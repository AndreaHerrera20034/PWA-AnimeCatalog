import { openDB } from 'idb';

const CACHE_NAME = 'anime-cache-v1';
const API_URL = 'http://localhost:4000/api/animes'; // URL base de tu API
const DB_NAME = 'anime-db';
const STORE_NAME = 'animes';
const PENDING_STORE = 'pending-animes';

// Instalar el Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching app shell...');
      return cache.addAll([
        '/', // Cachea los archivos esenciales
        '/index.html',
        '/styles.css',
        '/script.js',
      ]);
    })
  );
});

// Activar el Service Worker y limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Manejar solicitudes de red
self.addEventListener('fetch', event => {
  const request = event.request;

  // Si es una solicitud a la API, manejar con NetworkFirst
  if (request.url.includes(API_URL)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clonedResponse = response.clone();
          clonedResponse.json().then(data => {
            saveToIndexedDB(STORE_NAME, data); // Guardar datos en IndexedDB
          });
          return response;
        })
        .catch(() => getFromIndexedDB(STORE_NAME)) // Recuperar datos offline
    );
  } else {
    // Manejar otras solicitudes (archivos estáticos)
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        return cachedResponse || fetch(request);
      })
    );
  }
});

// Escuchar eventos de sincronización
self.addEventListener('sync', event => {
  if (event.tag === 'sync-animes') {
    event.waitUntil(syncAnimes());
  }
});

// Sincronización: reenviar datos pendientes
async function syncAnimes() {
  const pendingAnimes = await getFromIndexedDB(PENDING_STORE);
  for (const anime of pendingAnimes) {
    try {
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(anime),
        headers: { 'Content-Type': 'application/json' },
      });
      await deleteFromIndexedDB(PENDING_STORE, anime.id); // Eliminar de pendientes
    } catch (error) {
      console.error('Error syncing anime:', anime, error);
    }
  }
}

// IndexedDB: Guardar datos
async function saveToIndexedDB(storeName, data) {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        db.createObjectStore(PENDING_STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
  const tx = db.transaction(storeName, 'readwrite');
  await tx.objectStore(storeName).put(data);
  await tx.done;
}

// IndexedDB: Recuperar datos
async function getFromIndexedDB(storeName) {
  const db = await openDB(DB_NAME, 1);
  const tx = db.transaction(storeName, 'readonly');
  const data = await tx.objectStore(storeName).getAll();
  await tx.done;
  return data;
}

// IndexedDB: Eliminar un elemento
async function deleteFromIndexedDB(storeName, id) {
  const db = await openDB(DB_NAME, 1);
  const tx = db.transaction(storeName, 'readwrite');
  await tx.objectStore(storeName).delete(id);
  await tx.done;
}

// Obtener animes no sincronizados
async function getPendingAnimes() {
  return await getFromIndexedDB(PENDING_STORE);
}

// Marcar como sincronizado
async function markAsSynced(id) {
  await deleteFromIndexedDB(PENDING_STORE, id);
}


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