const CACHE_NAME = "levelup-v3";

// Assets to pre-cache for offline use
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
];

// Install — cache shell assets & force activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate — delete ALL old caches, then claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — Network-first, but SKIP caching for dev server assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // CRITICAL: Never cache Next.js internal assets (_next), webpack chunks,
  // HMR (hot module reload) requests, or API calls.
  // These cause the MODULE_NOT_FOUND crashes when stale.
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("webpack") ||
    url.pathname.includes("__nextjs") ||
    url.pathname.includes("hot-update") ||
    url.pathname.includes(".js") ||
    url.pathname.includes(".css")
  ) {
    return; // Let the browser handle these normally — no SW interception
  }

  // Only cache navigation requests (HTML pages) and static assets (images, fonts)
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
