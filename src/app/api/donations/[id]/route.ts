import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth.config";
import dbConnect from "@/lib/db";
import { Donation } from "@/models/Donation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  await dbConnect();

  const { id } = await context.params;

  // Scoped to userId too — prevents guessing another donor's donation ID
  const donation = await Donation.findOne({
    donationId: id,
    userId: session.user.id,
  }).lean();

  if (!donation) {
    return NextResponse.json(
      { success: false, message: "Donation not found." },
      { status: 404 },
    );
  }

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
}
