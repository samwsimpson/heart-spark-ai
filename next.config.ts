import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // keep the build serverful; do NOT set output:"export"
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true }
};

export default nextConfig;
