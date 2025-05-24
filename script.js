/**
 * Portfolio App - Apple Design Language V4
 * Celal Başaran - Senior iOS Architect
 * Advanced JavaScript with native iOS app performance
 */

class PortfolioApp {
    constructor() {
        this.isLoaded = false;
        this.animationObserver = null;
        this.currentTheme = localStorage.getItem('theme') || 'auto';
        
        // Performance tracking
        this.performanceMetrics = {
            startTime: performance.now(),
            domContentLoaded: null,
            windowLoaded: null,
            firstPaint: null
        };
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        console.log('🚀 Portfolio App initializing...');
        
        // Critical: Hide loading screen immediately if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.handleDOMReady());
        } else {
            this.handleDOMReady();
        }
        
        // Fallback timeout - force hide loading screen after 3 seconds
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 3000);
        
        // Window load event
        window.addEventListener('load', () => this.handleWindowLoad());
        
        // Error handling
        window.addEventListener('error', (e) => this.handleError(e));
        window.addEventListener('unhandledrejection', (e) => this.handleError(e));
    }
    
    /**
     * Handle DOM Content Loaded
     */
    handleDOMReady() {
        this.performanceMetrics.domContentLoaded = performance.now();
        console.log(`📄 DOM ready in ${this.performanceMetrics.domContentLoaded - this.performanceMetrics.startTime}ms`);
        
        // Initialize theme
        this.initializeTheme();
        
        // Initialize navigation
        this.initializeNavigation();
        
        // Initialize animations
        this.initializeAnimations();
        
        // Initialize interactive elements
        this.initializeInteractiveElements();
        
        // Hide loading screen after a short delay to show it briefly
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 800);
    }
    
    /**
     * Handle Window Load
     */
    handleWindowLoad() {
        this.performanceMetrics.windowLoaded = performance.now();
        console.log(`🏁 Window loaded in ${this.performanceMetrics.windowLoaded - this.performanceMetrics.startTime}ms`);
        
        // Ensure loading screen is hidden
        this.hideLoadingScreen();
        
        // Initialize Service Worker
        this.initializeServiceWorker();
        
        // Initialize performance monitoring
        this.initializePerformanceMonitoring();
        
        this.isLoaded = true;
    }
    
    /**
     * Hide loading screen with smooth animation
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            console.log('✨ Hiding loading screen...');
            
            // Add hidden class for fade out animation
            loadingScreen.classList.add('hidden');
            
            // Add loaded class to body
            document.body.classList.add('loaded');
            
            // Remove from DOM after animation
            setTimeout(() => {
                if (loadingScreen.parentNode) {
                    loadingScreen.remove();
                }
            }, 600);
        }
    }
    
    /**
     * Initialize theme system
     */
    initializeTheme() {
        const themeToggle = document.getElementById('themeToggle');
        
        // Apply saved theme
        this.applyTheme(this.currentTheme);
        
        // Theme toggle event
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.currentTheme === 'auto') {
                this.applyTheme('auto');
            }
        });
    }
    
    /**
     * Toggle theme
     */
    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.currentTheme = themes[nextIndex];
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
    }
    
    /**
     * Apply theme
     */
    applyTheme(theme) {
        const html = document.documentElement;
        
        // Remove all theme classes
        html.classList.remove('theme-light', 'theme-dark');
        
        if (theme === 'light') {
            html.classList.add('theme-light');
        } else if (theme === 'dark') {
            html.classList.add('theme-dark');
        }
        // 'auto' uses system preference via CSS media queries
    }
    
    /**
     * Initialize navigation
     */
    initializeNavigation() {
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                const isOpen = navMenu.classList.contains('open');
                
                if (isOpen) {
                    navMenu.classList.remove('open');
                    menuToggle.classList.remove('open');
                } else {
                    navMenu.classList.add('open');
                    menuToggle.classList.add('open');
                }
            });
        }
        
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                if (href === '#') return;
                
                e.preventDefault();
                
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    
                    // Close mobile menu if open
                    if (navMenu && navMenu.classList.contains('open')) {
                        navMenu.classList.remove('open');
                        menuToggle.classList.remove('open');
                    }
                }
            });
        });
        
        // Active navigation link tracking
        this.initializeActiveNavigation();
    }
    
    /**
     * Initialize active navigation tracking
     */
    initializeActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    
                    // Remove active class from all nav links
                    navLinks.forEach(link => link.classList.remove('active'));
                    
                    // Add active class to current section link
                    const currentLink = document.querySelector(`.nav-link[href="#${id}"]`);
                    if (currentLink) {
                        currentLink.classList.add('active');
                    }
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '-20% 0px -20% 0px'
        });
        
        sections.forEach(section => observer.observe(section));
    }
    
    /**
     * Initialize animations
     */
    initializeAnimations() {
        // Scroll-triggered animations
        this.animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });
        
        // Observe all elements with data-animate
        document.querySelectorAll('[data-animate]').forEach(el => {
            this.animationObserver.observe(el);
        });
        
        // Counter animations for stats
        this.initializeCounterAnimations();
    }
    
    /**
     * Initialize counter animations
     */
    initializeCounterAnimations() {
        const counters = document.querySelectorAll('[data-count]');
        
        const countObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-count'));
                    const duration = 2000; // 2 seconds
                    const start = performance.now();
                    
                    const animate = (currentTime) => {
                        const elapsed = currentTime - start;
                        const progress = Math.min(elapsed / duration, 1);
                        
                        // Easing function
                        const easeOut = 1 - Math.pow(1 - progress, 3);
                        const current = Math.floor(target * easeOut);
                        
                        counter.textContent = current;
                        
                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            counter.textContent = target;
                        }
                    };
                    
                    requestAnimationFrame(animate);
                    countObserver.unobserve(counter);
                }
            });
        }, {
            threshold: 0.5
        });
        
        counters.forEach(counter => countObserver.observe(counter));
    }
    
    /**
     * Initialize interactive elements
     */
    initializeInteractiveElements() {
        // Button hover effects
        document.querySelectorAll('.cta-button').forEach(button => {
            button.addEventListener('mouseenter', () => {
                if (!this.isTouchDevice()) {
                    button.style.transform = 'translateY(-2px) scale(1.02)';
                }
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = '';
            });
        });
        
        // Form handling
        this.initializeFormHandling();
        
        // Scroll indicator
        this.initializeScrollIndicator();
    }
    
    /**
     * Initialize form handling
     */
    initializeFormHandling() {
        const newsletterForm = document.getElementById('newsletterForm');
        
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const email = e.target.querySelector('input[type="email"]').value;
                
                if (this.validateEmail(email)) {
                    this.handleNewsletterSubscription(email);
                }
            });
        }
    }
    
    /**
     * Handle newsletter subscription
     */
    handleNewsletterSubscription(email) {
        console.log('📧 Newsletter subscription:', email);
        
        // Show success message (you can implement actual API call here)
        const form = document.getElementById('newsletterForm');
        const originalHTML = form.innerHTML;
        
        form.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 24px; margin-bottom: 10px;">✅</div>
                <p>Teşekkürler! Email listemize eklendi.</p>
            </div>
        `;
        
        setTimeout(() => {
            form.innerHTML = originalHTML;
            this.initializeFormHandling(); // Re-initialize
        }, 3000);
    }
    
    /**
     * Validate email
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    /**
     * Initialize scroll indicator
     */
    initializeScrollIndicator() {
        const scrollIndicator = document.querySelector('.scroll-indicator');
        
        if (scrollIndicator) {
            // Hide on scroll
            let lastScrollY = window.scrollY;
            
            window.addEventListener('scroll', () => {
                const currentScrollY = window.scrollY;
                
                if (currentScrollY > 100) {
                    scrollIndicator.style.opacity = '0';
                } else {
                    scrollIndicator.style.opacity = '1';
                }
                
                lastScrollY = currentScrollY;
            });
            
            // Click to scroll
            scrollIndicator.addEventListener('click', () => {
                window.scrollTo({
                    top: window.innerHeight,
                    behavior: 'smooth'
                });
            });
        }
    }
    
    /**
     * Initialize Service Worker
     */
    initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('🔧 Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('❌ Service Worker registration failed:', error);
                });
        }
    }
    
    /**
     * Initialize performance monitoring
     */
    initializePerformanceMonitoring() {
        // Web Vitals tracking
        if ('web-vital' in window) {
            // This would integrate with web-vitals library if included
        }
        
        // Custom performance metrics
        setTimeout(() => {
            const metrics = {
                ...this.performanceMetrics,
                totalLoadTime: performance.now() - this.performanceMetrics.startTime,
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576)
                } : null
            };
            
            console.log('📊 Performance Metrics:', metrics);
        }, 1000);
    }
    
    /**
     * Check if device supports touch
     */
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    /**
     * Handle errors
     */
    handleError(error) {
        console.error('❌ Application Error:', error);
        
        // Ensure loading screen is hidden even on error
        this.hideLoadingScreen();
    }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.animationObserver) {
            this.animationObserver.disconnect();
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioApp = new PortfolioApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioApp;
} 