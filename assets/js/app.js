/**
 * Portfolio OS - Main Application
 * Apple Design Language V5
 * Enterprise-grade JavaScript architecture
 */

class PortfolioApp {
    constructor() {
        this.version = '2.0.0';
        this.modules = new Map();
        this.state = {
            currentPage: 'home',
            theme: 'auto',
            isMenuOpen: false,
            aiAssistantOpen: false,
            scrollPosition: 0,
            user: null
        };
        
        this.init();
    }
    
    async init() {
        console.log('🚀 Portfolio OS v' + this.version + ' initializing...');
        
        try {
            // Wait for DOM to be ready
            await this.waitForDOM();
            
            // Initialize core systems
            this.initializeCore();
            
            // Load modules
            await this.loadModules();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize animations
            this.initializeAnimations();
            
            // Register Service Worker
            this.registerServiceWorker();
            
            console.log('✅ Portfolio OS fully loaded!');
            
        } catch (error) {
            console.error('❌ Portfolio OS initialization failed:', error);
            this.handleError(error);
        }
    }
    
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    initializeCore() {
        // Initialize theme system
        this.initializeTheme();
        
        // Initialize navigation
        this.initializeNavigation();
        
        // Initialize scroll behavior
        this.initializeScrollBehavior();
        
        // Initialize performance monitoring
        this.initializePerformanceMonitoring();
        
        console.log('🔧 Core systems initialized');
    }
    
    initializeTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                if (window.Portfolio?.ThemeController) {
                    window.Portfolio.ThemeController.toggle();
                }
            });
        }
    }
    
    initializeNavigation() {
        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
        
        // AI Assistant toggle
        const aiToggle = document.getElementById('aiToggle');
        if (aiToggle) {
            aiToggle.addEventListener('click', () => {
                this.toggleAIAssistant();
            });
        }
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    this.smoothScrollTo(target);
                }
            });
        });
    }
    
    toggleMobileMenu() {
        this.state.isMenuOpen = !this.state.isMenuOpen;
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (menuToggle && navMenu) {
            menuToggle.classList.toggle('active', this.state.isMenuOpen);
            navMenu.classList.toggle('active', this.state.isMenuOpen);
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = this.state.isMenuOpen ? 'hidden' : '';
        }
    }
    
    toggleAIAssistant() {
        this.state.aiAssistantOpen = !this.state.aiAssistantOpen;
        const aiAssistant = document.getElementById('aiAssistant');
        const aiToggle = document.getElementById('aiToggle');
        
        if (aiAssistant && aiToggle) {
            aiAssistant.classList.toggle('active', this.state.aiAssistantOpen);
            aiToggle.classList.toggle('active', this.state.aiAssistantOpen);
        }
    }
    
    initializeScrollBehavior() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }
    
    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        this.state.scrollPosition = scrollTop;
        
        // Update navbar appearance
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.toggle('scrolled', scrollTop > 50);
        }
        
        // Trigger scroll animations
        this.triggerScrollAnimations();
        
        // Update scroll indicator
        this.updateScrollIndicator();
    }
    
    triggerScrollAnimations() {
        const elements = document.querySelectorAll('[data-animate]');
        
        elements.forEach(element => {
            if (this.isElementInViewport(element) && !element.classList.contains('animated')) {
                const animationType = element.dataset.animate;
                const delay = element.dataset.delay || 0;
                
                setTimeout(() => {
                    element.classList.add('animated', animationType);
                }, parseInt(delay));
            }
        });
    }
    
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    updateScrollIndicator() {
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            const shouldShow = this.state.scrollPosition < 100;
            scrollIndicator.style.opacity = shouldShow ? '1' : '0';
        }
    }
    
    smoothScrollTo(target) {
        const targetPosition = target.offsetTop - 80; // Account for navbar
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
    
    initializeAnimations() {
        // Animate statistics counters
        this.animateCounters();
        
        // Initialize typewriter effect
        this.initializeTypewriter();
        
        // Initialize tech stack floating animation
        this.initializeTechStackAnimation();
    }
    
    animateCounters() {
        const counters = document.querySelectorAll('[data-count]');
        
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.count);
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;
            
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };
            
            // Start animation when element comes into view
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.disconnect();
                    }
                });
            });
            
            observer.observe(counter);
        });
    }
    
    initializeTypewriter() {
        const typewriterElement = document.getElementById('heroRole');
        if (!typewriterElement) return;
        
        const roles = [
            'Senior iOS Architect',
            'AI/ML Pioneer',
            'SwiftUI Expert',
            'Innovation Leader',
            'Tech Visionary'
        ];
        
        let currentRoleIndex = 0;
        let currentCharIndex = 0;
        let isDeleting = false;
        
        const typeWriter = () => {
            const currentRole = roles[currentRoleIndex];
            
            if (isDeleting) {
                currentCharIndex--;
            } else {
                currentCharIndex++;
            }
            
            typewriterElement.textContent = currentRole.substring(0, currentCharIndex);
            
            let typingSpeed = isDeleting ? 50 : 100;
            
            if (!isDeleting && currentCharIndex === currentRole.length) {
                typingSpeed = 2000; // Pause at end
                isDeleting = true;
            } else if (isDeleting && currentCharIndex === 0) {
                isDeleting = false;
                currentRoleIndex = (currentRoleIndex + 1) % roles.length;
                typingSpeed = 500; // Pause before next word
            }
            
            setTimeout(typeWriter, typingSpeed);
        };
        
        // Start typewriter effect after delay
        setTimeout(typeWriter, 1000);
    }
    
    initializeTechStackAnimation() {
        const techItems = document.querySelectorAll('.tech-item');
        
        techItems.forEach((item, index) => {
            const delay = parseFloat(item.style.getPropertyValue('--delay')) || 0;
            
            setTimeout(() => {
                item.style.animation = `float 3s ease-in-out infinite`;
                item.style.animationDelay = `${index * 0.2}s`;
            }, delay * 1000);
        });
    }
    
    initializePerformanceMonitoring() {
        // Monitor performance metrics
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        console.log('📊 Performance Metrics:', {
                            domLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
                            pageLoaded: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                            firstPaint: this.getFirstPaintTime()
                        });
                    }
                }, 1000);
            });
        }
    }
    
    getFirstPaintTime() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? Math.round(firstPaint.startTime) : null;
    }
    
    async loadModules() {
        const modulePromises = [
            this.loadModule('ThemeToggle', '/assets/js/modules/theme-toggle.js'),
            this.loadModule('Observer', '/assets/js/modules/observer.js'),
            this.loadModule('AIAssistant', '/assets/js/modules/ai-assistant.js'),
            this.loadModule('FPSGraph', '/assets/js/modules/fps-graph.js'),
            this.loadModule('Analytics', '/assets/js/modules/analytics.js')
        ];
        
        try {
            await Promise.allSettled(modulePromises);
            console.log('📦 Modules loaded successfully');
        } catch (error) {
            console.warn('⚠️ Some modules failed to load:', error);
        }
    }
    
    async loadModule(name, path) {
        try {
            const module = await import(path);
            this.modules.set(name, module.default || module);
            return module;
        } catch (error) {
            console.warn(`⚠️ Failed to load module ${name}:`, error);
            return null;
        }
    }
    
    setupEventListeners() {
        // Window resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 100);
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
        
        // Custom events
        window.addEventListener('themeChanged', (e) => {
            this.handleThemeChange(e.detail.theme);
        });
    }
    
    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768 && this.state.isMenuOpen) {
            this.toggleMobileMenu();
        }
        
        // Recalculate scroll positions
        this.handleScroll();
    }
    
    handleKeyboard(e) {
        // ESC key closes modals/menus
        if (e.key === 'Escape') {
            if (this.state.isMenuOpen) {
                this.toggleMobileMenu();
            }
            if (this.state.aiAssistantOpen) {
                this.toggleAIAssistant();
            }
        }
        
        // Arrow key navigation for accessibility
        if (e.key === 'ArrowDown' && e.ctrlKey) {
            window.scrollBy(0, 100);
        }
        if (e.key === 'ArrowUp' && e.ctrlKey) {
            window.scrollBy(0, -100);
        }
    }
    
    handleThemeChange(theme) {
        this.state.theme = theme;
        
        // Update any theme-dependent components
        this.modules.forEach(module => {
            if (module && module.onThemeChange) {
                module.onThemeChange(theme);
            }
        });
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/pwa/sw.js');
                console.log('✅ Service Worker registered:', registration);
                
                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    console.log('🔄 Service Worker update found');
                });
                
            } catch (error) {
                console.warn('⚠️ Service Worker registration failed:', error);
            }
        }
    }
    
    handleError(error) {
        console.error('❌ Application Error:', error);
        
        // Track error for analytics
        if (this.modules.has('Analytics')) {
            const analytics = this.modules.get('Analytics');
            analytics.trackError(error);
        }
        
        // Show user-friendly error message
        this.showNotification('Bir hata oluştu. Sayfa yenileniyor...', 'error');
        
        // Auto-reload after delay
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    // Public API methods
    async navigateTo(page) {
        try {
            this.state.currentPage = page;
            // Implement client-side routing if needed
            console.log('🧭 Navigating to:', page);
        } catch (error) {
            this.handleError(error);
        }
    }
    
    getState() {
        return { ...this.state };
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.emitStateChange();
    }
    
    emitStateChange() {
        window.dispatchEvent(new CustomEvent('stateChanged', {
            detail: this.getState()
        }));
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.PortfolioApp = new PortfolioApp();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioApp;
} 