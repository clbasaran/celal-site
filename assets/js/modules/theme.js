class ThemeManager {
    constructor() {
        this.themes = ['light', 'dark', 'auto'];
        this.currentTheme = this.getStoredTheme() || 'auto';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
        this.watchSystemTheme();
    }

    getStoredTheme() {
        return localStorage.getItem('theme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    getActiveTheme() {
        if (this.currentTheme === 'auto') {
            return this.getSystemTheme();
        }
        return this.currentTheme;
    }

    applyTheme(theme) {
        const activeTheme = theme === 'auto' ? this.getSystemTheme() : theme;
        document.documentElement.setAttribute('data-theme', activeTheme);
        
        // Update theme toggle button
        const themeToggle = document.querySelector('.theme-toggle');
        const themeIcon = themeToggle?.querySelector('.theme-icon');
        
        if (themeIcon) {
            const icons = {
                light: '☀️',
                dark: '🌙',
                auto: '🌓'
            };
            themeIcon.textContent = icons[theme] || icons.auto;
        }

        // Update theme toggle aria-label
        if (themeToggle) {
            const labels = {
                light: 'Koyu temaya geç',
                dark: 'Otomatik temaya geç',
                auto: 'Açık temaya geç'
            };
            themeToggle.setAttribute('aria-label', labels[theme] || labels.auto);
        }

        this.currentTheme = theme;
        this.setStoredTheme(theme);
    }

    cycleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        const nextTheme = this.themes[nextIndex];
        this.applyTheme(nextTheme);
        
        // Announce theme change to screen readers
        this.announceThemeChange(nextTheme);
    }

    announceThemeChange(theme) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        
        const messages = {
            light: 'Açık tema aktif',
            dark: 'Koyu tema aktif',
            auto: 'Otomatik tema aktif'
        };
        
        announcement.textContent = messages[theme] || messages.auto;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    setupEventListeners() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.cycleTheme());
            
            // Keyboard support
            themeToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.cycleTheme();
                }
            });
        }
    }

    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
            if (this.currentTheme === 'auto') {
                this.applyTheme('auto');
            }
        });
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

export default ThemeManager; 