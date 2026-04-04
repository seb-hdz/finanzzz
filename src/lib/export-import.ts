import { db } from "./db";
import { decryptBinaryWithPassword, encryptBinaryWithPassword } from "./crypto-blob";

export async function exportDatabase(password: string): Promise<Blob> {
  const data = {
    sources: await db.sources.toArray(),
    expenses: await db.expenses.toArray(),
    tags: await db.tags.toArray(),
    config: await db.config.toArray(),
    sharedSync: await db.sharedSync.toArray(),
    exportedAt: Date.now(),
    version: 2,
  };

  const json = JSON.stringify(data);
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(json);

  const payload = await encryptBinaryWithPassword(plaintext, password);
  return new Blob([payload.slice()], { type: "application/octet-stream" });
}

export async function importDatabase(file: File, password: string): Promise<void> {
  const buffer = await file.arrayBuffer();
  const payload = new Uint8Array(buffer);

  let plaintext: Uint8Array;
  try {
    plaintext = await decryptBinaryWithPassword(payload, password);
  } catch (e) {
    throw e instanceof Error ? e : new Error("Error al descifrar.");
  }

  const decoder = new TextDecoder();
  const json = decoder.decode(plaintext);
  const data = JSON.parse(json);

  if (!data.version || !data.sources || !data.expenses || !data.tags || !data.config) {
    throw new Error("Formato de archivo inválido.");
  }
  if (data.version !== 1 && data.version !== 2) {
    throw new Error("Versión de respaldo no soportada.");
  }

  const sharedSyncRows = Array.isArray(data.sharedSync) ? data.sharedSync : [];

  await db.transaction(
    "rw",
    [db.sources, db.expenses, db.tags, db.config, db.sharedSync],
    async () => {
      await db.sources.clear();
      await db.expenses.clear();
      await db.tags.clear();
      await db.config.clear();
      await db.sharedSync.clear();

      await db.sources.bulkAdd(data.sources);
      await db.expenses.bulkAdd(data.expenses);
      await db.tags.bulkAdd(data.tags);
      await db.config.bulkAdd(data.config);
      if (sharedSyncRows.length > 0) {
        await db.sharedSync.bulkAdd(sharedSyncRows);
      }
    }
  );
}
