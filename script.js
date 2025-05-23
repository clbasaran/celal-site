/**
 * ============================================================================
 * CELAL BAŞARAN - ADVANCED PORTFOLIO JAVASCRIPT
 * Modern ES6+ | Intersection Observer | Smooth Animations | Apple UX
 * Performance Optimized | Error Handling | Browser Compatible
 * ============================================================================
 */

// ===== ERROR HANDLING & LOGGING =====
class ErrorHandler {
  static log(error, context = 'Unknown') {
    console.error(`[${context}] Error:`, error);
    
    // Send to analytics in production
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: `${context}: ${error.message}`,
        fatal: false
      });
    }
  }
  
  static handlePromiseRejection(event) {
    ErrorHandler.log(event.reason, 'Unhandled Promise Rejection');
    event.preventDefault();
  }
  
  static handleError(event) {
    ErrorHandler.log(event.error, 'Global Error');
  }
}

// Global error handlers
window.addEventListener('unhandledrejection', ErrorHandler.handlePromiseRejection);
window.addEventListener('error', ErrorHandler.handleError);

// ===== BROWSER COMPATIBILITY & FEATURE DETECTION =====
class BrowserSupport {
  static checkSupport() {
    const features = {
      intersectionObserver: 'IntersectionObserver' in window,
      webGL: !!window.WebGLRenderingContext,
      serviceWorker: 'serviceWorker' in navigator,
      webP: false,
      modernCSS: CSS.supports('backdrop-filter', 'blur(10px)'),
      es6: (() => {
        try {
          new Function('(a = 0) => a');
          return true;
        } catch (e) {
          return false;
        }
      })()
    };
    
    // Check WebP support
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      features.webP = webP.height === 2;
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    
    return features;
  }
  
  static addPolyfills() {
    // Intersection Observer polyfill
    if (!('IntersectionObserver' in window)) {
      const script = document.createElement('script');
      script.src = 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver';
      document.head.appendChild(script);
    }
    
    // Smooth scroll polyfill for Safari
    if (!('scrollBehavior' in document.documentElement.style)) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/smoothscroll-polyfill@0.4.4/dist/smoothscroll.min.js';
      script.onload = () => window.__forceSmoothScrollPolyfill__ = true;
      document.head.appendChild(script);
    }
  }
}

// ===== PERFORMANCE MONITORING =====
class PerformanceTracker {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.init();
  }
  
  init() {
    this.measurePageLoad();
    this.setupPerformanceObserver();
    this.trackUserInteractions();
  }
  
  measurePageLoad() {
    try {
      if ('performance' in window && 'getEntriesByType' in performance) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            
            this.metrics = {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
              firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
              totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
            };
            
            this.reportMetrics();
          }, 0);
        });
      }
    } catch (error) {
      ErrorHandler.log(error, 'Performance Measurement');
    }
  }
  
  setupPerformanceObserver() {
    try {
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
        
        // Cumulative Layout Shift
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.metrics.cumulativeLayoutShift = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      }
    } catch (error) {
      ErrorHandler.log(error, 'Performance Observer');
    }
  }
  
  trackUserInteractions() {
    const interactionEvents = ['click', 'keydown', 'scroll'];
    let interactionCount = 0;
    
    interactionEvents.forEach(event => {
      document.addEventListener(event, () => {
        interactionCount++;
        this.metrics.userInteractions = interactionCount;
      }, { passive: true });
    });
  }
  
  reportMetrics() {
    console.log('📊 Performance Metrics:', this.metrics);
    
    // Send to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_performance', {
        custom_map: {
          metric1: 'load_time',
          metric2: 'fcp_time'
        },
        metric1: Math.round(this.metrics.totalLoadTime),
        metric2: Math.round(this.metrics.firstContentfulPaint)
      });
    }
  }
  
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
  }
}

// ===== CONSTANTS & CONFIGURATION =====
const CONFIG = {
  animationDuration: 1000,
  scrollOffset: 100,
  throttleDelay: 16,
  intersectionThreshold: 0.1,
  navbarHeight: 80,
  retryAttempts: 3,
  retryDelay: 1000
};

// ===== UTILITY FUNCTIONS =====
const $ = (selector) => {
  try {
    return document.querySelector(selector);
  } catch (error) {
    ErrorHandler.log(error, 'DOM Query');
    return null;
  }
};

const $$ = (selector) => {
  try {
    return document.querySelectorAll(selector);
  } catch (error) {
    ErrorHandler.log(error, 'DOM Query All');
    return [];
  }
};

const safeExecute = (fn, context = 'Unknown') => {
  try {
    return fn();
  } catch (error) {
    ErrorHandler.log(error, context);
    return null;
  }
};

