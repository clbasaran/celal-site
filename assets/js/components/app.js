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
      await this.initThemeManager();
      await this.initNavigationSystem(); 
      await this.initAccessibilityManager();
      await this.initAnimationSystem();
      await this.initInteractionHandlers();
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
    
    // Tab trapping for modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }
    });
  }

  handleKeyboardNavigation(event) {
    const { key, ctrlKey, altKey, shiftKey } = event;
    
    // Global keyboard shortcuts
    const shortcuts = {
      'Escape': () => this.handleEscapeKey(),
      'h': () => ctrlKey && this.navigateToSection('home'),
      'p': () => ctrlKey && this.navigateToSection('projects'),
      's': () => ctrlKey && this.navigateToSection('skills'), 
      'c': () => ctrlKey && this.navigateToSection('contact'),
      't': () => ctrlKey && this.toggleTheme(),
      '/': () => this.focusSearch(),
      '?': () => this.showKeyboardShortcuts()
    };
    
    const handler = shortcuts[key];
    if (handler) {
      event.preventDefault();
      handler();
      this.announceToScreenReader(`Keyboard shortcut activated: ${key}`);
    }
  }

  handleTabNavigation(event) {
    const focusableElements = this.getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault(); 
      firstElement.focus();
    }
  }

  getFocusableElements() {
    return Array.from(document.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  setupFocusManagement() {
    // Focus visible handling
    document.addEventListener('keydown', () => {
      document.body.classList.add('keyboard-navigation');
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
    
    // Focus stack for modal management
    this.accessibility.focusStack = [];
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

  // === THEME MANAGEMENT ===

  async initThemeManager() {
    const savedTheme = localStorage.getItem('portfolio-theme');
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    this.config.theme = savedTheme || systemPreference;
    this.applyTheme(this.config.theme);
    
    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
      this.updateThemeToggleButton();
    }
    
    // System theme change listener
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (this.config.theme === 'auto') {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
    
    this.log('🎨 Theme manager initialized', 'info');
  }

  toggleTheme() {
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.config.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    this.config.theme = nextTheme;
    localStorage.setItem('portfolio-theme', nextTheme);
    
    this.applyTheme(nextTheme);
    this.updateThemeToggleButton();
    
    this.announceToScreenReader(`Theme changed to ${nextTheme} mode`);
    this.emit('theme:changed', { theme: nextTheme });
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update meta theme-color for PWA
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      const color = theme === 'dark' ? '#000000' : '#FFFFFF';
      themeColorMeta.setAttribute('content', color);
    }
  }

  updateThemeToggleButton() {
    const themeIcon = document.querySelector('.theme-icon');
    const icons = {
      light: '🌙',
      dark: '☀️', 
      auto: '🌓'
    };
    
    if (themeIcon) {
      themeIcon.textContent = icons[this.config.theme];
    }
  }

  // === NAVIGATION SYSTEM ===

  async initNavigationSystem() {
    // Mobile navigation toggle
    this.setupMobileNavigation();
    
    // Smooth scroll navigation
    this.setupSmoothScrolling();
    
    // Active section tracking
    this.setupSectionTracking();
    
    // Breadcrumb navigation
    this.setupBreadcrumbs();
    
    this.log('🧭 Navigation system initialized', 'info');
  }

  setupMobileNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        
        navToggle.setAttribute('aria-expanded', !isExpanded);
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Focus management
        if (!isExpanded) {
          this.trapFocus(navMenu);
          navMenu.querySelector('.nav-link').focus();
        } else {
          this.releaseFocus();
        }
        
        this.announceToScreenReader(
          isExpanded ? 'Navigation menu closed' : 'Navigation menu opened'
        );
      });
    }
  }

  setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        this.navigateToSection(targetId);
      });
    });
  }

  navigateToSection(sectionId) {
    const targetElement = document.getElementById(sectionId);
    
    if (targetElement) {
      // Close mobile menu
      this.closeMobileMenu();
      
      // Smooth scroll with offset for fixed header
      const headerHeight = document.querySelector('.navigation').offsetHeight;
      const targetPosition = targetElement.offsetTop - headerHeight;
      
      window.scrollTo({
        top: targetPosition,
        behavior: this.config.reducedMotion ? 'auto' : 'smooth'
      });
      
      // Update active navigation link
      this.updateActiveNavigation(sectionId);
      
      // Announce to screen reader
      const sectionTitle = targetElement.querySelector('h1, h2, h3')?.textContent;
      this.announceToScreenReader(`Navigated to ${sectionTitle || sectionId} section`);
    }
  }

  setupSectionTracking() {
    // Intersection Observer for active section tracking
    const observerOptions = {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.updateActiveNavigation(entry.target.id);
        }
      });
    }, observerOptions);

    // Observe all sections with IDs
    document.querySelectorAll('section[id]').forEach(section => {
      observer.observe(section);
    });

    this.performance.observers.set('sectionTracking', observer);
  }

  updateActiveNavigation(activeId) {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${activeId}`;
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
  }

  closeMobileMenu() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.classList.remove('active');
      navMenu.classList.remove('active');
      this.releaseFocus();
    }
  }

  // === ANIMATION SYSTEM ===

  async initAnimationSystem() {
    if (this.config.reducedMotion) {
      this.log('⚡ Animations disabled due to reduced motion preference', 'info');
      return;
    }
    
    // Intersection Observer for scroll animations
    this.setupScrollAnimations();
    
    // Parallax effects (if motion allowed)
    this.setupParallaxEffects();
    
    this.log('🎬 Animation system initialized', 'info');
  }

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          entry.target.setAttribute('aria-hidden', 'false');
        }
      });
    }, observerOptions);

    // Observe animatable elements
    const animatableElements = document.querySelectorAll(
      '.project-card, .skill-category, .stat-item, .section-header'
    );
    
    animatableElements.forEach(el => {
      el.setAttribute('aria-hidden', 'true');
      observer.observe(el);
    });

    this.performance.observers.set('scrollAnimations', observer);
  }

  // === PERFORMANCE MONITORING ===

  initPerformanceMonitoring() {
    // Core Web Vitals
    this.measureWebVitals();
    
    // Resource loading metrics
    this.measureResourceMetrics();
    
    // User interaction metrics
    this.measureInteractionMetrics();
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

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.performance.metrics.set('FID', entry.processingStart - entry.startTime);
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
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
    
    // Offline handling
    this.setupOfflineHandling();
    
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

  // === UTILITY METHODS ===

  trapFocus(element) {
    this.accessibility.focusStack.push(document.activeElement);
    element.setAttribute('aria-modal', 'true');
    document.body.classList.add('focus-trap-active');
  }

  releaseFocus() {
    const previousFocus = this.accessibility.focusStack.pop();
    if (previousFocus) {
      previousFocus.focus();
    }
    document.body.classList.remove('focus-trap-active');
  }

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

  isAccessible() {
    return this.accessibility.screenReader || this.accessibility.keyboardNavigation;
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