import { createDefaultSharedSyncState, db } from "./db";
import type { Expense, SharedSourceSync, Source } from "./types";
import { getSyncSharedPath } from "./site";
import { decryptBinaryWithPassword, encryptBinaryWithPassword } from "./crypto-blob";

const FORMAT_RAW = 0;
const FORMAT_GZIP = 1;

const MAX_URL_TOKEN_CHARS = 1800;
const MAX_EXPENSES_TRY = 40;

export type SharedSyncPlainV1 = {
  v: 1;
  sharedPublicId: string;
  isPasswordSaved?: boolean;
  expenses: Expense[];
  emittedAt: number;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function packPlaintext(jsonBytes: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") {
    const out = new Uint8Array(1 + jsonBytes.byteLength);
    out[0] = FORMAT_RAW;
    out.set(jsonBytes, 1);
    return out;
  }
  const cs = new CompressionStream("gzip");
  const buf = await new Response(
    new Blob([jsonBytes.slice()]).stream().pipeThrough(cs)
  ).arrayBuffer();
  const gz = new Uint8Array(buf);
  if (gz.byteLength >= jsonBytes.byteLength * 0.9) {
    const out = new Uint8Array(1 + jsonBytes.byteLength);
    out[0] = FORMAT_RAW;
    out.set(jsonBytes, 1);
    return out;
  }
  const out = new Uint8Array(1 + gz.byteLength);
  out[0] = FORMAT_GZIP;
  out.set(gz, 1);
  return out;
}

async function unpackPlaintext(payload: Uint8Array): Promise<Uint8Array> {
  if (payload.byteLength < 2) {
    throw new Error("Datos inválidos.");
  }
  const fmt = payload[0];
  const rest = payload.slice(1);
  if (fmt === FORMAT_RAW) {
    return rest;
  }
  if (fmt === FORMAT_GZIP) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("Tu navegador no puede descomprimir este enlace.");
    }
    const ds = new DecompressionStream("gzip");
    const buf = await new Response(
      new Blob([rest.slice()]).stream().pipeThrough(ds)
    ).arrayBuffer();
    return new Uint8Array(buf);
  }
  throw new Error("Formato de paquete desconocido.");
}

function selectExpensesForBulk(
  all: Expense[],
  emittedIds: Set<string>,
  maxCount: number
): Expense[] {
  const pending = all
    .filter((e) => !emittedIds.has(e.id))
    .sort((a, b) => a.createdAt - b.createdAt);
  return pending.slice(0, maxCount);
}

export type BuildSharedSyncResult = {
  token: string;
  includedExpenses: Expense[];
  urlTooLong: boolean;
};

export async function buildSharedSyncToken(
  source: Source,
  sync: SharedSourceSync,
  password: string
): Promise<BuildSharedSyncResult> {
  if (source.type !== "shared" || !source.sharedPublicId) {
    throw new Error("La fuente no es compartida.");
  }

  const all = await db.expenses.where("sourceId").equals(source.id).toArray();
  const emitted = new Set(sync.emittedExpenseIds);

  let count = Math.min(MAX_EXPENSES_TRY, Math.max(1, all.length || 1));
  let included: Expense[] = [];

  for (let attempt = 0; attempt < 12; attempt++) {
    included = selectExpensesForBulk(all, emitted, count);
    const plain: SharedSyncPlainV1 = {
      v: 1,
      sharedPublicId: source.sharedPublicId,
      isPasswordSaved: !!sync.storedInboundPassword,
      expenses: included,
      emittedAt: Date.now(),
    };
    const encoder = new TextEncoder();
    const jsonBytes = encoder.encode(JSON.stringify(plain));
    const packed = await packPlaintext(jsonBytes);
    const encrypted = await encryptBinaryWithPassword(packed, password);
    const token = bytesToBase64Url(encrypted);

    if (token.length <= MAX_URL_TOKEN_CHARS) {
      return { token, includedExpenses: included, urlTooLong: false };
    }

    count = Math.max(0, Math.floor(count / 2));
    if (count === 0) {
      const plainEmpty: SharedSyncPlainV1 = {
        v: 1,
        sharedPublicId: source.sharedPublicId,
        isPasswordSaved: !!sync.storedInboundPassword,
        expenses: [],
        emittedAt: Date.now(),
      };
      const enc2 = new TextEncoder();
      const p2 = await packPlaintext(enc2.encode(JSON.stringify(plainEmpty)));
      const enc = await encryptBinaryWithPassword(p2, password);
      const tok2 = bytesToBase64Url(enc);
      return {
        token: tok2,
        includedExpenses: [],
        urlTooLong: tok2.length > MAX_URL_TOKEN_CHARS,
      };
    }
  }

  return { token: "", includedExpenses: [], urlTooLong: true };
}

