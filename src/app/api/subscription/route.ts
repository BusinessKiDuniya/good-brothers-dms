import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth.config";
import dbConnect from "@/lib/db";
import { Subscription } from "@/models/Subscription";
import { razorpay } from "@/lib/razorpay";
import { formatSubscription } from "@/lib/subscription";

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

  // CANCELLED is treated as "no plan" so the UI shows the start-plan screen,
  // not a dead management screen for a subscription that no longer exists at Razorpay.
  if (!sub || sub.status === "CANCELLED") {
    return NextResponse.json({ success: true, subscription: null });
  }

  return NextResponse.json({ success: true, subscription: formatSubscription(sub) });
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

    const { action } = await request.json();

    await dbConnect();

    const sub = await Subscription.findOne({ userId: session.user.id });

    if (!sub || sub.status === "CANCELLED" || !sub.razorpaySubscriptionId) {
      return NextResponse.json(
        { success: false, message: "No active subscription found." },
        { status: 404 },
      );
    }

    if (action === "pause") {
      if (sub.status !== "ACTIVE") {
        return NextResponse.json(
          { success: false, message: "Only an active subscription can be paused." },
          { status: 400 },
        );
      }
      await razorpay.subscriptions.pause(sub.razorpaySubscriptionId, { pause_at: "now" });
      sub.status = "PAUSED";
      await sub.save();
    } else if (action === "resume") {
      if (sub.status !== "PAUSED") {
        return NextResponse.json(
          { success: false, message: "Only a paused subscription can be resumed." },
          { status: 400 },
        );
      }
      await razorpay.subscriptions.resume(sub.razorpaySubscriptionId, { resume_at: "now" });
      sub.status = "ACTIVE";
      await sub.save();
    } else {
      return NextResponse.json(
        { success: false, message: "Unknown action." },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, subscription: formatSubscription(sub) });
  } catch (error) {
    console.error("Update subscription error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update subscription." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
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

    if (sub.razorpaySubscriptionId) {
      try {
        await razorpay.subscriptions.cancel(sub.razorpaySubscriptionId, false);
      } catch (err: any) {
        // If Razorpay already considers it cancelled/completed, don't block our own state change
        if (err?.statusCode !== 400) throw err;
      }
    }

    sub.status = "CANCELLED";
    sub.nextPaymentDate = undefined;
    await sub.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to cancel subscription." },
      { status: 500 },
    );
  }
}