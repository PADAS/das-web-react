/* eslint-disable no-undef, no-restricted-globals */
if ('function' === typeof importScripts) {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

  const TILE_CACHE_NAME_PREFIX = 'tilecache-v1-';
  let CURRENT_SCOPE_HASH = null;

  const handleMessage = (event) => {
    const data = event.data || {};
    if (data.type === 'SET_SCOPE' && data.scope && data.scope.hash !== null) {
      CURRENT_SCOPE_HASH = String(data.scope.hash);
    }
    if (data.type === 'PURGE_SCOPE' && data.hash) {
      caches.delete(TILE_CACHE_NAME_PREFIX + String(data.hash)).catch((err) => console.warn('Failed to delete cache:', err));
      if (CURRENT_SCOPE_HASH === String(data.hash)) CURRENT_SCOPE_HASH = null;
    }
  };

  const makeTileCacheKey = (request) => {
    const url = new URL(request.url);
    return new Request(url.toString(), { method: 'GET' });
  };

  if (workbox) {
    console.log('Workbox is loaded');

    workbox.setConfig({ debug: false });

    const handleInstall = (event) => {
      event.waitUntil(self.skipWaiting());
    };

    const handleActivate = (event) => {
      event.waitUntil(self.clients.claim());
    };

    const handleFetch = (event) => {
      if (event.request.url.match('^.*(/admin/).*$')) {
        return false;
      }
    };

    self.addEventListener('message', handleMessage);
    self.addEventListener('install', handleInstall);
    self.addEventListener('activate', handleActivate);
    self.addEventListener('fetch', handleFetch);
    workbox.core.clientsClaim();

    try {
      workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
    } catch (error) {
      console.warn('Initial precaching setup failed:', error);
    }

    // Font caching
    workbox.routing.registerRoute(
      new RegExp('https://fonts.(?:.googleapis|gstatic).com/(.*)'),
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

    // ---- user-scoped vector tile cache ----
    const tileRouteMatch = ({ url, request }) => {
      if (request.method !== 'GET') return false;

      return url.pathname.includes('spatialfeatures/tiles/') ||
             url.pathname.includes('observations/tiles/');
    };

    workbox.routing.registerRoute(
      tileRouteMatch,
      async ({ event, request }) => {
        // If we don't have a scope yet, bypass cache and hit the network.
        if (!CURRENT_SCOPE_HASH) {
          return fetch(request);
        }

        // Use Workbox StaleWhileRevalidate strategy with user-scoped cache name
        const strategy = new workbox.strategies.StaleWhileRevalidate({
          cacheName: TILE_CACHE_NAME_PREFIX + CURRENT_SCOPE_HASH,
          plugins: [
            new workbox.expiration.ExpirationPlugin({
              maxAgeSeconds: 7 * 24 * 60 * 60, // 7 day safety net
              maxEntries: 15000,
              purgeOnQuotaError: true,
            }),
            {
              cacheKeyWillBeUsed: async ({ request, mode }) => {
                if (mode === 'read' || mode === 'write') {
                  return makeTileCacheKey(request); // Only use clean cache key for cache operations, not network requests
                }
                return request;
              },
              cacheWillUpdate: async ({ response }) => {
                return response.ok ? response : null;
              }
            }
          ]
        });

        return strategy.handle({ event, request });
      }
    );
    // ---------------------------------------------------------------------------

  } else {
    console.error('Workbox could not be loaded. No offline support');
  }



}
