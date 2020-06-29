/* eslint-disable */
if ('function' === typeof importScripts) {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js'); 

  // Global workbox
  if (workbox) {
    console.log('Workbox is loaded');

    // Disable logging
    workbox.setConfig({ debug: false });

    self.addEventListener('install', (event) => {
      self.skipWaiting();
    });

    workbox.core.clientsClaim();

    self.addEventListener( 'fetch', function ( event ) {
      if ( event.request.url.match( '^.*(\/admin\/).*$' ) ) {
        return false;
      }
    });

    self.addEventListener('install', function (event) {

        self.skipWaiting();
    });

    // Manual injection point for manifest files.
    // All assets under build/ and 5MB sizes are precached.
    workbox.precaching.precacheAndRoute([]);

    // Font caching
    workbox.routing.registerRoute(
      new RegExp('https://fonts.(?:.googlepis|gstatic).com/(.*)'),
      workbox.strategies.cacheFirst({
        cacheName: 'googleapis',
        plugins: [
          new workbox.expiration.Plugin({
            maxEntries: 30,
          }),
        ],
      })
    );

    // Image caching
    workbox.routing.registerRoute(
      /\.(?:png|gif|jpg|jpeg|svg)$/,
      workbox.strategies.cacheFirst({
        cacheName: 'images',
        plugins: [
          new workbox.expiration.Plugin({
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          }),
        ],
      })
    );

    // JS, CSS caching
    workbox.routing.registerRoute(
      /\.(?:js|css)$/,
      workbox.strategies.staleWhileRevalidate({
        cacheName: 'static-resources',
        plugins: [
          new workbox.expiration.Plugin({
            maxEntries: 60,
            maxAgeSeconds: 20 * 24 * 60 * 60, // 20 Days
          }),
        ],
      })
    );
  } else {
    console.error('Workbox could not be loaded. No offline support');
  }
}