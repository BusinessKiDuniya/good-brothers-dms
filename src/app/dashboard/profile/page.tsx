"use client";

import { useEffect, useState } from "react";
import { MailboxIcon, PhoneIcon, UserCircleIcon } from "@phosphor-icons/react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/use-current-user";
import Image from "next/image";

type MobileStep = "idle" | "editing" | "otp";

export default function ProfilePage() {
  const { isLoading: sessionLoading, update } = useCurrentUser();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [nameMessage, setNameMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Mobile-change flow
  const [mobileStep, setMobileStep] = useState<MobileStep>("idle");
  const [newMobile, setNewMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileMessage, setMobileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await axios.get("/api/profile");
        if (response.data?.success) {
          const u = response.data.user;
          setName(u.name || "");
          setMobile(u.mobile || "");
          setEmail(u.email || "");
          setProfileImage(u.image || "");
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setNameMessage({ type: "error", text: "Name cannot be empty." });
      return;
    }

    setSaving(true);
    setNameMessage(null);

    try {
      const response = await axios.patch("/api/profile", { name: name.trim() });

      if (!response.data?.success) {
        setNameMessage({
          type: "error",
          text: response.data?.message || "Unable to save changes.",
        });
        return;
      }

      setNameMessage({ type: "success", text: "Name updated successfully." });
      await update({ name: name.trim() });
    } catch (error) {
      setNameMessage({ type: "error", text: "Unable to save changes." });
    } finally {
      setSaving(false);
    }
  }

  async function requestMobileOtp() {
    const cleaned = newMobile.replace(/\D/g, "");

    if (cleaned.length !== 10) {
      setMobileMessage({
        type: "error",
        text: "Enter a valid 10-digit number.",
      });
      return;
    }

    setMobileLoading(true);
    setMobileMessage(null);

    try {
      const response = await axios.post("/api/profile/mobile/request-otp", {
        mobile: cleaned,
      });

      if (!response.data?.success) {
        setMobileMessage({
          type: "error",
          text: response.data?.message || "Unable to send OTP.",
        });
        return;
      }

      setNewMobile(cleaned);
      setMobileStep("otp");
      setMobileMessage({
        type: "success",
        text: "OTP sent to the new number.",
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setMobileMessage({
          type: "error",
          text: error.response?.data?.message || "Unable to send OTP.",
        });
      } else {
        setMobileMessage({ type: "error", text: "Unable to send OTP." });
      }
    } finally {
      setMobileLoading(false);
    }
  }

  async function verifyMobileOtp() {
    if (otp.length !== 6) {
      setMobileMessage({ type: "error", text: "Enter the 6-digit OTP." });
      return;
    }

    setMobileLoading(true);
    setMobileMessage(null);

    try {
      const response = await axios.post("/api/profile/mobile/verify", {
        mobile: newMobile,
        otp,
      });

      if (!response.data?.success) {
        setMobileMessage({
          type: "error",
          text: response.data?.message || "Invalid or expired OTP.",
        });
        return;
      }

      setMobile(newMobile);
      setMobileStep("idle");
      setOtp("");
      setNewMobile("");
      setMobileMessage({ type: "success", text: "Mobile number updated." });
      await update({ mobile: newMobile });
      setNewMobile("");
    } catch (error) {
      setMobileMessage({ type: "error", text: "Unable to verify OTP." });
    } finally {
      setMobileLoading(false);
    }
  }

  function cancelMobileChange() {
    setMobileStep("idle");
    setNewMobile("");
    setOtp("");
    setMobileMessage(null);
  }

  const displayName = name || "User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (sessionLoading || loading) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading profile...</p>
      </AppShell>
    );
  }

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
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-xl font-bold text-green-800 overflow-hidden">
                {profileImage ? (
                  <Image
                    src={profileImage || ""}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    fill
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <CardTitle>{displayName}</CardTitle>
                <CardDescription>
                  Donor account{" "}
                  {email ? "· Google connected" : "· Mobile account"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={saveName}>
              <div>
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                  <UserCircleIcon
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    id="email"
                    value={email || "Not linked"}
                    disabled
                    className="pl-10"
                  />
                </div>
              </div>

              {nameMessage && (
                <p
                  className={`text-sm ${
                    nameMessage.type === "error"
                      ? "text-red-600"
                      : "text-green-700"
                  }`}
                >
                  {nameMessage.text}
                </p>
              )}

              <Button disabled={saving} type="submit">
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mobile number</CardTitle>
            <CardDescription>
              This number is used to log in with OTP — changing it requires
              verification.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {mobileStep === "idle" && (
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <PhoneIcon
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <Input
                    value={mobile || "Not linked"}
                    disabled
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setMobileStep("editing")}
                >
                  Change
                </Button>
              </div>
            )}

            {mobileStep === "editing" && (
              <div className="space-y-3">
                <Label htmlFor="newMobile">New mobile number</Label>
                <Input
                  id="newMobile"
                  inputMode="numeric"
                  maxLength={10}
                  value={newMobile}
                  onChange={(e) =>
                    setNewMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="98765 43210"
                />

                {mobileMessage && (
                  <p
                    className={`text-sm ${
                      mobileMessage.type === "error"
                        ? "text-red-600"
                        : "text-green-700"
                    }`}
                  >
                    {mobileMessage.text}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button disabled={mobileLoading} onClick={requestMobileOtp}>
                    {mobileLoading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                  <Button variant="ghost" onClick={cancelMobileChange}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {mobileStep === "otp" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Enter the OTP sent to <strong>{newMobile}</strong>.
                </p>

                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit OTP"
                  autoFocus
                />

                {mobileMessage && (
                  <p
                    className={`text-sm ${
                      mobileMessage.type === "error"
                        ? "text-red-600"
                        : "text-green-700"
                    }`}
                  >
                    {mobileMessage.text}
                  </p>
                )}

                <div className="flex gap-3">
                  <Button disabled={mobileLoading} onClick={verifyMobileOtp}>
                    {mobileLoading ? "Verifying..." : "Verify & Update"}
                  </Button>
                  <Button variant="ghost" onClick={cancelMobileChange}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
