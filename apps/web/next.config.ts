const INTERNAL_API_ORIGIN = process.env.INTERNAL_API_ORIGIN || "http://api:8080";

const nextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${INTERNAL_API_ORIGIN}/:path*` },
    ];
  },
};

export default nextConfig;
