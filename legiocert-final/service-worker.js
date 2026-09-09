/**
 * LegioCert Pro - Service Worker v2
 */
const CACHE_NAME = 'legiocert-v2';
const ASSETS = [
  './', './index.html', './style.css', './app.js', './config.js', './db.js',
  './gps.js', './firma.js', './fotos.js', './calculadora.js', './clientes.js',
  './instalaciones.js', './legionella.js', './pdf.js', './historial.js',
  './dashboard.js', './agenda.js', './productos.js', './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
