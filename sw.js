/*
 * ============================================================================
 * CELAL BAŞARAN - ADVANCED SERVICE WORKER
 * Ultra-Modern PWA Service Worker with Advanced Caching and Offline Support
 * ============================================================================
 * Features:
 * - Advanced Caching Strategies
 * - Offline-First Architecture
 * - Background Sync
 * - Push Notifications
 * - Performance Optimization
 * - Automatic Updates
 * ============================================================================
 */

const CACHE_NAME = 'celal-portfolio-v3.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const IMAGE_CACHE = `${CACHE_NAME}-images`;
const API_CACHE = `${CACHE_NAME}-api`;

// Cache version for automatic updates
const CACHE_VERSION = 3;

// Files to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/assets/css/styles.css',
    '/assets/js/app.js',
    '/assets/js/modules/3d-engine.js',
    '/assets/js/modules/ai-assistant.js',
    '/assets/js/modules/voice-commands.js',
    '/assets/js/modules/analytics.js',
    '/assets/js/modules/performance-monitor.js',
    // Add other static assets as they exist
];

// Network-first resources
const NETWORK_FIRST = [
    '/api/',
    'https://api.',
    'https://cdn.',
    '/analytics'
];

// Cache-first resources  
const CACHE_FIRST = [
    '/assets/images/',
    '/assets/icons/',
    '/assets/fonts/',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot'
];

// Maximum cache sizes
const MAX_CACHE_SIZE = {
    [STATIC_CACHE]: 50,
    [DYNAMIC_CACHE]: 100,
    [IMAGE_CACHE]: 200,
    [API_CACHE]: 50
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
    [STATIC_CACHE]: 7 * 24 * 60 * 60 * 1000, // 7 days
    [DYNAMIC_CACHE]: 24 * 60 * 60 * 1000, // 1 day
    [IMAGE_CACHE]: 30 * 24 * 60 * 60 * 1000, // 30 days
    [API_CACHE]: 60 * 60 * 1000 // 1 hour
};

// ============================================================================
// INSTALLATION
// ============================================================================

self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            cacheStaticAssets(),
            self.skipWaiting()
        ])
    );
});

async function cacheStaticAssets() {
    try {
        const cache = await caches.open(STATIC_CACHE);
        
        // Cache static assets with error handling
        const cachePromises = STATIC_ASSETS.map(async (asset) => {
            try {
                const response = await fetch(asset);
                if (response.ok) {
                    await cache.put(asset, response);
                    console.log(`✅ Cached: ${asset}`);
                } else {
                    console.warn(`⚠️ Failed to cache: ${asset} (${response.status})`);
                }
            } catch (error) {
                console.warn(`⚠️ Error caching ${asset}:`, error);
            }
        });
        
        await Promise.allSettled(cachePromises);
        console.log('🎯 Static assets cached');
        
    } catch (error) {
        console.error('❌ Failed to cache static assets:', error);
    }
}

// ============================================================================
// ACTIVATION
// ============================================================================

self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            cleanupOldCaches(),
            self.clients.claim()
        ])
    );
});

