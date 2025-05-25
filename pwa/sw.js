/**
 * Portfolio OS V6 - Service Worker
 * Progressive Web App Features
 */

const CACHE_NAME = 'portfolio-os-v6-cache-v1.0.0';
const CACHE_VERSION = '1.0.0';

// Files to cache
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/assets/css/main.css',
  '/assets/css/utilities.css',
  '/assets/css/components/navigation.css',
  '/assets/css/components/hero.css',
  '/assets/css/components/sections.css',
  '/assets/css/components/accessibility.css',
  '/assets/js/components/app.js',
  '/assets/js/components/navigation.js',
  '/assets/js/components/hero.js',
  '/assets/js/components/theme-manager.js',
  '/assets/js/utils/data-manager.js',
  '/assets/js/modules/accessibility.js',
  '/data/profile.json',
  '/data/projects.json',
  '/pwa/manifest.json'
];

// Dynamic cache for API responses and images
const DYNAMIC_CACHE_NAME = 'portfolio-os-v6-dynamic-cache';
const IMAGE_CACHE_NAME = 'portfolio-os-v6-images';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static files');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .then(() => {
        console.log('✅ Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== IMAGE_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests (different origin)
  if (url.origin !== location.origin) {
    return;
  }
  
  // Route requests to appropriate strategies
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (isDataRequest(request)) {
    event.respondWith(networkFirstStrategy(request));
  } else if (isImageRequest(request)) {
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    event.respondWith(networkFirstStrategy(request));
  }
});

// === CACHE STRATEGIES ===

// Cache First - Good for static assets
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return new Response('Offline - Resource not available', { status: 503 });
  }
}

// Network First - Good for dynamic content
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    
    return new Response('Offline - Resource not available', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Stale While Revalidate - Good for images
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// === UTILITY FUNCTIONS ===

function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  return pathname.includes('/assets/') || 
         pathname.endsWith('.css') || 
         pathname.endsWith('.js') || 
         pathname.endsWith('.json') ||
         pathname === '/';
}

function isDataRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/data/') || url.pathname.endsWith('.json');
}

function isImageRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  return pathname.includes('/images/') ||
         pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/);
}

// === BACKGROUND SYNC ===

self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Perform any background tasks
    console.log('📡 Performing background sync...');
    
    // Update cache if needed
    await updateCache();
    
    console.log('✅ Background sync completed');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

async function updateCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    // Update critical data files
    const criticalFiles = ['/data/profile.json', '/data/projects.json'];
    
    for (const file of criticalFiles) {
      try {
        const response = await fetch(file);
        if (response.ok) {
          await cache.put(file, response);
          console.log('📦 Updated cache for:', file);
        }
      } catch (error) {
        console.warn('⚠️ Failed to update cache for:', file);
      }
    }
  } catch (error) {
    console.error('❌ Cache update failed:', error);
  }
}

// === PUSH NOTIFICATIONS ===

self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Portfolio OS V6 bildirimi',
    icon: '/assets/images/icons/icon-192x192.png',
    badge: '/assets/images/icons/badge-72x72.png',
    tag: data.tag || 'portfolio-notification',
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Aç',
        icon: '/assets/images/icons/open.png'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: '/assets/images/icons/close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Portfolio OS V6', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'open' || !action) {
    event.waitUntil(
      clients.openWindow(data.url || '/')
    );
  }
});

// === MESSAGE HANDLING ===

self.addEventListener('message', (event) => {
  console.log('💬 Message received:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        payload: {
          version: CACHE_VERSION,
          caches: [CACHE_NAME, DYNAMIC_CACHE_NAME, IMAGE_CACHE_NAME]
        }
      });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({
          type: 'CACHE_CLEARED',
          payload: { success: true }
        });
      });
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('🗑️ All caches cleared');
  } catch (error) {
    console.error('❌ Failed to clear caches:', error);
  }
}

// === ERROR HANDLING ===

self.addEventListener('error', (event) => {
  console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection in SW:', event.reason);
});

// === PERIODIC BACKGROUND SYNC ===

self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic sync triggered:', event.tag);
  
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  try {
    console.log('🔄 Syncing content...');
    
    // Update cache with latest content
    await updateCache();
    
    // Notify clients about updates
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CONTENT_UPDATED',
        timestamp: Date.now()
      });
    });
    
    console.log('✅ Content sync completed');
  } catch (error) {
    console.error('❌ Content sync failed:', error);
  }
}

console.log('🚀 Portfolio OS V6 Service Worker loaded'); 