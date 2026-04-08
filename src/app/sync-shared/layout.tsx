import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = {
  ...sectionMetadata(
    "Enlace compartido",
    "Importa datos de una cuenta compartida; completamente local.",
    "/sync-shared"
  ),
  robots: {
    index: false,
    follow: false,
  },
};

export default function SyncSharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
