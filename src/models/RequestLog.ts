import mongoose from "mongoose";

const RequestLogSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

RequestLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export const RequestLog =
  mongoose.models.RequestLog || mongoose.model("RequestLog", RequestLogSchema);
