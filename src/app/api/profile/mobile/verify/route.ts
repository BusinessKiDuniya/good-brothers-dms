import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import crypto from "crypto";

import { authOptions } from "@/lib/auth.config";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { OtpVerification } from "@/models/OtpVerification";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { mobile, otp } = await request.json();

    const cleanMobile = String(mobile || "")
      .replace(/\D/g, "")
      .trim();
    const cleanOtp = String(otp || "").trim();

    if (cleanMobile.length !== 10 || cleanOtp.length !== 6) {
      return NextResponse.json(
        { success: false, message: "Invalid mobile number or OTP." },
        { status: 400 },
      );
    }

    await dbConnect();

    const record = await OtpVerification.findOne({
      mobile: cleanMobile,
      purpose: "profile_update",
      userId: session.user.id,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP." },
        { status: 400 },
      );
    }

    if (record.attempts >= 5) {
      await OtpVerification.deleteOne({ _id: record._id });
      return NextResponse.json(
        {
          success: false,
          message: "Too many attempts. Please request a new OTP.",
        },
        { status: 429 },
      );
    }

    const otpHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");

    if (record.otpHash !== otpHash) {
      record.attempts += 1;
      await record.save();

      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP." },
        { status: 400 },
      );
    }

    // Re-check uniqueness right before committing — closes the race window
    const existing = await User.findOne({
      mobile: cleanMobile,
      _id: { $ne: session.user.id },
    });

    if (existing) {
      await OtpVerification.deleteOne({ _id: record._id });
      return NextResponse.json(
        {
          success: false,
          message: "This mobile number is already linked to another account.",
        },
        { status: 409 },
      );
    }

    await User.findByIdAndUpdate(session.user.id, { mobile: cleanMobile });
    await OtpVerification.deleteOne({ _id: record._id });

    return NextResponse.json({
      success: true,
      message: "Mobile number updated successfully.",
    });
  } catch (error) {
    console.error("Mobile change verify error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to verify OTP. Please try again." },
      { status: 500 },
    );
  }
}
