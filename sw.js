/* ===================================================================
   SERVICE WORKER.  Precaches the whole app on install, then serves
   every request from that cache. There is no runtime network call:
   after the first load the app is identical in airplane mode.

   No build step, so the file list and the cache name are maintained
   by hand. Change any asset -> bump CACHE, or the old copy is served.
   =================================================================== */

const CACHE = "drills-v3";

const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./ui/styles.css",
  "./ui/app.js",
  "./engine/generator.js",
  "./engine/judge.js",
  "./data/verbs.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // cache: "reload" so installing never picks the assets up from the HTTP cache
    await cache.addAll(PRECACHE.map(u => new Request(u, { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // a navigation to any in-scope URL is the app itself
    if (e.request.mode === "navigate")
      return (await cache.match("./index.html")) ?? fetch(e.request);
    return (await cache.match(e.request, { ignoreSearch: true })) ?? fetch(e.request);
  })());
});
