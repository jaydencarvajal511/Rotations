import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Album artwork from the iTunes catalog
    remotePatterns: [new URL("https://*.mzstatic.com/**")],
  },
};

export default withSerwist(nextConfig);
