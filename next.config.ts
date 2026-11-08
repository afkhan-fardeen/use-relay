import type { NextConfig } from "next";

// Security headers on every response. (A strict Content-Security-Policy needs per-request nonces
// with Next's inline scripts; it is a separate piece of work.)
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    // Old product-page address, and the retired QR app: send visitors somewhere useful.
    return [
      { source: "/apps/export", destination: "/", permanent: true },
      { source: "/apps/qr", destination: "/", permanent: true },
      { source: "/qr-code-generator", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
