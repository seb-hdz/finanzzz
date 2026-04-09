const CACHE_NAME = "finanzzz-v2";

const APP_PATHS = [
  "/",
  "/expenses",
  "/sources",
  "/tags",
  "/settings",
  "/reports",
  "/sync-shared",
];

function scopeBasePrefix() {
  const path = new URL(self.registration.scope).pathname.replace(/\/$/, "");
  return path;
}

function shareIngestPathMatches(pathname, base) {
  const expected = base ? `${base}/share-sync-ingest` : "/share-sync-ingest";
  return pathname === expected;
}

function precacheUrls() {
  const base = scopeBasePrefix();
  return APP_PATHS.map((p) => (base === "" ? p : `${base}${p}`));
}

async function handleShareIngest(request) {
  const urlObj = new URL(request.url);
  const origin = urlObj.origin;
  const base = scopeBasePrefix();
  const redirectPath = `${base}/sync-shared?share=1`;
  const redirectUrl = `${origin}${redirectPath}`;

  try {
    const fd = await request.formData();
    const title = String(fd.get("title") ?? "");
    const text = String(fd.get("text") ?? "");
    const shareUrl = String(fd.get("url") ?? "");

    let fileEntry = null;
    for (const [, val] of fd.entries()) {
      if (typeof File !== "undefined" && val instanceof File && val.size > 0) {
        fileEntry = val;
        break;
      }
    }

    const cache = await caches.open("finanzzz-share-stash");
    const metaUrl = `${origin}${base}/__share_ingest_meta__`;
    const fileUrl = `${origin}${base}/__share_ingest_file__`;

    if (fileEntry) {
      await cache.put(
        fileUrl,
        new Response(fileEntry.stream(), {
          headers: {
            "Content-Type": fileEntry.type || "application/octet-stream",
          },
        })
      );
    } else {
      await cache.delete(fileUrl);
    }

    await cache.put(
      metaUrl,
      new Response(
        JSON.stringify({
          title,
          text,
          url: shareUrl,
          hasFile: Boolean(fileEntry),
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    );
  } catch {
    // still redirect so the app can show the receive UI
  }

  return Response.redirect(redirectUrl, 303);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(precacheUrls()))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const base = scopeBasePrefix();

  if (
    event.request.method === "POST" &&
    shareIngestPathMatches(url.pathname, base)
  ) {
    event.respondWith(handleShareIngest(event.request));
    return;
  }

  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
