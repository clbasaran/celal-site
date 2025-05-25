/**
 * Accessibility Module - Portfolio OS V6
 * Advanced WCAG 2.1 AA Compliance Features
 */

class AccessibilityModule {
  constructor() {
    this.isActive = false;
    this.focusStack = [];
    this.announcementQueue = [];
    this.keyboardNavigation = true;
    this.screenReader = this.detectScreenReader();
    
    this.config = {
      announceDelay: 100,
      focusRingVisible: true,
      keyboardShortcuts: true,
      skipLinks: true,
      headingNavigation: true
    };
    
    this.init();
  }

  init() {
    this.setupScreenReaderDetection();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupSkipLinks();
    this.setupHeadingNavigation();
    this.setupLiveRegions();
    this.setupLandmarkNavigation();
    this.isActive = true;
    
    console.log('♿ Accessibility Module initialized');
  }

  // === SCREEN READER DETECTION ===
  
  detectScreenReader() {
    const indicators = [
      // NVDA, JAWS detection
      navigator.userAgent.includes('NVDA') || navigator.userAgent.includes('JAWS'),
      
      // Speech synthesis availability
      window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
      
      // High contrast mode
      window.matchMedia('(prefers-contrast: high)').matches,
      
      // Reduced motion preference (often indicates assistive technology)
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      
      // Touch device without pointer capability
      window.matchMedia('(hover: none) and (pointer: coarse)').matches,
      
      // Check for accessibility APIs
      window.navigator.userAgentData?.mobile === false && window.innerWidth < 1024
    ];
    
    return indicators.some(indicator => indicator);
  }

  setupScreenReaderDetection() {
    // Monitor for screen reader activity
    let srActivity = false;
    
    // Check for virtual cursor movement
    document.addEventListener('focusin', (e) => {
      if (e.target && e.target !== document.activeElement) {
        srActivity = true;
        this.screenReader = true;
        document.body.classList.add('screen-reader-active');
      }
    });
    
    // Check for ARIA usage
    const ariaElements = document.querySelectorAll('[aria-live], [aria-label], [role]');
    if (ariaElements.length > 10) {
      this.screenReader = true;
    }
  }

  // === KEYBOARD NAVIGATION ===

  setupKeyboardNavigation() {
    // Global keyboard event handler
    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
    
    // Focus visible indicators
    document.addEventListener('keydown', () => {
      document.body.classList.add('keyboard-navigation');
      this.keyboardNavigation = true;
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
      this.keyboardNavigation = false;
    });
    
    // Tab order management
    this.setupTabOrderManagement();
  }

  handleKeyboardNavigation(event) {
    const { key, ctrlKey, shiftKey, altKey } = event;
    
    if (!this.config.keyboardShortcuts) return;
    
    // Global shortcuts
    const shortcuts = {
      // Navigation shortcuts
      '1': () => this.navigateToHeading(1),
      '2': () => this.navigateToHeading(2),
      '3': () => this.navigateToHeading(3),
      'h': () => this.cycleHeadings(),
      'l': () => this.cycleLandmarks(),
      'k': () => this.cycleLinks(),
      'b': () => this.cycleButtons(),
      
      // App shortcuts
      'Home': () => this.navigateToTop(),
      'End': () => this.navigateToBottom(),
      '0': () => this.showShortcutHelp(),
      
      // Bypass shortcuts
      'Escape': () => this.handleEscapeKey(),
      'Enter': () => this.handleEnterKey(event),
      ' ': () => this.handleSpaceKey(event)
    };
    
    // Execute shortcuts with proper modifiers
    if (altKey && shortcuts[key]) {
      event.preventDefault();
      shortcuts[key]();
      this.announceAction(`Shortcut activated: Alt+${key}`);
    }
  }

