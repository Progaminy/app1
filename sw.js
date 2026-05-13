// sw.js - Service Worker para manter o app vivo em segundo plano
const CACHE_NAME = 'monitor-meucel1-v1';

self.addEventListener('install', (event) => {
    console.log('[SW] Instalado');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Ativado');
    event.waitUntil(clients.claim());
});

// Manter o service worker vivo
self.addEventListener('message', (event) => {
    if (event.data === 'keepAlive') {
        console.log('[SW] Keep alive recebido');
    }
});

// Sincronização em background
self.addEventListener('sync', (event) => {
    if (event.tag === 'capture-sync') {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clients) => {
                if (clients.length > 0) {
                    clients[0].postMessage('capture-now');
                }
            })
        );
    }
});

// Periodic Background Sync (se disponível)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'capture-periodic') {
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clients) => {
                if (clients.length > 0) {
                    clients[0].postMessage('capture-now');
                }
            })
        );
    }
});