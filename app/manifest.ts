import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rotations",
    short_name: "Rotations",
    description: "Track the albums you want to hear and the ones you have.",
    start_url: "/",
    display: "standalone",
    background_color: "#e6e6ea",
    theme_color: "#e6e6ea",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
