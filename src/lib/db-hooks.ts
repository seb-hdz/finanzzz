"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import type { Expense, GlobalConfig, LimitInterval, Source, Tag } from "./types";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

export function useSources() {
  return useLiveQuery(() => db.sources.orderBy("createdAt").toArray()) ?? [];
}

export function useSource(id: string | undefined) {
  return useLiveQuery(() => (id ? db.sources.get(id) : undefined), [id]);
}

export function useTags() {
  return useLiveQuery(() => db.tags.orderBy("name").toArray()) ?? [];
}

export function useGlobalConfig(): GlobalConfig | undefined {
  return useLiveQuery(() => db.config.get("global"));
}

function getIntervalRange(interval: LimitInterval, refDate: Date = new Date()) {
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

export function useExpenses(filters?: {
  sourceId?: string;
  tagId?: string;
  startDate?: number;
  endDate?: number;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}) {
  return (
    useLiveQuery(() => {
      let collection = db.expenses.orderBy("date").reverse();

      return collection.toArray().then((expenses) => {
        let result = expenses;

        if (filters?.sourceId) {
          result = result.filter((e) => e.sourceId === filters.sourceId);
        }
        if (filters?.tagId) {
          result = result.filter((e) => e.tagIds.includes(filters.tagId!));
        }
        if (filters?.startDate) {
          result = result.filter((e) => e.date >= filters.startDate!);
        }
        if (filters?.endDate) {
          result = result.filter((e) => e.date <= filters.endDate!);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          result = result.filter(
            (e) =>
              e.description.toLowerCase().includes(q) ||
              e.amount.toString().includes(q)
          );
        }
        if (filters?.minAmount !== undefined) {
          result = result.filter((e) => e.amount >= filters.minAmount!);
        }
        if (filters?.maxAmount !== undefined) {
          result = result.filter((e) => e.amount <= filters.maxAmount!);
        }

        return result;
      });
    }, [filters]) ?? []
  );
}

export function useExpensesInInterval(interval: LimitInterval) {
  const range = getIntervalRange(interval);
  return (
    useLiveQuery(
      () =>
        db.expenses
          .where("date")
          .between(range.start, range.end, true, true)
          .toArray(),
      [interval]
    ) ?? []
  );
}

export function useSourceExpensesInInterval(
  sourceId: string | undefined,
  interval: LimitInterval
) {
  const range = getIntervalRange(interval);
  return (
    useLiveQuery(
      () =>
        sourceId
          ? db.expenses
              .where("date")
              .between(range.start, range.end, true, true)
              .filter((e) => e.sourceId === sourceId)
              .toArray()
          : [],
      [sourceId, interval]
    ) ?? []
  );
}

export function useExpensesByDateRange(startDate: number, endDate: number) {
  return (
    useLiveQuery(
      () =>
        db.expenses
          .where("date")
          .between(startDate, endDate, true, true)
          .reverse()
          .sortBy("date"),
      [startDate, endDate]
    ) ?? []
  );
}

export async function addExpense(expense: Omit<Expense, "id" | "createdAt">) {
  const { v4: uuid } = await import("uuid");
  return db.expenses.add({
    ...expense,
    id: uuid(),
    createdAt: Date.now(),
  });
}

export async function updateExpense(id: string, data: Partial<Expense>) {
  return db.expenses.update(id, data);
}

export async function deleteExpense(id: string) {
  return db.expenses.delete(id);
}

export async function addSource(source: Omit<Source, "id" | "createdAt">) {
  const { v4: uuid } = await import("uuid");
  return db.sources.add({
    ...source,
    id: uuid(),
    createdAt: Date.now(),
  });
}

export async function updateSource(id: string, data: Partial<Source>) {
  return db.sources.update(id, data);
}

export async function deleteSource(id: string) {
  const expenses = await db.expenses.where("sourceId").equals(id).count();
  if (expenses > 0) {
    throw new Error(
      `No se puede eliminar: hay ${expenses} gasto(s) asociado(s) a esta fuente.`
    );
  }
  return db.sources.delete(id);
}

export async function addTag(tag: Omit<Tag, "id">) {
  const { v4: uuid } = await import("uuid");
  return db.tags.add({ ...tag, id: uuid() });
}

export async function updateTag(id: string, data: Partial<Tag>) {
  return db.tags.update(id, data);
}

export async function deleteTag(id: string) {
  return db.tags.delete(id);
}

export async function updateGlobalConfig(data: Partial<GlobalConfig>) {
  return db.config.update("global", data);
}
