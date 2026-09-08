import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import crypto from "crypto";

import { authOptions } from "@/lib/auth.config";
import dbConnect from "@/lib/db";
import { Subscription } from "@/models/Subscription";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = await request.json();

    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { success: false, message: "Missing payment details." },
        { status: 400 },
      );
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(razorpay_signature, "utf8"),
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Verification failed." },
        { status: 400 },
      );
    }

    await dbConnect();

    await Subscription.findOneAndUpdate(
      {
        userId: session.user.id,
        razorpaySubscriptionId: razorpay_subscription_id,
      },
      { status: "ACTIVE", startedAt: new Date() },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify subscription error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to verify subscription." },
      { status: 500 },
    );
  }
}
