"use client";

import { useState } from "react";
import {
  ArrowLeftIcon,
  HeartIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
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

export default function NewDonationPage() {
  const [amount, setAmount] = useState("1000");

  function pay(e: React.FormEvent) {
    e.preventDefault();

    alert(`Demo only: Razorpay checkout would open for ₹${amount}.`);
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
                      className={`
                          rounded-xl
                          border
                          p-3
                          font-semibold

                          ${
                            amount === String(p)
                              ? "border-green-700 bg-green-50 text-green-800"
                              : "border-slate-200"
                          }
                        `}
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

              <Button className="h-12 w-full">
                Continue to secure payment
              </Button>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheckIcon size={16} />
                Payment verification will happen securely on the server.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
