"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRightIcon,
  HeartIcon,
  CurrencyInrIcon,
  RepeatIcon,
  CalendarIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import axios from "axios";

import { AppShell } from "@/components/dashboard/app-shell";
import { StatCard } from "@/components/common/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projects } from "@/lib/mock-data";
import { useCurrentUser } from "@/hooks/use-current-user";

type Donation = {
  id: string;
  date: string;
  amount: number;
  type: "ONE_TIME" | "MONTHLY";
  status: "SUCCESS" | "PENDING" | "FAILED";
  project: string;
  payment: string;
};

export default function HomePage() {
  const { user } = useCurrentUser();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await axios.get("/api/donations");
        if (response.data?.success) {
          setDonations(response.data.donations);
        }
      } catch (error) {
        console.error("Failed to load donations:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const total = donations
    .filter((d) => d.status === "SUCCESS")
    .reduce((sum, d) => sum + d.amount, 0);

  const monthly = donations
    .filter((d) => d.type === "MONTHLY" && d.status === "SUCCESS")
    .reduce((sum, d) => sum + d.amount, 0);

  const activeMonthly = donations
    .filter((d) => d.type === "MONTHLY" && d.status === "SUCCESS")
    .sort((a, b) => b.amount - a.amount)[0];

  const memberSince = user?.createdAt
  ? new Date(user.createdAt).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    })
  : "—";
  

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-green-950 p-6 text-white sm:p-8">
          <p className="text-sm text-green-200">Welcome back 👋</p>

          <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold">Hello, {user?.name}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-green-100/75">
                Thank you for being part of our mission. Every contribution
                creates measurable impact.
              </p>
            </div>

            <Link href="/dashboard/donations/new">
              <Button variant="secondary" className={"hover:bg-secondary/80"}>
                Donate Now
                <ArrowRightIcon size={17} />
              </Button>
            </Link>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Donated"
            value={loading ? "…" : `₹${total.toLocaleString("en-IN")}`}
            icon={CurrencyInrIcon}
          />

          <StatCard
            label="Donations"
            value={loading ? "…" : `${donations.length}`}
            icon={HeartIcon}
          />

          <StatCard
            label="Monthly Giving"
            value={loading ? "…" : `₹${monthly.toLocaleString("en-IN")}`}
            icon={RepeatIcon}
          />

          <StatCard
            label="Member Since"
            value={memberSince}
            icon={CalendarIcon}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent donations</CardTitle>
                <CardDescription>
                  Your latest contribution activity.
                </CardDescription>
              </div>

              <Link
                href="/dashboard/donations"
                className="text-sm font-semibold text-green-700"
              >
                View all
              </Link>
            </CardHeader>

            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : donations.length === 0 ? (
                <p className="text-sm text-slate-500">
                  You haven&apos;t made any donations yet.
                </p>
              ) : (
                donations.slice(0, 4).map((d) => (
                  <Link
                    href={`/donations/${d.id}`}
                    key={d.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-4 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-semibold">{d.project}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {d.date} · {d.id}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">
                        ₹{d.amount.toLocaleString("en-IN")}
                      </p>
                      <Badge
                        variant={
                          d.status === "SUCCESS"
                            ? "success"
                            : d.status === "FAILED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {d.status}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Monthly giving</CardTitle>
              <CardDescription>Make your support consistent.</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-2xl bg-green-50 p-5">
                <RepeatIcon className="text-green-700" size={24} />
                <p className="mt-4 text-2xl font-bold">
                  {activeMonthly
                    ? `₹${activeMonthly.amount} / month`
                    : "No active plan"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Automatically support ongoing community work.
                </p>

                <Link href="/dashboard/monthly-giving">
                  <Button className="mt-5 w-full">Manage monthly giving</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">Where your support goes</h2>
            <p className="text-sm text-slate-500">
              Current projects creating impact.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.title}>
                <CardContent className="p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700">
                    <UsersIcon size={20} />
                  </div>
                  <h3 className="mt-4 font-bold">{project.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {project.description}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-green-700">
                    {project.impact}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
