import type { SourceType } from "@/lib/types";

/** Agrupación de cuentas por tipo (formulario de gastos, filtros, etc.). */
export const PAYMENT_SOURCE_SECTIONS: readonly {
  readonly label: string;
  readonly types: readonly SourceType[];
}[] = [
  { label: "Cuentas Bancarias", types: ["bank_account"] },
  { label: "Tarjetas", types: ["debit_card", "credit_card"] },
  { label: "Monederos digitales", types: ["mobile_payment"] },
  { label: "Cuentas compartidas", types: ["shared"] },
] as const;
