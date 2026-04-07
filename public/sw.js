const CACHE_NAME = "finanzzz-v1";

const APP_PATHS = ["/", "/expenses", "/sources", "/tags", "/settings", "/reports"];

function scopeBasePrefix() {
  const path = new URL(self.registration.scope).pathname.replace(/\/$/, "");
  return path;
}

function precacheUrls() {
  const base = scopeBasePrefix();
  return APP_PATHS.map((p) => (base === "" ? p : `${base}${p}`));
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
