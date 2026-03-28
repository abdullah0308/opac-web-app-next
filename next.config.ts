import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

// next-pwa uses CommonJS — dynamic require to avoid ESM issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false,
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig: NextConfig = {
  // Allow Payload Admin UI + your app to coexist
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default withPWA(withPayload(nextConfig));
