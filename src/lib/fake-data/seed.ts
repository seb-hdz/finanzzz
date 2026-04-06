import { rand, randBetweenDate, randNumber } from "@ngneat/falso";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { buildExpenseDraft, pickExpenseAmount } from "./builders/expense";
import { buildSource, type SeedableSourceType } from "./builders/source";
import { buildCustomTag } from "./builders/tag";
import {
  defaultFakeSeedOptions,
  type FakeSeedOptions,
} from "./seed-options";

const SOURCE_TYPES: SeedableSourceType[] = [
  "bank_account",
  "mobile_payment",
  "debit_card",
  "credit_card",
];

const MAX_TAGS_PER_EXPENSE = 4;

function pickRandomTagIds(allTagIds: string[]): string[] {
  if (allTagIds.length === 0) return [];
  const maxPick = Math.min(MAX_TAGS_PER_EXPENSE, allTagIds.length);
  const count = randNumber({ min: 0, max: maxPick });
  const pool = [...allTagIds];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = randNumber({ min: 0, max: pool.length - 1 });
    out.push(pool[idx]!);
    pool.splice(idx, 1);
  }
  return out;
}

export async function seedFakeData(
  overrides?: Partial<FakeSeedOptions>
): Promise<{
  tagsAdded: number;
  sourcesAdded: number;
  expensesAdded: number;
}> {
  const opts: FakeSeedOptions = {
    ...defaultFakeSeedOptions(),
    ...overrides,
  };

  const existingTags = await db.tags.toArray();
  const allTagIds: string[] = existingTags.map((t) => t.id);

  const customTags = Array.from({ length: opts.customTagCount }, () => ({
    ...buildCustomTag(),
    id: uuid(),
  }));
  allTagIds.push(...customTags.map((t) => t.id));

  const from = new Date(opts.expenseDateStartMs);
  const to = new Date(opts.expenseDateEndMs);

  const sourcesRows = SOURCE_TYPES.flatMap((type) =>
    Array.from({ length: opts.sourcesPerType }, () => ({
      ...buildSource(type),
      id: uuid(),
      createdAt: Date.now(),
    }))
  );
  const sourceIds = sourcesRows.map((s) => s.id);

  const expensesRows = Array.from({ length: opts.expenseCount }, () => {
    const date = randBetweenDate({ from, to });
    return {
      ...buildExpenseDraft({
        sourceId: rand(sourceIds),
        tagIds: pickRandomTagIds(allTagIds),
        dateMs: date.getTime(),
        amount: pickExpenseAmount(),
      }),
      id: uuid(),
      createdAt: Date.now(),
    };
  });

  await db.transaction("rw", [db.tags, db.sources, db.expenses], async () => {
    await db.tags.bulkAdd(customTags);
    await db.sources.bulkAdd(sourcesRows);
    await db.expenses.bulkAdd(expensesRows);
  });

  return {
    tagsAdded: customTags.length,
    sourcesAdded: sourcesRows.length,
    expensesAdded: expensesRows.length,
  };
}
