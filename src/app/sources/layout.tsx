import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = sectionMetadata(
  "Cuentas",
  "Organiza tus cuentas de gasto en un solo lugar.",
  "/sources"
);

export default function SourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
