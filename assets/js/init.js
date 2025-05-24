/**
 * Portfolio OS - Initialization
 * Apple Design Language V5
 * Critical path initialization
 */

// Performance tracking
window.portfolioMetrics = {
    startTime: performance.now(),
    domLoaded: null,
    windowLoaded: null,
    firstPaint: null,
    assets: {
        loaded: 0,
        total: 0,
        failed: []
    }
};

// Critical DOM manipulation functions
const DOM = {
    ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    },
    
    id(id) {
        return document.getElementById(id);
    },
    
    query(selector) {
        return document.querySelector(selector);
    },
    
    queryAll(selector) {
        return document.querySelectorAll(selector);
    },
    
    addClass(element, className) {
        if (element) element.classList.add(className);
    },
    
    removeClass(element, className) {
        if (element) element.classList.remove(className);
    },
    
    hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    }
};

// Loading screen controller
const LoadingController = {
    screen: null,
    isHidden: false,
    
    init() {
        this.screen = DOM.id('loadingScreen');
        
        // Force hide after 3 seconds as fallback
        setTimeout(() => {
            this.hide();
        }, 3000);
        
        // Hide after DOM is ready + small delay
        DOM.ready(() => {
            setTimeout(() => {
                this.hide();
            }, 800);
        });
        
        // Ensure hidden on window load
        window.addEventListener('load', () => {
            this.hide();
        });
        
        console.log('🔄 Loading Controller initialized');
    },
    
    hide() {
        if (this.isHidden || !this.screen) return;
        
        console.log('✨ Hiding loading screen...');
        
        DOM.addClass(this.screen, 'hidden');
        DOM.addClass(document.body, 'loaded');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (this.screen && this.screen.parentNode) {
                this.screen.remove();
            }
        }, 600);
        
        this.isHidden = true;
        window.portfolioMetrics.loadingHidden = performance.now();
    }
};

// Theme system initialization
const ThemeController = {
    current: 'auto',
    
    init() {
        this.current = localStorage.getItem('theme') || 'auto';
        this.apply(this.current);
        
        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', () => {
            if (this.current === 'auto') {
                this.apply('auto');
            }
        });
        
        console.log('🎨 Theme Controller initialized:', this.current);
    },
    
    apply(theme) {
        const html = document.documentElement;
        
        // Remove existing theme attributes
        html.removeAttribute('data-theme');
        
        if (theme === 'light') {
            html.setAttribute('data-theme', 'light');
        } else if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else {
            // Auto mode - use system preference
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.setAttribute('data-theme', isDark ? 'dark' : 'light');
        }
        
        this.current = theme;
        localStorage.setItem('theme', theme);
    },
    
    toggle() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.current);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.apply(themes[nextIndex]);
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: this.current }
        }));
        
        console.log('🎨 Theme changed to:', this.current);
    }
};

// Error handling
const ErrorController = {
    init() {
        window.addEventListener('error', (e) => {
            console.error('❌ Script Error:', e.error);
            this.handleError(e);
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('❌ Promise Rejection:', e.reason);
            this.handleError(e);
        });
        
        console.log('🛡️ Error Controller initialized');
    },
    
    handleError(error) {
        // Ensure loading screen is hidden even on error
        LoadingController.hide();
        
        // Track error metrics
        window.portfolioMetrics.errors = window.portfolioMetrics.errors || [];
        window.portfolioMetrics.errors.push({
            timestamp: performance.now(),
            error: error.toString(),
            stack: error.stack
        });
    }
};

// FPS Monitor initialization
const FPSMonitor = {
    fps: 60,
    lastTime: 0,
    frameCount: 0,
    element: null,
    
    init() {
        this.element = DOM.id('fpsValue');
        if (this.element) {
            this.start();
            console.log('📊 FPS Monitor initialized');
        }
    },
    
    start() {
        const measure = (currentTime) => {
            this.frameCount++;
            
            if (currentTime >= this.lastTime + 1000) {
                this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
                this.frameCount = 0;
                this.lastTime = currentTime;
                
                if (this.element) {
                    this.element.textContent = this.fps;
                }
                
                // Update FPS color based on performance
                if (this.element) {
                    if (this.fps >= 55) {
                        this.element.style.color = 'var(--green)';
                    } else if (this.fps >= 30) {
                        this.element.style.color = 'var(--orange)';
                    } else {
                        this.element.style.color = 'var(--red)';
                    }
                }
            }
            
            requestAnimationFrame(measure);
        };
        
        requestAnimationFrame(measure);
    }
};

// Safe function to wait for other modules
const waitForModule = (moduleName, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const check = () => {
            if (window[moduleName]) {
                resolve(window[moduleName]);
            } else if (Date.now() - startTime > timeout) {
                reject(new Error(`Module ${moduleName} not loaded within ${timeout}ms`));
            } else {
                setTimeout(check, 100);
            }
        };
        
        check();
    });
};

// Initialize critical systems immediately
(function initializeCriticalSystems() {
    console.log('🚀 Portfolio OS starting...');
    
    // Initialize core controllers
    LoadingController.init();
    ThemeController.init();
    ErrorController.init();
    
    // Initialize FPS monitor after DOM is ready
    DOM.ready(() => {
        FPSMonitor.init();
        window.portfolioMetrics.domLoaded = performance.now();
        console.log(`📄 DOM ready in ${window.portfolioMetrics.domLoaded - window.portfolioMetrics.startTime}ms`);
    });
    
    // Global utility functions
    window.Portfolio = {
        DOM,
        LoadingController,
        ThemeController,
        ErrorController,
        FPSMonitor,
        waitForModule,
        metrics: window.portfolioMetrics
    };
    
    console.log('✅ Critical systems initialized');
})();

// Preload critical assets
(function preloadCriticalAssets() {
    const criticalAssets = [
        '/assets/css/main.css',
        '/assets/css/components/navbar.css',
        '/assets/css/components/hero.css',
        '/assets/images/celal-avatar.jpg'
    ];
    
    criticalAssets.forEach(asset => {
        const link = document.createElement('link');
        link.rel = 'preload';
        
        if (asset.endsWith('.css')) {
            link.as = 'style';
        } else if (asset.endsWith('.js')) {
            link.as = 'script';
        } else {
            link.as = 'image';
        }
        
        link.href = asset;
        document.head.appendChild(link);
    });
    
    window.portfolioMetrics.assets.total = criticalAssets.length;
    console.log('📦 Preloading critical assets:', criticalAssets.length);
})(); 