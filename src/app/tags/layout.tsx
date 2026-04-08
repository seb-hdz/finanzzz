import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = sectionMetadata(
  "Tags",
  "Etiquetas para clasificar gastos y ver totales por categoría en reportes y gráficos.",
  "/tags"
);

export default function TagsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