async function cleanupOldCaches() {
    try {
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
            name.startsWith('celal-portfolio-') && 
            !name.includes(`v${CACHE_VERSION}`)
        );
        
        const deletePromises = oldCaches.map(cacheName => {
            console.log(`🗑️ Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
        });
        
        await Promise.all(deletePromises);
        console.log('🧹 Old caches cleaned up');
        
    } catch (error) {
        console.error('❌ Failed to cleanup old caches:', error);
    }
}

// ============================================================================
// FETCH HANDLING
// ============================================================================

self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) return;
    
    event.respondWith(handleFetch(event.request));
});

async function handleFetch(request) {
    const url = new URL(request.url);
    
    try {
        // Different strategies based on resource type
        if (isStaticAsset(url)) {
            return await cacheFirstStrategy(request, STATIC_CACHE);
        } else if (isImage(url)) {
            return await cacheFirstStrategy(request, IMAGE_CACHE);
        } else if (isApiRequest(url)) {
            return await networkFirstStrategy(request, API_CACHE);
        } else if (isNavigationRequest(request)) {
            return await staleWhileRevalidateStrategy(request, DYNAMIC_CACHE);
        } else {
            return await networkFirstStrategy(request, DYNAMIC_CACHE);
        }
    } catch (error) {
        console.error('❌ Fetch error:', error);
        return await getFallbackResponse(request);
    }
}

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

// Cache First - Good for static assets
async function cacheFirstStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, cacheName)) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
            await trimCache(cacheName);
        }
        return networkResponse;
    } catch (error) {
        if (cachedResponse) {
            console.log('🔄 Serving stale cache due to network error');
            return cachedResponse;
        }
        throw error;
    }
}

// Network First - Good for API calls
async function networkFirstStrategy(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            await cache.put(request, networkResponse.clone());
            await trimCache(cacheName);
        }
        return networkResponse;
    } catch (error) {
        console.log('🌐 Network failed, trying cache...');
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse && !isExpired(cachedResponse, cacheName)) {
            return cachedResponse;
        }
        throw error;
    }
}

// Stale While Revalidate - Good for navigation
async function staleWhileRevalidateStrategy(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Always try to fetch from network
    const networkPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
            trimCache(cacheName);
        }
        return response;
    }).catch(() => null);
    
    // Return cached version immediately if available
    if (cachedResponse && !isExpired(cachedResponse, cacheName)) {
        networkPromise; // Update cache in background
        return cachedResponse;
    }
    
    // Wait for network if no cache
    return await networkPromise || cachedResponse;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isStaticAsset(url) {
    return STATIC_ASSETS.some(asset => url.pathname.includes(asset)) ||
           url.pathname.includes('/assets/');
}

function isImage(url) {
    return /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(url.pathname);
}

function isApiRequest(url) {
    return NETWORK_FIRST.some(pattern => url.href.includes(pattern));
}

function isNavigationRequest(request) {
    return request.mode === 'navigate' || 
           (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function isExpired(response, cacheName) {
    if (!response.headers.has('date')) return false;
    
    const dateHeader = response.headers.get('date');
    const cacheTime = new Date(dateHeader).getTime();
    const now = Date.now();
    const expiration = CACHE_EXPIRATION[cacheName] || CACHE_EXPIRATION[DYNAMIC_CACHE];
    
    return (now - cacheTime) > expiration;
}

async function trimCache(cacheName) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const maxSize = MAX_CACHE_SIZE[cacheName] || 50;
    
    if (keys.length > maxSize) {
        const oldestKeys = keys.slice(0, keys.length - maxSize);
        await Promise.all(oldestKeys.map(key => cache.delete(key)));
        console.log(`🗑️ Trimmed ${oldestKeys.length} items from ${cacheName}`);
    }
}

async function getFallbackResponse(request) {
    if (isNavigationRequest(request)) {
        // Return cached index.html for navigation requests
        const cache = await caches.open(STATIC_CACHE);
        return await cache.match('/index.html') || 
               await cache.match('/');
    }
    
    if (isImage(request.url)) {
        // Return placeholder image for failed image requests
        return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#666">🖼️</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
        );
    }
    
    // Generic fallback
    return new Response('Offline', { 
        status: 503, 
        statusText: 'Service Unavailable' 
    });
}

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

self.addEventListener('sync', event => {
    console.log('🔄 Background sync:', event.tag);
    
    if (event.tag === 'analytics-sync') {
        event.waitUntil(syncAnalytics());
    }
    
    if (event.tag === 'contact-form-sync') {
        event.waitUntil(syncContactForms());
    }
});

async function syncAnalytics() {
    try {
        // Sync pending analytics data
        const pendingData = await getStoredData('pending-analytics');
        
        if (pendingData && pendingData.length > 0) {
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingData)
            });
            
            if (response.ok) {
                await clearStoredData('pending-analytics');
                console.log('📊 Analytics synced successfully');
            }
        }
    } catch (error) {
        console.error('❌ Failed to sync analytics:', error);
    }
}

async function syncContactForms() {
    try {
        // Sync pending contact form submissions
        const pendingForms = await getStoredData('pending-contact-forms');
        
        if (pendingForms && pendingForms.length > 0) {
            for (const formData of pendingForms) {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    await removeStoredData('pending-contact-forms', formData.id);
                    console.log('📧 Contact form synced successfully');
                }
            }
        }
    } catch (error) {
        console.error('❌ Failed to sync contact forms:', error);
    }
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', event => {
    console.log('📱 Push notification received');
    
    const options = {
        body: 'Portfolio güncellendi! Yeni özellikler mevcut.',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Keşfet',
                icon: '/assets/icons/explore-icon.png'
            },
            {
                action: 'close',
                title: 'Kapat',
                icon: '/assets/icons/close-icon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Celal Portfolio', options)
    );
});

self.addEventListener('notificationclick', event => {
    console.log('📱 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/?notification=explore')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// ============================================================================
// MESSAGES FROM MAIN THREAD
// ============================================================================

self.addEventListener('message', event => {
    console.log('💬 Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_CACHE_STATUS') {
        getCacheStatus().then(status => {
            event.ports[0].postMessage(status);
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHES') {
        clearAllCaches().then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

async function getCacheStatus() {
    const cacheNames = await caches.keys();
    const cacheStatus = {};
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        cacheStatus[cacheName] = {
            size: keys.length,
            maxSize: MAX_CACHE_SIZE[cacheName] || 'unlimited'
        };
    }
    
    return cacheStatus;
}

async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('🧹 All caches cleared');
}

// ============================================================================
// INDEXED DB HELPERS
// ============================================================================

async function getStoredData(storeName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('portfolio-sw-db', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => reject(getAllRequest.error);
        };
        
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function clearStoredData(storeName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('portfolio-sw-db', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
        };
    });
}

async function removeStoredData(storeName, id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('portfolio-sw-db', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
    });
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

let swPerformance = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    errors: 0
};

function logPerformance(type) {
    swPerformance[type]++;
    
    // Send performance data to main thread periodically
    if ((swPerformance.cacheHits + swPerformance.cacheMisses) % 10 === 0) {
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'SW_PERFORMANCE',
                    data: swPerformance
                });
            });
        });
    }
}

console.log('🔧 Service Worker loaded successfully');
console.log(`📦 Cache version: ${CACHE_VERSION}`);
console.log(`🎯 Static assets to cache: ${STATIC_ASSETS.length}`); 