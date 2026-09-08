import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth.config";
import dbConnect from "@/lib/db";
import { Donation } from "@/models/Donation";
import { razorpay } from "@/lib/razorpay";
import { generateDonationId } from "@/lib/donation";
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

    const body = await request.json();
    const amount = Number(body.amount);
    const project =
      typeof body.project === "string" && body.project.trim()
        ? body.project.trim()
        : "General Fund";

    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json(
        { success: false, message: "Minimum donation amount is ₹100." },
        { status: 400 },
      );
    }

    await dbConnect();

    const allowed = await checkRateLimit(
      `donation-order:${session.user.id}`,
      10,
      10,
    );

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many payment attempts. Please wait a few minutes.",
        },
        { status: 429 },
      );
    }

    const donationId = await generateDonationId();

    // Create our record as PENDING first — this becomes the source of truth
    const donation = await Donation.create({
      donationId,
      userId: session.user.id,
      amount,
      type: "ONE_TIME",
      status: "PENDING",
      project,
      payment: "Razorpay",
    });

    // Razorpay expects amount in paise
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: donationId,
      notes: {
        donationId,
        userId: session.user.id,
      },
    });

    donation.razorpayOrderId = order.id;
    await donation.save();

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      donationId,
      name: session.user.name || "",
      email: session.user.email || "",
      contact: session.user.mobile || "",
    });
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create payment order." },
      { status: 500 },
    );
  }
}
