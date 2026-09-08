import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
    const { mobile } = await request.json();
    if (!mobile) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile number is required.",
        },
        { status: 400 },
      );
    }

    const cleanMobile = String(mobile).replace(/\D/g, "").trim();

    if (cleanMobile.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid mobile number.",
        },
        { status: 400 },
      );
    }

    await dbConnect();

    const ip = getClientIp(request);
    const now = new Date();

    // Cooldown: block rapid resends to the same number
    const lastOtp = await OtpVerification.findOne({ mobile: cleanMobile }).sort(
      {
        createdAt: -1,
      },
    );

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

    // Per-mobile limit within a rolling window
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
          message:
            "Too many OTP requests for this number. Please try again later.",
        },
        { status: 429 },
      );
    }

    // Per-IP limit within a rolling window (catches abuse across many numbers)
    const ipWindowStart = new Date(
      now.getTime() - IP_WINDOW_MINUTES * 60 * 1000,
    );

    const ipCount = await OtpRequestLog.countDocuments({
      ip,
      createdAt: { $gte: ipWindowStart },
    });

    if (ipCount >= MAX_PER_IP_PER_WINDOW) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Too many requests from this device. Please try again later.",
        },
        { status: 429 },
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({
      mobile: cleanMobile,
    });

    // Generate OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Remove old OTP
    await OtpVerification.deleteMany({ mobile: cleanMobile });

    // Store new OTP
    const otpRecord = await OtpVerification.create({
      mobile: cleanMobile,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    try {
      await sendOtpSms(cleanMobile, otp);
    } catch (err) {
      await OtpVerification.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { success: false, message: "Unable to send OTP. Please try again." },
        { status: 502 },
      );
    }

    // Log this send attempt for rate limiting
    await OtpRequestLog.create({ mobile: cleanMobile, ip });

    // Send SMS
    await sendOtpSms(cleanMobile, otp);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully.",
      isNewUser: !existingUser,
    });
  } catch (error) {
    console.error("Send OTP error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to send OTP. Please try again.",
      },
      { status: 500 },
    );
  }
}
