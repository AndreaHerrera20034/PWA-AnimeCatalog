// import { openDB } from 'idb';

// Caching los archivos importantes para que funcionen offline
self.addEventListener('install', (event) => {
  event.waitUntil(
      caches.open('my-cache').then((cache) => {
          return cache.addAll([
              '/',
              '/index.html',
              '/css/style.css',
              '/images/logo.png',
              '/js/app.js',
              '/manifest.json',
              '/images/icon.png'
          ]);
      })
  );
});

self.addEventListener('fetch', event => {
  // Si la red no está disponible, servir los archivos desde el cache
  event.respondWith(
      caches.match(event.request).then(response => {
          return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = ['my-cache-v1'];
  event.waitUntil(
      caches.keys().then(cacheNames => {
          return Promise.all(
              cacheNames.map(cacheName => {
                  if (!cacheWhitelist.includes(cacheName)) {
                      return caches.delete(cacheName);
                  }
              })
          );
      })
  );
});

// // Instalar el Service Worker y cachear los archivos
// self.addEventListener('install', event => {
//   event.waitUntil(
//     caches.open('v1').then(cache => {
//       return cache.addAll([
//         '/',
//         '/index.html',
//         '/css/styles.css',
//         '/js/app.js',
//         '/manifest.json',
//         '/images/icon.png'
//       ]);
//     })
//   );
// });

// // Interceptar las solicitudes de red para manejar la app en offline
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     caches.match(event.request).then(response => {
//       return response || fetch(event.request);
//     })
//   );
// });

// // Registrar la sincronización en segundo plano
// self.addEventListener('sync', event => {
//   if (event.tag === 'sync-animes') {
//     event.waitUntil(syncPendingAnimes()); // Sincronizar cuando vuelva la conexión
//   }
// });