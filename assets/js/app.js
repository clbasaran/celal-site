/**
 * ============================================================================
 * ULTRA-ADVANCED PORTFOLIO APPLICATION v3.0.0
 * Apple-optimized with performance enhancements
 * ============================================================================
 */

class PortfolioApp {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.language = localStorage.getItem('language') || 'tr';
        this.isLoading = true;
        this.scrollPosition = 0;
        this.lastScrollTime = 0;
        this.scrollDirection = 'down';
        this.modules = new Map();
        
        // Performance tracking
        this.performanceMetrics = {
            loadStart: performance.now(),
            domReady: null,
            loadComplete: null,
            firstPaint: null,
            firstContentfulPaint: null
        };
        
        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        try {
            // Record DOM ready time
            this.performanceMetrics.domReady = performance.now();
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize core systems
            await this.initializeCore();
            
            // Wait for AnimationManager to be ready
            await this.waitForAnimationManager();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Apply initial settings
            this.applyTheme();
            this.applyLanguage();
            
            // Initialize modules
            await this.initializeModules();
            
            // Hide loading screen
            await this.hideLoadingScreen();
            
            // Record load complete time
            this.performanceMetrics.loadComplete = performance.now();
            
            console.log('🚀 Portfolio App v3.0.0 initialized successfully');
            console.log('📊 Performance metrics:', this.performanceMetrics);
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.handleInitError(error);
        }
    }

    /**
     * Wait for AnimationManager to be ready
     */
    async waitForAnimationManager() {
        return new Promise((resolve) => {
            if (window.animationManager) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.animationManager) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 50);
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.warn('⚠️ AnimationManager not found, continuing without it');
                    resolve();
                }, 5000);
            }
        });
    }

    /**
     * Initialize core systems
     */
    async initializeCore() {
        // Apply initial theme immediately to prevent flash
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Setup critical CSS variables
        this.setupCSSVariables();
        
        // Initialize performance observer
        this.initializePerformanceObserver();
        
        // Setup error handling
        this.setupErrorHandling();
    }

    /**
     * Setup CSS custom properties
     */
    setupCSSVariables() {
        const root = document.documentElement;
        
        // Dynamic viewport units for mobile
        const vh = window.innerHeight * 0.01;
        root.style.setProperty('--vh', `${vh}px`);
        
        // Device pixel ratio
        root.style.setProperty('--pixel-ratio', window.devicePixelRatio);
        
        // Color scheme
        root.style.setProperty('--color-scheme', this.theme);
        
        // Performance mode
        if (window.animationManager) {
            root.style.setProperty('--performance-mode', window.animationManager.performanceMode);
        }
    }

    /**
     * Initialize performance observer
     */
    initializePerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Observe paint timings
            const paintObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.name === 'first-paint') {
                        this.performanceMetrics.firstPaint = entry.startTime;
                    } else if (entry.name === 'first-contentful-paint') {
                        this.performanceMetrics.firstContentfulPaint = entry.startTime;
                    }
                });
            });
            
            paintObserver.observe({ entryTypes: ['paint'] });
        }
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('💥 JavaScript Error:', event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('💥 Unhandled Promise Rejection:', event.reason);
        });
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    /**
     * Hide loading screen with smooth animation
     */
    async hideLoadingScreen() {
        return new Promise((resolve) => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    loadingScreen.remove();
                    resolve();
                }, 500);
            } else {
                resolve();
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Language toggle
        const langToggle = document.getElementById('langToggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguageDropdown());
        }

        // Language options
        document.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = option.dataset.lang;
                this.setLanguage(lang);
            });
        });

        // Search functionality
        const searchToggle = document.getElementById('searchToggle');
        const searchOverlay = document.getElementById('searchOverlay');
        const searchClose = document.getElementById('searchClose');
        
        if (searchToggle && searchOverlay) {
            searchToggle.addEventListener('click', () => this.toggleSearch());
            searchClose?.addEventListener('click', () => this.toggleSearch());
            
            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                    this.toggleSearch();
                }
            });
        }

        // Mobile menu
        const mobileToggle = document.getElementById('mobileToggle');
        const mobileNav = document.getElementById('mobileNav');
        
        if (mobileToggle && mobileNav) {
            mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Smooth scrolling for navigation links
        this.setupSmoothScrolling();

        // Window events
        window.addEventListener('resize', this.debounce(() => this.handleResize(), 250));
        window.addEventListener('scroll', this.throttle(() => this.handleScroll(), 16));
        
        // Visibility change
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    /**
     * Setup smooth scrolling
     */
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update CSS variables
        this.setupCSSVariables();
        
        // Update animation manager
        if (window.animationManager) {
            window.animationManager.handleResize();
        }
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('app:resize', {
            detail: {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio
            }
        }));
    }

    /**
     * Handle scroll events
     */
    handleScroll() {
        const currentScroll = window.pageYOffset;
        const currentTime = performance.now();
        
        // Determine scroll direction
        if (currentScroll > this.scrollPosition) {
            this.scrollDirection = 'down';
        } else if (currentScroll < this.scrollPosition) {
            this.scrollDirection = 'up';
        }
        
        this.scrollPosition = currentScroll;
        this.lastScrollTime = currentTime;
        
        // Update navbar
        this.updateNavbar();
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('app:scroll', {
            detail: {
                position: currentScroll,
                direction: this.scrollDirection,
                speed: Math.abs(currentScroll - this.scrollPosition) / (currentTime - this.lastScrollTime)
            }
        }));
    }

    /**
     * Update navbar based on scroll
     */
    updateNavbar() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;
        
        if (this.scrollPosition > 100) {
            navbar.classList.add('scrolled');
            if (this.scrollDirection === 'down' && this.scrollPosition > 300) {
                navbar.classList.add('hidden');
            } else {
                navbar.classList.remove('hidden');
            }
        } else {
            navbar.classList.remove('scrolled', 'hidden');
        }
    }

    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause animations and heavy operations
            if (window.animationManager) {
                window.animationManager.pauseAnimations();
            }
        } else {
            // Resume animations
            if (window.animationManager) {
                window.animationManager.resumeAnimations();
            }
        }
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const themes = ['dark', 'light'];
        const currentIndex = themes.indexOf(this.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.theme = themes[nextIndex];
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
        
        // Smooth theme transition
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
        
        // Update CSS variables
        this.setupCSSVariables();
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('app:themeChange', {
            detail: { theme: this.theme }
        }));
    }

    /**
     * Apply theme
     */
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.setAttribute('aria-label', 
                this.theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'
            );
        }
    }

    /**
     * Toggle language dropdown
     */
    toggleLanguageDropdown() {
        const langSelector = document.querySelector('.language-selector');
        if (langSelector) {
            langSelector.classList.toggle('open');
        }
    }

    /**
     * Set language
     */
    setLanguage(lang) {
        this.language = lang;
        localStorage.setItem('language', lang);
        this.applyLanguage();
        
        // Close dropdown
        const langSelector = document.querySelector('.language-selector');
        if (langSelector) {
            langSelector.classList.remove('open');
        }
    }

    /**
     * Apply language
     */
    applyLanguage() {
        document.documentElement.setAttribute('lang', this.language);
        
        // Update language toggle
        const langText = document.querySelector('.lang-text');
        if (langText) {
            langText.textContent = this.language.toUpperCase();
        }
        
        // Update active language option
        document.querySelectorAll('.lang-option').forEach(option => {
            option.classList.toggle('active', option.dataset.lang === this.language);
        });
    }

    /**
     * Toggle search overlay
     */
    toggleSearch() {
        const searchOverlay = document.getElementById('searchOverlay');
        const searchInput = document.getElementById('searchInput');
        
        if (searchOverlay) {
            const isActive = searchOverlay.classList.toggle('active');
            
            if (isActive && searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
        }
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const mobileToggle = document.getElementById('mobileToggle');
        const mobileNav = document.getElementById('mobileNav');
        
        if (mobileToggle && mobileNav) {
            const isActive = mobileToggle.classList.toggle('active');
            mobileNav.classList.toggle('active', isActive);
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = isActive ? 'hidden' : '';
        }
    }

    /**
     * Initialize modules
     */
    async initializeModules() {
        const moduleConfigs = [
            { name: 'ai-assistant', required: false },
            { name: '3d-engine', required: false },
            { name: 'voice-commands', required: false },
            { name: 'apple-devices', required: true },
            { name: 'performance-monitor', required: false },
            { name: 'analytics', required: false }
        ];

        for (const config of moduleConfigs) {
            try {
                await this.loadModule(config.name, config.required);
            } catch (error) {
                if (config.required) {
                    console.error(`❌ Failed to load required module: ${config.name}`, error);
                } else {
                    console.warn(`⚠️ Failed to load optional module: ${config.name}`, error);
                }
            }
        }
    }

    /**
     * Load a module
     */
    async loadModule(name, required = false) {
        try {
            const module = await import(`./modules/${name}.js`);
            this.modules.set(name, module);
            console.log(`✅ Module loaded: ${name}`);
        } catch (error) {
            if (required) {
                throw error;
            }
            console.warn(`⚠️ Optional module not available: ${name}`);
        }
    }

    /**
     * Handle initialization error
     */
    handleInitError(error) {
        // Hide loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Show error message
        document.body.innerHTML = `
            <div class="error-screen">
                <h1>Uygulama Yüklenemedi</h1>
                <p>Bir hata oluştu. Lütfen sayfayı yenileyin.</p>
                <button onclick="location.reload()">Sayfayı Yenile</button>
            </div>
        `;
    }

    /**
     * Utility: Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Utility: Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Get module by name
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    /**
     * Debug mode
     */
    enableDebugMode() {
        window.DEBUG = true;
        document.body.dataset.debug = 'true';
        
        if (window.animationManager) {
            window.animationManager.enableDebugMode();
        }
        
        console.log('🐛 Debug mode enabled');
        console.log('📊 Current metrics:', this.getPerformanceMetrics());
        console.log('🎬 Animation stats:', window.animationManager?.getStats());
    }

    /**
     * Disable debug mode
     */
    disableDebugMode() {
        window.DEBUG = false;
        document.body.dataset.debug = 'false';
        
        if (window.animationManager) {
            window.animationManager.disableDebugMode();
        }
        
        console.log('🐛 Debug mode disabled');
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new PortfolioApp();
    });
} else {
    window.app = new PortfolioApp();
}

// Export for global access
window.PortfolioApp = PortfolioApp;

console.log('🚀 Portfolio App v3.0.0 loaded'); 