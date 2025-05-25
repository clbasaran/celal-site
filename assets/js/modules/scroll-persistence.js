/**
 * Portfolio OS - Scroll Persistence Module
 * Apple Design Language V5
 * Advanced scroll position management and return-to-position functionality
 */

class ScrollPersistence {
  constructor(options = {}) {
    this.options = {
      enablePersistence: true,
      enableSmoothRestore: true,
      enableCrossDomain: false,
      storageType: 'sessionStorage', // 'sessionStorage', 'localStorage', 'memory'
      storageKey: 'portfolio-scroll-positions',
      restoreDelay: 100,
      smoothRestoreDuration: 800,
      maxPositions: 50,
      trackElements: true,
      trackModals: true,
      enableScrollMemory: true,
      scrollMemoryLimit: 10,
      enableScrollEvents: true,
      throttleDelay: 100,
      debugMode: false,
      ...options
    };

    this.scrollPositions = new Map();
    this.elementPositions = new Map();
    this.scrollHistory = [];
    this.currentUrl = window.location.href;
    this.isRestoring = false;
    this.scrollTimer = null;
    this.observers = new Map();
    this.eventListeners = new Map();
    this.lastScrollTime = 0;
    this.scrollDirection = 'down';
    this.isInitialized = false;
    
    this.init();
  }

  /**
   * Initialize scroll persistence
   */
  async init() {
    try {
      await this.loadStoredPositions();
      this.setupEventListeners();
      this.setupIntersectionObservers();
      this.setupMutationObserver();
      
      this.isInitialized = true;
      this.log('Scroll Persistence initialized successfully');
      
      // Restore scroll position after a short delay
      setTimeout(() => this.restoreScrollPosition(), this.options.restoreDelay);
      
    } catch (error) {
      this.log('Failed to initialize Scroll Persistence:', error);
    }
  }

  /**
   * Load stored scroll positions from storage
   */
  async loadStoredPositions() {
    try {
      const storage = this.getStorage();
      const stored = storage.getItem(this.options.storageKey);
      
      if (stored) {
        const data = JSON.parse(stored);
        
        // Convert array to Map for better performance
        if (Array.isArray(data.positions)) {
          data.positions.forEach(([url, position]) => {
            this.scrollPositions.set(url, position);
          });
        } else if (data.positions) {
          this.scrollPositions = new Map(Object.entries(data.positions));
        }
        
        // Load element positions
        if (data.elements) {
          this.elementPositions = new Map(Object.entries(data.elements));
        }
        
        // Load scroll history
        if (data.history) {
          this.scrollHistory = data.history.slice(-this.options.scrollMemoryLimit);
        }
      }
    } catch (error) {
      this.log('Failed to load stored positions:', error);
    }
  }

  /**
   * Get appropriate storage mechanism
   */
  getStorage() {
    switch (this.options.storageType) {
      case 'localStorage':
        return localStorage;
      case 'sessionStorage':
        return sessionStorage;
      case 'memory':
        return {
          data: new Map(),
          getItem: function(key) { return this.data.get(key); },
          setItem: function(key, value) { this.data.set(key, value); },
          removeItem: function(key) { this.data.delete(key); }
        };
      default:
        return sessionStorage;
    }
  }

