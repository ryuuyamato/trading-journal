/* Kandel service worker — offline shell only, no push.
 *
 * Hand-written rather than generated: the Next.js PWA guide recommends Serwist
 * for offline support but notes it still needs webpack configuration, and this
 * project builds with Turbopack.
 *
 * Bump CACHE_VERSION on any change here; `activate` deletes every cache that
 * doesn't match, which is what evicts the previous release.
 */

const CACHE_VERSION = "kandel-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const OFFLINE_URL = "/offline";

// Only assets that exist at every deploy and never 404.
const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // Individually, so one missing file cannot fail the whole install.
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never touch anything but same-origin GETs: POST/PATCH/DELETE go to the
  // trade API and must not be served from a cache, and cross-origin requests
  // are none of this worker's business.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Auth and API responses are per-user and time-sensitive — always network.
  if (url.pathname.startsWith("/api/")) return;

  // Build output is content-hashed, so it can be cached permanently.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Pages: network first so the journal is never stale, falling back to the
  // last good copy and finally to the offline screen.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit || caches.match(OFFLINE_URL))
            .then((hit) => hit || Response.error())
        )
    );
  }
});
