import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = sectionMetadata(
  "Reportes",
  "Exporta y analiza tu actividad o comparte resúmenes.",
  "/reports"
);

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