  /**
   * Setup event listeners for scroll tracking
   */
  setupEventListeners() {
    // Scroll events with throttling
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this.handleScroll(), this.options.throttleDelay);
    }, { passive: true });

    // Immediate scroll tracking for critical events
    window.addEventListener('scroll', this.trackScrollDirection.bind(this), { passive: true });

    // Page navigation events
    window.addEventListener('beforeunload', () => this.saveCurrentPosition());
    window.addEventListener('pagehide', () => this.saveCurrentPosition());
    
    // History navigation
    window.addEventListener('popstate', (e) => this.handlePopState(e));
    
    // Hash changes
    window.addEventListener('hashchange', () => this.handleHashChange());
    
    // Page visibility changes
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    
    // Resize events
    window.addEventListener('resize', this.throttle(() => this.handleResize(), 200));
    
    // Focus events for form elements
    document.addEventListener('focusin', (e) => this.handleElementFocus(e));
    
    // Modal events
    document.addEventListener('modal:opened', (e) => this.handleModalOpened(e));
    document.addEventListener('modal:closed', (e) => this.handleModalClosed(e));
  }

  /**
   * Setup intersection observers for element tracking
   */
  setupIntersectionObservers() {
    if (!this.options.trackElements) return;

    // Main content observer
    const mainObserver = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    // Observe key elements
    const elementsToObserve = document.querySelectorAll(
      'section, article, .scroll-section, [data-scroll-track]'
    );

    elementsToObserve.forEach(element => {
      mainObserver.observe(element);
    });

    this.observers.set('main', mainObserver);
  }

  /**
   * Setup mutation observer for dynamic content
   */
  setupMutationObserver() {
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check for new trackable elements
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.observeNewElements(node);
            }
          });
        }
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observers.set('mutation', mutationObserver);
  }

  /**
   * Observe new elements added to the DOM
   */
  observeNewElements(element) {
    if (!this.options.trackElements) return;

    const mainObserver = this.observers.get('main');
    if (!mainObserver) return;

    // Check if element should be observed
    if (element.matches && element.matches('section, article, .scroll-section, [data-scroll-track]')) {
      mainObserver.observe(element);
    }

    // Check children
    const children = element.querySelectorAll('section, article, .scroll-section, [data-scroll-track]');
    children.forEach(child => mainObserver.observe(child));
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    if (this.isRestoring) return;

    const now = Date.now();
    this.lastScrollTime = now;

    // Save current position
    this.saveCurrentPosition();

    // Track scroll progress
    this.trackScrollProgress();

    // Emit scroll event
    if (this.options.enableScrollEvents) {
      this.emit('scroll:position', {
        x: window.scrollX,
        y: window.scrollY,
        progress: this.getScrollProgress(),
        direction: this.scrollDirection,
        timestamp: now
      });
    }
  }

  /**
   * Track scroll direction
   */
  trackScrollDirection() {
    const currentScrollY = window.scrollY;
    const lastScrollY = this.lastScrollY || 0;

    if (currentScrollY > lastScrollY) {
      this.scrollDirection = 'down';
    } else if (currentScrollY < lastScrollY) {
      this.scrollDirection = 'up';
    }

    this.lastScrollY = currentScrollY;
  }

  /**
   * Get scroll progress percentage
   */
  getScrollProgress() {
    const scrollTop = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    return documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0;
  }

  /**
   * Track scroll progress for analytics
   */
  trackScrollProgress() {
    const progress = this.getScrollProgress();
    const url = this.getCurrentUrl();
    
    // Update maximum scroll depth
    const stored = this.scrollPositions.get(url) || {};
    if (!stored.maxProgress || progress > stored.maxProgress) {
      stored.maxProgress = progress;
      this.scrollPositions.set(url, stored);
    }
  }

  /**
   * Handle intersection observer entries
   */
  handleIntersection(entries) {
    entries.forEach((entry) => {
      const element = entry.target;
      const elementId = this.getElementId(element);
      
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        // Element is prominently visible
        this.elementPositions.set(elementId, {
          url: this.getCurrentUrl(),
          timestamp: Date.now(),
          intersectionRatio: entry.intersectionRatio,
          boundingRect: entry.boundingClientRect
        });
      }
    });
  }

  /**
   * Get unique identifier for element
   */
  getElementId(element) {
    return element.id || 
           element.dataset.scrollId || 
           `${element.tagName.toLowerCase()}-${Array.from(element.parentNode.children).indexOf(element)}`;
  }

  /**
   * Save current scroll position
   */
  saveCurrentPosition() {
    const url = this.getCurrentUrl();
    const position = {
      x: window.scrollX,
      y: window.scrollY,
      timestamp: Date.now(),
      progress: this.getScrollProgress(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      document: {
        width: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight
      }
    };

    this.scrollPositions.set(url, position);
    
    // Add to history
    if (this.options.enableScrollMemory) {
      this.addToScrollHistory(url, position);
    }

    // Persist to storage
    this.persistToStorage();
  }

  /**
   * Add position to scroll history
   */
  addToScrollHistory(url, position) {
    // Remove existing entry for same URL
    this.scrollHistory = this.scrollHistory.filter(entry => entry.url !== url);
    
    // Add new entry
    this.scrollHistory.push({ url, position, timestamp: Date.now() });
    
    // Limit history size
    if (this.scrollHistory.length > this.options.scrollMemoryLimit) {
      this.scrollHistory = this.scrollHistory.slice(-this.options.scrollMemoryLimit);
    }
  }

  /**
   * Restore scroll position for current URL
   */
  restoreScrollPosition(url = null) {
    const targetUrl = url || this.getCurrentUrl();
    const stored = this.scrollPositions.get(targetUrl);
    
    if (!stored || (stored.x === 0 && stored.y === 0)) {
      // No stored position or already at top
      this.emit('scroll:restored', { url: targetUrl, position: null });
      return;
    }

    this.isRestoring = true;
    
    if (this.options.enableSmoothRestore) {
      this.smoothScrollTo(stored.x, stored.y);
    } else {
      window.scrollTo(stored.x, stored.y);
      this.isRestoring = false;
    }

    this.log(`Restored scroll position for ${targetUrl}:`, stored);
    this.emit('scroll:restored', { url: targetUrl, position: stored });
  }

  /**
   * Smooth scroll to position
   */
  smoothScrollTo(x, y) {
    const startX = window.scrollX;
    const startY = window.scrollY;
    const deltaX = x - startX;
    const deltaY = y - startY;
    const duration = this.options.smoothRestoreDuration;
    const startTime = performance.now();

    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentX = startX + (deltaX * easeOut);
      const currentY = startY + (deltaY * easeOut);
      
      window.scrollTo(currentX, currentY);
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        this.isRestoring = false;
      }
    };

    requestAnimationFrame(animateScroll);
  }

  /**
   * Handle popstate events (back/forward navigation)
   */
  handlePopState(event) {
    const newUrl = window.location.href;
    
    // Update current URL
    this.currentUrl = newUrl;
    
    // Restore position after a delay to allow content to load
    setTimeout(() => {
      this.restoreScrollPosition(newUrl);
    }, this.options.restoreDelay);
  }

  /**
   * Handle hash changes
   */
  handleHashChange() {
    const hash = window.location.hash;
    
    if (hash) {
      // Scroll to hash target if it exists
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  /**
   * Handle page visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Page is being hidden, save current position
      this.saveCurrentPosition();
    } else {
      // Page is visible again, check if we need to restore position
      this.checkScrollPosition();
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Update viewport dimensions in stored positions
    const url = this.getCurrentUrl();
    const stored = this.scrollPositions.get(url);
    
    if (stored) {
      stored.viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      this.scrollPositions.set(url, stored);
    }
  }

  /**
   * Handle element focus events
   */
  handleElementFocus(event) {
    const element = event.target;
    
    // Store focus context for form elements
    if (element.matches('input, textarea, select')) {
      const url = this.getCurrentUrl();
      const elementData = {
        id: element.id,
        name: element.name,
        type: element.type,
        value: element.value,
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY
        },
        timestamp: Date.now()
      };
      
      this.elementPositions.set(`focus-${url}`, elementData);
    }
  }

  /**
   * Handle modal opened events
   */
  handleModalOpened(event) {
    if (!this.options.trackModals) return;

    const modal = event.target;
    const modalId = modal.id || 'modal-' + Date.now();
    
    // Save scroll position before modal opens
    const position = {
      x: window.scrollX,
      y: window.scrollY,
      timestamp: Date.now()
    };
    
    this.elementPositions.set(`modal-${modalId}-backdrop`, position);
  }

  /**
   * Handle modal closed events
   */
  handleModalClosed(event) {
    if (!this.options.trackModals) return;

    const modal = event.target;
    const modalId = modal.id || 'modal-' + Date.now();
    const stored = this.elementPositions.get(`modal-${modalId}-backdrop`);
    
    if (stored) {
      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(stored.x, stored.y);
      }, 100);
      
      // Clean up
      this.elementPositions.delete(`modal-${modalId}-backdrop`);
    }
  }

  /**
   * Check and adjust scroll position if needed
   */
  checkScrollPosition() {
    const url = this.getCurrentUrl();
    const stored = this.scrollPositions.get(url);
    
    if (stored) {
      const currentY = window.scrollY;
      const storedY = stored.y;
      
      // If we're significantly off from stored position, restore it
      if (Math.abs(currentY - storedY) > 100) {
        this.restoreScrollPosition(url);
      }
    }
  }

  /**
   * Get current URL for storage key
   */
  getCurrentUrl() {
    return this.options.enableCrossDomain ? 
           window.location.href : 
           window.location.pathname + window.location.search;
  }

  /**
   * Persist data to storage
   */
  persistToStorage() {
    try {
      const storage = this.getStorage();
      const data = {
        positions: Array.from(this.scrollPositions.entries()).slice(-this.options.maxPositions),
        elements: Array.from(this.elementPositions.entries()).slice(-this.options.maxPositions),
        history: this.scrollHistory,
        timestamp: Date.now()
      };
      
      storage.setItem(this.options.storageKey, JSON.stringify(data));
    } catch (error) {
      this.log('Failed to persist scroll data:', error);
    }
  }

  /**
   * Get scroll history
   */
  getScrollHistory() {
    return [...this.scrollHistory];
  }

  /**
   * Get stored position for URL
   */
  getStoredPosition(url = null) {
    const targetUrl = url || this.getCurrentUrl();
    return this.scrollPositions.get(targetUrl) || null;
  }

  /**
   * Clear stored positions
   */
  clearStoredPositions(url = null) {
    if (url) {
      this.scrollPositions.delete(url);
    } else {
      this.scrollPositions.clear();
      this.elementPositions.clear();
      this.scrollHistory = [];
    }
    
    this.persistToStorage();
    this.emit('scroll:cleared', { url });
  }

  /**
   * Get scroll statistics
   */
  getScrollStats() {
    const positions = Array.from(this.scrollPositions.values());
    
    return {
      totalPages: this.scrollPositions.size,
      averageProgress: positions.reduce((sum, pos) => sum + (pos.progress || 0), 0) / positions.length || 0,
      maxProgress: Math.max(...positions.map(pos => pos.progress || 0)),
      historyLength: this.scrollHistory.length,
      lastActivity: Math.max(...positions.map(pos => pos.timestamp)) || 0
    };
  }

  /**
   * Event system methods
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data = {}) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.log(`Event listener error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Throttle utility function
   */
  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  /**
   * Get module status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isRestoring: this.isRestoring,
      currentUrl: this.currentUrl,
      storedPositions: this.scrollPositions.size,
      elementPositions: this.elementPositions.size,
      scrollHistory: this.scrollHistory.length,
      lastScrollTime: this.lastScrollTime,
      scrollDirection: this.scrollDirection
    };
  }

  /**
   * Log messages with context
   */
  log(message, ...args) {
    if (this.options.debugMode) {
      console.log(`[Scroll Persistence] ${message}`, ...args);
    }
  }

  /**
   * Destroy scroll persistence
   */
  destroy() {
    // Save final position
    this.saveCurrentPosition();
    
    // Clear observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Clear timers
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    
    this.isInitialized = false;
    this.log('Scroll Persistence destroyed');
  }
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.scrollPersistence = new ScrollPersistence();
  });
} else {
  window.scrollPersistence = new ScrollPersistence();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollPersistence;
}

export default ScrollPersistence; 