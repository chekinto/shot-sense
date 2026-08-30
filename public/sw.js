/* Shot Sense service worker.
 * Keeps the active-round route (and the JS/CSS it needs) reachable offline (§21).
 * The round's data lives in IndexedDB (Dexie) — this only keeps the shell up so
 * the client can render from local state. Network-first for pages, so nothing
 * stale is shown while online.
 */
const VERSION = "v3";
const SHELL_CACHE = `shot-sense-shell-${VERSION}`;
const PAGE_CACHE = `shot-sense-pages-${VERSION}`;
const ASSET_CACHE = `shot-sense-assets-${VERSION}`;
const OFFLINE_URL = "/offline";
const SHELL_ASSETS = ["/offline", "/icon.svg", "/manifest.webmanifest"];
const KEEP = new Set([SHELL_CACHE, PAGE_CACHE, ASSET_CACHE]);

/** Routes worth keeping for offline play. */
const cacheableNavigation = (url) =>
  url.pathname === "/dashboard" ||
  (url.pathname.startsWith("/rounds/") && url.pathname.endsWith("/play"));

/** Immutable, content-hashed build output — safe to cache forever. */
const isBuildAsset = (url) =>
  url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !KEEP.has(k)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Build assets: cache-first (they never change for a given URL).
  if (isBuildAsset(url)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Page navigations: network-first, fall back to a cached copy then /offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (cacheableNavigation(url) && response.ok) {
            const cache = await caches.open(PAGE_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          const pageCache = await caches.open(PAGE_CACHE);
          const cached = await pageCache.match(request, { ignoreSearch: true });
          if (cached) return cached;
          const shell = await caches.open(SHELL_CACHE);
          return (await shell.match(OFFLINE_URL)) ?? Response.error();
        }
      })(),
    );
  }
});
