import { getBasePath } from "@/lib/site";

export const SHARE_STASH_CACHE = "finanzzz-share-stash";

export function shareIngestMetaRequest(): Request {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://local.invalid";
  return new Request(`${origin}${getBasePath()}/__share_ingest_meta__`);
}

export function shareIngestFileRequest(): Request {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://local.invalid";
  return new Request(`${origin}${getBasePath()}/__share_ingest_file__`);
}

/** Decode QR from image blob; returns trimmed text or null. */
export async function decodeQrFromImageBlob(
  blob: Blob
): Promise<string | null> {
  const { BrowserQRCodeReader } = await import("@zxing/browser");
  const reader = new BrowserQRCodeReader();
  const url = URL.createObjectURL(blob);
  try {
    const result = await reader.decodeFromImageUrl(url);
    const text = result.getText().trim();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type ConsumedShareStash = {
  pastedInput: string;
};

/**
 * Reads POST share-target payload stashed by the service worker; clears stash entries.
 */
export async function consumeShareTargetStash(): Promise<ConsumedShareStash | null> {
  if (typeof caches === "undefined") return null;
  const cache = await caches.open(SHARE_STASH_CACHE);
  const metaReq = shareIngestMetaRequest();
  const metaRes = await cache.match(metaReq);
  if (!metaRes) return null;

  let title = "";
  let text = "";
  let shareUrl = "";
  let hasFile = false;

  type ShareIngestMeta = {
    title?: string;
    text?: string;
    url?: string;
    hasFile?: boolean;
  };

  try {
    const meta: ShareIngestMeta = await metaRes.json();
    title = meta.title ?? "";
    text = meta.text ?? "";
    shareUrl = meta.url ?? "";
    hasFile = Boolean(meta.hasFile);
  } catch {
    await cache.delete(metaReq);
    return null;
  }
  await cache.delete(metaReq);

  let pastedInput =
    [shareUrl, text, title].find((s) => s.trim().length > 0) ?? "";

  if (hasFile) {
    const fileReq = shareIngestFileRequest();
    const fileRes = await cache.match(fileReq);
    if (fileRes) {
      const blob = await fileRes.blob();
      await cache.delete(fileReq);
      const decoded = await decodeQrFromImageBlob(blob);
      if (decoded) {
        pastedInput = decoded;
      }
    }
  }

  return { pastedInput };
}
