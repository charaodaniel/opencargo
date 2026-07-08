/**
 * ── OpenCargo — Service Worker ────────────────────────
 * Responsável por:
 * - Cache de assets estáticos para funcionamento offline
 * - Cache de CDN (Tailwind, Leaflet)
 * - Estratégias: Cache First para assets, Network First para API
 * - Notificações push (futuro)
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `opencargo-static-${CACHE_VERSION}`;
const CDN_CACHE = `opencargo-cdn-${CACHE_VERSION}`;
const API_CACHE = `opencargo-api-${CACHE_VERSION}`;

// Assets estáticos do app (pre-cache na instalação)
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/assets/css/style.css",
  "/assets/js/app.js",
  "/assets/js/router.js",
  "/assets/js/utils/config.js",
  "/assets/js/utils/storage.js",
  "/assets/js/utils/utils.js",
  "/assets/js/utils/api.js",
  "/assets/js/utils/geocoding.js",
  "/assets/js/components/Toast.js",
  "/assets/js/components/Modal.js",
  "/assets/js/components/Table.js",
  "/assets/js/components/Card.js",
  "/assets/js/components/Navbar.js",
  "/assets/js/components/Sidebar.js",
  "/assets/js/pages/dashboard.js",
  "/assets/js/pages/companies.js",
  "/assets/js/pages/drivers.js",
  "/assets/js/pages/vehicles.js",
  "/assets/js/pages/routes.js",
  "/assets/js/pages/loads.js",
  "/assets/js/pages/matching.js",
  "/assets/js/pages/chat.js",
  "/assets/js/pages/notifications.js",
  "/assets/js/pages/maps.js",
  "/assets/js/pages/login.js",
  "/assets/js/pages/landing.js",
  "/assets/icons/icon-192.svg",
  "/assets/icons/icon-512.svg",
];

// URLs de CDN para cache
const CDN_URLS = [
  "https://cdn.tailwindcss.com",
  "https://unpkg.com/leaflet",
  "https://unpkg.com/leaflet/dist/leaflet.css",
  "https://unpkg.com/leaflet.markercluster",
  "https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.css",
  "https://unpkg.com/leaflet.markercluster/dist/MarkerCluster.Default.css",
  "https://cdn.jsdelivr.net/npm/leaflet/dist/leaflet.css",
  "https://cdn.jsdelivr.net/npm/leaflet/dist/leaflet.js",
  "https://cdn.jsdelivr.net/npm/leaflet.markercluster/dist/leaflet.markercluster.js",
];

// ── Instalação ────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll(PRECACHE_ASSETS);

      const cdnCache = await caches.open(CDN_CACHE);
      // Cache CDN URLs em background (falhas não impedem instalação)
      for (const url of CDN_URLS) {
        try {
          const response = await fetch(url, { mode: "no-cors" });
          if (response.ok || response.type === "opaque") {
            await cdnCache.put(url, response);
          }
        } catch {
          // Ignora falhas de CDN durante instalação
        }
      }
    })()
  );
  self.skipWaiting();
});

// ── Ativação ──────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith("opencargo-") && !name.includes(CACHE_VERSION))
          .map((name) => caches.delete(name))
      );
    })()
  );
  self.clients.claim();
});

// ── Interceptação de Fetch ────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégia: Cache First para assets estáticos
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Estratégia: Cache First para CDN
  if (isCDNUrl(url)) {
    event.respondWith(cacheFirstCDN(request));
    return;
  }

  // Estratégia: Network First para API
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Estratégia: Network First para navegação (HTML)
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Default: Network First
  event.respondWith(networkFirst(request));
});

// ── Helpers ──────────────────────────────────────────

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/assets/") ||
      url.pathname === "/manifest.json" ||
      url.pathname === "/offline.html")
  );
}

function isCDNUrl(url) {
  return CDN_URLS.some((cdnUrl) => url.href.startsWith(cdnUrl));
}

function isApiRequest(url) {
  return (
    url.href.includes("/api/") ||
    url.pathname.startsWith("/api/")
  );
}

/**
 * Cache First: tenta cache, depois rede
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match("/offline.html");
  }
}

/**
 * Cache First específico para CDN (com fallback)
 */
async function cacheFirstCDN(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      const cache = await caches.open(CDN_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Se falhou e não tem cache, retorna erro silencioso
    return new Response("", { status: 408, statusText: "Offline" });
  }
}

/**
 * Network First: tenta rede, fallback cache
 */
async function networkFirst(request, cacheName = STATIC_CACHE) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("/offline.html");
  }
}

/**
 * Network First para navegação: fallback para offline.html
 */
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("/offline.html");
  }
}