const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  return (...args) => {
    const currentTime = Date.now();
    if (currentTime - lastExecTime > delay) {
      safeExecute(() => func.apply(this, args), 'Throttled Function');
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        safeExecute(() => func.apply(this, args), 'Throttled Function');
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      safeExecute(() => func.apply(this, args), 'Debounced Function');
    }, delay);
  };
};

// Retry mechanism for failed operations
const retry = async (fn, attempts = CONFIG.retryAttempts, delay = CONFIG.retryDelay) => {
  try {
    return await fn();
  } catch (error) {
    if (attempts > 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, attempts - 1, delay * 2);
    }
    throw error;
  }
};

// ===== NAVBAR FUNCTIONALITY =====
class NavbarManager {
  constructor() {
    this.navbar = $('#navbar');
    this.navLinks = $$('.navbar-link');
    this.lastScrollY = window.scrollY;
    this.isScrollingUp = false;
    this.isInitialized = false;
    
    this.init();
  }
  
  init() {
    if (!this.navbar) {
      ErrorHandler.log(new Error('Navbar element not found'), 'NavbarManager');
      return;
    }
    
    try {
      this.handleScroll();
      this.setupSmoothScrolling();
      this.updateActiveLink();
      
      window.addEventListener('scroll', throttle(() => {
        this.handleScroll();
        this.updateActiveLink();
      }, CONFIG.throttleDelay), { passive: true });
      
      this.isInitialized = true;
      console.log('✅ NavbarManager initialized');
    } catch (error) {
      ErrorHandler.log(error, 'NavbarManager Init');
    }
  }
  
  handleScroll() {
    if (!this.isInitialized) return;
    
    try {
      const currentScrollY = window.scrollY;
      this.isScrollingUp = currentScrollY < this.lastScrollY;
      
      // Auto-hide navbar on scroll down
      if (currentScrollY > CONFIG.navbarHeight) {
        if (this.isScrollingUp) {
          this.navbar.style.transform = 'translateY(0)';
          this.navbar.style.opacity = '1';
        } else {
          this.navbar.style.transform = 'translateY(-100%)';
          this.navbar.style.opacity = '0.95';
        }
      } else {
        this.navbar.style.transform = 'translateY(0)';
        this.navbar.style.opacity = '1';
      }
      
      // Navbar background opacity based on scroll
      const opacity = Math.min(currentScrollY / 200, 1);
      this.navbar.style.setProperty('--navbar-opacity', opacity);
      
      this.lastScrollY = currentScrollY;
    } catch (error) {
      ErrorHandler.log(error, 'NavbarManager Scroll');
    }
  }
  
