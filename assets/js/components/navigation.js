/**
 * Navigation Component - Portfolio OS V6
 * Apple Design Language V6 with WCAG 2.1 AA Compliance
 */

class NavigationComponent {
  constructor() {
    this.nav = document.querySelector('.navigation');
    this.navToggle = document.getElementById('navToggle');
    this.navMenu = document.getElementById('navMenu');
    this.navLinks = document.querySelectorAll('.nav-link');
    this.themeToggle = document.getElementById('themeToggle');
    
    this.isMenuOpen = false;
    this.currentSection = 'home';
    this.scrollThreshold = 50;
    this.lastScrollY = window.scrollY;
    
    this.init();
  }

  init() {
    if (!this.nav) {
      console.warn('Navigation element not found');
      return;
    }

    this.setupEventListeners();
    this.setupScrollBehavior();
    this.setupKeyboardNavigation();
    this.setupActiveTracking();
    this.updateNavigationState();
    
    console.log('🧭 Navigation component initialized');
  }

  setupEventListeners() {
    // Mobile menu toggle
    if (this.navToggle && this.navMenu) {
      this.navToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
    }

    // Navigation links
    this.navLinks.forEach(link => {
      link.addEventListener('click', this.handleNavLinkClick.bind(this));
    });

    // Theme toggle
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', this.handleThemeToggle.bind(this));
    }

