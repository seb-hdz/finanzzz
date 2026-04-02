import type { AlertLevel, GlobalConfig, Source, Expense, LimitInterval } from "./types";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

export function getIntervalRange(interval: LimitInterval, refDate: Date = new Date()) {
  switch (interval) {
    case "daily":
      return { start: startOfDay(refDate).getTime(), end: endOfDay(refDate).getTime() };
    case "weekly":
      return {
        start: startOfWeek(refDate, { weekStartsOn: 1 }).getTime(),
        end: endOfWeek(refDate, { weekStartsOn: 1 }).getTime(),
      };
    case "monthly":
      return { start: startOfMonth(refDate).getTime(), end: endOfMonth(refDate).getTime() };
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
  const spent = computeSpentInInterval(expenses, config.limitInterval, source.id);
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
  return `S/ ${amount.toFixed(2)}`;
}

export function getAlertMessage(level: AlertLevel, spent: number, limit: number): string {
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  switch (level) {
    case "danger":
      return `Has alcanzado el ${pct}% de tu límite (${formatPEN(spent)} / ${formatPEN(limit)})`;
    case "warning":
      return `Vas en el ${pct}% de tu límite (${formatPEN(spent)} / ${formatPEN(limit)})`;
    case "success":
      return `Gasto registrado. Llevas ${formatPEN(spent)}${limit > 0 ? ` de ${formatPEN(limit)}` : ""}`;
  }
}
