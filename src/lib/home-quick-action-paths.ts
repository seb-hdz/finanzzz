export const HOME_QUICK_ACTION_PATHS = {
  new_expense: "/expenses?new",
  sync_shared: "/sync-shared",
  report: "/reports",
} as const;

export type HomeQuickActionId = keyof typeof HOME_QUICK_ACTION_PATHS;

/** Persisted value when no shortcut is shown on Inicio. */
export const HOME_QUICK_ACTION_CONFIG_NONE = "none" as const;

export type HomeQuickActionConfigId =
  | HomeQuickActionId
  | typeof HOME_QUICK_ACTION_CONFIG_NONE;

export const HOME_QUICK_ACTION_ORDER = [
  "new_expense",
  "sync_shared",
  "report",
] as const satisfies readonly HomeQuickActionId[];

const ID_SET = new Set<string>(HOME_QUICK_ACTION_ORDER);

/** Suggested default when an action is required (e.g. migrations). */
export const DEFAULT_HOME_QUICK_ACTION_ID: HomeQuickActionId = "new_expense";

export const HOME_QUICK_ACTION_SETTINGS_HASH = "#home-quick-action" as const;

export const HOME_QUICK_ACTION_SETTINGS_HREF =
  `/settings${HOME_QUICK_ACTION_SETTINGS_HASH}` as const;

export function isHomeQuickActionId(v: unknown): v is HomeQuickActionId {
  return typeof v === "string" && ID_SET.has(v);
}

export function isValidId(v: unknown): v is HomeQuickActionConfigId {
  return v === HOME_QUICK_ACTION_CONFIG_NONE || isHomeQuickActionId(v);
}

/** Maps legacy/missing values to `none`. */
export function resolveHomeQuickActionConfigId(
  v: unknown
): HomeQuickActionConfigId {
  if (v === undefined || v === null) return HOME_QUICK_ACTION_CONFIG_NONE;
  if (v === HOME_QUICK_ACTION_CONFIG_NONE) return HOME_QUICK_ACTION_CONFIG_NONE;
  if (isHomeQuickActionId(v)) return v;
  return HOME_QUICK_ACTION_CONFIG_NONE;
}

/** Returns a concrete action id, or `null` if disabled / unknown. */
export function resolveHomeQuickActionId(v: unknown): HomeQuickActionId | null {
  return isHomeQuickActionId(v) ? v : null;
}
