/**
 * ============================================================================
 * CELAL BAŞARAN - SERVICE WORKER
 * PWA Support | Offline Caching | Performance Optimization
 * ============================================================================
 */

const CACHE_NAME = 'celal-portfolio-v1.0.0';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/blog.html',
  '/style.css',
  '/script.js',
  '/blog-script.js',
  '/manifest.json'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('📦 Service Worker: Serving from cache', request.url);
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache if not successful
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response
            const responseToCache = networkResponse.clone();
            
            // Add to dynamic cache
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                console.log('💾 Service Worker: Caching dynamic content', request.url);
                cache.put(request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch((error) => {
            console.error('🌐 Service Worker: Network request failed', error);
            
            // Return offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // Return empty response for other requests
            return new Response('', {
              status: 408,
              statusText: 'Request Timeout'
            });
          });
      })
  );
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form') {
    console.log('🔄 Service Worker: Background sync - contact form');
    event.waitUntil(syncContactForm());
  }
  
  if (event.tag === 'newsletter') {
    console.log('🔄 Service Worker: Background sync - newsletter');
    event.waitUntil(syncNewsletter());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📬 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Yeni içerik mevcut!',
    icon: '/favicon-192x192.png',
    badge: '/favicon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Görüntüle',
        icon: '/favicon-96x96.png'
      },
      {
        action: 'close',
        title: 'Kapat',
        icon: '/favicon-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Celal Başaran Portfolio', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions
async function syncContactForm() {
  try {
    const formData = await getStoredFormData('contact-form');
    if (formData) {
      // Simulate form submission
      console.log('📤 Service Worker: Syncing contact form', formData);
      // In real app, send to server
      await clearStoredFormData('contact-form');
    }
  } catch (error) {
    console.error('❌ Service Worker: Contact form sync failed', error);
  }
}

async function syncNewsletter() {
  try {
    const newsletterData = await getStoredFormData('newsletter');
    if (newsletterData) {
      console.log('📤 Service Worker: Syncing newsletter', newsletterData);
      // In real app, send to server
      await clearStoredFormData('newsletter');
    }
  } catch (error) {
    console.error('❌ Service Worker: Newsletter sync failed', error);
  }
}

async function getStoredFormData(key) {
  // In real app, get from IndexedDB
  return null;
}

async function clearStoredFormData(key) {
  // In real app, clear from IndexedDB
  return true;
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PERFORMANCE_MARK') {
    console.log('📊 Service Worker: Performance mark', event.data.mark);
  }
});

console.log('🎯 Service Worker: Loaded successfully'); 