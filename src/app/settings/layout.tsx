import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = sectionMetadata(
  "Ajustes",
  "Configura la apariencia, límites, y otras opciones de Finanzzz.",
  "/settings"
);

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
