import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth.config";
import dbConnect from "@/lib/db";
import { Subscription } from "@/models/Subscription";
import { razorpay } from "@/lib/razorpay";
import { checkRateLimit } from "@/lib/rate-limit";  

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const allowed = await checkRateLimit(
      `subscription-create:${session.user.id}`,
      5,
      10,
    );

    if (!allowed) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please wait a few minutes." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json(
        { success: false, message: "Minimum monthly amount is ₹100." },
        { status: 400 },
      );
    }

    await dbConnect();

    const existing = await Subscription.findOne({ userId: session.user.id });

    if (existing && existing.status !== "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          message: "You already have an active or paused monthly plan.",
        },
        { status: 409 },
      );
    }

    // A fresh plan per subscription keeps this simple — creating plans is free on Razorpay.
    const plan = await razorpay.plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: `Monthly Giving - ₹${amount}`,
        amount: Math.round(amount * 100),
        currency: "INR",
      },
    });

    // total_count is required by Razorpay; 120 cycles (~10 years) approximates "until cancelled"
    const subscription = await razorpay.subscriptions.create({
      plan_id: plan.id,
      customer_notify: 1,
      total_count: 120,
      notes: { userId: session.user.id },
    });

    if (existing) {
      existing.amount = amount;
      existing.status = "CREATED";
      existing.razorpayPlanId = plan.id;
      existing.razorpaySubscriptionId = subscription.id;
      existing.lastChargedPaymentId = undefined;
      existing.startedAt = undefined;
      existing.nextPaymentDate = undefined;
      await existing.save();
    } else {
      await Subscription.create({
        userId: session.user.id,
        amount,
        status: "CREATED",
        razorpayPlanId: plan.id,
        razorpaySubscriptionId: subscription.id,
      });
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      name: session.user.name || "",
      email: session.user.email || "",
      contact: session.user.mobile || "",
    });
  } catch (error) {
    console.error("Create subscription error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to start monthly giving." },
      { status: 500 },
    );
  }
}