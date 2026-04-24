import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // The Worker (src/index.js) uses Cloudflare Worker globals (URL, Response, Headers)
    // which ESLint in browser scope misidentifies as undefined.
    // The Worker is deployed independently via wrangler, not bundled by Next.js.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-2396f6cc78584b509842059538a7220f.r2.dev",
      },
    ],
  },
};

export default nextConfig;
