/* eslint-disable */
if ('function' === typeof importScripts) {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

  // ---- User-scoped tile cache — minimal additions for Workbox v7 ----
  const TILE_CACHE_NAME_PREFIX = 'tilecache-v1-';
  let CURRENT_SCOPE_HASH = null; // set via postMessage after login

  // Accept scope updates / purges from the app
  self.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'SET_SCOPE' && data.scope && data.scope.hash) {
      CURRENT_SCOPE_HASH = String(data.scope.hash);
    }
    if (data.type === 'PURGE_SCOPE' && data.hash) {
      // Best-effort delete; ignore errors
      caches.delete(TILE_CACHE_NAME_PREFIX + String(data.hash)).catch(() => {});
      // If the current scope matches the purged hash, clear it
      if (CURRENT_SCOPE_HASH === String(data.hash)) CURRENT_SCOPE_HASH = null;
    }
  });

  function responseIsVectorTile(resp) {
    const ct = resp.headers.get('Content-Type') || '';
    return (
      ct.includes('application/vnd.mapbox-vector-tile') ||
      ct.includes('application/x-protobuf')
    );
  }

  // Build a stable cache key for a tile URL.
  function makeTileCacheKey(request) {
    const url = new URL(request.url);
    return new Request(url.toString(), { method: 'GET' });
  }
  // -------------------------------------------------------------------

  // Global workbox
  if (workbox) {
    console.log('Workbox is loaded');

    // Disable logging
    workbox.setConfig({ debug: false });

    self.addEventListener('install', (event) => {
      event.waitUntil(self.skipWaiting());
    });

    self.addEventListener('activate', function(event) {
      event.waitUntil(self.clients.claim()); // Become available to all pages
    });

    workbox.core.clientsClaim();

    self.addEventListener('fetch', function (event) {
      if ( event.request.url.match( '^.*(\/admin\/).*$' ) ) {
        return false;
      }
    });

    // Manual injection point for manifest files.
    // All assets under build/ and 5MB sizes are precached.
    workbox.precaching.precacheAndRoute([]);

    // Font caching
    workbox.routing.registerRoute(
      new RegExp('https://fonts.(?:.googlepis|gstatic).com/(.*)'),
      new workbox.strategies.CacheFirst({
        cacheName: 'googleapis',
        plugins: [
          new workbox.expiration.ExpirationPlugin({
            maxEntries: 30,
          }),
        ],
      })
    );

    // Image caching
    workbox.routing.registerRoute(
      /\.(?:png|gif|jpg|jpeg|svg)$/,
      new workbox.strategies.CacheFirst({
        cacheName: 'images',
        plugins: [
          new workbox.expiration.ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          }),
        ],
      })
    );

    // JS, CSS caching
    workbox.routing.registerRoute(
      /\.(?:js|css)$/,
      new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'static-resources',
        plugins: [
          new workbox.expiration.ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 20 * 24 * 60 * 60, // 20 Days
          }),
        ],
      })
    );

    // ---- Tiles: user-scoped disk cache (works with cookies or Authorization) ----
    // Intercept only your tile requests. Adjust the path/pattern if needed.
    // Examples:
    //   ^/tiles/          -> relative to your origin
    //   https://api.example.com/tiles/
    const tileRouteMatch = ({url, request}) => {
      if (request.method !== 'GET') return false;
      // Match your tile path(s); tweak as appropriate:
      return url.pathname.includes('/api/v1.0/spatialfeatures/tiles/') || 
             url.pathname.includes('/api/v1.0/observations/tiles/')
    };

    workbox.routing.registerRoute(
      tileRouteMatch,
      async ({event, request}) => {
        // If we don't have a scope yet, bypass cache and hit the network.
        if (!CURRENT_SCOPE_HASH) {
          return fetch(request);
        }

        // Use Workbox CacheFirst strategy with user-scoped cache name
        const strategy = new workbox.strategies.CacheFirst({
          cacheName: TILE_CACHE_NAME_PREFIX + CURRENT_SCOPE_HASH,
          plugins: [
            new workbox.expiration.ExpirationPlugin({
              maxAgeSeconds: 7 * 24 * 60 * 60, // 7 day safety net
              purgeOnQuotaError: true,
            }),
            // Custom plugin to respect Cache-Control headers
            {
              cacheKeyWillBeUsed: async ({request}) => {
                return makeTileCacheKey(request);
              },
              cacheWillUpdate: async ({response}) => {
                return response.ok && responseIsVectorTile(response) ? response : null;
              },
              cachedResponseWillBeUsed: async ({cachedResponse}) => {
                if (!cachedResponse) return null;
                
                const cacheControl = cachedResponse.headers.get('cache-control');
                const cachedDate = cachedResponse.headers.get('date');
                
                if (cacheControl && cachedDate) {
                  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
                  if (maxAgeMatch) {
                    const maxAge = parseInt(maxAgeMatch[1], 10);
                    const cachedTime = new Date(cachedDate).getTime();
                    const age = (Date.now() - cachedTime) / 1000;
                    
                    if (age >= maxAge) {
                      return null;
                    }
                  }
                }
                
                return cachedResponse;
              }
            }
          ]
        });

        return strategy.handle({event, request});
      }
    );
    // ---------------------------------------------------------------------------

  } else {
    console.error('Workbox could not be loaded. No offline support');
  }

  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

}
