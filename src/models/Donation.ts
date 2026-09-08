import mongoose from "mongoose";

const DonationSchema = new mongoose.Schema(
  {
    donationId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    type: {
      type: String,
      enum: ["ONE_TIME", "MONTHLY"],
      required: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "PENDING", "FAILED"],
      default: "PENDING",
    },
    project: {
      type: String,
      required: true,
    },
    payment: {
      type: String,
      default: "Razorpay",
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Donation =
  mongoose.models.Donation || mongoose.model("Donation", DonationSchema);