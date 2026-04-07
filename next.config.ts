import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    middlewarePrefetch: "strict",
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "nsqimhnrvgkhdetxkflr.supabase.co",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
