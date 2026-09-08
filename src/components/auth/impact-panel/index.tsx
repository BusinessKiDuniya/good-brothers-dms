"use client";
import { ngo } from "@/lib/mock-data";
import Image from "next/image";

export function ImpactPanel() {
  return (
    <div className="relative flex min-h-[520px] flex-col justify-between overflow-hidden bg-primary p-8 text-white lg:p-12">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

      <div className="relative">
        <div className="mb-10 flex items-center gap-3">
          <Image src={"/logo/logo.png"} alt="Good Brothers Logo" width={70} height={70}/>

          <span className="font-bold text-2xl">{ngo.name}</span>
        </div>

        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
          Your contribution matters
        </p>

        <h1 className="max-w-lg text-4xl font-bold leading-tight sm:text-5xl">
          {ngo.tagline}
        </h1>

        <p className="mt-5 max-w-md text-sm leading-6 text-green-100/80">
          {ngo.description}
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
        {ngo.stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
          >
            <div className="text-2xl font-bold">{stat.value}</div>

            <div className="mt-1 text-xs text-green-100/70">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
