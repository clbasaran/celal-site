/**
 * Portfolio OS - Scroll Watcher Module
 * Apple Design Language V5
 * Advanced scroll behavior tracking and management
 */

class ScrollWatcher {
    constructor(options = {}) {
        this.options = {
            throttleDelay: 16, // ~60fps
            debounceDelay: 100,
            sections: '[data-scroll-section]',
            triggers: '[data-scroll-trigger]',
            parallax: '[data-parallax]',
            reveal: '[data-scroll-reveal]',
            progress: '[data-scroll-progress]',
            ...options
        };
        
        this.state = {
            scrollY: 0,
            scrollDirection: 'down',
            scrollSpeed: 0,
            isScrolling: false,
            activeSection: null,
            progress: 0
        };
        
        this.observers = new Map();
        this.sections = new Map();
        this.parallaxElements = [];
        this.progressElements = [];
        this.callbacks = new Map();
        
        // Performance tracking
        this.metrics = {
            scrollEvents: 0,
            intersectionEvents: 0,
            parallaxUpdates: 0,
            averageScrollSpeed: 0,
            performance: []
        };
        
        this.init();
    }
    
    init() {
        try {
            this.setupScrollObserver();
            this.setupIntersectionObserver();
            this.setupParallaxElements();
            this.setupProgressElements();
            this.setupRevealElements();
            this.bindEvents();
            
            console.log('🔍 Scroll Watcher initialized');
            
        } catch (error) {
            console.error('❌ Scroll Watcher initialization failed:', error);
        }
    }
    
