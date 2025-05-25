/**
 * Portfolio OS - Observer Module
 * Apple Design Language V5
 * Enterprise-grade intersection observer with lazy loading and animations
 */

class AdvancedObserver {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px 0px',
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
            enableLazyLoading: true,
            enableAnimations: true,
            enableAnalytics: true,
            debounceDelay: 100,
            animationDelay: 150,
            ...options
        };
        
        this.observers = new Map();
        this.observedElements = new Set();
        this.animatedElements = new Set();
        this.lazyImages = new Set();
        
        // Performance tracking
        this.metrics = {
            elementsObserved: 0,
            animationsTriggered: 0,
            imagesLoaded: 0,
            intersections: 0,
            averageProcessingTime: 0
        };
        
        this.init();
    }
    
    init() {
        try {
            this.setupMainObserver();
            this.setupLazyLoadObserver();
            this.setupAnimationObserver();
            this.findElements();
            this.startObserving();
            
            console.log('👁️ Advanced Observer initialized');
            
        } catch (error) {
            console.error('❌ Observer initialization failed:', error);
        }
    }
    
    setupMainObserver() {
        const mainObserver = new IntersectionObserver(
            this.handleMainIntersection.bind(this),
            {
                rootMargin: this.options.rootMargin,
                threshold: this.options.threshold
            }
        );
        
        this.observers.set('main', mainObserver);
    }
    
    setupLazyLoadObserver() {
        if (!this.options.enableLazyLoading) return;
        
        const lazyObserver = new IntersectionObserver(
            this.handleLazyIntersection.bind(this),
            {
                rootMargin: '200px 0px',
                threshold: 0.01
            }
        );
        
        this.observers.set('lazy', lazyObserver);
    }
    
    setupAnimationObserver() {
        if (!this.options.enableAnimations) return;
        
        const animationObserver = new IntersectionObserver(
            this.handleAnimationIntersection.bind(this),
            {
                rootMargin: '100px 0px',
                threshold: 0.15
            }
        );
        
        this.observers.set('animation', animationObserver);
    }
    
    findElements() {
        // Find animation elements
        const animationElements = document.querySelectorAll('[data-animate]:not(.animated)');
        animationElements.forEach(element => {
            this.observeElement(element, 'animation');
        });
        
        // Find lazy load images
        const lazyImages = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        lazyImages.forEach(img => {
            this.observeElement(img, 'lazy');
            this.lazyImages.add(img);
        });
        
        // Find elements with intersection data
        const observableElements = document.querySelectorAll('[data-observe]');
        observableElements.forEach(element => {
            this.observeElement(element, 'main');
        });
        
        this.metrics.elementsObserved = this.observedElements.size;
    }
    
    observeElement(element, observerType = 'main') {
        const observer = this.observers.get(observerType);
        if (!observer) return;
        
        observer.observe(element);
        this.observedElements.add(element);
        
        // Store observer type on element
        element.dataset.observerType = observerType;
    }
    
    unobserveElement(element) {
        const observerType = element.dataset.observerType;
        const observer = this.observers.get(observerType);
        
        if (observer) {
            observer.unobserve(element);
        }
        
        this.observedElements.delete(element);
        this.animatedElements.delete(element);
        this.lazyImages.delete(element);
    }
    
    handleMainIntersection(entries) {
        entries.forEach(entry => {
            this.processMainEntry(entry);
        });
    }
    
    processMainEntry(entry) {
        const startTime = performance.now();
        const element = entry.target;
        
        // Update intersection data
        this.updateIntersectionData(element, entry);
        
        // Dispatch custom events
        this.dispatchIntersectionEvent(element, entry);
        
        // Analytics tracking
        if (this.options.enableAnalytics) {
            this.trackIntersection(element, entry);
        }
        
        // Update metrics
        this.metrics.intersections++;
        const processingTime = performance.now() - startTime;
        this.updateProcessingTime(processingTime);
    }
    
    handleLazyIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.loadLazyImage(entry.target);
            }
        });
    }
    
    loadLazyImage(img) {
        if (img.dataset.loaded === 'true') return;
        
        const startTime = performance.now();
        
        // Handle different lazy loading scenarios
        if (img.dataset.src) {
            // Custom data-src lazy loading
            this.loadImageWithDataSrc(img);
        } else if (img.loading === 'lazy') {
            // Native lazy loading fallback
            this.handleNativeLazyLoad(img);
        }
        
        // Mark as processed
        img.dataset.loaded = 'true';
        this.metrics.imagesLoaded++;
        
        // Unobserve after loading
        setTimeout(() => {
            this.unobserveElement(img);
        }, 100);
        
        const loadTime = performance.now() - startTime;
        console.log(`🖼️ Lazy image loaded in ${loadTime.toFixed(2)}ms`);
    }
    
    loadImageWithDataSrc(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        
        // Create a new image to preload
        const tempImg = new Image();
        
        tempImg.onload = () => {
            // Apply loaded image
            img.src = src;
            if (srcset) img.srcset = srcset;
            
            // Add loaded class for animations
            img.classList.add('lazy-loaded');
            
            // Dispatch load event
            this.dispatchImageLoadEvent(img);
        };
        
        tempImg.onerror = () => {
            console.warn('Failed to load lazy image:', src);
            img.classList.add('lazy-error');
        };
        
        // Start loading
        if (srcset) tempImg.srcset = srcset;
        tempImg.src = src;
    }
    
    handleNativeLazyLoad(img) {
        // For native lazy loading, just add loaded class
        img.classList.add('lazy-loaded');
        this.dispatchImageLoadEvent(img);
    }
    
    handleAnimationIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.triggerAnimation(entry.target);
            }
        });
    }
    
    triggerAnimation(element) {
        if (this.animatedElements.has(element)) return;
        
        const animationType = element.dataset.animate;
        const delay = parseInt(element.dataset.delay) || 0;
        
        setTimeout(() => {
            this.applyAnimation(element, animationType);
            this.animatedElements.add(element);
            this.metrics.animationsTriggered++;
            
            // Unobserve after animation
            setTimeout(() => {
                this.unobserveElement(element);
            }, 1000);
            
        }, delay);
    }
    
    applyAnimation(element, type) {
        element.classList.add('animated', `animate-${type}`);
        
        // Dispatch animation event
        const event = new CustomEvent('elementAnimated', {
            detail: {
                element,
                animationType: type,
                timestamp: performance.now()
            }
        });
        
        element.dispatchEvent(event);
        window.dispatchEvent(event);
        
        console.log(`🎭 Animation triggered: ${type} on`, element);
    }
    
    updateIntersectionData(element, entry) {
        // Store intersection data on element
        element.dataset.intersectionRatio = entry.intersectionRatio.toFixed(3);
        element.dataset.isIntersecting = entry.isIntersecting;
        element.dataset.lastIntersection = Date.now();
        
        // Add/remove intersection classes
        element.classList.toggle('in-view', entry.isIntersecting);
        element.classList.toggle('fully-visible', entry.intersectionRatio >= 0.9);
        element.classList.toggle('partially-visible', 
            entry.intersectionRatio > 0 && entry.intersectionRatio < 0.9);
    }
    
    dispatchIntersectionEvent(element, entry) {
        const event = new CustomEvent('intersection', {
            detail: {
                element,
                entry,
                ratio: entry.intersectionRatio,
                isIntersecting: entry.isIntersecting,
                timestamp: performance.now()
            }
        });
        
        element.dispatchEvent(event);
        window.dispatchEvent(event);
    }
    
    dispatchImageLoadEvent(img) {
        const event = new CustomEvent('lazyImageLoaded', {
            detail: {
                image: img,
                src: img.src,
                timestamp: performance.now()
            }
        });
        
        img.dispatchEvent(event);
        window.dispatchEvent(event);
    }
    
    trackIntersection(element, entry) {
        // Analytics tracking for intersection events
        const trackingData = {
            elementId: element.id || 'unknown',
            elementClass: element.className,
            ratio: entry.intersectionRatio,
            isIntersecting: entry.isIntersecting,
            timestamp: Date.now()
        };
        
        // Send to analytics (implement your analytics service)
        this.sendAnalytics('intersection', trackingData);
    }
    
    sendAnalytics(eventType, data) {
        // Placeholder for analytics implementation
        console.log(`📊 Analytics: ${eventType}`, data);
    }
    
    updateProcessingTime(time) {
        if (this.metrics.averageProcessingTime === 0) {
            this.metrics.averageProcessingTime = time;
        } else {
            this.metrics.averageProcessingTime = 
                (this.metrics.averageProcessingTime * 0.9) + (time * 0.1);
        }
    }
    
    startObserving() {
        // Start observing all elements
        this.observedElements.forEach(element => {
            const observerType = element.dataset.observerType || 'main';
            const observer = this.observers.get(observerType);
            if (observer) {
                observer.observe(element);
            }
        });
    }
    
    // Public API methods
    observe(element, type = 'main') {
        this.observeElement(element, type);
    }
    
    unobserve(element) {
        this.unobserveElement(element);
    }
    
    refresh() {
        // Disconnect all observers
        this.disconnect();
        
        // Re-find elements
        this.findElements();
        
        // Start observing again
        this.startObserving();
    }
    
    addElements(elements, type = 'main') {
        elements.forEach(element => {
            this.observeElement(element, type);
        });
    }
    
    triggerAnimationManually(element) {
        const animationType = element.dataset.animate;
        if (animationType) {
            this.applyAnimation(element, animationType);
            this.animatedElements.add(element);
        }
    }
    
    resetAnimation(element) {
        element.classList.remove('animated');
        element.className = element.className.replace(/animate-\w+/g, '');
        this.animatedElements.delete(element);
        
        // Re-observe for animation
        this.observeElement(element, 'animation');
    }
    
    getVisibleElements() {
        return Array.from(this.observedElements).filter(element => 
            element.classList.contains('in-view')
        );
    }
    
    getElementVisibility(element) {
        return {
            isIntersecting: element.dataset.isIntersecting === 'true',
            ratio: parseFloat(element.dataset.intersectionRatio) || 0,
            lastIntersection: parseInt(element.dataset.lastIntersection) || 0
        };
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            observersActive: this.observers.size,
            elementsCurrentlyObserved: this.observedElements.size,
            animatedElementsCount: this.animatedElements.size,
            lazyImagesCount: this.lazyImages.size
        };
    }
    
    disconnect() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        
        this.observedElements.clear();
        this.animatedElements.clear();
        this.lazyImages.clear();
    }
    
    destroy() {
        this.disconnect();
        this.observers.clear();
        
        console.log('👁️ Advanced Observer destroyed');
    }
}

