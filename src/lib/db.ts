import Dexie, { type EntityTable } from "dexie";
import type { Source, Expense, Tag, GlobalConfig } from "./types";
import { PREDEFINED_TAGS, DEFAULT_GLOBAL_CONFIG } from "./constants";
import { v4 as uuid } from "uuid";

export const db = new Dexie("finanzzz") as Dexie & {
  sources: EntityTable<Source, "id">;
  expenses: EntityTable<Expense, "id">;
  tags: EntityTable<Tag, "id">;
  config: EntityTable<GlobalConfig, "id">;
};

db.version(1).stores({
  sources: "id, name, type, createdAt",
  expenses: "id, sourceId, date, amount, createdAt, *tagIds",
  tags: "id, name, isPredefined",
  config: "id",
});

export async function seedDatabase() {
  const tagCount = await db.tags.count();
  if (tagCount === 0) {
    const tags = PREDEFINED_TAGS.map((t) => ({ ...t, id: uuid() }));
    await db.tags.bulkAdd(tags);
  }

  const configExists = await db.config.get("global");
  if (!configExists) {
    await db.config.add(DEFAULT_GLOBAL_CONFIG);
  }
}
