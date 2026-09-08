"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  DownloadIcon,
  ScrollIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useParams } from "next/navigation";
import axios from "axios";

import { AppShell } from "@/components/dashboard/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Donation = {
  id: string;
  date: string;
  amount: number;
  type: "ONE_TIME" | "MONTHLY";
  status: "SUCCESS" | "PENDING" | "FAILED";
  project: string;
  payment: string;
};

export default function DonationDetailsPage() {
  const params = useParams<{ id: string }>();
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await axios.get(`/api/donations/${params.id}`);
        if (response.data?.success) {
          setDonation(response.data.donation);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading donation...</p>
      </AppShell>
    );
  }

  if (notFound || !donation) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <Link
            href="/dashboard/donations"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeftIcon size={16} />
            Back to donations
          </Link>

          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <WarningCircleIcon size={32} className="text-slate-400" />
              <p className="font-semibold">Donation not found</p>
              <p className="text-sm text-slate-500">
                This donation doesn&apos;t exist or doesn&apos;t belong to your
                account.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/dashboard/donations"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeftIcon size={16} />
          Back to donations
        </Link>

        <Card className="overflow-hidden">
          <div className="bg-green-950 p-7 text-white">
            <CheckCircleIcon size={32} className="text-green-300" />
            <p className="mt-4 text-sm text-green-200">
              {donation.status === "SUCCESS"
                ? "Donation successful"
                : donation.status === "PENDING"
                  ? "Donation pending"
                  : "Donation failed"}
            </p>
            <h1 className="mt-1 text-4xl font-bold">
              ₹{donation.amount.toLocaleString("en-IN")}
            </h1>
            <p className="mt-2 text-sm text-green-100/70">{donation.id}</p>
          </div>

          <CardHeader>
            <CardTitle>Donation details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <Detail label="Project" value={donation.project} />
            <Detail label="Date" value={donation.date} />
            <Detail
              label="Donation type"
              value={donation.type === "MONTHLY" ? "Monthly" : "One-time"}
            />
            <Detail label="Payment provider" value={donation.payment} />
            <Detail
              label="Status"
              value={
                <Badge
                  variant={
                    donation.status === "SUCCESS"
                      ? "success"
                      : donation.status === "FAILED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {donation.status}
                </Badge>
              }
            />

            {donation.status === "SUCCESS" && (
              <div className="pt-3">
                <Button className="w-full sm:w-auto">
                  <Link
                    href={`/api/donations/${donation.id}/receipt`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <DownloadIcon size={17} />
                    Download Receipt
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 rounded-2xl bg-green-50 p-5 text-sm text-green-900">
          <ScrollIcon className="mt-0.5 shrink-0" size={19} />
          <p>
            Your official donation receipt should be generated by the backend
            after Razorpay payment verification.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-1 border-b pb-3 sm:flex-row sm:items-center">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
