const CACHE = __CACHE_NAME__;
const ASSETS = __ASSETS__;
const PATHS = new Set(ASSETS);
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) => name.startsWith("drevos-shell-") && name !== CACHE,
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  // Never intercept or retain commands, relay traffic, credentials or arbitrary URLs.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.search ||
    url.pathname === "/android-update.json" ||
    url.pathname.startsWith("/api/")
  )
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error("Offline shell");
          return response;
        })
        .catch(async () => (await caches.open(CACHE)).match("/index.html")),
    );
  } else if (PATHS.has(url.pathname)) {
    event.respondWith(
      caches
        .open(CACHE)
        .then(
          async (cache) => (await cache.match(url.pathname)) || fetch(request),
        ),
    );
  }
});
