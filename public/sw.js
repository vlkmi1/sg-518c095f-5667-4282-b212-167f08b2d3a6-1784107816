// Service Worker for PWA with smart update strategy
const CACHE_VERSION = "v" + new Date().getTime(); // Dynamic version based on timestamp
const CACHE_NAME = "ukaz-rybu-" + CACHE_VERSION;

// Assets to cache on install
const STATIC_CACHE = [
  "/",
  "/manifest.json",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing new service worker...", CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_CACHE);
    }).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating new service worker...", CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - Network First strategy for dynamic content
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Network First strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response before caching
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request).then((response) => {
          return response || new Response("Offline - no cached version available", {
            status: 503,
            statusText: "Service Unavailable"
          });
        });
      })
  );
});

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] Received SKIP_WAITING message");
    self.skipWaiting();
  }
});
