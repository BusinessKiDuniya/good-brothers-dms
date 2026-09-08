import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth.config";
import dbConnect from "@/lib/db";
import { Subscription } from "@/models/Subscription";
import { Donation } from "@/models/Donation";
import { addOneMonth, formatSubscription } from "@/lib/subscription";
import { generateDonationId } from "@/lib/donation";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  await dbConnect();

  const sub = await Subscription.findOne({ userId: session.user.id }).lean();

  return NextResponse.json({
    success: true,
    subscription: sub ? formatSubscription(sub) : null,
  });
}

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

    const now = new Date();
    const nextPaymentDate = addOneMonth(now);

    let sub;

    // TODO: replace with real Razorpay subscription creation before going live.
    if (existing) {
      existing.amount = amount;
      existing.status = "ACTIVE";
      existing.startedAt = now;
      existing.nextPaymentDate = nextPaymentDate;
      sub = await existing.save();
    } else {
      sub = await Subscription.create({
        userId: session.user.id,
        amount,
        status: "ACTIVE",
        startedAt: now,
        nextPaymentDate,
      });
    }

    // Record the first charge as a regular donation so history/totals stay consistent.
    // TODO: future recurring charges should be created by a billing webhook/cron, not here.
    await Donation.create({
      donationId: await generateDonationId(),
      userId: session.user.id,
      amount,
      type: "MONTHLY",
      status: "SUCCESS",
      project: "Monthly Giving",
      payment: "Razorpay",
    });

    return NextResponse.json({
      success: true,
      subscription: formatSubscription(sub),
    });
  } catch (error) {
    console.error("Create subscription error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to start monthly giving." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    await dbConnect();

    const sub = await Subscription.findOne({ userId: session.user.id });

    if (!sub || sub.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, message: "No active subscription found." },
        { status: 404 },
      );
    }

    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount < 100) {
        return NextResponse.json(
          { success: false, message: "Minimum monthly amount is ₹100." },
          { status: 400 },
        );
      }
      sub.amount = amount;
    }

    if (body.action === "pause") {
      if (sub.status !== "ACTIVE") {
        return NextResponse.json(
          { success: false, message: "Only an active subscription can be paused." },
          { status: 400 },
        );
      }
      sub.status = "PAUSED";
    }

    if (body.action === "resume") {
      if (sub.status !== "PAUSED") {
        return NextResponse.json(
          { success: false, message: "Only a paused subscription can be resumed." },
          { status: 400 },
        );
      }
      sub.status = "ACTIVE";
      sub.nextPaymentDate = addOneMonth(new Date());
    }

    await sub.save();

    return NextResponse.json({
      success: true,
      subscription: formatSubscription(sub),
    });
  } catch (error) {
    console.error("Update subscription error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update subscription." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  await dbConnect();

  const sub = await Subscription.findOne({ userId: session.user.id });

  if (!sub || sub.status === "CANCELLED") {
    return NextResponse.json(
      { success: false, message: "No active subscription found." },
      { status: 404 },
    );
  }

  sub.status = "CANCELLED";
  sub.nextPaymentDate = undefined;
  await sub.save();

  return NextResponse.json({ success: true });
}
