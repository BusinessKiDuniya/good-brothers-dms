"use client";

import Link from "next/link";

import {
  EyeIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { AppShell } from "@/components/dashboard/app-shell";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import {
  donations,
} from "@/lib/mock-data";

export default function DonationsPage() {

  const [search, setSearch] =
    useState("");

  const filtered =
    donations.filter(
      (d) =>
        `${d.id} ${d.project}`
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  return (
    <AppShell>

      <div className="mx-auto max-w-6xl space-y-6">

        <div>

          <h1 className="text-3xl font-bold">
            Donation History
          </h1>

          <p className="mt-1 text-slate-500">
            View every contribution
            made through your account.
          </p>

        </div>

        <div className="grid gap-4 md:grid-cols-3">

          <Card>
            <CardContent className="p-5">

              <p className="text-sm text-slate-500">
                Total donated
              </p>

              <p className="mt-1 text-2xl font-bold">
                ₹6,000
              </p>

            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">

              <p className="text-sm text-slate-500">
                Successful donations
              </p>

              <p className="mt-1 text-2xl font-bold">
                {
                  donations.filter(
                    (x) =>
                      x.status ===
                      "SUCCESS"
                  ).length
                }
              </p>

            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">

              <p className="text-sm text-slate-500">
                Monthly contributions
              </p>

              <p className="mt-1 text-2xl font-bold">
                ₹1,500
              </p>

            </CardContent>
          </Card>

        </div>

        <Card>

          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <CardTitle>
              All transactions
            </CardTitle>

            <div className="relative w-full sm:w-72">

              <MagnifyingGlassIcon
                size={16}
                className="absolute left-3 top-3 text-slate-400"
              />

              <Input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search donations..."
                className="pl-9"
              />

            </div>

          </CardHeader>

          <CardContent className="p-0">

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full text-sm">

                <thead className="border-y bg-slate-50 text-left text-slate-500">

                  <tr>

                    <th className="px-6 py-3">
                      Donation
                    </th>

                    <th className="px-6 py-3">
                      Date
                    </th>

                    <th className="px-6 py-3">
                      Type
                    </th>

                    <th className="px-6 py-3">
                      Amount
                    </th>

                    <th className="px-6 py-3">
                      Status
                    </th>

                    <th className="px-6 py-3" />

                  </tr>

                </thead>

                <tbody>

                  {filtered.map(
                    (d) => (

                      <tr
                        key={d.id}
                        className="border-b last:border-0"
                      >

                        <td className="px-6 py-4">

                          <p className="font-semibold">
                            {d.project}
                          </p>

                          <p className="text-xs text-slate-500">
                            {d.id}
                          </p>

                        </td>

                        <td className="px-6 py-4">
                          {d.date}
                        </td>

                        <td className="px-6 py-4">
                          {
                            d.type ===
                            "MONTHLY"
                              ? "Monthly"
                              : "One-time"
                          }
                        </td>

                        <td className="px-6 py-4 font-semibold">
                          ₹
                          {d.amount.toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td className="px-6 py-4">

                          <Badge
                            variant={
                              d.status ===
                              "SUCCESS"
                                ? "success"
                                : d.status ===
                                  "FAILED"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {d.status}
                          </Badge>

                        </td>

                        <td className="px-6 py-4 text-right">

                          <Button
                            variant="ghost"
                            size="sm"
                          >

                            <Link
                              href={`/donations/${d.id}`}
                            >

                              <EyeIcon
                                size={16}
                              />

                              View

                            </Link>

                          </Button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            <div className="space-y-3 p-4 md:hidden">

              {filtered.map(
                (d) => (

                  <Link
                    key={d.id}
                    href={`/donations/${d.id}`}
                    className="block rounded-xl border p-4"
                  >

                    <div className="flex justify-between gap-3">

                      <div>

                        <p className="font-semibold">
                          {d.project}
                        </p>

                        <p className="text-xs text-slate-500">
                          {d.id} ·{" "}
                          {d.date}
                        </p>

                      </div>

                      <p className="font-bold">
                        ₹
                        {d.amount.toLocaleString(
                          "en-IN"
                        )}
                      </p>

                    </div>

                    <div className="mt-3">

                      <Badge variant="success">
                        {d.status}
                      </Badge>

                    </div>

                  </Link>

                )
              )}

            </div>

          </CardContent>

        </Card>

      </div>

    </AppShell>
  );
}