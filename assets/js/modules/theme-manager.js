/**
 * Theme Manager Module
 * Advanced theme management with multiple theme support,
 * automatic dark/light mode detection, and smooth transitions
 * 
 * @version 2.0.0
 * @author Celal Başaran
 * @license MIT
 */

class ThemeManager {
    constructor(options = {}) {
        this.options = {
            defaultTheme: options.defaultTheme || 'auto',
            storageKey: options.storageKey || 'portfolio-theme',
            transitionDuration: options.transitionDuration || 300,
            enableSystemTheme: options.enableSystemTheme !== false,
            enableCustomThemes: options.enableCustomThemes !== false,
            enableTransitions: options.enableTransitions !== false,
            respectReducedMotion: options.respectReducedMotion !== false,
            ...options
        };

        this.currentTheme = null;
        this.systemTheme = null;
        this.isTransitioning = false;
        this.mediaQuery = null;
        this.customThemes = new Map();
        
        this.themes = {
            light: {
                name: 'Light',
                icon: '☀️',
                properties: {
                    '--background-primary': '#ffffff',
                    '--background-secondary': '#f8fafc',
                    '--background-tertiary': '#f1f5f9',
                    '--text-primary': '#1e293b',
                    '--text-secondary': '#64748b',
                    '--text-tertiary': '#94a3b8',
                    '--accent-primary': '#3b82f6',
                    '--accent-primary-rgb': '59, 130, 246',
                    '--accent-primary-hover': '#2563eb',
                    '--accent-secondary': '#8b5cf6',
                    '--accent-secondary-rgb': '139, 92, 246',
                    '--border-primary': '#e2e8f0',
                    '--border-secondary': '#cbd5e1',
                    '--shadow-primary': 'rgba(0, 0, 0, 0.1)',
                    '--shadow-secondary': 'rgba(0, 0, 0, 0.05)',
                    '--glass-bg': 'rgba(255, 255, 255, 0.8)',
                    '--glass-border': 'rgba(255, 255, 255, 0.2)',
                    '--success': '#10b981',
                    '--warning': '#f59e0b',
                    '--error': '#ef4444',
                    '--info': '#06b6d4'
                }
            },
            dark: {
                name: 'Dark',
                icon: '🌙',
                properties: {
                    '--background-primary': '#0f172a',
                    '--background-secondary': '#1e293b',
                    '--background-tertiary': '#334155',
                    '--text-primary': '#f8fafc',
                    '--text-secondary': '#cbd5e1',
                    '--text-tertiary': '#94a3b8',
                    '--accent-primary': '#60a5fa',
                    '--accent-primary-rgb': '96, 165, 250',
                    '--accent-primary-hover': '#3b82f6',
                    '--accent-secondary': '#a78bfa',
                    '--accent-secondary-rgb': '167, 139, 250',
                    '--border-primary': '#334155',
                    '--border-secondary': '#475569',
                    '--shadow-primary': 'rgba(0, 0, 0, 0.3)',
                    '--shadow-secondary': 'rgba(0, 0, 0, 0.2)',
                    '--glass-bg': 'rgba(15, 23, 42, 0.8)',
                    '--glass-border': 'rgba(255, 255, 255, 0.1)',
                    '--success': '#34d399',
                    '--warning': '#fbbf24',
                    '--error': '#f87171',
                    '--info': '#22d3ee'
                }
            },
            midnight: {
                name: 'Midnight',
                icon: '🌌',
                properties: {
                    '--background-primary': '#000000',
                    '--background-secondary': '#111111',
                    '--background-tertiary': '#1a1a1a',
                    '--text-primary': '#ffffff',
                    '--text-secondary': '#cccccc',
                    '--text-tertiary': '#888888',
                    '--accent-primary': '#00d4ff',
                    '--accent-primary-rgb': '0, 212, 255',
                    '--accent-primary-hover': '#00b8e6',
                    '--accent-secondary': '#ff6b6b',
                    '--accent-secondary-rgb': '255, 107, 107',
                    '--border-primary': '#333333',
                    '--border-secondary': '#444444',
                    '--shadow-primary': 'rgba(0, 0, 0, 0.5)',
                    '--shadow-secondary': 'rgba(0, 0, 0, 0.3)',
                    '--glass-bg': 'rgba(0, 0, 0, 0.9)',
                    '--glass-border': 'rgba(255, 255, 255, 0.05)',
                    '--success': '#4ade80',
                    '--warning': '#facc15',
                    '--error': '#f87171',
                    '--info': '#38bdf8'
                }
            },
            ocean: {
                name: 'Ocean',
                icon: '🌊',
                properties: {
                    '--background-primary': '#0c4a6e',
                    '--background-secondary': '#075985',
                    '--background-tertiary': '#0369a1',
                    '--text-primary': '#f0f9ff',
                    '--text-secondary': '#bae6fd',
                    '--text-tertiary': '#7dd3fc',
                    '--accent-primary': '#0ea5e9',
                    '--accent-primary-rgb': '14, 165, 233',
                    '--accent-primary-hover': '#0284c7',
                    '--accent-secondary': '#06b6d4',
                    '--accent-secondary-rgb': '6, 182, 212',
                    '--border-primary': '#0369a1',
                    '--border-secondary': '#0284c7',
                    '--shadow-primary': 'rgba(12, 74, 110, 0.3)',
                    '--shadow-secondary': 'rgba(12, 74, 110, 0.2)',
                    '--glass-bg': 'rgba(12, 74, 110, 0.8)',
                    '--glass-border': 'rgba(240, 249, 255, 0.1)',
                    '--success': '#10b981',
                    '--warning': '#f59e0b',
                    '--error': '#ef4444',
                    '--info': '#06b6d4'
                }
            },
            forest: {
                name: 'Forest',
                icon: '🌲',
                properties: {
                    '--background-primary': '#14532d',
                    '--background-secondary': '#166534',
                    '--background-tertiary': '#15803d',
                    '--text-primary': '#f0fdf4',
                    '--text-secondary': '#bbf7d0',
                    '--text-tertiary': '#86efac',
                    '--accent-primary': '#22c55e',
                    '--accent-primary-rgb': '34, 197, 94',
                    '--accent-primary-hover': '#16a34a',
                    '--accent-secondary': '#84cc16',
                    '--accent-secondary-rgb': '132, 204, 22',
                    '--border-primary': '#15803d',
                    '--border-secondary': '#16a34a',
                    '--shadow-primary': 'rgba(20, 83, 45, 0.3)',
                    '--shadow-secondary': 'rgba(20, 83, 45, 0.2)',
                    '--glass-bg': 'rgba(20, 83, 45, 0.8)',
                    '--glass-border': 'rgba(240, 253, 244, 0.1)',
                    '--success': '#22c55e',
                    '--warning': '#eab308',
                    '--error': '#ef4444',
                    '--info': '#06b6d4'
                }
            },
            sunset: {
                name: 'Sunset',
                icon: '🌅',
                properties: {
                    '--background-primary': '#7c2d12',
                    '--background-secondary': '#9a3412',
                    '--background-tertiary': '#c2410c',
                    '--text-primary': '#fff7ed',
                    '--text-secondary': '#fed7aa',
                    '--text-tertiary': '#fdba74',
                    '--accent-primary': '#f97316',
                    '--accent-primary-rgb': '249, 115, 22',
                    '--accent-primary-hover': '#ea580c',
                    '--accent-secondary': '#f59e0b',
                    '--accent-secondary-rgb': '245, 158, 11',
                    '--border-primary': '#c2410c',
                    '--border-secondary': '#ea580c',
                    '--shadow-primary': 'rgba(124, 45, 18, 0.3)',
                    '--shadow-secondary': 'rgba(124, 45, 18, 0.2)',
                    '--glass-bg': 'rgba(124, 45, 18, 0.8)',
                    '--glass-border': 'rgba(255, 247, 237, 0.1)',
                    '--success': '#22c55e',
                    '--warning': '#f59e0b',
                    '--error': '#ef4444',
                    '--info': '#06b6d4'
                }
            }
        };

        this.metrics = {
            themeChanges: 0,
            averageTransitionTime: 0,
            mostUsedTheme: null,
            themeUsage: new Map()
        };

        this.init();
    }

