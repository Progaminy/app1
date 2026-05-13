// sw.js - Service Worker para Monitor MEUCEL1
const CACHE_NAME = 'monitor-meucel1-v2';
const CACHE_FILES = [
    '/',
    '/index.html',
    '/sw.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Cache criado');
            return cache.addAll(CACHE_FILES).catch(err => {
                console.log('[SW] Cache parcial:', err);
            });
        })
    );
    
    self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Ativado');
    
    // Limpar caches antigos
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Removendo cache antigo:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    
    event.waitUntil(clients.claim());
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
    // Só interceptar requisições GET
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        caches.match(event.request).then((cached) => {
            // Retornar do cache ou buscar da rede
            return cached || fetch(event.request).then((response) => {
                // Salvar no cache para uso offline
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            }).catch(() => {
                // Se offline e não tem cache, retornar página inicial
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});

// Mensagens do app principal
self.addEventListener('message', (event) => {
    console.log('[SW] Mensagem recebida:', event.data);
    
    if (event.data && event.data.type === 'KEEP_ALIVE') {
        console.log('[SW] Keep alive recebido');
        
        // Responder para manter comunicação ativa
        if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ type: 'ALIVE_ACK' });
        }
    }
    
    if (event.data && event.data.type === 'CAPTURE_NOW') {
        console.log('[SW] Captura solicitada');
        
        // Notificar todos os clientes
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            clients.forEach(client => {
                client.postMessage({ type: 'CAPTURE', timestamp: Date.now() });
            });
        });
    }
});

// Sincronização em background (funciona em alguns navegadores)
self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event:', event.tag);
    
    if (event.tag === 'capture-sync') {
        event.waitUntil(
            self.clients.matchAll({ type: 'window' }).then((clients) => {
                if (clients.length > 0) {
                    clients[0].postMessage({ 
                        type: 'CAPTURE', 
                        source: 'background-sync',
                        timestamp: Date.now() 
                    });
                }
            })
        );
    }
});

// Sincronização periódica (Chrome apenas)
self.addEventListener('periodicsync', (event) => {
    console.log('[SW] Periodic sync:', event.tag);
    
    if (event.tag === 'capture-periodic') {
        event.waitUntil(
            self.clients.matchAll({ type: 'window' }).then((clients) => {
                if (clients.length > 0) {
                    clients[0].postMessage({ 
                        type: 'CAPTURE', 
                        source: 'periodic-sync',
                        timestamp: Date.now() 
                    });
                } else {
                    console.log('[SW] Nenhum cliente aberto');
                }
            })
        );
    }
});

// Notificação de push (se implementado)
self.addEventListener('push', (event) => {
    console.log('[SW] Push recebido');
    
    const options = {
        body: 'Nova captura disponível',
        icon: '/icon.png',
        badge: '/badge.png',
        vibrate: [200, 100, 200],
        data: {
            url: '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('Monitor MEUCEL1', options)
    );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            if (clients.length > 0) {
                clients[0].focus();
            } else {
                self.clients.openWindow('/');
            }
        })
    );
});