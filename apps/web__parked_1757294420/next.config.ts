import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip ESLint in CI builds (Vercel)
  eslint: { ignoreDuringBuilds: true },

  // Silence the “inferred workspace root” warning
  // (__dirname points at apps/web, which is what we want)
  turbopack: { root: __dirname },
};

export default nextConfig;
