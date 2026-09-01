// Service Worker simples: mantém os arquivos principais disponíveis offline.
// Ao mudar a versão do CACHE, o navegador baixa os arquivos novos do AnotaAí.
const CACHE = 'anotaai-v29';
const FILES = ['./', './index.html', './style.css', './backup-config.js', './script.js', './logo.png', './icon-192.png', './icon-512.png', './manifest.json'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
