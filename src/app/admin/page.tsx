"use client";

import {
  CurrencyInrIcon,
  UsersIcon,
  RepeatIcon,
  TrendUpIcon,
  DownloadIcon,
} from "@phosphor-icons/react";
import { AppShell } from "@/components/dashboard/app-shell";
import { StatCard } from "@/components/common/stat-card";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { adminStats, donations, ngo } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            <p className="mt-1 text-slate-500">
              Overview of donor and donation activity.
            </p>
          </div>

          <Button variant="outline">
            <DownloadIcon size={17} />
            Export report
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total donations"
            value={`₹${adminStats.totalDonations.toLocaleString("en-IN")}`}
            icon={CurrencyInrIcon}
          />

          <StatCard
            label="Total donors"
            value={adminStats.totalDonors.toLocaleString("en-IN")}
            icon={UsersIcon}
          />

          <StatCard
            label="Monthly recurring"
            value={`₹${adminStats.monthlyRecurring.toLocaleString("en-IN")}`}
            icon={RepeatIcon}
          />

          <StatCard
            label="Success rate"
            value={`${adminStats.successfulPayments}%`}
            icon={TrendUpIcon}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent donations</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {donations.slice(0, 5).map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <div>
                    <p className="font-semibold">{d.project}</p>

                    <p className="text-xs text-slate-500">
                      {d.id} · {d.date}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">
                      ₹{d.amount.toLocaleString("en-IN")}
                    </p>

                    <Badge variant="success">{d.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impact numbers</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {ngo.stats.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold">{stat.value}</p>

                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}

              <Button className="w-full" variant="outline">
                Manage impact content
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
