/**
 * Portfolio OS - Service Worker
 * Apple Design Language V5
 * Advanced PWA features with offline-first strategy
 */

const CACHE_NAME = 'portfolio-os-v2.0.0';
const CACHE_VERSION = '2.0.0';

// Resources to cache immediately
const STATIC_CACHE = [
    '/',
    '/index.html',
    '/about.html',
    '/projects.html',
    '/blog.html',
    '/contact.html',
    '/hire-me.html',
    '/cv.html',
    
    // Core CSS
    '/assets/css/main.css',
    '/assets/css/reset.css',
    '/assets/css/grid.css',
    '/assets/css/typography.css',
    '/assets/css/animations.css',
    '/assets/css/darkmode.css',
    '/assets/css/responsive.css',
    
    // Component CSS
    '/assets/css/components/navbar.css',
    '/assets/css/components/hero.css',
    '/assets/css/components/cards.css',
    '/assets/css/components/footer.css',
    
    // Core JavaScript
    '/assets/js/init.js',
    '/assets/js/app.js',
    '/assets/js/router.js',
    '/assets/js/state.js',
    '/assets/js/scroll.js',
    '/assets/js/storage.js',
    
    // Modules
    '/assets/js/modules/theme-toggle.js',
    '/assets/js/modules/observer.js',
    '/assets/js/modules/ai-assistant.js',
    '/assets/js/modules/voice.js',
    '/assets/js/modules/fps-graph.js',
    '/assets/js/modules/analytics.js',
    
    // Data
    '/data/projects.json',
    '/data/skills.json',
    '/data/experience.json',
    '/data/blog.json',
    
    // Essential images
    '/assets/images/celal-avatar.jpg',
    '/assets/icons/apple-touch-icon.png',
    '/assets/icons/favicon-32x32.png',
    
    // PWA files
    '/pwa/manifest.json',
    
    // SEO files
    '/robots.txt',
    '/sitemap.xml'
];

// Runtime cache patterns
const RUNTIME_CACHE_PATTERNS = [
    {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
            cacheName: 'images-cache',
            expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
            }
        }
    },
    {
        urlPattern: /\.(?:js|css)$/,
        handler: 'StaleWhileRevalidate',
        options: {
            cacheName: 'static-resources'
        }
    },
    {
        urlPattern: /^https:\/\/api\./,
        handler: 'NetworkFirst',
        options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 3,
            expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
            }
        }
    }
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log('🚀 Service Worker installing...', CACHE_VERSION);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching static resources...');
                return cache.addAll(STATIC_CACHE);
            })
            .then(() => {
                console.log('✅ Static resources cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Cache install failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('⚡ Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName.startsWith('portfolio-os-') && cacheName !== CACHE_NAME;
                        })
                        .map((cacheName) => {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('🎯 Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content with fallbacks
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other protocols
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        handleRequest(request)
    );
});

async function handleRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Check if it's a navigation request
        if (request.mode === 'navigate') {
            return await handleNavigationRequest(request);
        }
        
        // Check if it's an API request
        if (url.pathname.startsWith('/api/')) {
            return await handleApiRequest(request);
        }
        
        // Check for specific file types
        if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff|woff2)$/)) {
            return await handleStaticAsset(request);
        }
        
        // Default cache-first strategy
        return await cacheFirst(request);
        
    } catch (error) {
        console.error('❌ Request failed:', error);
        return await getFallbackResponse(request);
    }
}

// Navigation request handler with offline fallback
async function handleNavigationRequest(request) {
    try {
        // Try network first for HTML pages
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache the response
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
        
    } catch (error) {
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Ultimate fallback - offline page
        return await caches.match('/index.html') || new Response(
            getOfflineFallbackHTML(),
            {
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
}

// API request handler with timeout
async function handleApiRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    
    try {
        // Try network with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const networkResponse = await fetch(request, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error('API response not ok');
        
    } catch (error) {
        // Fallback to cache
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return error response
        return new Response(
            JSON.stringify({ error: 'Offline - data not available' }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Static asset handler
async function handleStaticAsset(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // Try cache first for static assets
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
        
        throw new Error('Asset fetch failed');
        
    } catch (error) {
        // Return placeholder for failed images
        if (request.url.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
            return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" font-family="system-ui" font-size="14" fill="#666">Image Offline</text></svg>',
                {
                    headers: { 'Content-Type': 'image/svg+xml' }
                }
            );
        }
        
        return new Response('Asset not available offline', { status: 404 });
    }
}

// Cache-first strategy
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    cache.put(request, networkResponse.clone());
    return networkResponse;
}

// Fallback response for failed requests
async function getFallbackResponse(request) {
    if (request.mode === 'navigate') {
        return new Response(
            getOfflineFallbackHTML(),
            {
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
    
    return new Response('Offline', { status: 503 });
}

// Offline fallback HTML
function getOfflineFallbackHTML() {
    return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - Celal Başaran</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: #000;
                color: #fff;
                text-align: center;
            }
            .offline-container {
                max-width: 400px;
                padding: 40px 20px;
            }
            .offline-icon {
                font-size: 64px;
                margin-bottom: 20px;
            }
            .offline-title {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 10px;
            }
            .offline-description {
                font-size: 16px;
                opacity: 0.7;
                margin-bottom: 30px;
            }
            .retry-button {
                background: #0A84FF;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s ease;
            }
            .retry-button:hover {
                background: #0071E3;
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1 class="offline-title">Çevrimdışı</h1>
            <p class="offline-description">
                İnternet bağlantınızı kontrol edin ve tekrar deneyin.
            </p>
            <button class="retry-button" onclick="window.location.reload()">
                Tekrar Dene
            </button>
        </div>
    </body>
    </html>`;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'contact-form') {
        event.waitUntil(syncContactForm());
    }
});

async function syncContactForm() {
    try {
        // Get offline contact form submissions
        const offlineData = await getStoredData('contact-submissions');
        
        if (offlineData && offlineData.length > 0) {
            for (const submission of offlineData) {
                await submitContactForm(submission);
            }
            
            // Clear stored data after successful sync
            await clearStoredData('contact-submissions');
            console.log('✅ Contact forms synced');
        }
    } catch (error) {
        console.error('❌ Contact form sync failed:', error);
    }
}

// Push notification handler
self.addEventListener('push', (event) => {
    console.log('📬 Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'Yeni güncellemeler mevcut!',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        tag: 'portfolio-update',
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'Görüntüle',
                icon: '/assets/icons/actions/view.png'
            },
            {
                action: 'dismiss',
                title: 'Kapat',
                icon: '/assets/icons/actions/dismiss.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Celal Başaran Portfolio', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Helper functions for IndexedDB operations
async function getStoredData(key) {
    // Simplified localStorage fallback
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

async function clearStoredData(key) {
    try {
        localStorage.removeItem(key);
    } catch {
        // Silent fail
    }
}

async function submitContactForm(data) {
    return fetch('/api/contact', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

console.log('🎯 Service Worker loaded successfully'); 