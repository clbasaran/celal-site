/**
 * Service Worker - PWA Support
 * Celal Başaran Portfolio - Apple Design Language V4
 * Offline-first caching strategy
 */

const CACHE_NAME = 'celal-portfolio-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Öncelikli cache edilecek dosyalar (Critical Path)
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  // Core fonts (SF Pro fallback)
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

// Runtime'da cache edilecek dosyalar
const RUNTIME_CACHE = [
  '/assets/',
  '/blog.html'
];

// Cache stratejileri
const CACHE_STRATEGIES = {
  cacheFirst: 'cacheFirst',
  networkFirst: 'networkFirst',
  staleWhileRevalidate: 'staleWhileRevalidate'
};

/**
 * Service Worker Install Event
 */
self.addEventListener('install', (event) => {
  console.log('💿 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching core assets...');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('✅ Core assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error caching core assets:', error);
      })
  );
});

/**
 * Service Worker Activate Event
 */
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Eski cache'leri temizle
      cleanupOldCaches(),
      // Tüm clientları kontrol et
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated successfully');
    })
  );
});

/**
 * Fetch Event - Network requests'leri intercept et
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Sadece HTTP/HTTPS requestleri handle et
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Strategy'yi belirle
  const strategy = determineStrategy(request);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch(error => {
        console.error('❌ Fetch error:', error);
        return handleFallback(request);
      })
  );
});

/**
 * Cache stratejisini belirle
 */
function determineStrategy(request) {
  const url = new URL(request.url);
  
  // Static assets (CSS, JS, Images) - Cache First
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      url.pathname.includes('/assets/')) {
    return CACHE_STRATEGIES.cacheFirst;
  }
  
  // HTML pages - Network First
  if (request.destination === 'document') {
    return CACHE_STRATEGIES.networkFirst;
  }
  
  // API calls - Stale While Revalidate
  if (url.pathname.includes('/api/')) {
    return CACHE_STRATEGIES.staleWhileRevalidate;
  }
  
  // Default - Network First
  return CACHE_STRATEGIES.networkFirst;
}

/**
 * Request'i stratejiye göre handle et
 */
async function handleRequest(request, strategy) {
  switch (strategy) {
    case CACHE_STRATEGIES.cacheFirst:
      return handleCacheFirst(request);
    
    case CACHE_STRATEGIES.networkFirst:
      return handleNetworkFirst(request);
    
    case CACHE_STRATEGIES.staleWhileRevalidate:
      return handleStaleWhileRevalidate(request);
    
    default:
      return handleNetworkFirst(request);
  }
}

/**
 * Cache First Strategy
 * Önce cache'e bak, yoksa network'ten al
 */
async function handleCacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  // Sadece başarılı responseları cache'le
  if (networkResponse.status === 200) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

/**
 * Network First Strategy
 * Önce network'ten al, başarısızsa cache'den ver
 */
async function handleNetworkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    // Başarılı responseları cache'le
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network başarısızsa cache'den dön
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 * Cache'den hemen dön, background'da güncelle
 */
async function handleStaleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Background'da fetch et
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  // Cache varsa hemen dön, yoksa network'ü bekle
  return cachedResponse || fetchPromise;
}

/**
 * Fallback handler - Offline sayfası
 */
async function handleFallback(request) {
  // HTML sayfası için offline fallback
  if (request.destination === 'document') {
    const cache = await caches.open(STATIC_CACHE);
    return cache.match('/index.html') || new Response(
      generateOfflinePage(),
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
  
  // Image için placeholder
  if (request.destination === 'image') {
    return new Response(
      generatePlaceholderSVG(),
      {
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    );
  }
  
  // Diğer durumlar için 404
  return new Response('Offline - Content not available', {
    status: 404,
    statusText: 'Not Found'
  });
}

/**
 * Eski cache'leri temizle
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE];
  
  return Promise.all(
    cacheNames
      .filter(cacheName => !validCaches.includes(cacheName))
      .map(cacheName => {
        console.log('🗑️ Deleting old cache:', cacheName);
        return caches.delete(cacheName);
      })
  );
}

/**
 * Offline sayfası HTML'i generate et
 */
function generateOfflinePage() {
  return `
<!DOCTYPE html>
<html lang="tr" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - Celal Başaran</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
            background: linear-gradient(135deg, #0A84FF, #5E5CE6);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 20px;
        }
        .container {
            max-width: 500px;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 24px;
        }
        h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 16px;
        }
        p {
            font-size: 18px;
            opacity: 0.8;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            color: white;
            text-decoration: none;
            font-weight: 600;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📱</div>
        <h1>Offline Mode</h1>
        <p>
            İnternet bağlantınız yok gibi görünüyor. Bazı içerikler cache'den sunuluyor.
            Tam deneyim için lütfen internet bağlantınızı kontrol edin.
        </p>
        <a href="/" class="btn" onclick="window.location.reload()">
            Tekrar Dene
        </a>
    </div>
</body>
</html>
  `;
}

/**
 * Placeholder SVG image generate et
 */
function generatePlaceholderSVG() {
  return `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <rect x="50%" y="50%" width="200" height="100" rx="8" fill="#e5e7eb" transform="translate(-100, -50)"/>
  <text x="50%" y="50%" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle" dy="0.3em">
    📷 Image not available offline
  </text>
</svg>
  `;
}

/**
 * Message handling (for cache updates)
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.payload;
    caches.open(DYNAMIC_CACHE).then(cache => {
      cache.addAll(urls);
    });
  }
});

/**
 * Background Sync (for future use)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Future: Handle offline form submissions, analytics etc.
  console.log('🔄 Background sync triggered');
}

/**
 * Push notifications (for future use)
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/assets/icons/favicon-192x192.png',
        badge: '/assets/icons/favicon-96x96.png',
        tag: 'celal-portfolio',
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Portfolio'
          },
          {
            action: 'close',
            title: 'Close'
          }
        ]
      })
    );
  }
});

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
}); 