/**
 * Theme Manager - Portfolio OS V6
 * Apple Design Language V6 with System Preference Detection
 */

class ThemeManager {
  constructor() {
    this.themes = ['light', 'dark', 'auto'];
    this.currentTheme = this.getStoredTheme() || 'auto';
    this.systemTheme = this.getSystemTheme();
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    this.themeToggle = document.getElementById('themeToggle');
    this.themeIcon = document.querySelector('.theme-icon');
    this.themeAnnouncement = document.getElementById('theme-announcement');
    
    this.init();
  }

  init() {
    // Apply initial theme
    this.applyTheme(this.currentTheme);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Update UI
    this.updateThemeToggleUI();
    
    // Listen for system theme changes
    this.setupSystemThemeListener();
    
    console.log('🎨 Theme Manager initialized with theme:', this.currentTheme);
  }

  setupEventListeners() {
    // Theme toggle button
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', this.cycleTheme.bind(this));
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        this.cycleTheme();
      }
    });

    // Custom theme change events
    document.addEventListener('theme:change', this.handleThemeChangeEvent.bind(this));
  }

  setupSystemThemeListener() {
    // Listen for system theme changes
    this.mediaQuery.addListener(this.handleSystemThemeChange.bind(this));
  }

  handleSystemThemeChange(e) {
    this.systemTheme = e.matches ? 'dark' : 'light';
    
    // If current theme is auto, apply the new system theme
    if (this.currentTheme === 'auto') {
      this.applyTheme('auto');
    }
    
    console.log('🖥️ System theme changed to:', this.systemTheme);
  }

  cycleTheme() {
    const currentIndex = this.themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % this.themes.length;
    const nextTheme = this.themes[nextIndex];
    
    this.setTheme(nextTheme);
  }

  setTheme(theme) {
    if (!this.themes.includes(theme)) {
      console.warn('Invalid theme:', theme);
      return;
    }

    const previousTheme = this.currentTheme;
    this.currentTheme = theme;
    
    // Store theme preference
    this.storeTheme(theme);
    
    // Apply theme
    this.applyTheme(theme);
    
    // Update UI
    this.updateThemeToggleUI();
    
    // Announce to screen readers
    this.announceThemeChange(theme);
    
    // Emit theme change event
    this.emitThemeChangeEvent(theme, previousTheme);
    
    console.log(`🎨 Theme changed from ${previousTheme} to ${theme}`);
  }

  applyTheme(theme) {
    const root = document.documentElement;
    let appliedTheme = theme;
    
    // Resolve auto theme to actual theme
    if (theme === 'auto') {
      appliedTheme = this.getSystemTheme();
    }
    
    // Set data attribute for CSS
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-resolved-theme', appliedTheme);
    
    // Update color scheme meta tag
    this.updateColorSchemeMeta(appliedTheme);
    
    // Update theme color meta tag for PWA
    this.updateThemeColorMeta(appliedTheme);
    
    // Apply theme-specific adjustments
    this.applyThemeAdjustments(appliedTheme);
    
    // Update favicon if needed
    this.updateFavicon(appliedTheme);
    
    // Trigger CSS transitions after a small delay
    setTimeout(() => {
      root.classList.add('theme-transition');
      setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 300);
    }, 10);
  }

  applyThemeAdjustments(theme) {
    const root = document.documentElement;
    
    // Theme-specific CSS custom property adjustments
    if (theme === 'dark') {
      root.style.setProperty('--scrollbar-thumb', 'rgba(255, 255, 255, 0.3)');
      root.style.setProperty('--scrollbar-track', 'rgba(255, 255, 255, 0.1)');
    } else {
      root.style.setProperty('--scrollbar-thumb', 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--scrollbar-track', 'rgba(0, 0, 0, 0.1)');
    }
    
    // Update selection colors
    const selectionColor = theme === 'dark' ? 
      'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.3)';
    root.style.setProperty('--selection-background', selectionColor);
  }

  updateColorSchemeMeta(theme) {
    let colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
    
    if (!colorSchemeMeta) {
      colorSchemeMeta = document.createElement('meta');
      colorSchemeMeta.name = 'color-scheme';
      document.head.appendChild(colorSchemeMeta);
    }
    
    colorSchemeMeta.content = theme === 'dark' ? 'dark light' : 'light dark';
  }

  updateThemeColorMeta(theme) {
    const themeColors = {
      light: '#007AFF',
      dark: '#0A84FF'
    };
    
    // Update existing theme-color meta tags
    const themeColorMetas = document.querySelectorAll('meta[name="theme-color"]');
    
    if (themeColorMetas.length > 0) {
      themeColorMetas.forEach(meta => {
        const media = meta.getAttribute('media');
        if (media && media.includes('dark') && theme === 'dark') {
          meta.content = themeColors.dark;
        } else if ((!media || media.includes('light')) && theme === 'light') {
          meta.content = themeColors.light;
        }
      });
    } else {
      // Create theme-color meta tag if none exists
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = themeColors[theme];
      document.head.appendChild(meta);
    }
  }

  updateFavicon(theme) {
    // Optional: Switch favicon based on theme
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      const faviconPath = theme === 'dark' ? 
        './assets/images/icons/favicon-dark.ico' : 
        './assets/images/icons/favicon.ico';
      
      // Check if dark favicon exists
      const img = new Image();
      img.onload = () => {
        favicon.href = faviconPath;
      };
      img.onerror = () => {
        // Keep default favicon if dark version doesn't exist
      };
      img.src = faviconPath;
    }
  }

  updateThemeToggleUI() {
    if (!this.themeIcon) return;
    
    const icons = {
      light: '🌙',
      dark: '☀️',
      auto: '🌓'
    };
    
    const labels = {
      light: 'Koyu temaya geç',
      dark: 'Otomatik temaya geç', 
      auto: 'Açık temaya geç'
    };
    
    this.themeIcon.textContent = icons[this.currentTheme];
    
    if (this.themeToggle) {
      this.themeToggle.setAttribute('aria-label', labels[this.currentTheme]);
      this.themeToggle.title = labels[this.currentTheme];
    }
    
    // Add visual feedback
    this.addToggleAnimation();
  }

  addToggleAnimation() {
    if (!this.themeToggle) return;
    
    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) return;
    
    // Add bounce animation
    this.themeToggle.classList.add('theme-toggle-bounce');
    
    setTimeout(() => {
      this.themeToggle.classList.remove('theme-toggle-bounce');
    }, 300);
  }

  announceThemeChange(theme) {
    const messages = {
      light: 'Açık tema aktif',
      dark: 'Koyu tema aktif',
      auto: 'Otomatik tema aktif - sistem tercihine göre ayarlanıyor'
    };
    
    const message = messages[theme];
    
    if (this.themeAnnouncement) {
      this.themeAnnouncement.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        this.themeAnnouncement.textContent = '';
      }, 2000);
    }
    
    // Fallback announcement
    this.announceToScreenReader(message);
  }

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  emitThemeChangeEvent(newTheme, previousTheme) {
    const event = new CustomEvent('theme:changed', {
      detail: {
        theme: newTheme,
        previousTheme: previousTheme,
        resolvedTheme: newTheme === 'auto' ? this.getSystemTheme() : newTheme,
        timestamp: Date.now()
      }
    });
    
    document.dispatchEvent(event);
  }

  handleThemeChangeEvent(e) {
    // Handle external theme change requests
    const { theme } = e.detail;
    if (theme && this.themes.includes(theme)) {
      this.setTheme(theme);
    }
  }

  // Storage methods
  storeTheme(theme) {
    try {
      localStorage.setItem('portfolio-theme', theme);
    } catch (error) {
      console.warn('Could not store theme preference:', error);
    }
  }

  getStoredTheme() {
    try {
      return localStorage.getItem('portfolio-theme');
    } catch (error) {
      console.warn('Could not read stored theme:', error);
      return null;
    }
  }

  // System theme detection
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Theme preference detection
  detectUserPreferences() {
    const preferences = {
      colorScheme: this.getSystemTheme(),
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: window.matchMedia('(prefers-contrast: high)').matches,
      reducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)').matches
    };
    
    return preferences;
  }

  // Public API methods
  getCurrentTheme() {
    return this.currentTheme;
  }

  getResolvedTheme() {
    return this.currentTheme === 'auto' ? this.getSystemTheme() : this.currentTheme;
  }

  isAutoTheme() {
    return this.currentTheme === 'auto';
  }

  isDarkMode() {
    return this.getResolvedTheme() === 'dark';
  }

  isLightMode() {
    return this.getResolvedTheme() === 'light';
  }

  // Force theme without cycling
  forceTheme(theme) {
    if (this.themes.includes(theme)) {
      this.setTheme(theme);
      return true;
    }
    return false;
  }

  // Reset to system preference
  resetToSystem() {
    this.setTheme('auto');
  }

  // Get theme statistics for analytics
  getThemeStats() {
    return {
      currentTheme: this.currentTheme,
      resolvedTheme: this.getResolvedTheme(),
      systemTheme: this.getSystemTheme(),
      userPreferences: this.detectUserPreferences(),
      hasStoredPreference: Boolean(this.getStoredTheme())
    };
  }

  // Cleanup method
  destroy() {
    // Remove event listeners
    this.mediaQuery.removeListener(this.handleSystemThemeChange);
    document.removeEventListener('theme:change', this.handleThemeChangeEvent);
    
    // Clear stored references
    this.themeToggle = null;
    this.themeIcon = null;
    this.themeAnnouncement = null;
    
    console.log('🎨 Theme Manager destroyed');
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
  });
} else {
  window.themeManager = new ThemeManager();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
} 