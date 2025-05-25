/**
 * Portfolio OS V6 - Main Application
 * Apple Design Language V6 - WCAG 2.1 AA Compliant
 * Modular Architecture with Accessibility Focus
 */

class PortfolioApp {
  constructor() {
    this.isInitialized = false;
    this.modules = {};
    this.eventBus = new EventTarget();
    this.config = {
      debug: false,
      version: '6.0.0',
      build: Date.now(),
      theme: localStorage.getItem('portfolio-theme') || 'auto',
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    };
    
    this.accessibility = {
      announcements: new Map(),
      focusStack: [],
      keyboardNavigation: true,
      screenReader: this.detectScreenReader()
    };
    
    this.performance = {
      metrics: new Map(),
      observers: new Map(),
      startTime: performance.now()
    };
    
    this.init();
  }

  async init() {
    try {
      this.log('🍎 Portfolio OS V6 başlatılıyor...', 'info');
      
      // Performance monitoring başlat
      this.initPerformanceMonitoring();
      
      // Accessibility features başlat  
      this.initAccessibilityFeatures();
      
      // DOM hazır kontrolü
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bootstrap());
      } else {
        this.bootstrap();
      }
    } catch (error) {
      this.log('Portfolio OS başlatma hatası:', 'error', error);
    }
  }

  async bootstrap() {
    try {
      // Loading indicator göster
      this.showLoadingIndicator();
      
      // Core modülleri sırayla başlat
      await this.loadCoreModules();
      
      // Component'leri yükle
      await this.loadComponents();
      
      // Data layer'ı başlat
      await this.initDataLayer();
      
      // PWA özelliklerini başlat
      await this.initPWAFeatures();
      
      // Loading indicator gizle
      setTimeout(() => this.hideLoadingIndicator(), 300);
      
      this.isInitialized = true;
      this.log('✅ Portfolio OS V6 başarıyla başlatıldı', 'success');
      
      // Performance metrics hesapla
      this.calculateLoadMetrics();
      
      // Başlatma event'i gönder
      this.emit('app:initialized', {
        timestamp: Date.now(),
        loadTime: performance.now() - this.performance.startTime
      });
      
    } catch (error) {
      this.log('Bootstrap hatası:', 'error', error);
      this.handleCriticalError(error);
    }
  }

  async loadCoreModules() {
    const coreModules = [
      { name: 'themeManager', loader: () => this.loadThemeManager() },
      { name: 'dataManager', loader: () => this.loadDataManager() }
    ];

    for (const module of coreModules) {
      try {
        await module.loader();
        this.log(`✅ ${module.name} yüklendi`, 'info');
      } catch (error) {
        this.log(`❌ ${module.name} yüklenemedi:`, 'error', error);
      }
    }
  }

  async loadComponents() {
    const components = [
      { name: 'navigation', loader: () => this.loadNavigationComponent() },
      { name: 'hero', loader: () => this.loadHeroComponent() }
    ];

    // Paralel component yükleme
    const loadPromises = components.map(async (component) => {
      try {
        await component.loader();
        this.log(`✅ ${component.name} component yüklendi`, 'info');
        return { name: component.name, status: 'success' };
      } catch (error) {
        this.log(`❌ ${component.name} component yüklenemedi:`, 'error', error);
        return { name: component.name, status: 'error', error };
      }
    });

    const results = await Promise.allSettled(loadPromises);
    this.log('📦 Component yükleme tamamlandı', 'info', results);
  }

  async loadThemeManager() {
    if (window.themeManager) {
      this.modules.themeManager = window.themeManager;
      this.log('🎨 Theme Manager zaten yüklü', 'info');
      return;
    }

    // Theme Manager'ı dinamik yükle (eğer ayrı dosyada ise)
    try {
      await this.loadScript('./assets/js/components/theme-manager.js');
      
      // Yükleme tamamlanana kadar bekle
      await this.waitForGlobal('themeManager', 5000);
      
      this.modules.themeManager = window.themeManager;
      this.log('🎨 Theme Manager yüklendi', 'info');
    } catch (error) {
      this.log('Theme Manager yüklenemedi, fallback kullanılıyor', 'warn');
      await this.initFallbackThemeManager();
    }
  }

  async loadDataManager() {
    if (window.dataManager) {
      this.modules.dataManager = window.dataManager;
      this.log('📊 Data Manager zaten yüklü', 'info');
      return;
    }

    try {
      await this.loadScript('./assets/js/utils/data-manager.js');
      await this.waitForGlobal('dataManager', 5000);
      
      this.modules.dataManager = window.dataManager;
      this.log('📊 Data Manager yüklendi', 'info');
    } catch (error) {
      this.log('Data Manager yüklenemedi', 'error', error);
      throw error;
    }
  }

  async loadNavigationComponent() {
    if (window.navigationComponent) {
      this.modules.navigation = window.navigationComponent;
      this.log('🧭 Navigation zaten yüklü', 'info');
      return;
    }

    try {
      await this.loadScript('./assets/js/components/navigation.js');
      await this.waitForGlobal('navigationComponent', 5000);
      
      this.modules.navigation = window.navigationComponent;
      this.log('🧭 Navigation component yüklendi', 'info');
    } catch (error) {
      this.log('Navigation component yüklenemedi', 'error', error);
      await this.initFallbackNavigation();
    }
  }

  async loadHeroComponent() {
    if (window.heroComponent) {
      this.modules.hero = window.heroComponent;
      this.log('🦸 Hero zaten yüklü', 'info');
      return;
    }

    try {
      await this.loadScript('./assets/js/components/hero.js');
      await this.waitForGlobal('heroComponent', 5000);
      
      this.modules.hero = window.heroComponent;
      this.log('🦸 Hero component yüklendi', 'info');
    } catch (error) {
      this.log('Hero component yüklenemedi', 'error', error);
      // Hero component olmadan da çalışabilir
    }
  }

  async initDataLayer() {
    if (!this.modules.dataManager) {
      this.log('Data Manager bulunamadı, veri yüklenemedi', 'warn');
      return;
    }

    try {
      // Kritik verileri yükle
      const profileData = await this.modules.dataManager.getProfile();
      const projectsData = await this.modules.dataManager.getProjects();
      
      // Global veri store
      window.portfolioData = {
        profile: profileData,
        projects: projectsData
      };
      
      this.log('📊 Data layer başlatıldı', 'info');
      this.emit('data:loaded', { profile: profileData, projects: projectsData });
      
    } catch (error) {
      this.log('Data layer başlatılamadı:', 'warn', error);
      // Fallback data ile devam et
      await this.initFallbackData();
    }
  }

  async initFallbackData() {
    window.portfolioData = {
      profile: {
        name: 'Celal Başaran',
        title: 'Full Stack Developer & UI/UX Designer',
        description: 'Apple Design Language V6 ile modern, erişilebilir web deneyimleri oluşturuyor.',
        status: 'available'
      },
      projects: {
        featured: [],
        projects: []
      }
    };
    
    this.log('📋 Fallback data kullanılıyor', 'info');
  }

  async initFallbackThemeManager() {
    // Basit fallback theme manager
    this.modules.themeManager = {
      getCurrentTheme: () => localStorage.getItem('portfolio-theme') || 'auto',
      setTheme: (theme) => {
        localStorage.setItem('portfolio-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
      }
    };
  }

  async initFallbackNavigation() {
    // Basit fallback navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
    
    this.log('🧭 Fallback navigation aktif', 'info');
  }

  // === ACCESSIBILITY FEATURES ===

  initAccessibilityFeatures() {
    // Screen reader detection
    this.accessibility.screenReader = this.detectScreenReader();
    
    // Keyboard navigation setup
    this.setupKeyboardNavigation();
    
    // Focus management
    this.setupFocusManagement();
    
    // ARIA live regions
    this.setupLiveRegions();
    
    // High contrast detection
    this.handleHighContrastMode();
    
    this.log('♿ Accessibility features initialized', 'info');
  }

  detectScreenReader() {
    // Screen reader detection heuristics
    const indicators = [
      window.navigator.userAgent.includes('NVDA'),
      window.navigator.userAgent.includes('JAWS'),  
      window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
      window.navigator.maxTouchPoints === 0 && window.innerWidth < 1024,
      document.activeElement !== document.body
    ];
    
    return indicators.some(indicator => indicator);
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardNavigation(e);
    });
  }

  handleKeyboardNavigation(event) {
    const { key, ctrlKey } = event;
    
    // Global keyboard shortcuts
    const shortcuts = {
      'Escape': () => this.handleEscapeKey(),
      'h': () => ctrlKey && this.navigateToSection('home'),
      'p': () => ctrlKey && this.navigateToSection('projects'),
      's': () => ctrlKey && this.navigateToSection('skills'), 
      'c': () => ctrlKey && this.navigateToSection('contact'),
      't': () => ctrlKey && this.toggleTheme()
    };
    
    const handler = shortcuts[key];
    if (handler) {
      event.preventDefault();
      handler();
      this.announceToScreenReader(`Keyboard shortcut activated: ${key}`);
    }
  }

  setupFocusManagement() {
    // Focus visible handling
    document.addEventListener('keydown', () => {
      document.body.classList.add('keyboard-navigation');
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  setupLiveRegions() {
    // Create ARIA live regions if they don't exist
    if (!document.getElementById('announcements')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'announcements';
      liveRegion.className = 'sr-only';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      document.body.appendChild(liveRegion);
    }
  }

  handleHighContrastMode() {
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    const applyHighContrast = (matches) => {
      document.documentElement.classList.toggle('high-contrast', matches);
    };
    
    applyHighContrast(highContrastQuery.matches);
    highContrastQuery.addListener((e) => applyHighContrast(e.matches));
  }

  announceToScreenReader(message, priority = 'polite') {
    const liveRegion = document.getElementById('announcements');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
    
    this.log(`📢 Screen Reader: ${message}`, 'info');
  }

  // === NAVIGATION HELPERS ===

  navigateToSection(sectionId) {
    if (this.modules.navigation && this.modules.navigation.navigateToSection) {
      this.modules.navigation.navigateToSection(sectionId);
    } else {
      // Fallback navigation
      const targetElement = document.getElementById(sectionId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  toggleTheme() {
    if (this.modules.themeManager && this.modules.themeManager.cycleTheme) {
      this.modules.themeManager.cycleTheme();
    } else {
      // Fallback theme toggle
      const current = localStorage.getItem('portfolio-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      localStorage.setItem('portfolio-theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }
  }

  handleEscapeKey() {
    // Close any open modals or menus
    if (this.modules.navigation && this.modules.navigation.closeNavigation) {
      this.modules.navigation.closeNavigation();
    }
    
    // Emit escape event for other components
    this.emit('app:escape');
  }

  // === PERFORMANCE MONITORING ===

  initPerformanceMonitoring() {
    // Core Web Vitals
    this.measureWebVitals();
    
    // Resource loading metrics
    this.measureResourceMetrics();
  }

  measureWebVitals() {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.performance.metrics.set('FCP', entry.startTime);
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.performance.metrics.set('LCP', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  measureResourceMetrics() {
    // Measure component load times
    this.performance.componentLoadStart = performance.now();
  }

  calculateLoadMetrics() {
    const loadTime = performance.now() - this.performance.startTime;
    this.performance.metrics.set('appLoadTime', loadTime);
    
    if (this.config.debug) {
      this.log('📊 Performance Metrics:', 'info');
      console.table(Object.fromEntries(this.performance.metrics));
    }
  }

  // === PWA FEATURES ===

  async initPWAFeatures() {
    // Service Worker registration
    await this.registerServiceWorker();
    
    // Install prompt handling
    this.setupInstallPrompt();
    
    this.log('📱 PWA features initialized', 'info');
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/pwa/sw.js');
        this.log('🔄 Service Worker registered', 'info');
        
        registration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate(registration);
        });
      } catch (error) {
        this.log('Service Worker registration failed:', 'error', error);
      }
    }
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.installPrompt = e;
      this.emit('pwa:installable');
    });
  }

  // === UTILITY METHODS ===

  showLoadingIndicator() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
      loader.classList.remove('hidden');
      loader.setAttribute('aria-hidden', 'false');
    }
  }

  hideLoadingIndicator() {
    const loader = document.getElementById('loading-indicator'); 
    if (loader) {
      loader.classList.add('hidden');
      loader.setAttribute('aria-hidden', 'true');
    }
  }

  handleCriticalError(error) {
    this.log('💥 Critical error occurred:', 'error', error);
    
    // Show user-friendly error message
    this.announceToScreenReader('Application error occurred. Please refresh the page.');
    
    // Send error to monitoring service (if available)
    if (window.gtag) {
      gtag('event', 'exception', {
        description: error.message,
        fatal: true
      });
    }
  }

  // Event system
  emit(eventName, data = {}) {
    const event = new CustomEvent(eventName, { 
      detail: { ...data, timestamp: Date.now() } 
    });
    
    this.eventBus.dispatchEvent(event);
    document.dispatchEvent(event);
    
    this.log(`📡 Event emitted: ${eventName}`, 'debug', data);
  }

  on(eventName, callback) {
    this.eventBus.addEventListener(eventName, callback);
  }

  off(eventName, callback) {
    this.eventBus.removeEventListener(eventName, callback);
  }

  // Logging system
  log(message, level = 'info', data = null) {
    if (!this.config.debug && level === 'debug') return;
    
    const timestamp = new Date().toISOString();
    const logLevels = {
      error: '❌',
      warn: '⚠️', 
      info: 'ℹ️',
      success: '✅',
      debug: '🐛'
    };
    
    const prefix = `${logLevels[level]} [${timestamp}] Portfolio OS:`;
    
    if (data) {
      console[level === 'error' ? 'error' : 'log'](prefix, message, data);
    } else {
      console[level === 'error' ? 'error' : 'log'](prefix, message);
    }
  }

  // Public API
  getConfig() {
    return { ...this.config };
  }

  getMetrics() {
    return Object.fromEntries(this.performance.metrics);
  }

  getModules() {
    return { ...this.modules };
  }

  isReady() {
    return this.isInitialized;
  }

  async reload() {
    this.log('🔄 Portfolio OS yeniden başlatılıyor...', 'info');
    
    // Cleanup current modules
    Object.values(this.modules).forEach(module => {
      if (module && typeof module.destroy === 'function') {
        module.destroy();
      }
    });
    
    this.modules = {};
    this.isInitialized = false;
    
    // Restart
    await this.bootstrap();
  }

  async loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async waitForGlobal(globalName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkGlobal = () => {
        if (window[globalName]) {
          resolve(window[globalName]);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Global ${globalName} not found within ${timeout}ms`));
        } else {
          setTimeout(checkGlobal, 100);
        }
      };
      
      checkGlobal();
    });
  }
}

// Initialize app
const app = new PortfolioApp();

// Debug mode
if (window.location.search.includes('debug=true')) {
  app.config.debug = true;
  window.portfolioApp = app;
  app.log('🐛 Debug mode enabled', 'debug');
}

// Global error handling
window.addEventListener('error', (event) => {
  app.log('Unhandled error:', 'error', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  app.log('Unhandled promise rejection:', 'error', event.reason);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PortfolioApp;
} 