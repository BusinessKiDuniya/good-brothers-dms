import mongoose from "mongoose";

const OtpRequestLogSchema = new mongoose.Schema(
  {
    mobile: {
      type: String,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
);

// Auto-delete log entries after 24 hours — keeps the collection small
OtpRequestLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export const OtpRequestLog =
  mongoose.models.OtpRequestLog ||
  mongoose.model("OtpRequestLog", OtpRequestLogSchema);