    init() {
        try {
            this.setupSystemThemeDetection();
            this.loadSavedTheme();
            this.setupEventListeners();
            this.createThemeSelector();
            
            if (this.options.enableTransitions) {
                this.setupTransitions();
            }
            
            this.dispatchEvent('themeManager:initialized', {
                currentTheme: this.currentTheme,
                availableThemes: Object.keys(this.themes)
            });
            
            console.log(`Theme Manager initialized with theme: ${this.currentTheme}`);
        } catch (error) {
            console.error('Theme Manager initialization failed:', error);
        }
    }

    setupSystemThemeDetection() {
        if (!this.options.enableSystemTheme) return;
        
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.systemTheme = this.mediaQuery.matches ? 'dark' : 'light';
        
        this.mediaQuery.addEventListener('change', (e) => {
            this.systemTheme = e.matches ? 'dark' : 'light';
            
            if (this.currentTheme === 'auto') {
                this.applyTheme(this.systemTheme);
            }
            
            this.dispatchEvent('themeManager:systemThemeChanged', {
                systemTheme: this.systemTheme
            });
        });
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem(this.options.storageKey);
        const themeToApply = savedTheme || this.options.defaultTheme;
        
        this.setTheme(themeToApply);
    }

    setTheme(themeName, skipTransition = false) {
        if (themeName === 'auto') {
            this.currentTheme = 'auto';
            this.applyTheme(this.systemTheme, skipTransition);
        } else if (this.themes[themeName] || this.customThemes.has(themeName)) {
            this.currentTheme = themeName;
            this.applyTheme(themeName, skipTransition);
        } else {
            console.warn(`Theme "${themeName}" not found. Using default theme.`);
            this.setTheme(this.options.defaultTheme, skipTransition);
            return;
        }
        
        // Save to localStorage
        localStorage.setItem(this.options.storageKey, this.currentTheme);
        
        // Update metrics
        this.updateMetrics(themeName);
        
        this.dispatchEvent('themeManager:themeChanged', {
            theme: this.currentTheme,
            appliedTheme: themeName === 'auto' ? this.systemTheme : themeName
        });
    }

