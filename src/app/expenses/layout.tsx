import type { Metadata } from "next";
import { sectionMetadata } from "@/lib/site-metadata";

export const metadata: Metadata = sectionMetadata(
  "Gastos",
  "Registra y revisa tus gastos: montos, fechas, fuentes y tags.",
  "/expenses"
);

export default function ExpensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
