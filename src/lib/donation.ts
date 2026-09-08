import crypto from "crypto";

import { Donation } from "@/models/Donation";

export async function generateDonationId() {
  for (let i = 0; i < 5; i++) {
    const candidate = `DON-${crypto.randomInt(100000, 999999)}`;
    const exists = await Donation.findOne({ donationId: candidate }).lean();
    if (!exists) return candidate;
  }
  throw new Error("Unable to generate a unique donation ID");
}