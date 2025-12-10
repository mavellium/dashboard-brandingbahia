import type { NextConfig } from "next";

const FTP_DOMAIN = process.env.FTP_DOMAIN as string;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: FTP_DOMAIN,
      },
    ],
  },
};

export default nextConfig;