    // Scroll events
    window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 16));
    
    // Resize events
    window.addEventListener('resize', this.throttle(this.handleResize.bind(this), 250));

    // Click outside menu
    document.addEventListener('click', this.handleOutsideClick.bind(this));

    // Escape key to close menu
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  setupScrollBehavior() {
    // Add scrolled class based on scroll position
    this.updateScrolledState();

    // Intersection Observer for navigation items
    const observerOptions = {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0.1
    };

    this.sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.setActiveNavItem(entry.target.id);
        }
      });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section[id]').forEach(section => {
      this.sectionObserver.observe(section);
    });
  }

  setupKeyboardNavigation() {
    // Arrow key navigation in menu
    this.navMenu?.addEventListener('keydown', (e) => {
      if (!this.isMenuOpen) return;

      const focusableElements = Array.from(this.navMenu.querySelectorAll('.nav-link'));
      const currentIndex = focusableElements.indexOf(document.activeElement);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % focusableElements.length;
          focusableElements[nextIndex]?.focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
          focusableElements[prevIndex]?.focus();
          break;
        case 'Home':
          e.preventDefault();
          focusableElements[0]?.focus();
          break;
        case 'End':
          e.preventDefault();
          focusableElements[focusableElements.length - 1]?.focus();
          break;
      }
    });
  }

  setupActiveTracking() {
    // Set initial active state
    const hash = window.location.hash.slice(1);
    if (hash) {
      this.setActiveNavItem(hash);
    } else {
      this.setActiveNavItem('home');
    }
  }

  toggleMobileMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    
    // Update ARIA attributes
    this.navToggle?.setAttribute('aria-expanded', this.isMenuOpen.toString());
    
    // Toggle classes
    this.navToggle?.classList.toggle('active', this.isMenuOpen);
    this.navMenu?.classList.toggle('active', this.isMenuOpen);
    
    // Manage focus
    if (this.isMenuOpen) {
      this.trapFocus();
      // Focus first menu item
      const firstLink = this.navMenu?.querySelector('.nav-link');
      firstLink?.focus();
    } else {
      this.releaseFocus();
      this.navToggle?.focus();
    }

    // Update body scroll
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
    
    // Announce to screen readers
    this.announceToScreenReader(
      this.isMenuOpen ? 'Navigasyon menüsü açıldı' : 'Navigasyon menüsü kapandı'
    );

    console.log(`📱 Mobile menu ${this.isMenuOpen ? 'opened' : 'closed'}`);
  }

  handleNavLinkClick(e) {
    e.preventDefault();
    
    const link = e.currentTarget;
    const href = link.getAttribute('href');
    
    if (!href || !href.startsWith('#')) return;

    const targetId = href.slice(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Close mobile menu if open
      if (this.isMenuOpen) {
        this.toggleMobileMenu();
      }

      // Smooth scroll to target
      this.scrollToElement(targetElement);
      
      // Update URL hash
      history.pushState(null, null, href);
      
      // Set active nav item
      this.setActiveNavItem(targetId);
      
      // Announce navigation
      const sectionTitle = targetElement.querySelector('h1, h2, h3')?.textContent || targetId;
      this.announceToScreenReader(`${sectionTitle} bölümüne geçildi`);
    }
  }

  handleThemeToggle() {
    // Theme manager will handle the actual theme change
    // This just provides additional navigation-specific behavior
    
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    console.log(`🎨 Theme toggle clicked, current theme: ${currentTheme}`);
    
    // Add visual feedback
    this.themeToggle?.classList.add('active');
    setTimeout(() => {
      this.themeToggle?.classList.remove('active');
    }, 150);
  }

  handleScroll() {
    const currentScrollY = window.scrollY;
    
    // Update scrolled state
    this.updateScrolledState();
    
    // Hide/show navigation on scroll (optional)
    if (this.shouldHideNavOnScroll()) {
      if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
        // Scrolling down
        this.nav?.classList.add('nav-hidden');
      } else {
        // Scrolling up
        this.nav?.classList.remove('nav-hidden');
      }
    }
    
    this.lastScrollY = currentScrollY;
  }

  handleResize() {
    // Close mobile menu on resize to desktop
    if (window.innerWidth > 768 && this.isMenuOpen) {
      this.toggleMobileMenu();
    }
    
    // Update navigation state
    this.updateNavigationState();
  }

  handleOutsideClick(e) {
    // Close mobile menu when clicking outside
    if (this.isMenuOpen && 
        !this.navMenu?.contains(e.target) && 
        !this.navToggle?.contains(e.target)) {
      this.toggleMobileMenu();
    }
  }

  handleEscapeKey(e) {
    if (e.key === 'Escape' && this.isMenuOpen) {
      this.toggleMobileMenu();
    }
  }

  scrollToElement(element) {
    const headerHeight = this.nav?.offsetHeight || 0;
    const targetPosition = element.offsetTop - headerHeight - 20;
    
    // Check for reduced motion preference
    const shouldUseReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    window.scrollTo({
      top: targetPosition,
      behavior: shouldUseReducedMotion ? 'auto' : 'smooth'
    });
  }

  setActiveNavItem(sectionId) {
    if (this.currentSection === sectionId) return;
    
    this.currentSection = sectionId;
    
    // Update nav links
    this.navLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isActive = href === `#${sectionId}`;
      
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
    
    console.log(`🎯 Active section: ${sectionId}`);
  }

  updateScrolledState() {
    const isScrolled = window.scrollY > this.scrollThreshold;
    this.nav?.classList.toggle('scrolled', isScrolled);
  }

  updateNavigationState() {
    // Update navigation based on current state
    const isMobile = window.innerWidth <= 768;
    
    // Reset mobile menu state if switching to desktop
    if (!isMobile && this.isMenuOpen) {
      this.isMenuOpen = false;
      this.navToggle?.setAttribute('aria-expanded', 'false');
      this.navToggle?.classList.remove('active');
      this.navMenu?.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  shouldHideNavOnScroll() {
    // Only hide navigation on scroll for mobile devices
    return window.innerWidth <= 768;
  }

  trapFocus() {
    // Add focus trap for mobile menu
    if (this.navMenu) {
      this.previouslyFocused = document.activeElement;
      this.navMenu.setAttribute('aria-modal', 'true');
    }
  }

  releaseFocus() {
    // Release focus trap
    if (this.navMenu) {
      this.navMenu.removeAttribute('aria-modal');
      if (this.previouslyFocused) {
        this.previouslyFocused.focus();
        this.previouslyFocused = null;
      }
    }
  }

  announceToScreenReader(message) {
    // Create temporary element for screen reader announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Utility function for throttling
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Public API methods
  navigateToSection(sectionId) {
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      this.scrollToElement(targetElement);
      this.setActiveNavItem(sectionId);
    }
  }

  getActiveSection() {
    return this.currentSection;
  }

  isNavigationOpen() {
    return this.isMenuOpen;
  }

  closeNavigation() {
    if (this.isMenuOpen) {
      this.toggleMobileMenu();
    }
  }

  // Cleanup method
  destroy() {
    // Remove event listeners and observers
    if (this.sectionObserver) {
      this.sectionObserver.disconnect();
    }
    
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('click', this.handleOutsideClick);
    document.removeEventListener('keydown', this.handleEscapeKey);
    
    console.log('🧭 Navigation component destroyed');
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.navigationComponent = new NavigationComponent();
  });
} else {
  window.navigationComponent = new NavigationComponent();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NavigationComponent;
} 