"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import {
  HeartIcon,
  LockKeyIcon,
  PhoneIcon,
  ArrowLeftIcon,
} from "@phosphor-icons/react";

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

import Image from "next/image";
import axios from "axios";

type AuthMode = "login" | "otp" | "profile";

export default function AuthPanel() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("login");

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // GOOGLE LOGIN
  async function googleLogin() {
    setLoading(true);
    setMessage("");

    try {
      await signIn("google", {
        callbackUrl: "/dashboard",
      });
    } catch (error) {
      console.error("Google login failed:", error);

      setMessage("Unable to continue with Google. Please try again.");

      setLoading(false);
    }
  }

  // SEND OTP
  async function sendOtp() {
    const cleanMobile = mobile.replace(/\D/g, "");

    if (cleanMobile.length !== 10) {
      setMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post("/api/auth/send-otp", {
        mobile: cleanMobile,
      });

      if (!response.data?.success) {
        setMessage(response.data?.message || "Unable to send OTP.");
        return;
      }

      setMobile(cleanMobile);

      if (response.data.isNewUser) {
        setMode("profile");
      } else {
        setMode("otp");
      }

      setMessage("OTP sent successfully.");
    } catch (error) {
      console.error("Send OTP failed:", error);

      if (axios.isAxiosError(error)) {
        setMessage(
          error.response?.data?.message ||
            "Unable to send OTP. Please try again.",
        );
      } else {
        setMessage("Unable to send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // CREATE PROFILE
  function continueToOtp() {
    if (!fullName.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    setMessage("");
    setMode("otp");
  }

  // VERIFY OTP + LOGIN
  async function verifyOtp() {
    if (otp.length !== 6) {
      setMessage("Please enter the 6-digit OTP.");
      return;
    }

    if (mode === "profile" && !fullName.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        mobile: mobile.replace(/\D/g, ""),
        otp,
        fullName: fullName.trim() || undefined,
      });

      if (!result?.ok) {
        setMessage(result?.error || "Invalid or expired OTP.");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("OTP verification failed:", error);

      setMessage("Unable to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // RESEND OTP
  async function resendOtp() {
    if (!mobile || resendCooldown > 0) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post("/api/auth/send-otp", {
        mobile: mobile.replace(/\D/g, ""),
      });

      if (!response.data?.success) {
        setMessage(response.data?.message || "Failed to resend OTP.");
        return;
      }

      setMessage("OTP resent successfully.");
      setResendCooldown(30);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        setMessage(
          error.response.data?.message || "Please wait before retrying.",
        );
        setResendCooldown(30);
      } else {
        setMessage("Unable to resend OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // GO BACK
  function goBackToMobile() {
    setMode("login");
    setOtp("");
    setFullName("");
    setMessage("");
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardHeader className="space-y-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-700 text-white">
          <HeartIcon fill="currentColor" size={20} />
        </div>

        <div>
          <CardTitle className="text-2xl">
            {mode === "login" && "Welcome"}
            {mode === "profile" && "Create your account"}
            {mode === "otp" && "Verify your number"}
          </CardTitle>

          <CardDescription className="mt-1">
            {mode === "login" && "Sign in to manage your donations and impact."}

            {mode === "profile" && "Tell us your name to get started."}

            {mode === "otp" && `Enter the OTP sent to ${mobile}.`}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {/* LOGIN */}
        {mode === "login" && (
          <div className="space-y-5">
            <Button
              onClick={googleLogin}
              disabled={loading}
              variant="outline"
              className="h-12 w-full"
            >
              <Image
                src="/icons/google.svg"
                alt="Google"
                width={20}
                height={20}
              />

              {loading ? "Connecting..." : "Continue with Google"}
            </Button>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="h-px flex-1 bg-slate-200" />
              OR
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile number</Label>

              <div className="relative">
                <PhoneIcon
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <Input
                  id="mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="98765 43210"
                  className="pl-10"
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
            </div>

            {message && <p className="text-sm text-red-600">{message}</p>}

            <Button
              onClick={sendOtp}
              disabled={loading}
              className="h-12 w-full"
            >
              {loading ? "Sending OTP..." : "Continue with Mobile"}
            </Button>

            <p className="text-center text-xs leading-5 text-slate-400">
              By continuing, you agree to our Terms and Privacy Policy.
            </p>
          </div>
        )}

        {/* NEW USER PROFILE */}
        {mode === "profile" && (
          <div className="space-y-5">
            <button
              onClick={goBackToMobile}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
            >
              <ArrowLeftIcon size={16} />
              Change number
            </button>

            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900">
              <PhoneIcon className="mb-2" size={18} />

              <p>
                No account was found for <strong>{mobile}</strong>.
              </p>

              <p className="mt-1 text-green-800/80">
                Create your account to continue.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full name <span className="text-red-500">*</span>
              </Label>

              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>

            {message && <p className="text-sm text-red-600">{message}</p>}

            <Button
              onClick={continueToOtp}
              disabled={loading}
              className="h-12 w-full"
            >
              Continue
            </Button>
          </div>
        )}

        {/* OTP */}
        {mode === "otp" && (
          <div className="space-y-5">
            <button
              onClick={goBackToMobile}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
            >
              <ArrowLeftIcon size={16} />
              Change number
            </button>

            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-900">
              <LockKeyIcon className="mb-2" size={18} />
              OTP sent to <strong>{mobile}</strong>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>

              <Input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit OTP"
                autoFocus
              />
            </div>

            {message && <p className="text-sm text-slate-600">{message}</p>}

            <Button
              onClick={verifyOtp}
              disabled={loading}
              className="h-12 w-full"
            >
              {loading
                ? "Verifying..."
                : fullName.trim()
                  ? "Create Account"
                  : "Verify & Continue"}
            </Button>

            <button
              onClick={resendOtp}
              disabled={loading || resendCooldown > 0}
              className="w-full text-center text-sm font-medium text-green-700 hover:underline disabled:opacity-50"
            >
              {resendCooldown > 0
                ? `Resend OTP in ${resendCooldown}s`
                : "Resend OTP"}
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
