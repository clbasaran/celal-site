/*
 * Portfolio OS V6 - Main Application
 * Apple Design Language V6
 */

class PortfolioApp {
  constructor() {
    this.isInitialized = false;
    this.modules = {};
    this.config = {
      debug: false,
      version: '6.0.0',
      theme: localStorage.getItem('portfolio-theme') || 'auto'
    };
    
    this.init();
  }

  async init() {
    try {
      console.log('🍎 Portfolio OS V6 Başlatılıyor...');
      
      // DOM hazır kontrolü
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.bootstrap());
      } else {
        this.bootstrap();
      }
    } catch (error) {
      console.error('Portfolio OS başlatma hatası:', error);
    }
  }

  bootstrap() {
    try {
      // Core modülleri başlat
      this.initNavigation();
      this.initThemeManager();
      this.initAnimations();
      this.initEventListeners();
      
      this.isInitialized = true;
      console.log('✅ Portfolio OS V6 başarıyla başlatıldı');
      
      // Başlatma eventi gönder
      this.emit('app:initialized');
      
    } catch (error) {
      console.error('Bootstrap hatası:', error);
    }
  }

  initNavigation() {
    // Navigasyon menü toggle
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }

    // Smooth scroll navigasyon
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          // Mobile menüyü kapat
          navMenu?.classList.remove('active');
          navToggle?.classList.remove('active');
          
          // Smooth scroll
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Active link güncelle
          this.updateActiveNavLink(link);
        }
      });
    });
  }

  initThemeManager() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle?.querySelector('.theme-icon');
    
    if (themeToggle) {
      // Tema durumunu güncelle
      this.updateThemeUI();
      
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  initAnimations() {
    // Intersection Observer ile scroll animasyonları
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Animasyonlu elementleri observe et
    const animatedElements = document.querySelectorAll(
      '.project-card, .skill-category, .section-header'
    );
    
    animatedElements.forEach(el => observer.observe(el));
  }

  initEventListeners() {
    // Scroll listener
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.handleScroll();
      }, 10);
    });

    // Resize listener
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 150);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      this.handleKeyboard(e);
    });
  }

  handleScroll() {
    const scrollY = window.scrollY;
    const navigation = document.getElementById('navigation');
    
    // Navigation backdrop effect
    if (navigation) {
      if (scrollY > 50) {
        navigation.classList.add('scrolled');
      } else {
        navigation.classList.remove('scrolled');
      }
    }

    // Update active section
    this.updateActiveSection();
  }

  handleResize() {
    // Mobile menüyü kapat resize'da
    const navMenu = document.getElementById('navMenu');
    const navToggle = document.getElementById('navToggle');
    
    if (window.innerWidth > 768) {
      navMenu?.classList.remove('active');
      navToggle?.classList.remove('active');
    }
  }

  handleKeyboard(e) {
    // ESC ile mobile menüyü kapat
    if (e.key === 'Escape') {
      const navMenu = document.getElementById('navMenu');
      const navToggle = document.getElementById('navToggle');
      
      navMenu?.classList.remove('active');
      navToggle?.classList.remove('active');
    }
  }

  updateActiveNavLink(activeLink) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
  }

  updateActiveSection() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    let currentSection = '';
    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('portfolio-theme', newTheme);
    
    this.updateThemeUI();
    this.emit('theme:changed', { theme: newTheme });
  }

  updateThemeUI() {
    const themeIcon = document.querySelector('.theme-icon');
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    
    if (themeIcon) {
      themeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }
  }

  // Event system
  emit(eventName, data = {}) {
    const event = new CustomEvent(eventName, { 
      detail: { ...data, timestamp: Date.now() } 
    });
    document.dispatchEvent(event);
  }

  on(eventName, callback) {
    document.addEventListener(eventName, callback);
  }

  // Utility methods
  scrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    // TODO: Implement toast notification system
  }

  // Performance monitoring
  getPerformanceMetrics() {
    if (window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const metrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        timestamp: Date.now()
      };
      
      if (this.config.debug) {
        console.table(metrics);
      }
      
      return metrics;
    }
    return null;
  }
}

// Global app instance
window.PortfolioApp = PortfolioApp;

// Auto-initialize when DOM is ready
const app = new PortfolioApp();

// Debug mode
if (window.location.search.includes('debug=true')) {
  app.config.debug = true;
  window.portfolioApp = app;
  console.log('🐛 Debug mode enabled');
} 