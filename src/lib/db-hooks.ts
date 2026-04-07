"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { createDefaultSharedSyncState, db } from "./db";
import type {
  Expense,
  GlobalConfig,
  LimitInterval,
  SharedSourceSync,
  Source,
  Tag,
} from "./types";
import { getIntervalRange } from "./limits";

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

export function useSharedSyncState(sourceId: string | undefined) {
  return useLiveQuery(
    () => (sourceId ? db.sharedSync.get(sourceId) : undefined),
    [sourceId]
  );
}

export function isSharedSourceLinked(sync: SharedSourceSync | undefined): boolean {
  return !!sync && sync.emissions.length >= 1 && sync.updates.length >= 1;
}

/**
 * Count of local expenses for this shared source not yet included in any successful
 * outbound sync (`emittedExpenseIds`). Only meaningful when the source is linked.
 */
export function useSharedSourcePendingOutboundCount(
  sourceId: string | undefined,
  linked: boolean
) {
  return (
    useLiveQuery(async () => {
      if (!sourceId || !linked) return 0;
      const sync = await db.sharedSync.get(sourceId);
      const emitted = new Set(sync?.emittedExpenseIds ?? []);
      const exps = await db.expenses
        .where("sourceId")
        .equals(sourceId)
        .toArray();
      let n = 0;
      for (const e of exps) {
        if (!emitted.has(e.id)) n += 1;
      }
      return n;
    }, [sourceId, linked]) ?? 0
  );
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
      const collection = db.expenses.orderBy("date").reverse();

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
  const id = uuid();
  await db.sources.add({
    ...source,
    id,
    createdAt: Date.now(),
  });
  if (source.type === "shared") {
    await db.sharedSync.put(createDefaultSharedSyncState(id));
  }
  return id;
}

export async function updateSource(id: string, data: Partial<Source>) {
  const prev = await db.sources.get(id);
  if (!prev) return;

  const mergedType = data.type ?? prev.type;
  const sharedPublicId =
    mergedType === "shared"
      ? data.sharedPublicId !== undefined
        ? data.sharedPublicId
        : prev.sharedPublicId
      : undefined;

  await db.sources.put({
    ...prev,
    ...data,
    sharedPublicId,
  });

  if (prev.type === "shared" && mergedType !== "shared") {
    await db.sharedSync.delete(id);
  }
  if (mergedType === "shared" && prev.type !== "shared") {
    const row = await db.sharedSync.get(id);
    if (!row) {
      await db.sharedSync.put(createDefaultSharedSyncState(id));
    }
  }
}

export async function deleteSource(id: string) {
  const expenses = await db.expenses.where("sourceId").equals(id).count();
  if (expenses > 0) {
    throw new Error(
      `No se puede eliminar: hay ${expenses} gasto(s) asociado(s) a esta fuente.`
    );
  }
  await db.sharedSync.delete(id);
  return db.sources.delete(id);
}

export async function setSharedSourceOutboundPassword(
  sourceId: string,
  password: string,
  locked: boolean
) {
  const row =
    (await db.sharedSync.get(sourceId)) ?? createDefaultSharedSyncState(sourceId);
  await db.sharedSync.put({
    ...row,
    outboundPassword: password,
    outboundPasswordLocked: locked,
  });
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
