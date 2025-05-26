/**
 * Apple Design V6 - Main Application
 * Celal Başaran - Personal Portfolio
 * 
 * Features:
 * - Theme management (auto/light/dark)
 * - Accessibility enhancements
 * - Smooth animations
 * - WCAG 2.1 AA compliance
 */

// ================================================
// Application State
// ================================================
const AppState = {
  theme: 'auto',
  isReducedMotion: false,
  isLoaded: false
};

// ================================================
// Theme Management
// ================================================
class ThemeManager {
  constructor() {
    this.themes = ['auto', 'light', 'dark'];
    this.currentTheme = this.getStoredTheme() || 'auto';
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    this.init();
  }
  
  init() {
    this.setTheme(this.currentTheme);
    this.bindEvents();
    this.updateThemeIcon();
  }
  
  getStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (e) {
      console.warn('LocalStorage not available, using default theme');
      return null;
    }
  }
  
  setStoredTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('LocalStorage not available, theme preference not saved');
    }
  }
  
  setTheme(theme) {
    if (!this.themes.includes(theme)) {
      theme = 'auto';
    }
    
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.setStoredTheme(theme);
    this.updateThemeIcon();
    
    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor();
    
    // Announce theme change to screen readers
    this.announceThemeChange(theme);
  }
  
  toggleTheme() {
    const currentIndex = this.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    const nextTheme = this.themes[nextIndex];
    
    this.setTheme(nextTheme);
  }
  
  updateThemeIcon() {
    const themeButton = document.querySelector('[data-theme-toggle]');
    const themeIcon = themeButton?.querySelector('.theme-icon');
    
    if (themeIcon) {
      const icons = {
        auto: '🔄',
        light: '🌙',
        dark: '☀️'
      };
      
      themeIcon.textContent = icons[this.currentTheme];
      
      // Update button accessibility attributes
      themeButton.setAttribute('aria-pressed', this.currentTheme !== 'auto');
      themeButton.setAttribute('aria-label', `Tema: ${this.getThemeLabel()}`);
    }
  }
  
  getThemeLabel() {
    const labels = {
      auto: 'Otomatik',
      light: 'Açık',
      dark: 'Koyu'
    };
    return labels[this.currentTheme];
  }
  
  updateMetaThemeColor() {
    const lightColorMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: light)"]');
    const darkColorMeta = document.querySelector('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]');
    
    if (this.currentTheme === 'light') {
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#007AFF');
    } else if (this.currentTheme === 'dark') {
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0A84FF');
    }
  }
  
  announceThemeChange(theme) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Tema ${this.getThemeLabel()} olarak değiştirildi`;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
  
  bindEvents() {
    // Theme toggle button
    const themeButton = document.querySelector('[data-theme-toggle]');
    if (themeButton) {
      themeButton.addEventListener('click', () => this.toggleTheme());
      
      // Keyboard support
      themeButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleTheme();
        }
      });
    }
    
    // Listen for system theme changes
    this.mediaQuery.addListener(() => {
      if (this.currentTheme === 'auto') {
        this.updateMetaThemeColor();
      }
    });
  }
}

// ================================================
// Accessibility Manager
// ================================================
class AccessibilityManager {
  constructor() {
    this.init();
  }
  
  init() {
    this.checkReducedMotion();
    this.setupFocusManagement();
    this.setupKeyboardNavigation();
    this.addScreenReaderSupport();
  }
  
  checkReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    AppState.isReducedMotion = mediaQuery.matches;
    
    if (AppState.isReducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    }
    
    mediaQuery.addListener((e) => {
      AppState.isReducedMotion = e.matches;
      document.documentElement.classList.toggle('reduced-motion', e.matches);
    });
  }
  
  setupFocusManagement() {
    // Enhanced focus visibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }
  
  setupKeyboardNavigation() {
    // Skip link functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(skipLink.getAttribute('href'));
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }
  
  addScreenReaderSupport() {
    // Add screen reader only class styles
    if (!document.querySelector('style[data-sr-styles]')) {
      const style = document.createElement('style');
      style.setAttribute('data-sr-styles', '');
      style.textContent = `
        .sr-only {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          padding: 0 !important;
          margin: -1px !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          white-space: nowrap !important;
          border: 0 !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// ================================================
// Animation Manager
// ================================================
class AnimationManager {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupIntersectionObserver();
    this.setupProgressAnimation();
  }
  
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window && !AppState.isReducedMotion) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
      
      // Observe elements that should animate in
      document.querySelectorAll('.hero, .notice').forEach(el => {
        observer.observe(el);
      });
    }
  }
  
  setupProgressAnimation() {
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar && !AppState.isReducedMotion) {
      // Animate progress bar when it becomes visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Add smooth animation to progress fill
            progressBar.style.transition = 'width 2s ease-out';
            observer.unobserve(entry.target);
          }
        });
      });
      
      observer.observe(progressBar);
    }
  }
}

// ================================================
// Performance Manager
// ================================================
class PerformanceManager {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupPageLoadOptimization();
    this.reportWebVitals();
  }
  
  setupPageLoadOptimization() {
    // Prevent transitions during page load
    document.documentElement.classList.add('preload');
    
    window.addEventListener('load', () => {
      setTimeout(() => {
        document.documentElement.classList.remove('preload');
        AppState.isLoaded = true;
      }, 100);
    });
  }
  
  reportWebVitals() {
    // Basic performance monitoring
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          if (perfData) {
            console.log('Page Load Performance:', {
              dns: perfData.domainLookupEnd - perfData.domainLookupStart,
              tcp: perfData.connectEnd - perfData.connectStart,
              request: perfData.responseStart - perfData.requestStart,
              response: perfData.responseEnd - perfData.responseStart,
              dom: perfData.domContentLoadedEventEnd - perfData.responseEnd,
              total: perfData.loadEventEnd - perfData.navigationStart
            });
          }
        }, 0);
      });
    }
  }
}

// ================================================
// Application Initialization
// ================================================
class App {
  constructor() {
    this.themeManager = null;
    this.accessibilityManager = null;
    this.animationManager = null;
    this.performanceManager = null;
    
    this.init();
  }
  
  init() {
    // Initialize core systems
    this.performanceManager = new PerformanceManager();
    this.accessibilityManager = new AccessibilityManager();
    this.themeManager = new ThemeManager();
    this.animationManager = new AnimationManager();
    
    // Setup global event listeners
    this.setupGlobalEvents();
    
    console.log('🚀 Celal Başaran Portfolio - Apple Design V6 sistem başlatıldı');
  }
  
  setupGlobalEvents() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, pause non-essential animations
        document.documentElement.classList.add('page-hidden');
      } else {
        // Page is visible, resume animations
        document.documentElement.classList.remove('page-hidden');
      }
    });
    
    // Handle errors gracefully
    window.addEventListener('error', (e) => {
      console.error('Application error:', e.error);
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
    });
  }
}

// ================================================
// Initialize Application
// ================================================
document.addEventListener('DOMContentLoaded', () => {
  new App();
});

// Export for potential module usage
export { App, ThemeManager, AccessibilityManager, AnimationManager };
