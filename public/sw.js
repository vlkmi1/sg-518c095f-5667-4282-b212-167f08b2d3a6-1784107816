// Service Worker for PWA - OPTIMIZED to prevent FOUC
// KEY PRINCIPLE: Never cache CSS or HTML - always serve fresh from network

const CACHE_VERSION = "v2026-10-14-fix"; // Updated version to force cache clear
const CACHE_NAME = "ukaz-rybu-" + CACHE_VERSION;

// Assets to cache on install - ONLY static assets that rarely change
const STATIC_CACHE = [
  "/manifest.json",
  "/favicon.ico",
];

// Install event - cache minimal static assets only
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...", CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching essential static assets");
      return cache.addAll(STATIC_CACHE).catch(err => {
        console.log("[SW] Some assets failed to cache:", err);
      });
    })
  );
  
  // Activate immediately without waiting
  self.skipWaiting();
});

// Activate event - clean ALL old caches aggressively
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating new service worker...", CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete ALL old caches - no exceptions
          console.log("[SW] Deleting old cache:", cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - STRICT caching strategy to prevent FOUC
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip non-http requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // ============================================================
  // CRITICAL: These should NEVER be cached - always network first
  // ============================================================
  
  // 1. HTML pages - ALWAYS fresh (prevents serving stale pages)
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache HTML - always get fresh version
          return response;
        })
        .catch(() => {
          // Offline fallback for HTML
          return caches.match("/").then((cachedResponse) => {
            return cachedResponse || new Response("Offline", { 
              status: 503,
              statusText: "Service Unavailable"
            });
          });
        })
    );
    return;
  }

  // 2. CSS files - NEVER CACHE (this was causing the FOUC bug!)
  if (url.pathname.endsWith('.css') || url.pathname.includes('/_next/static/css/')) {
    // Always fetch from network - NO caching whatsoever
    event.respondWith(
      fetch(request).catch(() => {
        // If offline, try to find ANY cached CSS as last resort
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response("/* Offline */", { 
            status: 503,
            headers: { "Content-Type": "text/css" }
          });
        });
      })
    );
    return;
  }

  // 3. JavaScript files - Stale While Revalidate
  if (url.pathname.endsWith('.js') || url.pathname.includes('/_next/static/chunks/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Fetch updated version in background
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              // Cache the fresh response
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => null);

        // Return cached immediately, or wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. API calls - NEVER cache
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('supabase') ||
      url.pathname.includes('/_next/data')) {
    event.respondWith(fetch(request));
    return;
  }

  // 5. Images and fonts - Cache First with background update
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached, but update in background
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response.clone());
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // Not in cache - fetch and cache
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
          return new Response("Offline", { status: 503 });
        });
      })
    );
    return;
  }

  // Default: Network First for everything else
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then((cachedResponse) => {
          return cachedResponse || new Response("Offline", { status: 503 });
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
  
  // Handle cache clear request
  if (event.data && event.data.type === "CLEAR_CACHE") {
    console.log("[SW] Clearing all caches");
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    });
  }
});