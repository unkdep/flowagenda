import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://flowagenda.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;