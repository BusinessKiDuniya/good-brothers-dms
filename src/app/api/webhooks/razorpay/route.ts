import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import dbConnect from "@/lib/db";
import { Donation } from "@/models/Donation";
import { Subscription } from "@/models/Subscription";
import { generateDonationId } from "@/lib/donation";

export async function POST(request: NextRequest) {
  try {
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

    // --- One-time donations ---
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

    // --- Monthly giving subscriptions ---
    if (
      event.event === "subscription.activated" ||
      event.event === "subscription.charged"
    ) {
      const sub = event.payload.subscription.entity;
      const payment = event.payload.payment?.entity;

      const dbSub = await Subscription.findOne({
        razorpaySubscriptionId: sub.id,
      });

      if (dbSub) {
        dbSub.status = "ACTIVE";
        if (sub.current_end)
          dbSub.nextPaymentDate = new Date(sub.current_end * 1000);
        if (!dbSub.startedAt) dbSub.startedAt = new Date();

        // Record a Donation for this billing cycle, once per unique payment id
        if (payment && dbSub.lastChargedPaymentId !== payment.id) {
          await Donation.create({
            donationId: await generateDonationId(),
            userId: dbSub.userId,
            amount: payment.amount / 100,
            type: "MONTHLY",
            status: "SUCCESS",
            project: "Monthly Giving",
            payment: "Razorpay",
            razorpayPaymentId: payment.id,
          });
          dbSub.lastChargedPaymentId = payment.id;
        }

        await dbSub.save();
      }
    }

    if (event.event === "subscription.halted") {
      const sub = event.payload.subscription.entity;
      await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: sub.id },
        { status: "HALTED" },
      );
    }

    if (event.event === "subscription.cancelled") {
      const sub = event.payload.subscription.entity;
      await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: sub.id },
        { status: "CANCELLED", nextPaymentDate: null },
      );
    }

    if (event.event === "subscription.paused") {
      const sub = event.payload.subscription.entity;
      await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: sub.id },
        { status: "PAUSED" },
      );
    }

    if (event.event === "subscription.resumed") {
      const sub = event.payload.subscription.entity;
      await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: sub.id },
        { status: "ACTIVE" },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
