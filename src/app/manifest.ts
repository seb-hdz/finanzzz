import type { MetadataRoute } from "next";
import { appBasePath } from "@/lib/app-base-path";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const prefix = appBasePath;

  return {
    name: "Finanzzz",
    short_name: "Finanzzz",
    description: "Control de gastos personales",
    start_url: `${prefix}/`,
    scope: `${prefix}/`,
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    orientation: "portrait-primary",
    icons: [
      {
        src: `${prefix}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${prefix}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${prefix}/icons/icon-192.svg`,
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: `${prefix}/icons/icon-512.svg`,
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
