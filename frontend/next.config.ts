import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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