  setupSmoothScrolling() {
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        try {
          const href = link.getAttribute('href');
          if (href && href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = $(`#${targetId}`);
            
            if (targetElement) {
              this.smoothScrollTo(targetElement);
            }
          }
        } catch (error) {
          ErrorHandler.log(error, 'Smooth Scrolling');
        }
      });
    });
  }
  
  smoothScrollTo(element) {
    try {
      const targetPosition = element.offsetTop - CONFIG.navbarHeight;
      
      if ('scrollTo' in window) {
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      } else {
        // Fallback for older browsers
        window.scrollTo(0, targetPosition);
      }
    } catch (error) {
      ErrorHandler.log(error, 'Smooth Scroll To');
    }
  }
  
  updateActiveLink() {
    try {
      const sections = $$('section[id]');
      const scrollPosition = window.scrollY + CONFIG.navbarHeight + 50;
      
      let activeSection = '';
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          activeSection = section.getAttribute('id');
        }
      });
      
      this.navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${activeSection}`) {
          link.classList.add('active');
        }
      });
    } catch (error) {
      ErrorHandler.log(error, 'Update Active Link');
    }
  }
}

// ===== INTERSECTION OBSERVER ANIMATIONS =====
class AnimationManager {
  constructor() {
    this.animatedElements = $$('.fade-in, .slide-in-left, .slide-in-right, .scale-in, .rotate-in');
    this.init();
  }
  
  init() {
    const options = {
      threshold: CONFIG.intersectionThreshold,
      rootMargin: '0px 0px -50px 0px'
    };
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, options);
    
    this.animatedElements.forEach(element => {
      this.observer.observe(element);
    });
  }
  
  animateElement(element) {
    // Add a small delay for staggered animations
    const delay = Array.from(this.animatedElements).indexOf(element) * 100;
    
    setTimeout(() => {
      element.classList.add('visible');
    }, Math.min(delay, 500));
  }
}

// ===== HERO SECTION ENHANCEMENTS =====
class HeroManager {
  constructor() {
    this.heroSection = $('#hero');
    this.heroTitle = $('.hero-title');
    this.heroScrollIndicator = $('.hero-scroll');
    
    this.init();
  }
  
  init() {
    this.setupParallaxEffect();
    this.setupScrollIndicator();
    this.setupTypewriterEffect();
  }
  
  setupParallaxEffect() {
    if (!this.heroSection) return;
    
    window.addEventListener('scroll', throttle(() => {
      const scrolled = window.scrollY;
      const rate = scrolled * -0.5;
      
      this.heroSection.style.transform = `translateY(${rate}px)`;
    }, CONFIG.throttleDelay));
  }
  
  setupScrollIndicator() {
    if (!this.heroScrollIndicator) return;
    
    this.heroScrollIndicator.addEventListener('click', () => {
      const aboutSection = $('#about');
      if (aboutSection) {
        aboutSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
    
    // Hide scroll indicator when scrolling
    window.addEventListener('scroll', throttle(() => {
      const opacity = Math.max(1 - window.scrollY / 300, 0);
      if (this.heroScrollIndicator) {
        this.heroScrollIndicator.style.opacity = opacity;
      }
    }, CONFIG.throttleDelay));
  }
  
  setupTypewriterEffect() {
    if (!this.heroTitle) return;
    
    const text = this.heroTitle.textContent;
    this.heroTitle.textContent = '';
    this.heroTitle.style.borderRight = '2px solid var(--apple-blue-400)';
    
    let i = 0;
    const typeWriter = () => {
      if (i < text.length) {
        this.heroTitle.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 50);
      } else {
        // Remove cursor after typing
        setTimeout(() => {
          this.heroTitle.style.borderRight = 'none';
        }, 1000);
      }
    };
    
    // Start typewriter effect after page load
    setTimeout(typeWriter, 500);
  }
}

// ===== CONTACT FORM HANDLING =====
class ContactFormManager {
  constructor() {
    this.form = $('#contact-form');
    this.inputs = $$('.form-input, .form-select, .form-textarea');
    this.submitButton = this.form?.querySelector('button[type="submit"]');
    
    this.init();
  }
  
  init() {
    if (!this.form) return;
    
    this.setupFormValidation();
    this.setupFormSubmission();
    this.setupInputEnhancements();
  }
  
  setupFormValidation() {
    this.inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearError(input));
    });
  }
  
  validateField(field) {
    const value = field.value.trim();
    const name = field.name;
    const errorElement = $(`#${name}-error`);
    
    let isValid = true;
    let errorMessage = '';
    
    switch (name) {
      case 'name':
        if (!value) {
          errorMessage = 'İsim gereklidir';
          isValid = false;
        } else if (value.length < 2) {
          errorMessage = 'İsim en az 2 karakter olmalıdır';
          isValid = false;
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          errorMessage = 'Email gereklidir';
          isValid = false;
        } else if (!emailRegex.test(value)) {
          errorMessage = 'Geçerli bir email adresi giriniz';
          isValid = false;
        }
        break;
        
      case 'subject':
        if (!value) {
          errorMessage = 'Konu seçiniz';
          isValid = false;
        }
        break;
        
      case 'message':
        if (!value) {
          errorMessage = 'Mesaj gereklidir';
          isValid = false;
        } else if (value.length < 10) {
          errorMessage = 'Mesaj en az 10 karakter olmalıdır';
          isValid = false;
        }
        break;
    }
    
    if (errorElement) {
      errorElement.textContent = errorMessage;
      errorElement.style.opacity = isValid ? '0' : '1';
    }
    
    field.classList.toggle('error', !isValid);
    return isValid;
  }
  
  clearError(field) {
    const errorElement = $(`#${field.name}-error`);
    if (errorElement) {
      errorElement.style.opacity = '0';
    }
    field.classList.remove('error');
  }
  
  setupFormSubmission() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Validate all fields
      let isFormValid = true;
      this.inputs.forEach(input => {
        if (!this.validateField(input)) {
          isFormValid = false;
        }
      });
      
      if (!isFormValid) {
        this.showNotification('Lütfen tüm alanları doğru doldurunuz', 'error');
        return;
      }
      
      // Show loading state
      this.setLoadingState(true);
      
      try {
        // Simulate form submission
        await this.submitForm();
        this.showNotification('Mesajınız başarıyla gönderildi! En kısa sürede dönüş yapacağım.', 'success');
        this.form.reset();
      } catch (error) {
        this.showNotification('Bir hata oluştu. Lütfen tekrar deneyiniz.', 'error');
      } finally {
        this.setLoadingState(false);
      }
    });
  }
  
  async submitForm() {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  }
  
  setLoadingState(isLoading) {
    if (!this.submitButton) return;
    
    this.submitButton.disabled = isLoading;
    this.submitButton.innerHTML = isLoading 
      ? '<span class="loading-spinner"></span> Gönderiliyor...'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Mesaj Gönder';
  }
  
  setupInputEnhancements() {
    this.inputs.forEach(input => {
      // Add floating label effect
      input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
      });
      
      input.addEventListener('blur', () => {
        if (!input.value) {
          input.parentElement.classList.remove('focused');
        }
      });
      
      // Auto-resize textarea
      if (input.tagName === 'TEXTAREA') {
        input.addEventListener('input', () => {
          input.style.height = 'auto';
          input.style.height = input.scrollHeight + 'px';
        });
      }
    });
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Close notification">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
    
    // Remove on click
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
    
    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
  }
}

