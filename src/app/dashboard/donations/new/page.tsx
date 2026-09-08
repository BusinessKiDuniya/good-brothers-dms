"use client";

import { useState } from "react";
import {
  ArrowLeftIcon,
  HeartIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

import { AppShell } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const presets = [500, 1000, 2000, 5000];

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-checkout-js")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function NewDonationPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("1000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function pay(e: React.FormEvent) {
    e.preventDefault();

    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric < 100) {
      setError("Minimum donation amount is ₹100.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Unable to load payment gateway. Check your connection.");
        setLoading(false);
        return;
      }

      const orderResponse = await axios.post("/api/donations/create-order", {
        amount: numeric,
        project: "General Fund",
      });

      if (!orderResponse.data?.success) {
        setError(orderResponse.data?.message || "Unable to start payment.");
        setLoading(false);
        return;
      }

      const {
        orderId,
        amount: orderAmount,
        currency,
        keyId,
        donationId,
        name,
        email,
        contact,
      } = orderResponse.data;

      const razorpayOptions = {
        key: keyId,
        amount: orderAmount,
        currency,
        name: "Good Brothers Trust",
        description: "Donation",
        order_id: orderId,
        prefill: { name, email, contact },
        theme: { color: "#166534" },
        handler: async function (response: any) {
          try {
            const verifyResponse = await axios.post(
              "/api/donations/verify-payment",
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            );

            if (verifyResponse.data?.success) {
              router.push(`/donations/${verifyResponse.data.donation.id}`);
            } else {
              // Payment likely succeeded on Razorpay's side but our verification
              // hiccuped — the webhook will still resolve it correctly.
              router.push(`/donations/${donationId}`);
            }
          } catch (err) {
            router.push(`/donations/${donationId}`);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setError("Payment cancelled.");
          },
        },
      };

      const rzp = new window.Razorpay(razorpayOptions);

      rzp.on("payment.failed", function () {
        setLoading(false);
        setError("Payment failed. Please try again.");
      });

      rzp.open();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Unable to start payment.");
      } else {
        setError("Unable to start payment.");
      }
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeftIcon size={16} />
          Back
        </Link>

        <Card>
          <CardHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <HeartIcon fill="currentColor" size={20} />
            </div>
            <CardTitle className="mt-2 text-2xl">Make a donation</CardTitle>
            <CardDescription>
              Choose an amount and continue securely.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={pay} className="space-y-6">
              <div>
                <Label>Choose amount</Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {presets.map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setAmount(String(p))}
                      className={`rounded-xl border p-3 font-semibold ${
                        amount === String(p)
                          ? "border-green-700 bg-green-50 text-green-800"
                          : "border-slate-200"
                      }`}
                    >
                      ₹{p.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="amount">Custom amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" disabled={loading} className="h-12 w-full">
                {loading ? "Processing..." : "Continue to secure payment"}
              </Button>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheckIcon size={16} />
                Payment verification happens securely on the server.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
