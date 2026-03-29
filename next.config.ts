import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  // Prevent Next.js from bundling packages that use dynamic require()
  serverExternalPackages: ["drizzle-kit", "@payloadcms/drizzle"],
};

export default withPayload(nextConfig);