// ===== THEME MANAGER =====
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'dark';
    this.init();
  }
  
  init() {
    this.applyTheme();
    this.setupThemeToggle();
  }
  
  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }
  
  setupThemeToggle() {
    const themeToggle = $('.theme-toggle');
    if (!themeToggle) return;
    
    themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });
  }
  
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', this.currentTheme);
    this.applyTheme();
  }
}

// ===== PERFORMANCE MONITORING =====
class PerformanceMonitor {
  constructor() {
    this.init();
  }
  
  init() {
    this.measurePageLoad();
    this.setupLazyLoading();
  }
  
  measurePageLoad() {
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
      
      // Update footer with build time
      const buildTimeElement = $('#build-time');
      if (buildTimeElement) {
        buildTimeElement.textContent = `Loaded in ${loadTime.toFixed(0)}ms`;
      }
    });
  }
  
  setupLazyLoading() {
    const images = $$('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }
}

// ===== EASTER EGGS & INTERACTIONS =====
class EasterEggManager {
  constructor() {
    this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    this.currentSequence = [];
    
    this.init();
  }
  
  init() {
    this.setupKonamiCode();
    this.setupClickEffects();
  }
  
  setupKonamiCode() {
    document.addEventListener('keydown', (e) => {
      this.currentSequence.push(e.code);
      
      if (this.currentSequence.length > this.konamiCode.length) {
        this.currentSequence.shift();
      }
      
      if (JSON.stringify(this.currentSequence) === JSON.stringify(this.konamiCode)) {
        this.activateEasterEgg();
        this.currentSequence = [];
      }
    });
  }
  
  activateEasterEgg() {
    // Add rainbow animation to the whole page
    document.body.classList.add('rainbow-mode');
    
    setTimeout(() => {
      document.body.classList.remove('rainbow-mode');
    }, 10000);
    
    console.log('🎉 Konami Code activated! You found the easter egg!');
  }
  
  setupClickEffects() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('.btn, .navbar-link, .card')) {
        this.createRippleEffect(e);
      }
    });
  }
  
  createRippleEffect(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(56, 139, 253, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 1000;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
}

// ===== MAIN APPLICATION =====
class PortfolioApp {
  constructor() {
    this.init();
  }
  
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
    } else {
      this.initializeComponents();
    }
  }
  
  initializeComponents() {
    try {
      // Initialize all managers
      this.navbarManager = new NavbarManager();
      this.animationManager = new AnimationManager();
      this.heroManager = new HeroManager();
      this.contactFormManager = new ContactFormManager();
      this.themeManager = new ThemeManager();
      this.performanceMonitor = new PerformanceMonitor();
      this.easterEggManager = new EasterEggManager();
      
      console.log('🚀 Portfolio app initialized successfully!');
    } catch (error) {
      console.error('❌ Error initializing portfolio app:', error);
    }
  }
}

// ===== INITIALIZE APPLICATION =====
const app = new PortfolioApp();

// ===== ADD REQUIRED CSS ANIMATIONS =====
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  @keyframes rainbow {
    0% { filter: hue-rotate(0deg); }
    100% { filter: hue-rotate(360deg); }
  }
  
  .rainbow-mode {
    animation: rainbow 2s linear infinite;
  }
  
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
    background: var(--surface-glass);
    backdrop-filter: var(--glass-backdrop);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: var(--space-4);
    box-shadow: var(--shadow-xl);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .notification.show {
    transform: translateX(0);
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }
  
  .notification-message {
    color: var(--text-primary);
    font-size: 0.875rem;
  }
  
  .notification-close {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: var(--space-1);
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
  }
  
  .notification-close:hover {
    color: var(--text-primary);
    background: var(--surface-secondary);
  }
  
  .notification-success {
    border-left: 4px solid var(--apple-green-light);
  }
  
  .notification-error {
    border-left: 4px solid var(--apple-red-light);
  }
  
  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .form-input.error,
  .form-select.error,
  .form-textarea.error {
    border-color: var(--apple-red-light);
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2);
  }
`;

document.head.appendChild(style); 