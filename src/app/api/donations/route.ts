import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import crypto from "crypto";

import { authOptions } from "@/lib/auth.config";
import dbConnect from "@/lib/db";
import { Donation } from "@/models/Donation";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  await dbConnect();

  const donations = await Donation.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    success: true,
    donations: donations.map((d) => ({
      id: d.donationId,
      date: new Date(d.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      amount: d.amount,
      type: d.type,
      status: d.status,
      project: d.project,
      payment: d.payment,
    })),
  });
}

async function generateDonationId() {
  // Retry a handful of times in case of a rare collision
  for (let i = 0; i < 5; i++) {
    const candidate = `DON-${crypto.randomInt(100000, 999999)}`;
    const exists = await Donation.findOne({ donationId: candidate }).lean();
    if (!exists) return candidate;
  }
  throw new Error("Unable to generate a unique donation ID");
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
    const project =
      typeof body.project === "string" && body.project.trim()
        ? body.project.trim()
        : "General Fund";
    const type = body.type === "MONTHLY" ? "MONTHLY" : "ONE_TIME";

    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json(
        { success: false, message: "Minimum donation amount is ₹100." },
        { status: 400 },
      );
    }

    await dbConnect();

    const donationId = await generateDonationId();

    // TODO: replace this with a real Razorpay flow before going live —
    // create the order here as PENDING, redirect to Razorpay checkout,
    // and only mark SUCCESS from a verified server-side webhook.
    const donation = await Donation.create({
      donationId,
      userId: session.user.id,
      amount,
      type,
      project,
      payment: "Razorpay",
      status: "SUCCESS", // placeholder — see TODO above
    });

    return NextResponse.json({
      success: true,
      donation: {
        id: donation.donationId,
        date: new Date(donation.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        amount: donation.amount,
        type: donation.type,
        status: donation.status,
        project: donation.project,
        payment: donation.payment,
      },
    });
  } catch (error) {
    console.error("Create donation error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to record donation." },
      { status: 500 },
    );
  }
}
