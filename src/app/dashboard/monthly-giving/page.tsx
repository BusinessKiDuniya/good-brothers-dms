"use client";

import { useState } from "react";

import {
  PauseIcon,
  PlayIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
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

export default function MonthlyGivingPage() {
  const [active, setActive] = useState(true);

  const [amount, setAmount] = useState("500");

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Monthly Giving</h1>

          <p className="mt-1 text-slate-500">
            Create consistent impact with an automatic monthly contribution.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="bg-primary p-7 text-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-green-200">Current subscription</p>

                <h2 className="mt-1 text-3xl font-bold">₹{amount} / month</h2>
              </div>

              <Badge
                variant={active ? "success" : "warning"}
                className="bg-white/10 text-white"
              >
                {active ? "ACTIVE" : "PAUSED"}
              </Badge>
            </div>
          </div>

          <CardContent className="grid gap-6 p-6 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Next payment</p>

              <p className="mt-1 font-semibold">05 October 2026</p>

              <p className="mt-5 text-sm text-slate-500">Started</p>

              <p className="mt-1 font-semibold">05 September 2026</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Subscription ID</p>

              <p className="mt-1 font-semibold">SUB_8H7D92K</p>

              <p className="mt-5 text-sm text-slate-500">Payment provider</p>

              <p className="mt-1 font-semibold">Razorpay</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage subscription</CardTitle>

            <CardDescription>
              Changes should be synced with Razorpay from your backend.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <Label htmlFor="amount">Monthly amount</Label>

              <div className="flex max-w-sm gap-2">
                <Input
                  id="amount"
                  type="number"
                  min="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />

                <Button variant="outline">Update</Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => setActive(!active)}>
                {active ? (
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

              <Button variant="destructive">
                <XCircleIcon size={17} />
                Cancel subscription
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 rounded-2xl bg-slate-100 p-5 text-sm text-slate-600">
          <ShieldCheckIcon className="shrink-0" size={19} />

          <p>
            Recurring payments require proper Razorpay subscription setup,
            webhook verification and secure server-side handling.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
