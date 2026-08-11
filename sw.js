const CACHE_NAME = 'pdv-entregas-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// Instalar el Service Worker y guardar los archivos en el teléfono
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar las peticiones para cargar desde el caché si no hay internet
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el archivo está en caché, lo devuelve (Offline)
        if (response) {
          return response;
        }
        // Si no está, lo busca en internet
        return fetch(event.request);
      })
      .catch(() => {
        // Si falla todo (no hay red), siempre devuelve el index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});