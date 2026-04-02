import { db } from "./db";

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt.buffer as ArrayBuffer, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function exportDatabase(password: string): Promise<Blob> {
  const data = {
    sources: await db.sources.toArray(),
    expenses: await db.expenses.toArray(),
    tags: await db.tags.toArray(),
    config: await db.config.toArray(),
    exportedAt: Date.now(),
    version: 1,
  };

  const json = JSON.stringify(data);
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(json);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  const payload = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  payload.set(salt, 0);
  payload.set(iv, salt.length);
  payload.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return new Blob([payload], { type: "application/octet-stream" });
}

export async function importDatabase(file: File, password: string): Promise<void> {
  const buffer = await file.arrayBuffer();
  const payload = new Uint8Array(buffer);

  const salt = payload.slice(0, 16);
  const iv = payload.slice(16, 28);
  const ciphertext = payload.slice(28);

  const key = await deriveKey(password, salt);

  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
  } catch {
    throw new Error("Contraseña incorrecta o archivo corrupto.");
  }

  const decoder = new TextDecoder();
  const json = decoder.decode(plaintext);
  const data = JSON.parse(json);

  if (!data.version || !data.sources || !data.expenses || !data.tags || !data.config) {
    throw new Error("Formato de archivo inválido.");
  }

  await db.transaction("rw", db.sources, db.expenses, db.tags, db.config, async () => {
    await db.sources.clear();
    await db.expenses.clear();
    await db.tags.clear();
    await db.config.clear();

    await db.sources.bulkAdd(data.sources);
    await db.expenses.bulkAdd(data.expenses);
    await db.tags.bulkAdd(data.tags);
    await db.config.bulkAdd(data.config);
  });
}
