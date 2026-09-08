import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import crypto from "crypto";

import { authOptions } from "@/lib/auth.config";
import dbConnect from "@/lib/db";
import { Donation } from "@/models/Donation";

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
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing payment details." },
        { status: 400 },
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(razorpay_signature, "utf8"),
    );

    await dbConnect();

    if (!isValid) {
      // Signature mismatch — don't trust this, let it stay PENDING for the
      // webhook to resolve authoritatively rather than marking FAILED here.
      return NextResponse.json(
        { success: false, message: "Payment verification failed." },
        { status: 400 },
      );
    }

    // Atomic + idempotent: only flips PENDING -> SUCCESS once, scoped to this user's order
    const donation = await Donation.findOneAndUpdate(
      {
        razorpayOrderId: razorpay_order_id,
        userId: session.user.id,
        status: "PENDING",
      },
      {
        status: "SUCCESS",
        razorpayPaymentId: razorpay_payment_id,
      },
      { new: true },
    );

    if (!donation) {
      // Either already processed (e.g. webhook beat us to it) or doesn't belong to this user
      const existing = await Donation.findOne({
        razorpayOrderId: razorpay_order_id,
        userId: session.user.id,
      });

      if (existing?.status === "SUCCESS") {
        return NextResponse.json({
          success: true,
          donation: { id: existing.donationId },
        });
      }

      return NextResponse.json(
        { success: false, message: "Donation not found or already processed." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      donation: { id: donation.donationId },
    });
  } catch (error) {
    console.error("Verify payment error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to verify payment." },
      { status: 500 },
    );
  }
}