    setupScrollObserver() {
        let ticking = false;
        let lastScrollY = window.scrollY;
        let lastTimestamp = performance.now();
        
        const updateScroll = (timestamp) => {
            const currentScrollY = window.scrollY;
            const deltaY = currentScrollY - lastScrollY;
            const deltaTime = timestamp - lastTimestamp;
            
            // Update state
            this.state.scrollY = currentScrollY;
            this.state.scrollDirection = deltaY > 0 ? 'down' : 'up';
            this.state.scrollSpeed = Math.abs(deltaY / deltaTime) * 1000; // px/s
            this.state.isScrolling = true;
            
            // Calculate overall progress
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            this.state.progress = Math.min(currentScrollY / documentHeight, 1);
            
            // Update parallax elements
            this.updateParallax();
            
            // Update progress elements
            this.updateProgress();
            
            // Emit scroll event
            this.emit('scroll', {
                scrollY: currentScrollY,
                direction: this.state.scrollDirection,
                speed: this.state.scrollSpeed,
                progress: this.state.progress,
                timestamp
            });
            
            // Track metrics
            this.trackScrollEvent(deltaY, deltaTime);
            
            lastScrollY = currentScrollY;
            lastTimestamp = timestamp;
            ticking = false;
        };
        
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(updateScroll);
                ticking = true;
            }
        };
        
        // Debounced scroll end detection
        const scrollEndDebounced = this.debounce(() => {
            this.state.isScrolling = false;
            this.emit('scrollEnd', this.state);
        }, this.options.debounceDelay);
        
        window.addEventListener('scroll', () => {
            onScroll();
            scrollEndDebounced();
        }, { passive: true });
    }
    
    setupIntersectionObserver() {
        // Observer for sections
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const sectionId = entry.target.id || entry.target.dataset.section;
                
                if (entry.isIntersecting) {
                    this.state.activeSection = sectionId;
                    this.sections.set(sectionId, {
                        element: entry.target,
                        visible: true,
                        ratio: entry.intersectionRatio
                    });
                    
                    this.emit('sectionEnter', {
                        section: sectionId,
                        element: entry.target,
                        ratio: entry.intersectionRatio
                    });
                } else {
                    this.sections.set(sectionId, {
                        element: entry.target,
                        visible: false,
                        ratio: 0
                    });
                    
                    this.emit('sectionLeave', {
                        section: sectionId,
                        element: entry.target
                    });
                }
                
                this.metrics.intersectionEvents++;
            });
        }, {
            threshold: [0, 0.25, 0.5, 0.75, 1],
            rootMargin: '0px'
        });
        
        // Observe sections
        document.querySelectorAll(this.options.sections).forEach(section => {
            sectionObserver.observe(section);
        });
        
        this.observers.set('sections', sectionObserver);
    }
    
    setupParallaxElements() {
        this.parallaxElements = Array.from(document.querySelectorAll(this.options.parallax))
            .map(element => ({
                element,
                speed: parseFloat(element.dataset.parallaxSpeed) || 0.5,
                direction: element.dataset.parallaxDirection || 'vertical',
                offset: parseFloat(element.dataset.parallaxOffset) || 0,
                bounds: element.getBoundingClientRect()
            }));
    }
    
    setupProgressElements() {
        this.progressElements = Array.from(document.querySelectorAll(this.options.progress))
            .map(element => ({
                element,
                type: element.dataset.progressType || 'bar',
                target: element.dataset.progressTarget || 'document'
            }));
    }
    
    setupRevealElements() {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const delay = parseInt(element.dataset.revealDelay) || 0;
                    const animation = element.dataset.revealAnimation || 'fadeInUp';
                    
                    setTimeout(() => {
                        element.classList.add('revealed');
                        element.style.animationName = animation;
                        
                        this.emit('elementRevealed', {
                            element,
                            animation,
                            delay
                        });
                    }, delay);
                    
                    revealObserver.unobserve(element);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        document.querySelectorAll(this.options.reveal).forEach(element => {
            element.classList.add('scroll-reveal');
            revealObserver.observe(element);
        });
        
        this.observers.set('reveal', revealObserver);
    }
    
    updateParallax() {
        if (this.parallaxElements.length === 0) return;
        
        const scrollY = this.state.scrollY;
        
        this.parallaxElements.forEach(({ element, speed, direction, offset }) => {
            const elementTop = element.offsetTop;
            const elementHeight = element.offsetHeight;
            const windowHeight = window.innerHeight;
            
            // Check if element is in viewport
            if (scrollY + windowHeight > elementTop && scrollY < elementTop + elementHeight) {
                const yPos = scrollY - elementTop;
                let transform = '';
                
                switch (direction) {
                    case 'vertical':
                        transform = `translateY(${(yPos * speed) + offset}px)`;
                        break;
                    case 'horizontal':
                        transform = `translateX(${(yPos * speed) + offset}px)`;
                        break;
                    case 'scale':
                        const scale = 1 + (yPos * speed * 0.001);
                        transform = `scale(${scale})`;
                        break;
                    case 'rotate':
                        transform = `rotate(${(yPos * speed) + offset}deg)`;
                        break;
                }
                
                element.style.transform = transform;
                this.metrics.parallaxUpdates++;
            }
        });
    }
    
    updateProgress() {
        this.progressElements.forEach(({ element, type, target }) => {
            let progress = 0;
            
            if (target === 'document') {
                progress = this.state.progress;
            } else {
                const targetElement = document.querySelector(target);
                if (targetElement) {
                    const rect = targetElement.getBoundingClientRect();
                    const elementTop = rect.top + window.scrollY;
                    const elementHeight = rect.height;
                    const scrollProgress = (this.state.scrollY - elementTop) / elementHeight;
                    progress = Math.max(0, Math.min(1, scrollProgress));
                }
            }
            
            switch (type) {
                case 'bar':
                    element.style.width = `${progress * 100}%`;
                    break;
                case 'circle':
                    const circumference = 2 * Math.PI * 40; // assuming radius of 40
                    const offset = circumference - (progress * circumference);
                    element.style.strokeDashoffset = offset;
                    break;
                case 'number':
                    element.textContent = Math.round(progress * 100);
                    break;
            }
            
            element.setAttribute('data-progress', progress);
        });
    }
    
    bindEvents() {
        // Handle resize
        window.addEventListener('resize', this.debounce(() => {
            this.setupParallaxElements();
            this.emit('resize', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }, 250));
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.setupParallaxElements();
            }
        });
    }
    
    // Event System
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.callbacks.has(event)) {
            const callbacks = this.callbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in scroll watcher callback for ${event}:`, error);
                }
            });
        }
    }
    
    // Public API
    getState() {
        return { ...this.state };
    }
    
    getSections() {
        return new Map(this.sections);
    }
    
    scrollToSection(sectionId, options = {}) {
        const section = document.getElementById(sectionId) || 
                      document.querySelector(`[data-section="${sectionId}"]`);
        
        if (section) {
            const offset = options.offset || 0;
            const behavior = options.behavior || 'smooth';
            
            const targetY = section.offsetTop + offset;
            
            window.scrollTo({
                top: targetY,
                behavior
            });
            
            this.emit('scrollToSection', {
                section: sectionId,
                targetY,
                options
            });
        }
    }
    
    addParallaxElement(element, config = {}) {
        const parallaxConfig = {
            element,
            speed: config.speed || 0.5,
            direction: config.direction || 'vertical',
            offset: config.offset || 0,
            bounds: element.getBoundingClientRect()
        };
        
        this.parallaxElements.push(parallaxConfig);
        return parallaxConfig;
    }
    
    removeParallaxElement(element) {
        this.parallaxElements = this.parallaxElements.filter(
            config => config.element !== element
        );
    }
    
    trackScrollEvent(deltaY, deltaTime) {
        this.metrics.scrollEvents++;
        
        const speed = Math.abs(deltaY / deltaTime) * 1000;
        this.metrics.averageScrollSpeed = 
            (this.metrics.averageScrollSpeed + speed) / 2;
        
        // Keep performance history
        this.metrics.performance.push({
            timestamp: Date.now(),
            speed,
            deltaY,
            deltaTime
        });
        
        // Keep only last 100 records
        if (this.metrics.performance.length > 100) {
            this.metrics.performance.shift();
        }
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            sectionsVisible: Array.from(this.sections.values())
                .filter(s => s.visible).length,
            parallaxElementsCount: this.parallaxElements.length,
            currentSection: this.state.activeSection
        };
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
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    destroy() {
        // Disconnect observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // Clear callbacks
        this.callbacks.clear();
        
        // Reset arrays
        this.parallaxElements = [];
        this.progressElements = [];
        this.sections.clear();
        
        console.log('🔍 Scroll Watcher destroyed');
    }
}

// Auto-initialization
function initializeScrollWatcher() {
    if (typeof window !== 'undefined') {
        window.ScrollWatcher = ScrollWatcher;
        window.scrollWatcher = new ScrollWatcher();
        
        // Common scroll patterns
        window.scrollWatcher.on('scroll', ({ progress }) => {
            document.documentElement.style.setProperty('--scroll-progress', progress);
        });
        
        // Auto-hide/show navbar on scroll
        let lastScrollY = 0;
        window.scrollWatcher.on('scroll', ({ scrollY, direction }) => {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                if (direction === 'down' && scrollY > 100) {
                    navbar.classList.add('navbar-hidden');
                } else if (direction === 'up' || scrollY < 100) {
                    navbar.classList.remove('navbar-hidden');
                }
            }
            lastScrollY = scrollY;
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeScrollWatcher);
} else {
    initializeScrollWatcher();
}

export default ScrollWatcher; 