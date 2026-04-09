import type { MetadataRoute } from "next";
import { appBasePath } from "@/lib/app-base-path";

export const dynamic = "force-static";

/**
 * Orden: PNG por acceso → icono general de la app → SVG (p. ej. Android/WebAPK).
 */
const SHORTCUT_ICONS = (name: string) => {
  const prefix = appBasePath;
  return [
    {
      src: `${prefix}/icons/shortcut-${name}.png`,
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: `${prefix}/icons/icon-192.png`,
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: `${prefix}/icons/shortcut-${name}.svg`,
      sizes: "192x192",
      type: "image/svg+xml",
    },
  ];
};

export default function manifest(): MetadataRoute.Manifest {
  const prefix = appBasePath;

  return {
    name: "Finanzzz",
    short_name: "Finanzzz",
    description: "Control de gastos personales",
    start_url: `${prefix}/`,
    scope: `${prefix}/`,
    /**
     * Chrome (p. ej. macOS): sin esto, `auto` suele abrir un cliente nuevo al usar
     * accesos del manifiesto. `navigate-existing` reutiliza la ventana y navega.
     * @see https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/launch_handler
     */
    launch_handler: {
      client_mode: ["navigate-existing", "auto"],
    },
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
    shortcuts: [
      {
        name: "Nuevo gasto",
        description: "Registra un nuevo gasto",
        url: `${prefix}/expenses?new`,
        icons: SHORTCUT_ICONS("expense"),
      },
      {
        name: "Sincronizar cuenta compartida",
        short_name: "Sincronizar",
        description: "Sincroniza una cuenta compartida",
        url: `${prefix}/sync-shared`,
        icons: SHORTCUT_ICONS("sync"),
      },
      {
        name: "Generar reporte",
        description: "Genera un reporte de tus gastos",
        url: `${prefix}/reports`,
        icons: SHORTCUT_ICONS("reports"),
      },
      {
        name: "Ajustes",
        description: "Configura tu aplicación",
        url: `${prefix}/settings`,
        icons: SHORTCUT_ICONS("settings"),
      },
    ],
    share_target: {
      action: `${prefix}/share-sync-ingest`,
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [
          {
            name: "files",
            accept: ["image/*"],
          },
        ],
      },
    },
  };
}
