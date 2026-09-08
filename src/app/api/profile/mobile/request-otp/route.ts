import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import crypto from "crypto";

import { authOptions } from "@/lib/auth.config";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { OtpVerification } from "@/models/OtpVerification";
import { OtpRequestLog } from "@/models/OtpRequestLog";
import { sendOtpSms } from "@/lib/sms";
import {
  IP_WINDOW_MINUTES,
  MAX_PER_IP_PER_WINDOW,
  MAX_PER_MOBILE_PER_WINDOW,
  MOBILE_WINDOW_MINUTES,
  RESEND_COOLDOWN_SECONDS,
} from "@/lib/const";

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
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

    const { mobile } = await request.json();
    const cleanMobile = String(mobile || "").replace(/\D/g, "").trim();

    if (cleanMobile.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Invalid mobile number." },
        { status: 400 },
      );
    }

    await dbConnect();

    // Don't let a user "change" to a number already tied to their own account
    if (cleanMobile === session.user.mobile) {
      return NextResponse.json(
        { success: false, message: "This is already your mobile number." },
        { status: 400 },
      );
    }

    // Block taking a number already registered to someone else
    const existing = await User.findOne({
      mobile: cleanMobile,
      _id: { $ne: session.user.id },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "This mobile number is already linked to another account.",
        },
        { status: 409 },
      );
    }

    const ip = getClientIp(request);
    const now = new Date();

    // Same abuse protections as login OTP: cooldown + per-mobile + per-IP windows
    const lastOtp = await OtpVerification.findOne({
      mobile: cleanMobile,
      purpose: "profile_update",
    }).sort({ createdAt: -1 });

    if (lastOtp) {
      const secondsSinceLast =
        (now.getTime() - new Date(lastOtp.createdAt).getTime()) / 1000;

      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${Math.ceil(
              RESEND_COOLDOWN_SECONDS - secondsSinceLast,
            )}s before requesting another OTP.`,
          },
          { status: 429 },
        );
      }
    }

    const mobileWindowStart = new Date(
      now.getTime() - MOBILE_WINDOW_MINUTES * 60 * 1000,
    );

    const mobileCount = await OtpRequestLog.countDocuments({
      mobile: cleanMobile,
      createdAt: { $gte: mobileWindowStart },
    });

    if (mobileCount >= MAX_PER_MOBILE_PER_WINDOW) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many OTP requests for this number. Please try again later.",
        },
        { status: 429 },
      );
    }

    const ipWindowStart = new Date(now.getTime() - IP_WINDOW_MINUTES * 60 * 1000);

    const ipCount = await OtpRequestLog.countDocuments({
      ip,
      createdAt: { $gte: ipWindowStart },
    });

    if (ipCount >= MAX_PER_IP_PER_WINDOW) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests from this device. Please try again later.",
        },
        { status: 429 },
      );
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Clear any previous pending change OTP for this user
    await OtpVerification.deleteMany({
      userId: session.user.id,
      purpose: "profile_update",
    });

    await OtpVerification.create({
      mobile: cleanMobile,
      otpHash,
      purpose: "profile_update",
      userId: session.user.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await OtpRequestLog.create({ mobile: cleanMobile, ip });
    await sendOtpSms(cleanMobile, otp);

    return NextResponse.json({
      success: true,
      message: "OTP sent to the new number.",
    });
  } catch (error) {
    console.error("Mobile change OTP error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to send OTP. Please try again." },
      { status: 500 },
    );
  }
}