export type ApplySharedSyncInput = {
  token: string;
  password: string;
  rememberPassword: boolean;
};

export type ApplySharedSyncResult =
  | { ok: true; sourceId: string; mergedCount: number; sharedPublicId: string }
  | { ok: false; error: string };

export async function applySharedSyncFromToken(
  input: ApplySharedSyncInput
): Promise<ApplySharedSyncResult> {
  let encrypted: Uint8Array;
  try {
    encrypted = base64UrlToBytes(input.token.trim());
  } catch {
    return { ok: false, error: "Enlace inválido (Base64)." };
  }

  let decrypted: Uint8Array;
  try {
    decrypted = await decryptBinaryWithPassword(encrypted, input.password);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo descifrar.",
    };
  }

  let jsonBytes: Uint8Array;
  try {
    jsonBytes = await unpackPlaintext(decrypted);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al descomprimir.",
    };
  }

  let plain: SharedSyncPlainV1;
  try {
    plain = JSON.parse(new TextDecoder().decode(jsonBytes)) as SharedSyncPlainV1;
  } catch {
    return { ok: false, error: "Contenido del enlace corrupto." };
  }

  if (plain.v !== 1 || typeof plain.sharedPublicId !== "string") {
    return { ok: false, error: "Versión de sincronización no soportada." };
  }

  const sources = await db.sources
    .filter(
      (s) => s.type === "shared" && s.sharedPublicId === plain.sharedPublicId
    )
    .toArray();

  if (sources.length === 0) {
    return {
      ok: false,
      error: `No hay fuente compartida con id "${plain.sharedPublicId}". Créala primero con el mismo id.`,
    };
  }
  if (sources.length > 1) {
    return {
      ok: false,
      error: "Hay más de una fuente con el mismo id compartido; deja solo una.",
    };
  }

  const target = sources[0]!;
  const syncRow =
    (await db.sharedSync.get(target.id)) ?? createDefaultSharedSyncState(target.id);

  let merged = 0;
  await db.transaction("rw", db.expenses, db.sharedSync, async () => {
    for (const inc of plain.expenses) {
      const existing = await db.expenses.get(inc.id);
      const row: Expense = { ...inc, sourceId: target.id };
      if (!existing) {
        await db.expenses.add(row);
        merged += 1;
      } else if (inc.createdAt > existing.createdAt) {
        await db.expenses.put(row);
        merged += 1;
      } else if (existing.sourceId !== target.id) {
        await db.expenses.update(inc.id, { sourceId: target.id });
        merged += 1;
      }
    }

    const now = String(Date.now());
    const updates = [...syncRow.updates, now];
    const peerSaved = plain.isPasswordSaved ? true : syncRow.peerSavedPassword;
    const receivedIds = plain.expenses.map((e) => e.id);
    const emittedExpenseIds = [
      ...new Set([...syncRow.emittedExpenseIds, ...receivedIds]),
    ];

    await db.sharedSync.put({
      ...syncRow,
      sourceId: target.id,
      updates,
      lastReceivedRemoteAt: Date.now(),
      peerSavedPassword: peerSaved,
      emittedExpenseIds,
      storedInboundPassword: input.rememberPassword
        ? input.password
        : syncRow.storedInboundPassword,
    });
  });

  return {
    ok: true,
    sourceId: target.id,
    mergedCount: merged,
    sharedPublicId: plain.sharedPublicId,
  };
}

export async function recordSuccessfulSharedEmission(
  sourceId: string,
  includedExpenseIds: string[]
): Promise<void> {
  const row = (await db.sharedSync.get(sourceId)) ?? createDefaultSharedSyncState(sourceId);
  const now = String(Date.now());
  const emitted = new Set([...row.emittedExpenseIds, ...includedExpenseIds]);
  const cap = 3000;
  const emittedExpenseIds =
    emitted.size > cap
      ? [...emitted].slice(-cap)
      : [...emitted];

  await db.sharedSync.put({
    ...row,
    sourceId,
    emissions: [...row.emissions, now],
    emittedExpenseIds,
  });
}

export function buildFullSyncUrl(token: string): string {
  if (typeof window === "undefined") {
    return "";
  }
  const path = getSyncSharedPath();
  return `${window.location.origin}${path}?d=${encodeURIComponent(token)}`;
}
