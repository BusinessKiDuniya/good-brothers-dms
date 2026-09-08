import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
   allowedDevOrigins: [
    "imminent-setting-isotope.ngrok-free.dev",
  ],
};

export default nextConfig;