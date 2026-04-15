export const HOME_DASHBOARD_LAYOUT_STORAGE_KEY =
  "finanzzz-home-dashboard-layout" as const;

export type HomeDashboardWidgetId =
  | "globalGauge"
  | "transactions"
  | "topSource"
  | "activeSources"
  | "spendingBySource"
  | "spendingByTag"
  | "spendingTrend";

export type HomeDashboardRowId = "metrics" | "charts" | "trend";

export type HomeDashboardLayoutV1 = {
  v: 1;
  rowOrder: HomeDashboardRowId[];
  itemsByRow: Record<HomeDashboardRowId, HomeDashboardWidgetId[]>;
  hidden: HomeDashboardWidgetId[];
};

export const HOME_DASHBOARD_ROW_IDS: HomeDashboardRowId[] = [
  "metrics",
  "charts",
  "trend",
];

export const HOME_DASHBOARD_WIDGET_IDS: HomeDashboardWidgetId[] = [
  "globalGauge",
  "transactions",
  "topSource",
  "activeSources",
  "spendingBySource",
  "spendingByTag",
  "spendingTrend",
];

function isRowId(id: string): id is HomeDashboardRowId {
  return (HOME_DASHBOARD_ROW_IDS as string[]).includes(id);
}

function isWidgetId(id: string): id is HomeDashboardWidgetId {
  return (HOME_DASHBOARD_WIDGET_IDS as string[]).includes(id);
}

export function defaultHomeDashboardLayout(): HomeDashboardLayoutV1 {
  return {
    v: 1,
    rowOrder: [...HOME_DASHBOARD_ROW_IDS],
    itemsByRow: {
      metrics: ["globalGauge", "transactions", "topSource", "activeSources"],
      charts: ["spendingBySource", "spendingByTag"],
      trend: ["spendingTrend"],
    },
    hidden: [],
  };
}

export function normalizeHomeDashboardLayout(
  raw: unknown
): HomeDashboardLayoutV1 {
  const defaults = defaultHomeDashboardLayout();
  if (!raw || typeof raw !== "object") return defaults;

  const o = raw as Partial<HomeDashboardLayoutV1>;
  if (o.v !== 1) return defaults;

  const rowOrderRaw = Array.isArray(o.rowOrder)
    ? o.rowOrder
    : defaults.rowOrder;
  const rowOrder: HomeDashboardRowId[] = [];
  for (const id of rowOrderRaw) {
    if (typeof id === "string" && isRowId(id) && !rowOrder.includes(id)) {
      rowOrder.push(id);
    }
  }
  for (const id of HOME_DASHBOARD_ROW_IDS) {
    if (!rowOrder.includes(id)) rowOrder.push(id);
  }

  const itemsByRow: Record<HomeDashboardRowId, HomeDashboardWidgetId[]> = {
    ...defaults.itemsByRow,
  };

  for (const row of HOME_DASHBOARD_ROW_IDS) {
    const stored = o.itemsByRow?.[row];
    if (!Array.isArray(stored)) continue;
    const valid = stored.filter(
      (id): id is HomeDashboardWidgetId =>
        typeof id === "string" && isWidgetId(id)
    );
    const merged: HomeDashboardWidgetId[] = [...valid];
    for (const w of defaults.itemsByRow[row]) {
      if (!merged.includes(w)) merged.push(w);
    }
    itemsByRow[row] = merged;
  }

  const hiddenRaw = Array.isArray(o.hidden) ? o.hidden : [];
  const hidden: HomeDashboardWidgetId[] = [];
  for (const id of hiddenRaw) {
    if (typeof id === "string" && isWidgetId(id) && !hidden.includes(id)) {
      hidden.push(id);
    }
  }

  return { v: 1, rowOrder, itemsByRow, hidden };
}

export function readHomeDashboardLayout(): HomeDashboardLayoutV1 {
  if (typeof window === "undefined") return defaultHomeDashboardLayout();
  try {
    const raw = localStorage.getItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY);
    if (!raw) return defaultHomeDashboardLayout();
    return normalizeHomeDashboardLayout(JSON.parse(raw) as unknown);
  } catch {
    return defaultHomeDashboardLayout();
  }
}

export function writeHomeDashboardLayout(layout: HomeDashboardLayoutV1): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      HOME_DASHBOARD_LAYOUT_STORAGE_KEY,
      JSON.stringify(layout)
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/** Borra el layout persistido del inicio (p. ej. tras `resetLocalDatabase`). La próxima lectura usa el default. */
export function clearHomeDashboardLayoutStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY);
  } catch (e) {
    console.error("Error al borrar el layout persistido del inicio:", e);
  }
}

export function findRowForWidget(
  layout: HomeDashboardLayoutV1,
  widgetId: HomeDashboardWidgetId
): HomeDashboardRowId | null {
  for (const row of HOME_DASHBOARD_ROW_IDS) {
    if (layout.itemsByRow[row].includes(widgetId)) return row;
  }
  return null;
}
