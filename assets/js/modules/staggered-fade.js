/**
 * Portfolio OS - Staggered Fade Module
 * Apple Design Language V5
 * Advanced staggered animation effects with performance optimization
 */

class StaggeredFade {
    constructor(options = {}) {
        this.options = {
            selector: '[data-animate="staggerFadeIn"]',
            childSelector: ':scope > *',
            delay: 100,
            duration: 600,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            threshold: 0.1,
            rootMargin: '50px',
            animateOnce: true,
            ...options
        };
        
        this.observer = null;
        this.animatedElements = new Set();
        this.isInitialized = false;
        
        // Performance tracking
        this.metrics = {
            animationsTriggered: 0,
            averageDelay: 0,
            totalDuration: 0,
            performance: []
        };
        
        this.init();
    }
    
    init() {
        try {
            this.createObserver();
            this.observeElements();
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✨ Staggered Fade initialized');
            
        } catch (error) {
            console.error('❌ Staggered Fade initialization failed:', error);
        }
    }
    
    createObserver() {
        if (!window.IntersectionObserver) {
            console.warn('IntersectionObserver not supported');
            this.fallbackToImmediate();
            return;
        }
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, {
            threshold: this.options.threshold,
            rootMargin: this.options.rootMargin
        });
    }
    
    observeElements() {
        const elements = document.querySelectorAll(this.options.selector);
        
        elements.forEach(element => {
            if (!this.animatedElements.has(element)) {
                this.prepareElement(element);
                
                if (this.observer) {
                    this.observer.observe(element);
                } else {
                    this.animateElement(element);
                }
            }
        });
    }
    
    prepareElement(container) {
        const children = container.querySelectorAll(this.options.childSelector);
        
        // Set initial state for staggered animation
        children.forEach((child, index) => {
            child.style.opacity = '0';
            child.style.transform = 'translateY(20px)';
            child.style.transition = 'none';
            
            // Store original styles for cleanup
            child.dataset.originalOpacity = child.style.opacity || '';
            child.dataset.originalTransform = child.style.transform || '';
            child.dataset.staggerIndex = index;
        });
        
        // Mark container as prepared
        container.dataset.staggerPrepared = 'true';
    }
    
    animateElement(container) {
        if (this.animatedElements.has(container)) {
            return;
        }
        
        if (this.options.animateOnce) {
            this.animatedElements.add(container);
        }
        
        const startTime = performance.now();
        const children = container.querySelectorAll(this.options.childSelector);
        
        if (children.length === 0) {
            return;
        }
        
        // Calculate stagger timing
        const totalDelay = this.calculateTotalDelay(children.length);
        
        // Animate children with stagger
        children.forEach((child, index) => {
            const delay = index * this.options.delay;
            
            // Use requestAnimationFrame for better performance
            requestAnimationFrame(() => {
                setTimeout(() => {
                    this.animateChild(child, index);
                }, delay);
            });
        });
        
        // Track performance
        this.trackAnimation(container, children.length, totalDelay, startTime);
        
        // Cleanup after animation
        setTimeout(() => {
            this.cleanupElement(container);
        }, totalDelay + this.options.duration + 100);
    }
    
    animateChild(child, index) {
        const animationType = this.getAnimationType(child);
        
        // Set transition
        child.style.transition = `opacity ${this.options.duration}ms ${this.options.easing}, 
                                 transform ${this.options.duration}ms ${this.options.easing}`;
        
        // Apply animation based on type
        switch (animationType) {
            case 'slideUp':
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
                break;
                
            case 'slideDown':
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
                break;
                
            case 'slideLeft':
                child.style.opacity = '1';
                child.style.transform = 'translateX(0)';
                break;
                
            case 'slideRight':
                child.style.opacity = '1';
                child.style.transform = 'translateX(0)';
                break;
                
            case 'scale':
                child.style.opacity = '1';
                child.style.transform = 'scale(1)';
                break;
                
            case 'fade':
            default:
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
                break;
        }
        
        // Add custom classes if specified
        const customClass = child.dataset.staggerClass;
        if (customClass) {
            child.classList.add(customClass);
        }
        
        // Emit custom event
        this.emitAnimationEvent(child, index);
    }
    
    getAnimationType(element) {
        return element.dataset.staggerType || 'slideUp';
    }
    
    calculateTotalDelay(childCount) {
        return (childCount - 1) * this.options.delay;
    }
    
    cleanupElement(container) {
        const children = container.querySelectorAll(this.options.childSelector);
        
        children.forEach(child => {
            // Remove transition to prevent interference
            child.style.transition = '';
            
            // Remove data attributes
            delete child.dataset.staggerIndex;
            delete child.dataset.originalOpacity;
            delete child.dataset.originalTransform;
        });
        
        // Mark as cleaned up
        container.dataset.staggerCleaned = 'true';
    }
    
    fallbackToImmediate() {
        const elements = document.querySelectorAll(this.options.selector);
        
        elements.forEach(container => {
            const children = container.querySelectorAll(this.options.childSelector);
            
            children.forEach(child => {
                child.style.opacity = '1';
                child.style.transform = 'none';
            });
        });
    }
    
    setupEventListeners() {
        // Handle dynamic content
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const newElements = node.querySelectorAll(this.options.selector);
                        newElements.forEach(element => {
                            if (!this.animatedElements.has(element)) {
                                this.prepareElement(element);
                                if (this.observer) {
                                    this.observer.observe(element);
                                }
                            }
                        });
                    }
                });
            });
        });
        
        mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.refreshObserver();
            }
        });
        
        // Handle resize
        window.addEventListener('resize', this.debounce(() => {
            this.refreshObserver();
        }, 250));
    }
    
    refreshObserver() {
        if (this.observer) {
            this.observer.disconnect();
            this.createObserver();
            this.observeElements();
        }
    }
    
    trackAnimation(container, childCount, totalDelay, startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.metrics.animationsTriggered++;
        this.metrics.averageDelay = (this.metrics.averageDelay + totalDelay) / this.metrics.animationsTriggered;
        this.metrics.totalDuration += duration;
        
        this.metrics.performance.push({
            timestamp: Date.now(),
            childCount,
            totalDelay,
            duration,
            container: container.tagName
        });
        
        // Keep only last 50 records
        if (this.metrics.performance.length > 50) {
            this.metrics.performance.shift();
        }
    }
    
    emitAnimationEvent(element, index) {
        const event = new CustomEvent('staggerAnimationStart', {
            detail: {
                element,
                index,
                type: this.getAnimationType(element),
                timestamp: performance.now()
            }
        });
        
        element.dispatchEvent(event);
        document.dispatchEvent(event);
    }
    
    // Public API Methods
    animateNow(selector) {
        const elements = typeof selector === 'string' 
            ? document.querySelectorAll(selector)
            : [selector];
            
        elements.forEach(element => {
            if (element.matches(this.options.selector)) {
                this.animateElement(element);
            }
        });
    }
    
    reset(selector) {
        const elements = typeof selector === 'string' 
            ? document.querySelectorAll(selector)
            : [selector];
            
        elements.forEach(element => {
            this.animatedElements.delete(element);
            delete element.dataset.staggerPrepared;
            delete element.dataset.staggerCleaned;
            
            this.prepareElement(element);
            
            if (this.observer) {
                this.observer.observe(element);
            }
        });
    }
    
    pause() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
    
    resume() {
        if (this.observer) {
            this.observeElements();
        }
    }
    
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.refreshObserver();
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            isInitialized: this.isInitialized,
            animatedCount: this.animatedElements.size,
            averageAnimationTime: this.metrics.totalDuration / this.metrics.animationsTriggered || 0
        };
    }
    
    // Animation Presets
    static presets = {
        subtle: {
            delay: 80,
            duration: 400,
            easing: 'cubic-bezier(0.4, 0, 0.6, 1)'
        },
        
        smooth: {
            delay: 100,
            duration: 600,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        },
        
        dramatic: {
            delay: 150,
            duration: 800,
            easing: 'cubic-bezier(0.2, 0, 0.1, 1)'
        },
        
        quick: {
            delay: 50,
            duration: 300,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
    };
    
    applyPreset(presetName) {
        const preset = StaggeredFade.presets[presetName];
        if (preset) {
            this.updateOptions(preset);
        }
    }
    
    // Utility methods
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
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // Reset all animated elements
        this.animatedElements.forEach(element => {
            this.cleanupElement(element);
        });
        
        this.animatedElements.clear();
        
        console.log('✨ Staggered Fade destroyed');
    }
}

// Auto-initialization with different presets
function initializeStaggeredFade() {
    if (typeof window !== 'undefined') {
        window.StaggeredFade = StaggeredFade;
        
        // Initialize with default options
        window.staggeredFade = new StaggeredFade();
        
        // Initialize subtle variant for cards
        if (document.querySelector('[data-animate="staggerFadeInSubtle"]')) {
            window.staggeredFadeSubtle = new StaggeredFade({
                selector: '[data-animate="staggerFadeInSubtle"]',
                ...StaggeredFade.presets.subtle
            });
        }
        
        // Initialize dramatic variant for hero sections
        if (document.querySelector('[data-animate="staggerFadeInDramatic"]')) {
            window.staggeredFadeDramatic = new StaggeredFade({
                selector: '[data-animate="staggerFadeInDramatic"]',
                ...StaggeredFade.presets.dramatic
            });
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStaggeredFade);
} else {
    initializeStaggeredFade();
}

export default StaggeredFade; 