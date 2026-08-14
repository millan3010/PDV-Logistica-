const CACHE_NAME = 'pdv-entregas-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
  // No incluyas recursos externos aquí: fallan al cachear desde el SW en GitHub Pages
];

// Instalación: cachear recursos locales esenciales
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

// Estrategia de fetch
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // No interceptar peticiones a APIs de Firebase/Firestore ni a recursos externos
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('cdn.tailwindcss.com') ||
    url.hostname.includes('cdnjs.cloudflare.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Para navegaciones, usar red y si falla servir index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Para otros recursos, usar cache-first, luego red
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
