import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = sectionMetadata(
  "Fuentes",
  "Organiza tus fuentes de gasto en un solo lugar.",
  "/sources"
);

export default function SourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
