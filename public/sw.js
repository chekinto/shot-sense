/* Shot Sense service worker — Epic 0 shell.
 * Minimal app-shell caching only. Round/offline caching strategy is built in Epic 7.
 */
const VERSION = "v1";
const SHELL_CACHE = `shot-sense-shell-${VERSION}`;
const OFFLINE_URL = "/offline";
const SHELL_ASSETS = ["/offline", "/icon.svg", "/manifest.webmanifest"];

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
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Network-first for navigations, falling back to the cached offline page.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = await cache.match(OFFLINE_URL);
      return cached ?? Response.error();
    }),
  );
});
