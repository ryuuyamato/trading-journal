import type { MetadataRoute } from "next";

// Mirrors kandel-brand/code/site.webmanifest. Next generates /manifest.webmanifest
// from this and links it automatically, so no manual <link> tag is needed.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kandel — Trading Journal",
    short_name: "Kandel",
    description: "Catat setiap entry, exit, dan alasan di baliknya.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0B0E11",
    theme_color: "#0B0E11",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
