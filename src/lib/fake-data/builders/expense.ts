import { randAmount, randCatchPhrase, randProductName } from "@ngneat/falso";
import type { Expense } from "@/lib/types";

function chance(p: number): boolean {
  return Math.random() < p;
}

export function pickExpenseAmount(): number {
  const heavy = chance(0.12);
  const raw = heavy
    ? randAmount({ min: 100, max: 2500 })
    : randAmount({ min: 2, max: 180 });
  return Math.round(raw * 100) / 100;
}

export function buildExpenseDraft(params: {
  sourceId: string;
  tagIds: string[];
  dateMs: number;
  amount: number;
}): Omit<Expense, "id" | "createdAt"> {
  const description = chance(0.55)
    ? randProductName()
    : randCatchPhrase();
  return {
    amount: params.amount,
    description: description.slice(0, 200),
    sourceId: params.sourceId,
    tagIds: params.tagIds,
    date: params.dateMs,
  };
}
