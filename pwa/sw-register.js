/**
 * Portfolio OS V6 - Service Worker Registration
 * PWA Features Registration and Management
 */

class ServiceWorkerManager {
  constructor() {
    this.swRegistration = null;
    this.isUpdateAvailable = false;
    this.deferredPrompt = null;
    
    this.init();
  }

  async init() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker desteklenmiyor');
      return;
    }

    try {
      await this.registerServiceWorker();
      this.setupUpdateDetection();
      this.setupInstallPrompt();
      this.setupPushNotifications();
      
      console.log('📱 PWA Manager initialized');
    } catch (error) {
      console.error('PWA Manager başlatılamadı:', error);
    }
  }

  async registerServiceWorker() {
    try {
      this.swRegistration = await navigator.serviceWorker.register('/pwa/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker kayıt edildi:', this.swRegistration.scope);

      // Check for updates
      this.swRegistration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker güncellemesi bulundu');
        this.handleUpdate();
      });

      // Listen for controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker kontrolü değişti');
        window.location.reload();
      });

    } catch (error) {
      console.error('❌ Service Worker kayıt hatası:', error);
      throw error;
    }
  }

  handleUpdate() {
    const newWorker = this.swRegistration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        this.isUpdateAvailable = true;
        this.showUpdateNotification();
      }
    });
  }

  showUpdateNotification() {
    // Show update notification to user
    const updateBanner = this.createUpdateBanner();
    document.body.appendChild(updateBanner);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (updateBanner.parentNode) {
        updateBanner.parentNode.removeChild(updateBanner);
      }
    }, 10000);
  }

  createUpdateBanner() {
    const banner = document.createElement('div');
    banner.className = 'update-banner';
    banner.innerHTML = `
      <div class="update-content">
        <span class="update-icon">🔄</span>
        <div class="update-text">
          <strong>Güncelleme Mevcut</strong>
          <p>Portfolio OS V6'nın yeni sürümü hazır!</p>
        </div>
        <div class="update-actions">
          <button class="btn btn-primary btn-sm" id="updateNow">
            Güncelle
          </button>
          <button class="btn btn-secondary btn-sm" id="updateLater">
            Sonra
          </button>
        </div>
      </div>
    `;

    // Add styles
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      max-width: 350px;
      border: 1px solid rgba(0, 0, 0, 0.1);
    `;

    // Event listeners
    banner.querySelector('#updateNow').addEventListener('click', () => {
      this.applyUpdate();
      banner.remove();
    });

    banner.querySelector('#updateLater').addEventListener('click', () => {
      banner.remove();
    });

    return banner;
  }

  async applyUpdate() {
    if (!this.swRegistration || !this.swRegistration.waiting) {
      return;
    }

    // Tell the waiting service worker to skip waiting
    this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  // === INSTALL PROMPT ===

  setupInstallPrompt() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      
      console.log('📱 Install prompt hazır');
      this.showInstallButton();
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA yüklendi');
      this.deferredPrompt = null;
      this.hideInstallButton();
      
      // Track installation
      if (window.gtag) {
        gtag('event', 'app_install', {
          event_category: 'PWA',
          event_label: 'Portfolio OS V6'
        });
      }
    });
  }

  showInstallButton() {
    // Create install button if it doesn't exist
    let installBtn = document.getElementById('pwa-install-btn');
    
    if (!installBtn) {
      installBtn = document.createElement('button');
      installBtn.id = 'pwa-install-btn';
      installBtn.className = 'btn btn-primary install-btn';
      installBtn.innerHTML = `
        <span>📱</span>
        <span>Uygulamayı Yükle</span>
      `;
      
      installBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        border-radius: 25px;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 500;
        background: var(--color-primary);
        color: white;
        border: none;
        box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3);
        cursor: pointer;
        transition: all 0.3s ease;
        display: none;
      `;

      document.body.appendChild(installBtn);
    }

    installBtn.style.display = 'flex';
    installBtn.addEventListener('click', this.handleInstallClick.bind(this));
  }

  hideInstallButton() {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  }

  async handleInstallClick() {
    if (!this.deferredPrompt) return;

    try {
      // Show install prompt
      this.deferredPrompt.prompt();
      
      // Wait for user choice
      const choiceResult = await this.deferredPrompt.userChoice;
      
      console.log('Install prompt result:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('✅ Kullanıcı uygulamayı yükledi');
      } else {
        console.log('❌ Kullanıcı yüklemeyi reddetti');
      }
      
      this.deferredPrompt = null;
      this.hideInstallButton();
      
    } catch (error) {
      console.error('Install prompt hatası:', error);
    }
  }

  // === PUSH NOTIFICATIONS ===

  async setupPushNotifications() {
    if (!('PushManager' in window)) {
      console.warn('Push notifications desteklenmiyor');
      return;
    }

    if (!this.swRegistration) {
      console.warn('Service Worker kayıtlı değil');
      return;
    }

    try {
      // Check current subscription
      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('✅ Push notification aboneliği mevcut');
      } else {
        console.log('ℹ️ Push notification aboneliği yok');
      }
      
    } catch (error) {
      console.error('Push notification setup hatası:', error);
    }
  }

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications desteklenmiyor');
      return false;
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      console.log('✅ Notification izni verildi');
      return true;
    } else {
      console.log('❌ Notification izni reddedildi');
      return false;
    }
  }

  async subscribeToPushNotifications() {
    if (!this.swRegistration) {
      console.error('Service Worker kayıtlı değil');
      return null;
    }

    try {
      const hasPermission = await this.requestNotificationPermission();
      if (!hasPermission) return null;

      // Application server key (VAPID public key)
      const applicationServerKey = 'YOUR_VAPID_PUBLIC_KEY_HERE';

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(applicationServerKey)
      });

      console.log('✅ Push notification aboneliği oluşturuldu');
      return subscription;

    } catch (error) {
      console.error('Push notification abonelik hatası:', error);
      return null;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // === CACHE MANAGEMENT ===

  async getCacheStatus() {
    if (!this.swRegistration) return null;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.payload);
      };

      this.swRegistration.active?.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );
    });
  }

  async clearCache() {
    if (!this.swRegistration) return false;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.payload.success);
      };

      this.swRegistration.active?.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }

  // === NETWORK STATUS ===

  setupNetworkDetection() {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      document.body.classList.toggle('offline', !isOnline);
      
      if (!isOnline) {
        this.showOfflineMessage();
      } else {
        this.hideOfflineMessage();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
  }

  showOfflineMessage() {
    let offlineMsg = document.getElementById('offline-message');
    
    if (!offlineMsg) {
      offlineMsg = document.createElement('div');
      offlineMsg.id = 'offline-message';
      offlineMsg.className = 'offline-banner';
      offlineMsg.innerHTML = `
        <span>📡</span>
        <span>Çevrimdışı - Önbelleğe alınmış içerik gösteriliyor</span>
      `;
      
      offlineMsg.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #FF9500;
        color: white;
        padding: 8px;
        text-align: center;
        font-size: 14px;
        z-index: 10001;
        transform: translateY(-100%);
        transition: transform 0.3s ease;
      `;
      
      document.body.appendChild(offlineMsg);
    }
    
    setTimeout(() => {
      offlineMsg.style.transform = 'translateY(0)';
    }, 100);
  }

  hideOfflineMessage() {
    const offlineMsg = document.getElementById('offline-message');
    if (offlineMsg) {
      offlineMsg.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        offlineMsg.remove();
      }, 300);
    }
  }

  // === PUBLIC API ===

  isInstallable() {
    return !!this.deferredPrompt;
  }

  async install() {
    return this.handleInstallClick();
  }

  async enableNotifications() {
    return this.subscribeToPushNotifications();
  }

  getRegistration() {
    return this.swRegistration;
  }

  hasUpdate() {
    return this.isUpdateAvailable;
  }

  async update() {
    return this.applyUpdate();
  }
}

// Initialize Service Worker Manager
const swManager = new ServiceWorkerManager();

// Export for global access
window.swManager = swManager;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ServiceWorkerManager;
} 