    async applyTheme(themeName, skipTransition = false) {
        if (this.isTransitioning && !skipTransition) return;
        
        const theme = this.themes[themeName] || this.customThemes.get(themeName);
        if (!theme) {
            console.error(`Theme "${themeName}" not found`);
            return;
        }
        
        const startTime = performance.now();
        
        if (this.options.enableTransitions && !skipTransition && !this.shouldReduceMotion()) {
            this.isTransitioning = true;
            await this.transitionToTheme(theme);
            this.isTransitioning = false;
        } else {
            this.applyThemeProperties(theme);
        }
        
        const transitionTime = performance.now() - startTime;
        this.updateTransitionMetrics(transitionTime);
        
        // Update theme selector
        this.updateThemeSelector();
        
        // Update document class
        document.documentElement.className = document.documentElement.className
            .replace(/theme-\w+/g, '')
            .trim();
        document.documentElement.classList.add(`theme-${themeName}`);
        
        this.dispatchEvent('themeManager:themeApplied', {
            theme: themeName,
            transitionTime
        });
    }

    applyThemeProperties(theme) {
        const root = document.documentElement;
        
        Object.entries(theme.properties).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }

    async transitionToTheme(theme) {
        return new Promise((resolve) => {
            const root = document.documentElement;
            
            // Add transition class
            root.classList.add('theme-transitioning');
            
            // Apply transition styles
            root.style.transition = `all ${this.options.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            
            // Apply new theme properties
            requestAnimationFrame(() => {
                this.applyThemeProperties(theme);
                
                setTimeout(() => {
                    root.classList.remove('theme-transitioning');
                    root.style.transition = '';
                    resolve();
                }, this.options.transitionDuration);
            });
        });
    }

    createThemeSelector() {
        // Remove existing selector
        const existingSelector = document.querySelector('.theme-selector');
        if (existingSelector) {
            existingSelector.remove();
        }
        
        const selector = document.createElement('div');
        selector.className = 'theme-selector';
        selector.innerHTML = `
            <button class="theme-toggle" aria-label="Tema seçici" title="Tema değiştir">
                <span class="theme-icon">${this.getCurrentThemeIcon()}</span>
                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
            </button>
            <div class="theme-dropdown">
                <div class="theme-options">
                    ${this.createThemeOptions()}
                </div>
            </div>
        `;
        
        this.setupThemeSelectorEvents(selector);
        document.body.appendChild(selector);
    }

    createThemeOptions() {
        let options = '';
        
        // Auto theme option
        if (this.options.enableSystemTheme) {
            options += `
                <button class="theme-option ${this.currentTheme === 'auto' ? 'active' : ''}" 
                        data-theme="auto" 
                        aria-label="Otomatik tema">
                    <span class="theme-icon">🔄</span>
                    <span class="theme-name">Otomatik</span>
                    <span class="theme-description">Sistem temasını takip et</span>
                </button>
            `;
        }
        
        // Built-in themes
        Object.entries(this.themes).forEach(([key, theme]) => {
            const isActive = this.currentTheme === key || 
                           (this.currentTheme === 'auto' && this.systemTheme === key);
            
            options += `
                <button class="theme-option ${isActive ? 'active' : ''}" 
                        data-theme="${key}" 
                        aria-label="${theme.name} teması">
                    <span class="theme-icon">${theme.icon}</span>
                    <span class="theme-name">${theme.name}</span>
                    <span class="theme-preview" style="background: ${theme.properties['--accent-primary']}"></span>
                </button>
            `;
        });
        
        // Custom themes
        if (this.options.enableCustomThemes) {
            this.customThemes.forEach((theme, key) => {
                const isActive = this.currentTheme === key;
                
                options += `
                    <button class="theme-option ${isActive ? 'active' : ''}" 
                            data-theme="${key}" 
                            aria-label="${theme.name} teması">
                        <span class="theme-icon">${theme.icon || '🎨'}</span>
                        <span class="theme-name">${theme.name}</span>
                        <span class="theme-preview" style="background: ${theme.properties['--accent-primary']}"></span>
                        <button class="remove-theme" data-theme="${key}" aria-label="Temayı sil">×</button>
                    </button>
                `;
            });
            
            // Add custom theme button
            options += `
                <button class="theme-option add-custom" aria-label="Özel tema ekle">
                    <span class="theme-icon">➕</span>
                    <span class="theme-name">Özel Tema Ekle</span>
                </button>
            `;
        }
        
        return options;
    }

    setupThemeSelectorEvents(selector) {
        const toggle = selector.querySelector('.theme-toggle');
        const dropdown = selector.querySelector('.theme-dropdown');
        
        // Toggle dropdown
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
        
        // Theme option clicks
        dropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.theme-option');
            if (!option) return;
            
            if (option.classList.contains('add-custom')) {
                this.showCustomThemeDialog();
                return;
            }
            
            const removeBtn = e.target.closest('.remove-theme');
            if (removeBtn) {
                e.stopPropagation();
                this.removeCustomTheme(removeBtn.dataset.theme);
                return;
            }
            
            const themeName = option.dataset.theme;
            if (themeName) {
                this.setTheme(themeName);
                dropdown.classList.remove('open');
            }
        });
        
        // Keyboard navigation
        dropdown.addEventListener('keydown', (e) => {
            const options = dropdown.querySelectorAll('.theme-option');
            const currentIndex = Array.from(options).findIndex(opt => opt === document.activeElement);
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % options.length;
                    options[nextIndex].focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = (currentIndex - 1 + options.length) % options.length;
                    options[prevIndex].focus();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    e.target.click();
                    break;
                case 'Escape':
                    dropdown.classList.remove('open');
                    toggle.focus();
                    break;
            }
        });
    }

    updateThemeSelector() {
        const selector = document.querySelector('.theme-selector');
        if (!selector) return;
        
        const icon = selector.querySelector('.theme-icon');
        const options = selector.querySelectorAll('.theme-option');
        
        if (icon) {
            icon.textContent = this.getCurrentThemeIcon();
        }
        
        options.forEach(option => {
            const themeName = option.dataset.theme;
            const isActive = this.currentTheme === themeName || 
                           (this.currentTheme === 'auto' && this.systemTheme === themeName);
            
            option.classList.toggle('active', isActive);
        });
    }

    getCurrentThemeIcon() {
        if (this.currentTheme === 'auto') {
            return '🔄';
        }
        
        const theme = this.themes[this.currentTheme] || this.customThemes.get(this.currentTheme);
        return theme ? theme.icon : '🎨';
    }

    showCustomThemeDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'custom-theme-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <h3>Özel Tema Oluştur</h3>
                <form class="custom-theme-form">
                    <div class="form-group">
                        <label for="theme-name">Tema Adı:</label>
                        <input type="text" id="theme-name" required>
                    </div>
                    <div class="form-group">
                        <label for="theme-icon">İkon:</label>
                        <input type="text" id="theme-icon" placeholder="🎨" maxlength="2">
                    </div>
                    <div class="color-groups">
                        <div class="color-group">
                            <h4>Ana Renkler</h4>
                            <div class="color-inputs">
                                <div class="color-input">
                                    <label for="bg-primary">Ana Arkaplan:</label>
                                    <input type="color" id="bg-primary" value="#ffffff">
                                </div>
                                <div class="color-input">
                                    <label for="text-primary">Ana Metin:</label>
                                    <input type="color" id="text-primary" value="#000000">
                                </div>
                                <div class="color-input">
                                    <label for="accent-primary">Vurgu Rengi:</label>
                                    <input type="color" id="accent-primary" value="#3b82f6">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="dialog-actions">
                        <button type="button" class="btn-secondary cancel-btn">İptal</button>
                        <button type="submit" class="btn-primary">Oluştur</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Setup dialog events
        const overlay = dialog.querySelector('.dialog-overlay');
        const cancelBtn = dialog.querySelector('.cancel-btn');
        const form = dialog.querySelector('.custom-theme-form');
        
        const closeDialog = () => {
            dialog.remove();
        };
        
        overlay.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCustomTheme(form);
            closeDialog();
        });
        
        // Focus first input
        dialog.querySelector('#theme-name').focus();
    }

    createCustomTheme(form) {
        const formData = new FormData(form);
        const name = form.querySelector('#theme-name').value;
        const icon = form.querySelector('#theme-icon').value || '🎨';
        const bgPrimary = form.querySelector('#bg-primary').value;
        const textPrimary = form.querySelector('#text-primary').value;
        const accentPrimary = form.querySelector('#accent-primary').value;
        
        // Generate theme key
        const key = name.toLowerCase().replace(/\s+/g, '-');
        
        // Create theme object
        const theme = {
            name,
            icon,
            properties: {
                '--background-primary': bgPrimary,
                '--background-secondary': this.lightenColor(bgPrimary, 0.05),
                '--background-tertiary': this.lightenColor(bgPrimary, 0.1),
                '--text-primary': textPrimary,
                '--text-secondary': this.adjustOpacity(textPrimary, 0.7),
                '--text-tertiary': this.adjustOpacity(textPrimary, 0.5),
                '--accent-primary': accentPrimary,
                '--accent-primary-rgb': this.hexToRgb(accentPrimary),
                '--accent-primary-hover': this.darkenColor(accentPrimary, 0.1),
                '--accent-secondary': this.adjustHue(accentPrimary, 30),
                '--accent-secondary-rgb': this.hexToRgb(this.adjustHue(accentPrimary, 30)),
                '--border-primary': this.adjustOpacity(textPrimary, 0.1),
                '--border-secondary': this.adjustOpacity(textPrimary, 0.2),
                '--shadow-primary': this.adjustOpacity(textPrimary, 0.1),
                '--shadow-secondary': this.adjustOpacity(textPrimary, 0.05),
                '--glass-bg': this.adjustOpacity(bgPrimary, 0.8),
                '--glass-border': this.adjustOpacity(textPrimary, 0.1),
                '--success': '#10b981',
                '--warning': '#f59e0b',
                '--error': '#ef4444',
                '--info': '#06b6d4'
            }
        };
        
        this.addCustomTheme(key, theme);
    }

    addCustomTheme(key, theme) {
        this.customThemes.set(key, theme);
        this.saveCustomThemes();
        this.createThemeSelector(); // Recreate selector with new theme
        
        this.dispatchEvent('themeManager:customThemeAdded', { key, theme });
    }

    removeCustomTheme(key) {
        if (this.customThemes.has(key)) {
            this.customThemes.delete(key);
            this.saveCustomThemes();
            
            // If current theme is being removed, switch to default
            if (this.currentTheme === key) {
                this.setTheme(this.options.defaultTheme);
            }
            
            this.createThemeSelector();
            
            this.dispatchEvent('themeManager:customThemeRemoved', { key });
        }
    }

    saveCustomThemes() {
        const themesData = Array.from(this.customThemes.entries());
        localStorage.setItem(`${this.options.storageKey}-custom`, JSON.stringify(themesData));
    }

    loadCustomThemes() {
        try {
            const saved = localStorage.getItem(`${this.options.storageKey}-custom`);
            if (saved) {
                const themesData = JSON.parse(saved);
                this.customThemes = new Map(themesData);
            }
        } catch (error) {
            console.error('Failed to load custom themes:', error);
        }
    }

    setupTransitions() {
        const style = document.createElement('style');
        style.textContent = `
            .theme-transitioning * {
                transition: background-color ${this.options.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1),
                           color ${this.options.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1),
                           border-color ${this.options.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1),
                           box-shadow ${this.options.transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
        
        // Load custom themes
        this.loadCustomThemes();
    }

    toggleTheme() {
        const themes = Object.keys(this.themes);
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }

    shouldReduceMotion() {
        return this.options.respectReducedMotion && 
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    updateMetrics(themeName) {
        this.metrics.themeChanges++;
        
        // Update theme usage
        const currentUsage = this.metrics.themeUsage.get(themeName) || 0;
        this.metrics.themeUsage.set(themeName, currentUsage + 1);
        
        // Update most used theme
        let mostUsed = null;
        let maxUsage = 0;
        
        this.metrics.themeUsage.forEach((usage, theme) => {
            if (usage > maxUsage) {
                maxUsage = usage;
                mostUsed = theme;
            }
        });
        
        this.metrics.mostUsedTheme = mostUsed;
    }

    updateTransitionMetrics(transitionTime) {
        const totalTime = this.metrics.averageTransitionTime * (this.metrics.themeChanges - 1) + transitionTime;
        this.metrics.averageTransitionTime = totalTime / this.metrics.themeChanges;
    }

    // Utility methods for color manipulation
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? 
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
            '0, 0, 0';
    }

    lightenColor(hex, amount) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * amount * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                     (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                     (B < 255 ? B < 1 ? 0 : B : 255))
                     .toString(16).slice(1);
    }

    darkenColor(hex, amount) {
        return this.lightenColor(hex, -amount);
    }

    adjustOpacity(hex, opacity) {
        const rgb = this.hexToRgb(hex);
        return `rgba(${rgb}, ${opacity})`;
    }

    adjustHue(hex, degrees) {
        // Convert hex to HSL, adjust hue, convert back to hex
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        // Adjust hue
        h = (h + degrees / 360) % 1;
        
        // Convert back to RGB
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        let newR, newG, newB;
        
        if (s === 0) {
            newR = newG = newB = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            newR = hue2rgb(p, q, h + 1/3);
            newG = hue2rgb(p, q, h);
            newB = hue2rgb(p, q, h - 1/3);
        }
        
        const toHex = (c) => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
    }

    // Public API methods
    getTheme() {
        return this.currentTheme;
    }

    getAvailableThemes() {
        return {
            builtin: Object.keys(this.themes),
            custom: Array.from(this.customThemes.keys())
        };
    }

    getMetrics() {
        return { ...this.metrics };
    }

    exportTheme(themeName) {
        const theme = this.themes[themeName] || this.customThemes.get(themeName);
        if (theme) {
            return JSON.stringify(theme, null, 2);
        }
        return null;
    }

    importTheme(themeData, themeName) {
        try {
            const theme = JSON.parse(themeData);
            this.addCustomTheme(themeName, theme);
            return true;
        } catch (error) {
            console.error('Failed to import theme:', error);
            return false;
        }
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: { ...detail, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    destroy() {
        // Remove theme selector
        const selector = document.querySelector('.theme-selector');
        if (selector) {
            selector.remove();
        }
        
        // Remove custom theme dialog if open
        const dialog = document.querySelector('.custom-theme-dialog');
        if (dialog) {
            dialog.remove();
        }
        
        // Disconnect media query listener
        if (this.mediaQuery) {
            this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
        }
        
        this.dispatchEvent('themeManager:destroyed');
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}

// Global access
window.ThemeManager = ThemeManager; 