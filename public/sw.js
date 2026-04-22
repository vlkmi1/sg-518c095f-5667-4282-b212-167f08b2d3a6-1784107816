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
      // Skip waiting to activate immediately when explicitly told to
      // (via postMessage from client)
      console.log("[SW] Installation complete, waiting for activation signal");
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
      console.log("[SW] Taking control of all clients");
      return self.clients.claim();
    })
  );
});

// Fetch event - Smart caching strategy
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

  // NEVER cache these - always fetch fresh from network:
  // 1. Supabase API calls
  // 2. Next.js API routes
  // 3. Dynamic pages with query parameters
  const neverCachePatterns = [
    /supabase\.co/,           // Supabase API
    /\/api\//,                // Next.js API routes
    /_next\/data/,            // Next.js data fetching
    /\?/,                     // URLs with query params (dynamic)
  ];

  const shouldNeverCache = neverCachePatterns.some(pattern => pattern.test(url.href));

  if (shouldNeverCache) {
    // Network only - no caching for API calls
    event.respondWith(fetch(request));
    return;
  }

  // For static assets (JS, CSS, images, fonts) - Cache First strategy
  // This allows offline functionality for UI
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version but fetch update in background
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
            });
          }
        });
        return cachedResponse;
      }

      // Not in cache - fetch from network and cache it
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === "error") {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        return new Response("Offline - no cached version available", {
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
