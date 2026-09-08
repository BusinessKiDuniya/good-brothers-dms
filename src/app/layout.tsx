import type { Metadata } from "next";
import { Baloo_Bhai_2 } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import SessionProvider from "@/components/providers/SessionProvider";

const balooBhai2 = Baloo_Bhai_2({
  subsets: ["latin"],
  variable: "--font-baloo-bhai-2",
});

export const metadata: Metadata = {
  title: "Hope Foundation | Donation Management",

  description: "Donor management and giving platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        balooBhai2.variable,
        balooBhai2.className,
      )}
    >
      <SessionProvider>
        <body className="min-h-full flex flex-col">{children}</body>
      </SessionProvider>
    </html>
  );
}