// Specialized observers for specific use cases
class CountUpObserver {
    constructor(options = {}) {
        this.options = {
            selector: '[data-count]',
            duration: 2000,
            easing: 'easeOutQuart',
            ...options
        };
        
        this.init();
    }
    
    init() {
        const observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            { threshold: 0.5 }
        );
        
        document.querySelectorAll(this.options.selector).forEach(element => {
            observer.observe(element);
        });
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.counted) {
                this.animateCount(entry.target);
            }
        });
    }
    
    animateCount(element) {
        const target = parseInt(element.dataset.count) || 0;
        const duration = parseInt(element.dataset.duration) || this.options.duration;
        
        let start = 0;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const eased = this.easeOutQuart(progress);
            const current = Math.floor(start + (target - start) * eased);
            
            element.textContent = this.formatNumber(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = this.formatNumber(target);
                element.dataset.counted = 'true';
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    easeOutQuart(t) {
        return 1 - (--t) * t * t * t;
    }
    
    formatNumber(num) {
        // Add formatting (commas, etc.)
        return num.toLocaleString();
    }
}

// Auto-initialization
function initializeObserver() {
    if (typeof window !== 'undefined') {
        window.AdvancedObserver = AdvancedObserver;
        window.CountUpObserver = CountUpObserver;
        
        // Create global instances
        window.observer = new AdvancedObserver();
        window.countUpObserver = new CountUpObserver();
        
        // Listen for dynamic content
        document.addEventListener('contentAdded', (event) => {
            if (event.detail?.container) {
                const container = event.detail.container;
                
                // Find new observable elements
                const newAnimationElements = container.querySelectorAll('[data-animate]:not(.animated)');
                const newLazyImages = container.querySelectorAll('img[data-src], img[loading="lazy"]');
                const newObservableElements = container.querySelectorAll('[data-observe]');
                
                // Add to observer
                if (newAnimationElements.length) {
                    window.observer.addElements(Array.from(newAnimationElements), 'animation');
                }
                
                if (newLazyImages.length) {
                    window.observer.addElements(Array.from(newLazyImages), 'lazy');
                }
                
                if (newObservableElements.length) {
                    window.observer.addElements(Array.from(newObservableElements), 'main');
                }
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeObserver);
} else {
    initializeObserver();
}

export { AdvancedObserver, CountUpObserver }; 