"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, HeartIcon } from "@phosphor-icons/react";

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

export default function CompleteProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");

  const [mobile, setMobile] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || mobile.replace(/\D/g, "").length < 10) {
      return;
    }

    localStorage.setItem("dms-demo-profile-complete", "true");

    router.replace("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-700 text-white">
            <HeartIcon fill="currentColor" size={20} />
          </div>

          <CardTitle className="mt-2 text-2xl">Complete your profile</CardTitle>

          <CardDescription>
            We need a few details before you can start using your donor account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label htmlFor="name">Full name</Label>

              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div>
              <Label htmlFor="mobile">Mobile number</Label>

              <Input
                id="mobile"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Your email from Google will be linked automatically. Your mobile
              number helps us keep your donation receipts and account secure.
            </div>

            <Button className="h-12 w-full" type="submit">
              Save & Continue
              <ArrowRightIcon size={17} />
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
