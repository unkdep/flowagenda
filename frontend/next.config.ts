import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,

  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "https://flowagenda.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;