import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 100,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "CANCELLED"],
      default: "ACTIVE",
    },
    razorpaySubscriptionId: {
      type: String,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    nextPaymentDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

export const Subscription =
  mongoose.models.Subscription ||
  mongoose.model("Subscription", SubscriptionSchema);
