import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Windows NTFS concurrent worker mkdir race conditions in sandboxed environments
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