  setupTabOrderManagement() {
    // Enhance tab navigation
    const focusableElements = 'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }
    });
  }

  handleTabNavigation(event) {
    const focusableElements = Array.from(document.querySelectorAll(
      'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => {
      return el.offsetWidth > 0 && el.offsetHeight > 0 && !el.closest('[hidden]');
    });
    
    const currentIndex = focusableElements.indexOf(document.activeElement);
    const isShiftTab = event.shiftKey;
    
    if (isShiftTab && currentIndex === 0) {
      // Wrap to last element
      event.preventDefault();
      focusableElements[focusableElements.length - 1].focus();
    } else if (!isShiftTab && currentIndex === focusableElements.length - 1) {
      // Wrap to first element
      event.preventDefault();
      focusableElements[0].focus();
    }
  }

  // === FOCUS MANAGEMENT ===

  setupFocusManagement() {
    // Enhanced focus indicators
    this.enhanceFocusIndicators();
    
    // Focus restoration
    this.setupFocusRestoration();
    
    // Focus trapping for modals
    this.setupFocusTrapping();
  }

  enhanceFocusIndicators() {
    // Add enhanced focus styles
    const style = document.createElement('style');
    style.textContent = `
      .accessibility-enhanced [tabindex]:focus,
      .accessibility-enhanced button:focus,
      .accessibility-enhanced a:focus,
      .accessibility-enhanced input:focus,
      .accessibility-enhanced textarea:focus,
      .accessibility-enhanced select:focus {
        outline: 3px solid var(--color-primary) !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 5px rgba(0, 122, 255, 0.3) !important;
      }
    `;
    document.head.appendChild(style);
  }

  setupFocusRestoration() {
    // Store focus before navigation
    document.addEventListener('beforeunload', () => {
      sessionStorage.setItem('lastFocusedElement', document.activeElement?.id || '');
    });
    
    // Restore focus on load
    window.addEventListener('load', () => {
      const lastFocusedId = sessionStorage.getItem('lastFocusedElement');
      if (lastFocusedId) {
        const element = document.getElementById(lastFocusedId);
        if (element) {
          setTimeout(() => element.focus(), 100);
        }
      }
    });
  }

  setupFocusTrapping() {
    // Focus trap utility for modals
    document.addEventListener('keydown', (e) => {
      const modal = document.querySelector('.modal.active, .focus-trap-active');
      if (modal && e.key === 'Tab') {
        this.trapFocus(e, modal);
      }
    });
  }

  trapFocus(event, container) {
    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    
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

  // === SKIP LINKS ===

  setupSkipLinks() {
    if (!this.config.skipLinks) return;
    
    // Create skip links if they don't exist
    this.createSkipLinks();
    
    // Handle skip link navigation
    this.handleSkipLinkNavigation();
  }

  createSkipLinks() {
    const existingSkipLinks = document.querySelector('.skip-links');
    if (existingSkipLinks) return;
    
    const skipLinks = document.createElement('nav');
    skipLinks.className = 'skip-links';
    skipLinks.setAttribute('aria-label', 'Skip links');
    
    const links = [
      { href: '#main-content', text: 'Ana içeriğe geç' },
      { href: '#navigation', text: 'Navigasyona geç' },
      { href: '#projects', text: 'Projelere geç' },
      { href: '#contact', text: 'İletişim bilgilerine geç' }
    ];
    
    links.forEach(link => {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      a.className = 'skip-link';
      skipLinks.appendChild(a);
    });
    
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  handleSkipLinkNavigation() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('skip-link')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          target.focus();
          this.announceAction(`Geçiş yapıldı: ${e.target.textContent}`);
        }
      }
    });
  }

  // === HEADING NAVIGATION ===

  setupHeadingNavigation() {
    if (!this.config.headingNavigation) return;
    
    this.headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    this.currentHeadingIndex = 0;
    
    // Add heading shortcuts
    this.addHeadingIds();
  }

  addHeadingIds() {
    this.headings.forEach((heading, index) => {
      if (!heading.id) {
        const text = heading.textContent.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-');
        heading.id = `heading-${index}-${text}`;
      }
      heading.setAttribute('tabindex', '-1');
    });
  }

  navigateToHeading(level) {
    const headings = this.headings.filter(h => 
      parseInt(h.tagName.substring(1)) === level
    );
    
    if (headings.length === 0) {
      this.announceAction(`Seviye ${level} başlık bulunamadı`);
      return;
    }
    
    const currentIndex = headings.indexOf(document.activeElement);
    const nextIndex = (currentIndex + 1) % headings.length;
    const target = headings[nextIndex];
    
    target.focus();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    this.announceAction(`Seviye ${level} başlık: ${target.textContent}`);
  }

  cycleHeadings() {
    if (this.headings.length === 0) return;
    
    this.currentHeadingIndex = (this.currentHeadingIndex + 1) % this.headings.length;
    const target = this.headings[this.currentHeadingIndex];
    
    target.focus();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    const level = target.tagName.substring(1);
    this.announceAction(`Başlık seviye ${level}: ${target.textContent}`);
  }

  // === LANDMARK NAVIGATION ===

  setupLandmarkNavigation() {
    this.landmarks = Array.from(document.querySelectorAll(
      '[role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="complementary"], nav, main, header, footer, aside'
    ));
    
    this.currentLandmarkIndex = 0;
  }

  cycleLandmarks() {
    if (this.landmarks.length === 0) return;
    
    this.currentLandmarkIndex = (this.currentLandmarkIndex + 1) % this.landmarks.length;
    const target = this.landmarks[this.currentLandmarkIndex];
    
    target.focus();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    const role = target.getAttribute('role') || target.tagName.toLowerCase();
    const label = target.getAttribute('aria-label') || role;
    this.announceAction(`Landmark: ${label}`);
  }

  // === LIVE REGIONS ===

  setupLiveRegions() {
    // Create global live regions
    this.createLiveRegions();
    
    // Monitor for dynamic content changes
    this.setupContentChangeMonitoring();
  }

  createLiveRegions() {
    // Polite announcements
    if (!document.getElementById('live-region-polite')) {
      const politeRegion = document.createElement('div');
      politeRegion.id = 'live-region-polite';
      politeRegion.setAttribute('aria-live', 'polite');
      politeRegion.setAttribute('aria-atomic', 'true');
      politeRegion.className = 'sr-only';
      document.body.appendChild(politeRegion);
    }
    
    // Assertive announcements
    if (!document.getElementById('live-region-assertive')) {
      const assertiveRegion = document.createElement('div');
      assertiveRegion.id = 'live-region-assertive';
      assertiveRegion.setAttribute('aria-live', 'assertive');
      assertiveRegion.setAttribute('aria-atomic', 'true');
      assertiveRegion.className = 'sr-only';
      document.body.appendChild(assertiveRegion);
    }
  }

  setupContentChangeMonitoring() {
    // MutationObserver for dynamic content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          this.handleDynamicContent(mutation.addedNodes);
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  handleDynamicContent(nodes) {
    nodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Announce new content to screen readers
        const text = node.textContent?.trim();
        if (text && text.length > 0 && text.length < 200) {
          this.announceAction(`Yeni içerik eklendi: ${text.substring(0, 100)}`);
        }
      }
    });
  }

  // === ANNOUNCEMENT SYSTEM ===

  announceAction(message, priority = 'polite') {
    if (!message) return;
    
    // Queue announcements to avoid overlap
    this.announcementQueue.push({ message, priority, timestamp: Date.now() });
    
    setTimeout(() => this.processAnnouncementQueue(), this.config.announceDelay);
  }

  processAnnouncementQueue() {
    if (this.announcementQueue.length === 0) return;
    
    const announcement = this.announcementQueue.shift();
    const regionId = announcement.priority === 'assertive' 
      ? 'live-region-assertive' 
      : 'live-region-polite';
    
    const region = document.getElementById(regionId);
    if (region) {
      region.textContent = announcement.message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
    
    // Continue processing queue
    if (this.announcementQueue.length > 0) {
      setTimeout(() => this.processAnnouncementQueue(), 500);
    }
  }

  // === UTILITY METHODS ===

  showShortcutHelp() {
    const shortcuts = [
      'Alt+H: Başlıklar arasında dolaş',
      'Alt+L: Landmark bölgeler arasında dolaş',
      'Alt+K: Linkler arasında dolaş',
      'Alt+B: Butonlar arasında dolaş',
      'Alt+1,2,3: Başlık seviyelerine git',
      'Alt+0: Bu yardım menüsü',
      'Escape: Çıkış/İptal'
    ];
    
    this.announceAction(`Klavye kısayolları: ${shortcuts.join('. ')}`);
  }

  navigateToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.focus();
    this.announceAction('Sayfa başına gidildi');
  }

  navigateToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    this.announceAction('Sayfa sonuna gidildi');
  }

  handleEscapeKey() {
    // Close any open modals or menus
    const modal = document.querySelector('.modal.active');
    if (modal) {
      modal.classList.remove('active');
      this.announceAction('Modal kapatıldı');
      return;
    }
    
    const menu = document.querySelector('.nav-menu.open');
    if (menu) {
      menu.classList.remove('open');
      this.announceAction('Menü kapatıldı');
      return;
    }
    
    // Return focus to body
    document.body.focus();
  }

  // === PUBLIC API ===

  enable() {
    this.isActive = true;
    document.body.classList.add('accessibility-enhanced');
    this.announceAction('Gelişmiş erişilebilirlik özellikleri etkinleştirildi');
  }

  disable() {
    this.isActive = false;
    document.body.classList.remove('accessibility-enhanced');
    this.announceAction('Gelişmiş erişilebilirlik özellikleri devre dışı bırakıldı');
  }

  toggle() {
    if (this.isActive) {
      this.disable();
    } else {
      this.enable();
    }
  }

  getStatus() {
    return {
      isActive: this.isActive,
      screenReader: this.screenReader,
      keyboardNavigation: this.keyboardNavigation,
      headingsCount: this.headings?.length || 0,
      landmarksCount: this.landmarks?.length || 0
    };
  }

  // === CLEANUP ===

  destroy() {
    this.isActive = false;
    this.announcementQueue = [];
    
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyboardNavigation);
    
    console.log('♿ Accessibility Module destroyed');
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityModule = new AccessibilityModule();
  });
} else {
  window.accessibilityModule = new AccessibilityModule();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityModule;
} 