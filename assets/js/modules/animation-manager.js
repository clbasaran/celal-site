/**
 * ============================================================================
 * ANIMATION MANAGER - PERFORMANCE OPTIMIZED
 * Celal Başaran Portfolio v3.0.0 - Smooth Animation System
 * ============================================================================
 */

class AnimationManager {
    constructor() {
        this.animatedElements = new Map();
        this.observers = new Map();
        this.isInitialized = false;
        this.performanceMode = this.detectPerformanceMode();
        
        // Bind methods
        this.handleIntersection = this.handleIntersection.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        this.init();
    }

    /**
     * Detect device performance capabilities
     */
    detectPerformanceMode() {
        const deviceInfo = {
            isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isLowEnd: navigator.hardwareConcurrency <= 2,
            prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            isSlowConnection: navigator.connection?.effectiveType === 'slow-2g' || navigator.connection?.effectiveType === '2g',
            batteryLevel: null
        };

        // Check battery level if available
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                deviceInfo.batteryLevel = battery.level;
                if (battery.level < 0.2) {
                    this.enablePowerSavingMode();
                }
            });
        }

        // Determine performance mode
        if (deviceInfo.prefersReducedMotion || deviceInfo.isSlowConnection) {
            return 'minimal';
        } else if (deviceInfo.isMobile || deviceInfo.isLowEnd) {
            return 'optimized';
        } else {
            return 'full';
        }
    }

    /**
     * Initialize animation system
     */
    init() {
        if (this.isInitialized) return;

        this.setupIntersectionObservers();
        this.setupEventListeners();
        this.processExistingElements();
        this.optimizeGPULayers();
        
        this.isInitialized = true;
        console.log(`🎬 Animation Manager initialized (${this.performanceMode} mode)`);
    }

    /**
     * Setup intersection observers for different animation types
     */
    setupIntersectionObservers() {
        const observerConfigs = {
            entrance: {
                threshold: this.performanceMode === 'full' ? 0.1 : 0.2,
                rootMargin: this.performanceMode === 'full' ? '0px 0px -50px 0px' : '0px 0px -100px 0px'
            },
            parallax: {
                threshold: 0,
                rootMargin: '0px'
            },
            lazy: {
                threshold: 0.1,
                rootMargin: '50px'
            }
        };

        // Create observers
        Object.entries(observerConfigs).forEach(([type, config]) => {
            const observer = new IntersectionObserver(this.handleIntersection, config);
            observer.type = type;
            this.observers.set(type, observer);
        });
    }

    /**
     * Handle intersection events
     */
    handleIntersection(entries, observer) {
        entries.forEach(entry => {
            const element = entry.target;
            const elementData = this.animatedElements.get(element);
            
            if (!elementData) return;

            if (entry.isIntersecting) {
                this.triggerAnimation(element, elementData);
            } else if (observer.type === 'parallax') {
                this.updateParallax(element, entry);
            }
        });
    }

    /**
     * Process existing elements in the DOM
     */
    processExistingElements() {
        // Find all animated elements
        const selectors = [
            '[data-animation]',
            '.fade-in',
            '.slide-in-left',
            '.slide-in-right',
            '.scale-in',
            '.rotate-in',
            '.parallax-element',
            '.stagger-item'
        ];

        const elements = document.querySelectorAll(selectors.join(', '));
        
        elements.forEach(element => {
            this.registerElement(element);
        });
    }

    /**
     * Register an element for animation
     */
    registerElement(element) {
        if (this.animatedElements.has(element)) return;

        const animationType = this.detectAnimationType(element);
        const observerType = this.getObserverType(animationType);
        
        const elementData = {
            type: animationType,
            observer: observerType,
            animated: false,
            performanceOptimized: this.shouldOptimize(element)
        };

        // Apply initial styles based on performance mode
        this.applyInitialStyles(element, elementData);
        
        // Register with appropriate observer
        const observer = this.observers.get(observerType);
        if (observer) {
            observer.observe(element);
        }

        this.animatedElements.set(element, elementData);
    }

    /**
     * Detect animation type from element
     */
    detectAnimationType(element) {
        if (element.dataset.animation) {
            return element.dataset.animation;
        }

        const classList = element.classList;
        if (classList.contains('fade-in')) return 'fade-in';
        if (classList.contains('slide-in-left')) return 'slide-in-left';
        if (classList.contains('slide-in-right')) return 'slide-in-right';
        if (classList.contains('scale-in')) return 'scale-in';
        if (classList.contains('rotate-in')) return 'rotate-in';
        if (classList.contains('parallax-element')) return 'parallax';
        if (classList.contains('stagger-item')) return 'stagger';
        
        return 'fade-in'; // default
    }

    /**
     * Get appropriate observer type for animation
     */
    getObserverType(animationType) {
        if (animationType === 'parallax') return 'parallax';
        return 'entrance';
    }

    /**
     * Check if element should be performance optimized
     */
    shouldOptimize(element) {
        return this.performanceMode !== 'full' ||
               element.classList.contains('performance-critical') ||
               element.closest('.performance-section');
    }

    /**
     * Apply initial styles to prevent layout shift
     */
    applyInitialStyles(element, elementData) {
        // Prevent layout shift by applying initial transform
        element.style.willChange = 'transform, opacity';
        
        // Apply GPU acceleration
        if (!element.style.transform.includes('translateZ')) {
            element.style.transform += ' translateZ(0)';
        }

        // Set contain property for layout optimization
        if (elementData.performanceOptimized) {
            element.style.contain = 'layout style paint';
        }
    }

    /**
     * Trigger animation for element
     */
    triggerAnimation(element, elementData) {
        if (elementData.animated) return;

        // Mark as animated to prevent re-triggering
        elementData.animated = true;

        // Apply performance-specific optimizations
        if (this.performanceMode === 'minimal') {
            this.triggerMinimalAnimation(element, elementData);
        } else if (this.performanceMode === 'optimized') {
            this.triggerOptimizedAnimation(element, elementData);
        } else {
            this.triggerFullAnimation(element, elementData);
        }

        // Clean up will-change after animation
        this.scheduleCleanup(element);
    }

    /**
     * Trigger minimal animation (reduced motion)
     */
    triggerMinimalAnimation(element, elementData) {
        element.style.opacity = '1';
        element.style.transform = 'translateZ(0)';
        element.classList.add('visible', 'animate');
    }

    /**
     * Trigger optimized animation (mobile/low-end devices)
     */
    triggerOptimizedAnimation(element, elementData) {
        // Use CSS transitions instead of complex animations
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        element.classList.add('visible', 'animate');
        
        // Stagger delay for groups
        if (elementData.type === 'stagger') {
            const siblings = element.parentElement.children;
            const index = Array.from(siblings).indexOf(element);
            element.style.transitionDelay = `${index * 0.1}s`;
        }
    }

    /**
     * Trigger full animation (high-end devices)
     */
    triggerFullAnimation(element, elementData) {
        // Use the CSS animation classes
        element.classList.add('visible', 'animate');
        
        // Apply stagger delays
        if (elementData.type === 'stagger') {
            const siblings = element.parentElement.children;
            const index = Array.from(siblings).indexOf(element);
            element.style.animationDelay = `${index * 0.1}s`;
        }

        // Apply advanced 3D transforms for cards
        if (element.classList.contains('project-card') || element.classList.contains('skill-card')) {
            this.setupAdvancedHover(element);
        }
    }

    /**
     * Setup advanced hover effects for cards
     */
    setupAdvancedHover(element) {
        if (this.performanceMode === 'minimal') return;

        let isHovering = false;

        element.addEventListener('mouseenter', (e) => {
            if (isHovering) return;
            isHovering = true;
            
            const rect = element.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            element.addEventListener('mousemove', this.handleCardMouseMove);
        });

        element.addEventListener('mouseleave', () => {
            isHovering = false;
            element.removeEventListener('mousemove', this.handleCardMouseMove);
            element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
        });
    }

    /**
     * Handle card mouse move for 3D effect
     */
    handleCardMouseMove = (e) => {
        if (this.performanceMode === 'minimal') return;

        const element = e.currentTarget;
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
    }

    /**
     * Update parallax effect
     */
    updateParallax(element, entry) {
        if (this.performanceMode === 'minimal') return;

        const bounds = entry.boundingClientRect;
        const viewport = entry.rootBounds;
        
        if (!viewport) return;

        const speed = parseFloat(element.dataset.parallaxSpeed) || 0.5;
        const offset = (bounds.top / viewport.height - 0.5) * speed * 100;
        
        element.style.transform = `translateY(${offset}px) translateZ(0)`;
    }

    /**
     * Optimize GPU layers
     */
    optimizeGPULayers() {
        const criticalElements = document.querySelectorAll(`
            .navbar,
            .hero-title,
            .hero-subtitle,
            .hero-actions,
            .floating-element,
            .avatar-ring,
            .project-card,
            .skill-card
        `);

        criticalElements.forEach(element => {
            element.style.willChange = 'transform';
            element.style.transform += ' translateZ(0)';
        });
    }

    /**
     * Schedule cleanup after animation
     */
    scheduleCleanup(element) {
        // Clean up will-change after animation completes
        setTimeout(() => {
            if (element.style.willChange) {
                element.style.willChange = 'auto';
            }
        }, 1000);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Throttled resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(this.handleResize, 250);
        });

        // Visibility change handler
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // Memory cleanup on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // Battery status monitoring
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                battery.addEventListener('levelchange', () => {
                    if (battery.level < 0.2) {
                        this.enablePowerSavingMode();
                    }
                });
            });
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Re-calculate parallax elements
        this.animatedElements.forEach((data, element) => {
            if (data.type === 'parallax') {
                this.updateParallax(element, { boundingClientRect: element.getBoundingClientRect() });
            }
        });
    }

    /**
     * Handle visibility change (tab switching)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause animations when tab is hidden
            this.pauseAnimations();
        } else {
            // Resume animations when tab becomes visible
            this.resumeAnimations();
        }
    }

    /**
     * Pause all animations
     */
    pauseAnimations() {
        document.documentElement.style.setProperty('--animation-play-state', 'paused');
        
        this.animatedElements.forEach((data, element) => {
            if (element.style.animationPlayState !== undefined) {
                element.style.animationPlayState = 'paused';
            }
        });
    }

    /**
     * Resume all animations
     */
    resumeAnimations() {
        document.documentElement.style.setProperty('--animation-play-state', 'running');
        
        this.animatedElements.forEach((data, element) => {
            if (element.style.animationPlayState !== undefined) {
                element.style.animationPlayState = 'running';
            }
        });
    }

    /**
     * Enable power saving mode
     */
    enablePowerSavingMode() {
        this.performanceMode = 'minimal';
        document.body.classList.add('power-saving-mode');
        
        // Disable heavy animations
        this.animatedElements.forEach((data, element) => {
            if (data.type === 'parallax' || element.classList.contains('floating-element')) {
                element.style.animation = 'none';
                element.style.transform = 'none';
            }
        });
        
        console.log('🔋 Power saving mode activated');
    }

    /**
     * Add new animated element dynamically
     */
    addElement(element, animationType = 'fade-in') {
        element.dataset.animation = animationType;
        element.classList.add(animationType);
        this.registerElement(element);
    }

    /**
     * Remove element from animation system
     */
    removeElement(element) {
        const elementData = this.animatedElements.get(element);
        if (!elementData) return;

        // Unobserve from all observers
        this.observers.forEach(observer => {
            observer.unobserve(element);
        });

        // Remove from tracking
        this.animatedElements.delete(element);

        // Clean up styles
        element.style.willChange = 'auto';
        element.style.contain = '';
    }

    /**
     * Get animation statistics
     */
    getStats() {
        return {
            totalElements: this.animatedElements.size,
            performanceMode: this.performanceMode,
            observers: this.observers.size,
            animatedCount: Array.from(this.animatedElements.values()).filter(data => data.animated).length
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Disconnect all observers
        this.observers.forEach(observer => {
            observer.disconnect();
        });

        // Clear all tracking
        this.animatedElements.clear();
        this.observers.clear();

        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);

        this.isInitialized = false;
        console.log('🧹 Animation Manager cleaned up');
    }

    /**
     * Debug mode - highlight animated elements
     */
    enableDebugMode() {
        document.body.dataset.debug = 'true';
        
        this.animatedElements.forEach((data, element) => {
            element.title = `Animation: ${data.type} | Observer: ${data.observer} | Animated: ${data.animated}`;
            
            if (data.animated) {
                element.style.outline = '2px solid lime';
            } else {
                element.style.outline = '2px solid orange';
            }
        });
        
        console.log('🐛 Debug mode enabled. Check elements for animation status.');
    }

    /**
     * Disable debug mode
     */
    disableDebugMode() {
        document.body.dataset.debug = 'false';
        
        this.animatedElements.forEach((data, element) => {
            element.removeAttribute('title');
            element.style.outline = '';
        });
    }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.animationManager = new AnimationManager();
    });
} else {
    window.animationManager = new AnimationManager();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
} else {
    window.AnimationManager = AnimationManager;
}

console.log('🎬 Animation Manager module loaded'); 