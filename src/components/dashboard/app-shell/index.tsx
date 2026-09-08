"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartIcon,
  LayoutIcon,
  RepeatIcon,
  SignOutIcon,
  TextIndentIcon,
  XCircleIcon,
  ShieldCheckIcon,
  UserCircleCheckIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { signOut } from "next-auth/react";

import { Separator } from "@/components/ui/separator";
import { ngo } from "@/lib/mock-data";
import Image from "next/image";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";

const links = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutIcon,
  },
  {
    href: "/dashboard/donations",
    label: "Donation History",
    icon: HeartIcon,
  },
  {
    href: "/dashboard/monthly-giving",
    label: "Monthly Giving",
    icon: RepeatIcon,
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: UserCircleCheckIcon,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useCurrentUser();

  const [open, setOpen] = useState(false);

  async function logout() {
    await signOut({
      callbackUrl: "/login",
    });
  }

  const displayName = user?.name || user?.mobile || "User";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* HEADER */}
      <header className="z-30 h-16 shrink-0 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold">
            <Image
              src="/logo/logo.png"
              alt="Good Brothers Logo"
              width={50}
              height={50}
              className="object-contain"
            />

            <span>{ngo.name}</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">
              Hi, {displayName.split(" ")[0]}
            </span>

            <button
              onClick={() => setOpen(!open)}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-green-100 font-semibold text-green-800"
              aria-label="Open menu"
            >
              {user?.image ? (
                <img
                  src={user.image}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </button>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1">
        {/* SIDEBAR */}
        <aside
          className={`
            fixed
            inset-y-16
            left-0
            z-20
            w-72
            border-r
            bg-white
            p-4
            transition-transform

            ${open ? "translate-x-0" : "-translate-x-full"}

            md:static
            md:block
            md:w-64
            md:shrink-0
            md:translate-x-0
          `}
        >
          <div className="flex h-full flex-col">
            {/* USER INFO */}
            <div className="mb-5 shrink-0 rounded-xl bg-green-50 p-4">
              <div className="flex items-center gap-3">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={displayName}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-700 text-sm font-semibold text-white">
                    {initials}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {displayName}
                  </p>

                  {user?.email ? (
                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                  ) : user?.mobile ? (
                    <p className="truncate text-xs text-slate-500">
                      {user.mobile}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* NAVIGATION */}
            <nav className="space-y-1">
              {links.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href ||
                  (href !== "/dashboard" && pathname.startsWith(href));

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`
                      flex
                      items-center
                      gap-3
                      rounded-lg
                      px-3
                      py-2.5
                      text-sm
                      font-medium

                      ${
                        active
                          ? "bg-green-50 text-green-800"
                          : "text-slate-600 hover:bg-slate-50"
                      }
                    `}
                  >
                    <Icon size={18} />

                    {label}
                  </Link>
                );
              })}
            </nav>

            <Separator className="my-5" />

            {/* BOTTOM ACTIONS */}
            <div className="mt-auto">
              <Button
                variant={"destructive"}
                onClick={logout}
                className="w-full"
              >
                <SignOutIcon size={18} />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* MOBILE OVERLAY */}
        {open && (
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 top-16 z-10 bg-black/20 md:hidden"
          >
            <XCircleIcon className="absolute right-5 top-4" />
          </button>
        )}

        {/* RIGHT CONTENT - ONLY THIS SCROLLS */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-green-700 text-white shadow-lg md:hidden"
        aria-label="Open menu"
      >
        {open ? <XCircleIcon /> : <TextIndentIcon />}
      </button>
    </div>
  );
}
