export type SourceType =
  | "bank_account"
  | "mobile_payment"
  | "debit_card"
  | "credit_card";

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  minLimit: number; // -1 = no limit
  maxLimit: number; // -1 = no limit
  color: string;
  icon: string;
  createdAt: number;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  sourceId: string;
  tagIds: string[];
  date: number;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  isPredefined: boolean;
}

export type LimitInterval = "daily" | "weekly" | "monthly";

export interface GlobalConfig {
  id: string; // always "global"
  totalMaxLimit: number; // -1 = no limit
  limitInterval: LimitInterval;
  warningThreshold: number; // 0-1, e.g. 0.7
  dangerThreshold: number; // 0-1, e.g. 0.9
}

export type AlertLevel = "success" | "warning" | "danger";

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  bank_account: "Cuenta Bancaria",
  mobile_payment: "Pago Móvil",
  debit_card: "Tarjeta Débito",
  credit_card: "Tarjeta Crédito",
};

export const SOURCE_TYPE_ICONS: Record<SourceType, string> = {
  bank_account: "Landmark",
  mobile_payment: "Smartphone",
  debit_card: "CreditCard",
  credit_card: "CreditCard",
};

export const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
];
