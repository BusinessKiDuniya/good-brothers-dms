"use client";

import { useState } from "react";
import { MailboxIcon, PhoneIcon, UserCircleIcon } from "@phosphor-icons/react";
import { AppShell } from "@/components/dashboard/app-shell";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { currentUser } from "@/lib/mock-data";

export default function ProfilePage() {
  const [name, setName] = useState(currentUser.name);

  const [mobile, setMobile] = useState(currentUser.mobile);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>

          <p className="mt-1 text-slate-500">
            Manage your donor account information.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-800">
                {name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")}
              </div>

              <div>
                <CardTitle>{name}</CardTitle>

                <CardDescription>
                  Donor account · Google connected
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <Label htmlFor="name">Full name</Label>

                <div className="relative">
                  <UserCircleIcon
                    size={17}
                    className="absolute left-3 top-3.5 text-slate-400"
                  />

                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>

                <div className="relative">
                  <MailboxIcon
                    size={17}
                    className="absolute left-3 top-3.5 text-slate-400"
                  />

                  <Input
                    id="email"
                    value={currentUser.email}
                    disabled
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mobile">Mobile</Label>

                <div className="relative">
                  <PhoneIcon
                    size={17}
                    className="absolute left-3 top-3.5 text-slate-400"
                  />

                  <Input
                    id="mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button>Save changes</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
