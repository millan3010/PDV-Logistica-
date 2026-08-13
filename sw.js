const CACHE_NAME = 'pdv-entregas-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  // Recursos externos necesarios para la app
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js'
];

// Instalación: cachear recursos esenciales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Usamos Promise.allSettled para que un fallo no detenga la instalación
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(url))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar versiones antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Estrategia de caché: primero caché, luego red; excepto para Firestore (no cachear)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // No cachear peticiones a Firestore u otras APIs de Firebase
  if (url.hostname.includes('firestore.googleapis.com') || 
      url.hostname.includes('firebaseio.com') ||
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com') && event.request.method !== 'GET') {
    // Para peticiones de red no cacheables, simplemente seguir con fetch
    event.respondWith(fetch(event.request));
    return;
  }

  // Para el resto, usar estrategia cache-first
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => {
        // Si falla la red y la petición es de navegación, devolver index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
