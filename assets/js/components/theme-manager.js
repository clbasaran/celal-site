/**
 * Portfolio OS V6 - Theme Manager
 * Advanced theme management with system preference detection
 */

export class ThemeManager {
    constructor() {
        this.themes = ['light', 'dark', 'auto'];
        this.currentTheme = 'auto';
        this.systemPreference = null;
        this.mediaQuery = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.toggle = this.toggle.bind(this);
        this.setTheme = this.setTheme.bind(this);
        this.handleSystemChange = this.handleSystemChange.bind(this);
    }
    
    // ===== INITIALIZATION =====
    async init() {
        try {
            // Load saved theme preference
            this.loadPreference();
            
            // Setup system preference detection
            this.setupSystemDetection();
            
            // Apply initial theme
            this.applyTheme();
            
            // Update theme toggles
            this.updateToggleButtons();
            
            console.log(`🎨 Theme Manager initialized. Current theme: ${this.getCurrentTheme()}`);
            
        } catch (error) {
            console.warn('Theme Manager initialization failed:', error);
            // Fallback to light theme
            this.setTheme('light');
        }
    }
    
    // ===== THEME MANAGEMENT =====
    toggle() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        const nextTheme = this.themes[nextIndex];
        
        this.setTheme(nextTheme);
        
        // Announce change to screen readers
        this.announceThemeChange(nextTheme);
    }
    
    setTheme(theme) {
        if (!this.themes.includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }
        
        this.currentTheme = theme;
        this.applyTheme();
        this.savePreference();
        this.updateToggleButtons();
        
        // Dispatch theme change event
        this.dispatchThemeEvent();
    }
    
    applyTheme() {
        const actualTheme = this.getCurrentTheme();
        
        // Update document attribute
        document.documentElement.setAttribute('data-theme', actualTheme);
        
        // Update CSS custom properties if needed
        this.updateCustomProperties(actualTheme);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(actualTheme);
    }
    
    getCurrentTheme() {
        if (this.currentTheme === 'auto') {
            return this.systemPreference || 'light';
        }
        return this.currentTheme;
    }
    
    // ===== SYSTEM PREFERENCE DETECTION =====
    setupSystemDetection() {
        // Create media query for dark mode preference
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Set initial system preference
        this.systemPreference = this.mediaQuery.matches ? 'dark' : 'light';
        
        // Listen for changes
        if (this.mediaQuery.addEventListener) {
            this.mediaQuery.addEventListener('change', this.handleSystemChange);
        } else {
            // Fallback for older browsers
            this.mediaQuery.addListener(this.handleSystemChange);
        }
    }
    
    handleSystemChange(event) {
        this.systemPreference = event.matches ? 'dark' : 'light';
        
        // If current theme is auto, update the applied theme
        if (this.currentTheme === 'auto') {
            this.applyTheme();
            this.updateToggleButtons();
            this.dispatchThemeEvent();
        }
    }
    
    // ===== UI UPDATES =====
    updateToggleButtons() {
        const toggleButtons = document.querySelectorAll('#themeToggle, #themeToggleNav');
        const currentTheme = this.getCurrentTheme();
        const themeIcons = {
            light: '☀️',
            dark: '🌙',
            auto: '🌓'
        };
        
        toggleButtons.forEach(button => {
            const icon = button.querySelector('.theme-icon');
            if (icon) {
                icon.textContent = themeIcons[this.currentTheme];
            }
            
            // Update aria-label
            button.setAttribute('aria-label', `Tema: ${this.getThemeLabel(this.currentTheme)}`);
        });
    }
    
    updateCustomProperties(theme) {
        const root = document.documentElement;
        
        // Additional theme-specific custom properties can be set here
        if (theme === 'dark') {
            root.style.setProperty('--scrollbar-track', '#1C1C1E');
            root.style.setProperty('--scrollbar-thumb', '#48484A');
        } else {
            root.style.setProperty('--scrollbar-track', '#F2F2F7');
            root.style.setProperty('--scrollbar-thumb', '#C7C7CC');
        }
    }
    
    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        const colors = {
            light: '#FFFFFF',
            dark: '#000000'
        };
        
        metaThemeColor.content = colors[theme] || colors.light;
    }
    
    // ===== PERSISTENCE =====
    loadPreference() {
        try {
            const saved = localStorage.getItem('portfolioOS_theme');
            if (saved && this.themes.includes(saved)) {
                this.currentTheme = saved;
            }
        } catch (error) {
            console.warn('Failed to load theme preference:', error);
        }
    }
    
    savePreference() {
        try {
            localStorage.setItem('portfolioOS_theme', this.currentTheme);
        } catch (error) {
            console.warn('Failed to save theme preference:', error);
        }
    }
    
    // ===== EVENTS =====
    dispatchThemeEvent() {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: this.currentTheme,
                actualTheme: this.getCurrentTheme(),
                systemPreference: this.systemPreference
            }
        });
        
        document.dispatchEvent(event);
    }
    
    // ===== ACCESSIBILITY =====
    announceThemeChange(theme) {
        const announcer = document.getElementById('polite-announcements');
        if (announcer) {
            const label = this.getThemeLabel(theme);
            announcer.textContent = `Tema ${label} olarak değiştirildi`;
        }
    }
    
    getThemeLabel(theme) {
        const labels = {
            light: 'açık',
            dark: 'koyu',
            auto: 'otomatik'
        };
        
        return labels[theme] || theme;
    }
    
    // ===== UTILITY METHODS =====
    getThemeInfo() {
        return {
            current: this.currentTheme,
            actual: this.getCurrentTheme(),
            system: this.systemPreference,
            available: this.themes
        };
    }
    
    // ===== CLEANUP =====
    destroy() {
        if (this.mediaQuery) {
            if (this.mediaQuery.removeEventListener) {
                this.mediaQuery.removeEventListener('change', this.handleSystemChange);
            } else {
                this.mediaQuery.removeListener(this.handleSystemChange);
            }
        }
    }
} 