"use client";

import { useEffect, useState } from "react";
import {
  PauseIcon,
  PlayIcon,
  ShieldCheckIcon,
  XCircleIcon,
  HeartIcon,
} from "@phosphor-icons/react";
import axios from "axios";

import { AppShell } from "@/components/dashboard/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

type Subscription = {
  amount: number;
  status: "CREATED" | "ACTIVE" | "PAUSED" | "HALTED";
  startedAt: string | null;
  nextPaymentDate: string | null;
  razorpaySubscriptionId: string | null;
};

export default function MonthlyGivingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [amountInput, setAmountInput] = useState("500");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function load() {
    try {
      const response = await axios.get("/api/subscription");
      if (response.data?.success) {
        setSub(response.data.subscription);
      }
    } catch (error) {
      console.error("Failed to load subscription:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubscription(): Promise<Subscription | null> {
    try {
      const response = await axios.get("/api/subscription");

      if (response.data?.success) {
        return response.data.subscription;
      }

      return null;
    } catch (error) {
      console.error("Failed to load subscription:", error);
      return null;
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetchSubscription().then((subscription) => {
      if (cancelled) return;

      setSub(subscription);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function startPlan() {
    const amount = Number(amountInput);
    if (!Number.isFinite(amount) || amount < 100) {
      setMessage({ type: "error", text: "Minimum monthly amount is ₹100." });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setMessage({ type: "error", text: "Unable to load payment gateway." });
        setActionLoading(false);
        return;
      }

      const response = await axios.post("/api/subscription/create", { amount });

      if (!response.data?.success) {
        setMessage({
          type: "error",
          text: response.data?.message || "Unable to start monthly giving.",
        });
        setActionLoading(false);
        return;
      }

      const { subscriptionId, keyId, name, email, contact } = response.data;

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "Good Brothers Trust",
        description: "Monthly Giving",
        prefill: { name, email, contact },
        theme: { color: "#166534" },
        handler: async function (resp: any) {
          try {
            await axios.post("/api/subscription/verify", {
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_subscription_id: resp.razorpay_subscription_id,
              razorpay_signature: resp.razorpay_signature,
            });
          } finally {
            await load();
            setMessage({ type: "success", text: "Monthly giving started!" });
            setActionLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setActionLoading(false);
            setMessage({ type: "error", text: "Setup cancelled." });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        setActionLoading(false);
        setMessage({
          type: "error",
          text: "Authorization failed. Please try again.",
        });
      });
      rzp.open();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMessage({
          type: "error",
          text:
            error.response?.data?.message || "Unable to start monthly giving.",
        });
      } else {
        setMessage({ type: "error", text: "Unable to start monthly giving." });
      }
      setActionLoading(false);
    }
  }

  async function toggleActive() {
    setActionLoading(true);
    setMessage(null);
    try {
      const response = await axios.patch("/api/subscription", {
        action: sub?.status === "ACTIVE" ? "pause" : "resume",
      });
      if (!response.data?.success) {
        setMessage({
          type: "error",
          text: response.data?.message || "Unable to update subscription.",
        });
        return;
      }
      setSub(response.data.subscription);
    } catch (error) {
      setMessage({ type: "error", text: "Unable to update subscription." });
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelPlan() {
    setActionLoading(true);
    setMessage(null);
    try {
      const response = await axios.delete("/api/subscription");
      if (!response.data?.success) {
        setMessage({
          type: "error",
          text: response.data?.message || "Unable to cancel subscription.",
        });
        return;
      }
      setSub(null);
      setAmountInput("500");
      setMessage({ type: "success", text: "Monthly giving cancelled." });
    } catch (error) {
      setMessage({ type: "error", text: "Unable to cancel subscription." });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading...</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Monthly Giving</h1>
          <p className="mt-1 text-slate-500">
            Create consistent impact with an automatic monthly contribution.
          </p>
        </div>

        {!sub ? (
          <Card>
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                <HeartIcon fill="currentColor" size={20} />
              </div>
              <CardTitle className="mt-2">Start a monthly plan</CardTitle>
              <CardDescription>
                Choose an amount to give automatically every month.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="startAmount">Monthly amount</Label>
                <Input
                  id="startAmount"
                  type="number"
                  min="100"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {message && (
                <p
                  className={`text-sm ${
                    message.type === "error" ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {message.text}
                </p>
              )}

              <Button disabled={actionLoading} onClick={startPlan}>
                {actionLoading ? "Starting..." : "Start monthly giving"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden">
              <div className="bg-primary p-7 text-white">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-green-200">
                      Current subscription
                    </p>
                    <h2 className="mt-1 text-3xl font-bold">
                      ₹{sub.amount} / month
                    </h2>
                  </div>
                  <Badge
                    variant={sub.status === "ACTIVE" ? "success" : "warning"}
                    className="bg-white/10 text-white"
                  >
                    {sub.status}
                  </Badge>
                </div>
              </div>

              <CardContent className="grid gap-6 p-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Next payment</p>
                  <p className="mt-1 font-semibold">
                    {sub.status === "ACTIVE"
                      ? (sub.nextPaymentDate ?? "Pending")
                      : "—"}
                  </p>
                  <p className="mt-5 text-sm text-slate-500">Started</p>
                  <p className="mt-1 font-semibold">
                    {sub.startedAt ?? "Awaiting first payment"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Payment provider</p>
                  <p className="mt-1 font-semibold">Razorpay</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manage subscription</CardTitle>
                <CardDescription>
                  To change your monthly amount, cancel this plan and start a
                  new one.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {message && (
                  <p
                    className={`text-sm ${
                      message.type === "error"
                        ? "text-red-600"
                        : "text-green-700"
                    }`}
                  >
                    {message.text}
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  {sub.status !== "HALTED" && sub.status !== "CREATED" && (
                    <Button
                      variant="outline"
                      disabled={actionLoading}
                      onClick={toggleActive}
                    >
                      {sub.status === "ACTIVE" ? (
                        <>
                          <PauseIcon size={17} />
                          Pause
                        </>
                      ) : (
                        <>
                          <PlayIcon size={17} />
                          Resume
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    disabled={actionLoading}
                    onClick={cancelPlan}
                  >
                    <XCircleIcon size={17} />
                    Cancel subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex gap-3 rounded-2xl bg-slate-100 p-5 text-sm text-slate-600">
          <ShieldCheckIcon className="shrink-0" size={19} />
          <p>Payments are securely processed and verified by Razorpay.</p>
        </div>
      </div>
    </AppShell>
  );
}
