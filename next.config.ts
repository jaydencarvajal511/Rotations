import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Album artwork from the Deezer catalog
    remotePatterns: [new URL("https://cdn-images.dzcdn.net/images/cover/**")],
  },
};

export default withSerwist(nextConfig);
