// 1. Identificador de la versión (Iniciamos en v1.0 para este proyecto)
const CACHE_NAME = 'Nokia-T9-Traductor-Master-v1.0';

// 2. Archivos Vitales (Asegúrate de que el icono se llame exactamente así en tu repo)
const INITIAL_ASSETS = [
  './',
  './index.html',
  './icon-app.png' 
];

// --- FASE DE INSTALACIÓN ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📱 [Nokia-T9]: Teclado instalado y listo.');
      return cache.addAll(INITIAL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// --- FASE DE ACTIVACIÓN ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log('📱 [Nokia-T9]: Borrando caché viejo:', key);
              return caches.delete(key);
            })
      );
    }).then(() => {
      console.log('📱 [Nokia-T9]: Traductor en línea. ¡A escribir!');
      return self.clients.claim();
    })
  );
});

// --- ESTRATEGIA DE RED: NETWORK FIRST CON AUTO-RECUPERACIÓN ---
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!(event.request.url.indexOf('http') === 0)) return;

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // MODO OFFLINE: Si falla la red, buscamos en el almacenamiento local
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
