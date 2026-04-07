export type SourceType =
  | "bank_account"
  | "mobile_payment"
  | "debit_card"
  | "credit_card"
  | "shared";

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  /** Required when type is `shared`. Normalized to lowercase. */
  sharedPublicId?: string;
  minLimit: number; // -1 = no limit
  maxLimit: number; // -1 = no limit
  color: string;
  icon: string;
  createdAt: number;
}

/** Per-device sync state for a shared source (`sourceId` = local Source.id). */
export interface SharedSourceSync {
  sourceId: string;
  emissions: string[];
  updates: string[];
  lastReceivedRemoteAt: number | null;
  /** Password for encrypting outbound sync URLs (set once on this device). */
  outboundPassword: string | null;
  outboundPasswordLocked: boolean;
  /** Saved after successful inbound decrypt if user opts in. */
  storedInboundPassword: string | null;
  /** True after we applied a payload where peer sent `isPasswordSaved`. */
  peerSavedPassword: boolean;
  /** Expense ids already included in at least one outbound payload from this device. */
  emittedExpenseIds: string[];
}

export const SHARED_PUBLIC_ID_MAX_LEN = 30;

/** After trim + lowercase. Letters, digits, `.`, `_`, `-`. */
export const SHARED_PUBLIC_ID_PATTERN = /^[a-z0-9._-]{1,30}$/;

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

export type LimitInterval = "daily" | "weekly" | "monthly" | "yearly";

export interface GlobalConfig {
  id: string; // always "global"
  totalMaxLimit: number; // -1 = no limit
  limitInterval: LimitInterval;
  warningThreshold: number; // 0-1, e.g. 0.7
  dangerThreshold: number; // 0-1, e.g. 0.9
  /** Hours without receiving a shared sync before showing stale UI. */
  sharedStaleHours: number;
}

export type AlertLevel = "success" | "warning" | "danger";

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  bank_account: "Cuenta Bancaria",
  mobile_payment: "Monedero Digital",
  debit_card: "Tarjeta Débito",
  credit_card: "Tarjeta Crédito",
  shared: "Cuenta Compartida",
};

export const SOURCE_TYPE_ICONS: Record<SourceType, string> = {
  bank_account: "Landmark",
  mobile_payment: "Smartphone",
  debit_card: "CreditCard",
  credit_card: "CreditCard",
  shared: "Users",
};

export function normalizeSharedPublicId(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidSharedPublicId(normalized: string): boolean {
  return SHARED_PUBLIC_ID_PATTERN.test(normalized);
}

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
