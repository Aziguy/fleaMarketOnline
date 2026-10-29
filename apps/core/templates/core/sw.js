{% load static %}
/* Service worker Mfoundi Mall : statiques en cache, pages publiques en réseau d'abord, repli hors ligne. */
const VERSION = "{{ version }}";
const STATIC_CACHE = `static-${VERSION}`;
const PAGES_CACHE = `pages-${VERSION}`;
const OFFLINE_URL = "{{ offline_url }}";
const PRECACHE = [{% for url in precache %}"{{ url }}"{% if not forloop.last %}, {% endif %}{% endfor %}];
const PRIVATE = [{% for p in private_prefixes %}"{{ p }}"{% if not forloop.last %}, {% endif %}{% endfor %}];
const MAX_PAGES = 40;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC_CACHE, PAGES_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isPrivate = (url) => PRIVATE.some((prefix) => url.pathname.startsWith(prefix));
const cacheable = (response) =>
  response.ok && response.type === "basic" && !/private|no-store/.test(response.headers.get("Cache-Control") || "");

async function trim(cache) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_PAGES)).map((key) => cache.delete(key)));
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirst(request, url) {
  try {
    const response = await fetch(request);
    if (!isPrivate(url) && cacheable(response)) {
      const cache = await caches.open(PAGES_CACHE);
      await cache.put(request, response.clone());
      trim(cache);
    }
    return response;
  } catch {
    const cached = !isPrivate(url) && (await caches.match(request));
    return cached || caches.match(OFFLINE_URL);
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || request.headers.get("HX-Request")) return;
  if (url.pathname.startsWith("{% get_static_prefix %}") || url.pathname.startsWith("/media/")) {
    event.respondWith(staleWhileRevalidate(request));
  } else if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, url));
  }
});
