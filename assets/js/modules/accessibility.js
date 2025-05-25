/**
 * Portfolio OS - Accessibility Module
 * Apple Design Language V5
 * Comprehensive accessibility features including keyboard navigation, screen reader support, and WCAG compliance
 */

class AccessibilityManager {
  constructor(options = {}) {
    this.options = {
      enableKeyboardNavigation: true,
      enableScreenReaderSupport: true,
      enableFocusManagement: true,
      enableReducedMotion: true,
      enableHighContrast: true,
      enableVoiceAnnouncements: true,
      enableSkipLinks: true,
      debugMode: false,
      ...options
    };

    this.isInitialized = false;
    this.currentFocus = null;
    this.focusHistory = [];
    this.skipLinks = [];
    this.ariaLiveRegions = [];
    this.keyboardShortcuts = new Map();
    this.preferredSettings = {};
    
    this.init();
  }

  /**
   * Initialize accessibility features
   */
  async init() {
    try {
      await this.loadUserPreferences();
      this.setupAccessibilityFeatures();
      this.createSkipLinks();
      this.setupKeyboardNavigation();
      this.setupFocusManagement();
      this.setupScreenReaderSupport();
      this.setupReducedMotionSupport();
      this.setupHighContrastSupport();
      this.setupAriaLiveRegions();
      this.bindEvents();
      
      this.isInitialized = true;
      this.log('Accessibility Manager initialized successfully');
      
      this.announceToScreenReader('Accessibility features have been initialized');
      
    } catch (error) {
      this.log('Failed to initialize Accessibility Manager:', error);
    }
  }

  /**
   * Load user accessibility preferences
   */
  async loadUserPreferences() {
    try {
      // Load from localStorage
      const saved = localStorage.getItem('accessibility-preferences');
      if (saved) {
        this.preferredSettings = JSON.parse(saved);
      }

      // Apply system preferences
      this.detectSystemPreferences();
      
      // Apply saved preferences
      this.applyUserPreferences();
      
    } catch (error) {
      this.log('Failed to load user preferences:', error);
    }
  }

  /**
   * Detect system accessibility preferences
   */
  detectSystemPreferences() {
    // Reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.preferredSettings.reducedMotion = true;
    }

