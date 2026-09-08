import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

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
