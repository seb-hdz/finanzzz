import { CURRENCY_SYMBOL } from "./constants";
import { cn } from "./utils";
import type {
  AlertLevel,
  GlobalConfig,
  Source,
  Expense,
  LimitInterval,
} from "./types";

/** Etiqueta junto al monto gastado en tarjetas de fuente (intervalo global). */
export const LIMIT_INTERVAL_SPENT_LABELS: Record<LimitInterval, string> = {
  daily: "Gastado este día",
  weekly: "Gastado esta semana",
  monthly: "Gastado este mes",
  yearly: "Gastado este año",
};
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

export function getIntervalRange(
  interval: LimitInterval,
  refDate: Date = new Date()
) {
  switch (interval) {
    case "daily":
      return {
        start: startOfDay(refDate).getTime(),
        end: endOfDay(refDate).getTime(),
      };
    case "weekly":
      return {
        start: startOfWeek(refDate, { weekStartsOn: 1 }).getTime(),
        end: endOfWeek(refDate, { weekStartsOn: 1 }).getTime(),
      };
    case "monthly":
      return {
        start: startOfMonth(refDate).getTime(),
        end: endOfMonth(refDate).getTime(),
      };
    case "yearly":
      return {
        start: startOfYear(refDate).getTime(),
        end: endOfYear(refDate).getTime(),
      };
  }
}

export function computeSpentInInterval(
  expenses: Expense[],
  interval: LimitInterval,
  sourceId?: string
): number {
  const { start, end } = getIntervalRange(interval);
  return expenses
    .filter(
      (e) =>
        e.date >= start &&
        e.date <= end &&
        (sourceId ? e.sourceId === sourceId : true)
    )
    .reduce((sum, e) => sum + e.amount, 0);
}

export function evaluateAlert(
  spent: number,
  limit: number,
  config: GlobalConfig
): AlertLevel {
  if (limit <= 0) return "success";
  const ratio = spent / limit;
  if (ratio >= config.dangerThreshold) return "danger";
  if (ratio >= config.warningThreshold) return "warning";
  return "success";
}

export function evaluateSourceAlert(
  expenses: Expense[],
  source: Source,
  config: GlobalConfig
): AlertLevel {
  if (source.maxLimit <= 0) return "success";
  const spent = computeSpentInInterval(
    expenses,
    config.limitInterval,
    source.id
  );
  return evaluateAlert(spent, source.maxLimit, config);
}

export function evaluateGlobalAlert(
  expenses: Expense[],
  config: GlobalConfig
): AlertLevel {
  if (config.totalMaxLimit <= 0) return "success";
  const spent = computeSpentInInterval(expenses, config.limitInterval);
  return evaluateAlert(spent, config.totalMaxLimit, config);
}

export function formatPEN(amount: number): string {
  return `${CURRENCY_SYMBOL} ${amount.toFixed(2)}`;
}

export function getAlertMessage(
  level: AlertLevel,
  spent: number,
  limit: number
): string {
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  switch (level) {
    case "danger":
      return `Has alcanzado el ${pct}% de tu límite (${formatPEN(
        spent
      )} de ${formatPEN(limit)})`;
    case "warning":
      return `Vas en el ${pct}% de tu límite (${formatPEN(
        spent
      )} de ${formatPEN(limit)})`;
    case "success":
      return `Gasto registrado. Llevas ${formatPEN(spent)}${
        limit > 0 ? ` de ${formatPEN(limit)}` : ""
      }`;
  }
}

/** Pista del Progress de límites: gris relativo a la card (light/dark). */
export function limitProgressTrackClassName() {
  return cn(
    "lg:h-3",
    "bg-[color-mix(in_oklch,var(--card)_88%,black)]",
    "dark:bg-[color-mix(in_oklch,var(--card)_72%,white)]"
  );
}

export function limitProgressIndicatorClassName(
  isDanger: boolean | undefined,
  isWarning: boolean | undefined
): string {
  return isDanger
    ? "bg-red-500"
    : isWarning
      ? "bg-yellow-500"
      : "bg-emerald-500";
}
