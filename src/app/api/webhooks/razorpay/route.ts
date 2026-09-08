import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import dbConnect from "@/lib/db";
import { Donation } from "@/models/Donation";

export async function POST(request: NextRequest) {
  try {
    // Must read the raw body — signature is computed over exact bytes
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(signature, "utf8"),
    );

    if (!isValid) {
      console.warn("Razorpay webhook: invalid signature");
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    await dbConnect();

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      await Donation.findOneAndUpdate(
        { razorpayOrderId: payment.order_id, status: "PENDING" },
        { status: "SUCCESS", razorpayPaymentId: payment.id },
      );
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;

      await Donation.findOneAndUpdate(
        { razorpayOrderId: payment.order_id, status: "PENDING" },
        { status: "FAILED" },
      );
    }

    // Always 200 quickly so Razorpay doesn't retry unnecessarily
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    // Still return 200 for parse errors on unrelated event types to avoid retry storms,
    // but 500 here if it's a genuine failure you want Razorpay to retry:
    return NextResponse.json({ success: false }, { status: 500 });
  }
}