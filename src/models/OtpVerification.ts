import mongoose from "mongoose";

const OtpVerificationSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// MongoDB automatically removes expired OTP records
OtpVerificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);

export const OtpVerification =
  mongoose.models.OtpVerification ||
  mongoose.model("OtpVerification", OtpVerificationSchema);