    // High contrast preference
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.preferredSettings.highContrast = true;
    }

    // Color scheme preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.preferredSettings.darkMode = true;
    }

    // Forced colors mode
    if (window.matchMedia('(forced-colors: active)').matches) {
      this.preferredSettings.forcedColors = true;
    }
  }

  /**
   * Apply user accessibility preferences
   */
  applyUserPreferences() {
    const body = document.body;

    if (this.preferredSettings.reducedMotion) {
      body.classList.add('reduced-motion');
    }

    if (this.preferredSettings.highContrast) {
      body.classList.add('high-contrast');
    }

    if (this.preferredSettings.largeFonts) {
      body.classList.add('large-fonts');
    }

    if (this.preferredSettings.focusIndicators) {
      body.classList.add('enhanced-focus');
    }
  }

  /**
   * Setup core accessibility features
   */
  setupAccessibilityFeatures() {
    // Add accessibility controls to page
    this.createAccessibilityPanel();
    
    // Setup focus indicators
    this.setupFocusIndicators();
    
    // Setup heading navigation
    this.setupHeadingNavigation();
    
    // Setup landmark navigation
    this.setupLandmarkNavigation();
  }

  /**
   * Create accessibility control panel
   */
  createAccessibilityPanel() {
    if (document.getElementById('accessibility-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'accessibility-panel';
    panel.className = 'accessibility-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'accessibility-panel-title');
    panel.setAttribute('aria-hidden', 'true');

    panel.innerHTML = `
      <div class="accessibility-panel__backdrop"></div>
      <div class="accessibility-panel__content">
        <div class="accessibility-panel__header">
          <h2 id="accessibility-panel-title">Accessibility Settings</h2>
          <button class="accessibility-panel__close" aria-label="Close accessibility settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="accessibility-panel__body">
          <div class="accessibility-option">
            <label class="accessibility-option__label">
              <input type="checkbox" id="reduced-motion-toggle" ${this.preferredSettings.reducedMotion ? 'checked' : ''}>
              <span class="accessibility-option__text">Reduce motion</span>
              <span class="accessibility-option__description">Minimize animations and transitions</span>
            </label>
          </div>

          <div class="accessibility-option">
            <label class="accessibility-option__label">
              <input type="checkbox" id="high-contrast-toggle" ${this.preferredSettings.highContrast ? 'checked' : ''}>
              <span class="accessibility-option__text">High contrast</span>
              <span class="accessibility-option__description">Increase contrast for better visibility</span>
            </label>
          </div>

          <div class="accessibility-option">
            <label class="accessibility-option__label">
              <input type="checkbox" id="large-fonts-toggle" ${this.preferredSettings.largeFonts ? 'checked' : ''}>
              <span class="accessibility-option__text">Large fonts</span>
              <span class="accessibility-option__description">Increase font size for better readability</span>
            </label>
          </div>

          <div class="accessibility-option">
            <label class="accessibility-option__label">
              <input type="checkbox" id="focus-indicators-toggle" ${this.preferredSettings.focusIndicators ? 'checked' : ''}>
              <span class="accessibility-option__text">Enhanced focus indicators</span>
              <span class="accessibility-option__description">Show clearer focus outlines</span>
            </label>
          </div>

          <div class="accessibility-option">
            <label class="accessibility-option__label">
              <input type="checkbox" id="voice-announcements-toggle" ${this.preferredSettings.voiceAnnouncements ? 'checked' : ''}>
              <span class="accessibility-option__text">Voice announcements</span>
              <span class="accessibility-option__description">Enable screen reader announcements</span>
            </label>
          </div>
        </div>

        <div class="accessibility-panel__footer">
          <button class="accessibility-panel__reset" type="button">Reset to defaults</button>
          <button class="accessibility-panel__save" type="button">Save preferences</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    
    // Bind panel events
    this.bindPanelEvents(panel);
  }

  /**
   * Bind accessibility panel events
   */
  bindPanelEvents(panel) {
    const closeBtn = panel.querySelector('.accessibility-panel__close');
    const backdrop = panel.querySelector('.accessibility-panel__backdrop');
    const resetBtn = panel.querySelector('.accessibility-panel__reset');
    const saveBtn = panel.querySelector('.accessibility-panel__save');
    const toggles = panel.querySelectorAll('input[type="checkbox"]');

    closeBtn.addEventListener('click', () => this.closeAccessibilityPanel());
    backdrop.addEventListener('click', () => this.closeAccessibilityPanel());
    resetBtn.addEventListener('click', () => this.resetAccessibilitySettings());
    saveBtn.addEventListener('click', () => this.saveAccessibilitySettings());

    toggles.forEach(toggle => {
      toggle.addEventListener('change', (e) => this.handleSettingToggle(e));
    });

    // Keyboard navigation within panel
    panel.addEventListener('keydown', (e) => this.handlePanelKeydown(e));
  }

  /**
   * Handle accessibility setting toggles
   */
  handleSettingToggle(event) {
    const toggle = event.target;
    const setting = toggle.id.replace('-toggle', '').replace('-', '');
    const isEnabled = toggle.checked;

    this.preferredSettings[setting] = isEnabled;
    
    // Apply setting immediately
    switch (setting) {
      case 'reducedmotion':
        document.body.classList.toggle('reduced-motion', isEnabled);
        break;
      case 'highcontrast':
        document.body.classList.toggle('high-contrast', isEnabled);
        break;
      case 'largefonts':
        document.body.classList.toggle('large-fonts', isEnabled);
        break;
      case 'focusindicators':
        document.body.classList.toggle('enhanced-focus', isEnabled);
        break;
      case 'voiceannouncements':
        this.options.enableVoiceAnnouncements = isEnabled;
        break;
    }

    this.announceToScreenReader(`${toggle.nextElementSibling.textContent} ${isEnabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Create skip links for keyboard navigation
   */
  createSkipLinks() {
    if (!this.options.enableSkipLinks) return;

    const skipLinksContainer = document.createElement('div');
    skipLinksContainer.className = 'skip-links';
    skipLinksContainer.setAttribute('role', 'navigation');
    skipLinksContainer.setAttribute('aria-label', 'Skip links');

    // Common skip link targets
    const targets = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#navigation', text: 'Skip to navigation' },
      { href: '#footer', text: 'Skip to footer' },
      { href: '#accessibility-panel', text: 'Open accessibility settings' }
    ];

    targets.forEach(target => {
      const link = document.createElement('a');
      link.href = target.href;
      link.className = 'skip-link';
      link.textContent = target.text;
      
      if (target.href === '#accessibility-panel') {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          this.openAccessibilityPanel();
        });
      }
      
      skipLinksContainer.appendChild(link);
    });

    document.body.insertBefore(skipLinksContainer, document.body.firstChild);
  }

  /**
   * Setup keyboard navigation system
   */
  setupKeyboardNavigation() {
    if (!this.options.enableKeyboardNavigation) return;

    // Register keyboard shortcuts
    this.registerKeyboardShortcuts();
    
    // Setup roving tabindex for complex widgets
    this.setupRovingTabindex();
    
    // Setup arrow key navigation
    this.setupArrowKeyNavigation();
  }

  /**
   * Register global keyboard shortcuts
   */
  registerKeyboardShortcuts() {
    const shortcuts = [
      { keys: ['Alt', 'a'], action: () => this.openAccessibilityPanel(), description: 'Open accessibility settings' },
      { keys: ['Alt', 'h'], action: () => this.navigateToHeading('next'), description: 'Next heading' },
      { keys: ['Alt', 'Shift', 'h'], action: () => this.navigateToHeading('previous'), description: 'Previous heading' },
      { keys: ['Alt', 'l'], action: () => this.navigateToLandmark('next'), description: 'Next landmark' },
      { keys: ['Alt', 'Shift', 'l'], action: () => this.navigateToLandmark('previous'), description: 'Previous landmark' },
      { keys: ['Alt', 'm'], action: () => this.focusMainContent(), description: 'Focus main content' },
      { keys: ['Alt', 'n'], action: () => this.focusNavigation(), description: 'Focus navigation' }
    ];

    shortcuts.forEach(shortcut => {
      this.keyboardShortcuts.set(shortcut.keys.join('+'), shortcut);
    });
  }

  /**
   * Setup roving tabindex for widget groups
   */
  setupRovingTabindex() {
    const widgets = document.querySelectorAll('[role="toolbar"], [role="menubar"], [role="tablist"]');
    
    widgets.forEach(widget => {
      const items = widget.querySelectorAll('[role="button"], [role="menuitem"], [role="tab"]');
      
      if (items.length === 0) return;
      
      // Set initial tabindex
      items.forEach((item, index) => {
        item.setAttribute('tabindex', index === 0 ? '0' : '-1');
      });
      
      // Handle arrow key navigation
      widget.addEventListener('keydown', (e) => {
        this.handleWidgetNavigation(e, items);
      });
    });
  }

  /**
   * Handle navigation within widgets
   */
  handleWidgetNavigation(event, items) {
    const { key } = event;
    const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex;
    
    switch (key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
    }
    
    if (nextIndex !== currentIndex) {
      items[currentIndex].setAttribute('tabindex', '-1');
      items[nextIndex].setAttribute('tabindex', '0');
      items[nextIndex].focus();
    }
  }

  /**
   * Setup arrow key navigation for grids and lists
   */
  setupArrowKeyNavigation() {
    const grids = document.querySelectorAll('[role="grid"]');
    const lists = document.querySelectorAll('[role="listbox"]');
    
    [...grids, ...lists].forEach(container => {
      container.addEventListener('keydown', (e) => {
        this.handleContainerNavigation(e, container);
      });
    });
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    if (!this.options.enableFocusManagement) return;

    // Track focus changes
    document.addEventListener('focusin', (e) => {
      this.handleFocusChange(e.target);
    });

    // Handle focus trapping for modals
    this.setupFocusTrapping();
    
    // Handle focus restoration
    this.setupFocusRestoration();
  }

  /**
   * Handle focus changes
   */
  handleFocusChange(element) {
    if (this.currentFocus !== element) {
      this.focusHistory.push(this.currentFocus);
      this.currentFocus = element;
      
      // Announce focus changes to screen readers if needed
      this.announceFocusChange(element);
    }
  }

  /**
   * Setup focus trapping for modal dialogs
   */
  setupFocusTrapping() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"]:not([aria-hidden="true"])');
        if (modal) {
          this.trapFocusInModal(e, modal);
        }
      }
    });
  }

  /**
   * Trap focus within modal
   */
  trapFocusInModal(event, modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Setup screen reader support
   */
  setupScreenReaderSupport() {
    if (!this.options.enableScreenReaderSupport) return;

    // Create live regions
    this.createAriaLiveRegions();
    
    // Setup descriptive text
    this.setupDescriptiveText();
    
    // Setup status announcements
    this.setupStatusAnnouncements();
  }

  /**
   * Create ARIA live regions for announcements
   */
  createAriaLiveRegions() {
    const regions = [
      { id: 'polite-announcements', priority: 'polite' },
      { id: 'assertive-announcements', priority: 'assertive' },
      { id: 'status-announcements', priority: 'polite', role: 'status' }
    ];

    regions.forEach(region => {
      if (document.getElementById(region.id)) return;

      const liveRegion = document.createElement('div');
      liveRegion.id = region.id;
      liveRegion.setAttribute('aria-live', region.priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      
      if (region.role) {
        liveRegion.setAttribute('role', region.role);
      }
      
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
      
      this.ariaLiveRegions.push(liveRegion);
    });
  }

  /**
   * Announce message to screen readers
   */
  announceToScreenReader(message, priority = 'polite') {
    if (!this.options.enableVoiceAnnouncements) return;

    const regionId = priority === 'assertive' ? 'assertive-announcements' : 'polite-announcements';
    const region = document.getElementById(regionId);
    
    if (region) {
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  /**
   * Setup focus indicators
   */
  setupFocusIndicators() {
    // Enhanced focus styles are handled via CSS
    // This method can add additional focus behavior
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('using-keyboard');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('using-keyboard');
    });
  }

  /**
   * Setup heading navigation
   */
  setupHeadingNavigation() {
    this.headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    this.currentHeadingIndex = -1;
  }

  /**
   * Navigate to next/previous heading
   */
  navigateToHeading(direction) {
    if (this.headings.length === 0) return;

    if (direction === 'next') {
      this.currentHeadingIndex = Math.min(this.currentHeadingIndex + 1, this.headings.length - 1);
    } else {
      this.currentHeadingIndex = Math.max(this.currentHeadingIndex - 1, 0);
    }

    const heading = this.headings[this.currentHeadingIndex];
    if (heading) {
      heading.focus();
      heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.announceToScreenReader(`Heading level ${heading.tagName.charAt(1)}: ${heading.textContent}`);
    }
  }

  /**
   * Setup landmark navigation
   */
  setupLandmarkNavigation() {
    this.landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], [role="complementary"], [role="region"]');
    this.currentLandmarkIndex = -1;
  }

  /**
   * Navigate to next/previous landmark
   */
  navigateToLandmark(direction) {
    if (this.landmarks.length === 0) return;

    if (direction === 'next') {
      this.currentLandmarkIndex = Math.min(this.currentLandmarkIndex + 1, this.landmarks.length - 1);
    } else {
      this.currentLandmarkIndex = Math.max(this.currentLandmarkIndex - 1, 0);
    }

    const landmark = this.landmarks[this.currentLandmarkIndex];
    if (landmark) {
      landmark.focus();
      landmark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      const role = landmark.getAttribute('role');
      const label = landmark.getAttribute('aria-label') || landmark.getAttribute('aria-labelledby');
      this.announceToScreenReader(`${role} landmark${label ? ': ' + label : ''}`);
    }
  }

  /**
   * Focus main content area
   */
  focusMainContent() {
    const main = document.querySelector('main, [role="main"]');
    if (main) {
      main.focus();
      this.announceToScreenReader('Main content');
    }
  }

  /**
   * Focus navigation area
   */
  focusNavigation() {
    const nav = document.querySelector('nav, [role="navigation"]');
    if (nav) {
      nav.focus();
      this.announceToScreenReader('Navigation');
    }
  }

  /**
   * Bind global event listeners
   */
  bindEvents() {
    // Global keyboard event handler
    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
    
    // Media query change listeners
    this.setupMediaQueryListeners();
    
    // Page visibility changes
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
  }

  /**
   * Handle global keyboard events
   */
  handleGlobalKeydown(event) {
    const keys = [];
    
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');
    if (event.metaKey) keys.push('Meta');
    
    keys.push(event.key);
    
    const shortcutKey = keys.join('+');
    const shortcut = this.keyboardShortcuts.get(shortcutKey);
    
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }

  /**
   * Setup media query listeners for preference changes
   */
  setupMediaQueryListeners() {
    // Reduced motion
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addListener((e) => {
      if (e.matches) {
        this.preferredSettings.reducedMotion = true;
        document.body.classList.add('reduced-motion');
      }
    });

    // High contrast
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    highContrastQuery.addListener((e) => {
      if (e.matches) {
        this.preferredSettings.highContrast = true;
        document.body.classList.add('high-contrast');
      }
    });
  }

  /**
   * Open accessibility panel
   */
  openAccessibilityPanel() {
    const panel = document.getElementById('accessibility-panel');
    if (panel) {
      panel.setAttribute('aria-hidden', 'false');
      panel.classList.add('accessibility-panel--open');
      
      // Focus first interactive element
      const firstInput = panel.querySelector('input, button');
      if (firstInput) {
        firstInput.focus();
      }
      
      this.announceToScreenReader('Accessibility settings panel opened');
    }
  }

  /**
   * Close accessibility panel
   */
  closeAccessibilityPanel() {
    const panel = document.getElementById('accessibility-panel');
    if (panel) {
      panel.setAttribute('aria-hidden', 'true');
      panel.classList.remove('accessibility-panel--open');
      
      this.announceToScreenReader('Accessibility settings panel closed');
    }
  }

  /**
   * Save accessibility settings
   */
  saveAccessibilitySettings() {
    try {
      localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferredSettings));
      this.announceToScreenReader('Accessibility preferences saved');
    } catch (error) {
      this.log('Failed to save accessibility settings:', error);
      this.announceToScreenReader('Failed to save preferences');
    }
  }

  /**
   * Reset accessibility settings to defaults
   */
  resetAccessibilitySettings() {
    this.preferredSettings = {};
    
    // Remove all accessibility classes
    document.body.classList.remove('reduced-motion', 'high-contrast', 'large-fonts', 'enhanced-focus');
    
    // Reset panel toggles
    const panel = document.getElementById('accessibility-panel');
    if (panel) {
      panel.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
      });
    }
    
    this.announceToScreenReader('Accessibility settings reset to defaults');
  }

  /**
   * Handle panel keyboard navigation
   */
  handlePanelKeydown(event) {
    if (event.key === 'Escape') {
      this.closeAccessibilityPanel();
    }
  }

  /**
   * Handle visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      this.announceToScreenReader('Page hidden');
    } else {
      this.announceToScreenReader('Page visible');
    }
  }

  /**
   * Announce focus changes
   */
  announceFocusChange(element) {
    if (!this.options.enableVoiceAnnouncements) return;

    const role = element.getAttribute('role');
    const label = element.getAttribute('aria-label') || element.textContent?.slice(0, 50);
    
    if (role && label) {
      this.announceToScreenReader(`${role}: ${label}`);
    }
  }

  /**
   * Setup descriptive text for complex elements
   */
  setupDescriptiveText() {
    // Add descriptions to interactive elements without labels
    const elements = document.querySelectorAll('button, input, select, textarea');
    
    elements.forEach(element => {
      if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
        const placeholder = element.getAttribute('placeholder');
        const title = element.getAttribute('title');
        
        if (placeholder) {
          element.setAttribute('aria-label', placeholder);
        } else if (title) {
          element.setAttribute('aria-label', title);
        }
      }
    });
  }

  /**
   * Setup status announcements
   */
  setupStatusAnnouncements() {
    // Monitor form validation
    document.addEventListener('invalid', (e) => {
      const message = e.target.validationMessage || 'Invalid input';
      this.announceToScreenReader(message, 'assertive');
    });

    // Monitor loading states
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-busy') {
          const element = mutation.target;
          const isBusy = element.getAttribute('aria-busy') === 'true';
          
          if (isBusy) {
            this.announceToScreenReader('Loading');
          } else {
            this.announceToScreenReader('Loading complete');
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['aria-busy']
    });
  }

  /**
   * Get accessibility status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      preferredSettings: this.preferredSettings,
      focusHistory: this.focusHistory.length,
      keyboardShortcuts: this.keyboardShortcuts.size
    };
  }

  /**
   * Log messages with context
   */
  log(message, ...args) {
    if (this.options.debugMode) {
      console.log(`[Accessibility] ${message}`, ...args);
    }
  }

  /**
   * Destroy accessibility manager
   */
  destroy() {
    // Remove event listeners
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    document.removeEventListener('focusin', this.handleFocusChange);
    
    // Remove accessibility panel
    const panel = document.getElementById('accessibility-panel');
    if (panel) {
      panel.remove();
    }
    
    // Remove skip links
    const skipLinks = document.querySelector('.skip-links');
    if (skipLinks) {
      skipLinks.remove();
    }
    
    // Remove ARIA live regions
    this.ariaLiveRegions.forEach(region => region.remove());
    
    this.isInitialized = false;
    this.log('Accessibility Manager destroyed');
  }
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
  });
} else {
  window.accessibilityManager = new AccessibilityManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityManager;
}

export default AccessibilityManager; 