/**
 * Portfolio OS - Parallax Module
 * Apple Design Language V5
 * High-performance parallax effects with smooth animations
 */

class ParallaxEffect {
    constructor(options = {}) {
        this.options = {
            selector: '[data-parallax]',
            speed: 0.5,
            offset: 0,
            threshold: 0.1,
            smooth: true,
            mobile: false,
            direction: 'vertical', // 'vertical' | 'horizontal' | 'both'
            intensity: 1,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            ...options
        };
        
        this.elements = new Map();
        this.isScrolling = false;
        this.ticking = false;
        this.isMobile = false;
        this.scrollY = 0;
        this.scrollX = 0;
        this.windowHeight = 0;
        this.windowWidth = 0;
        
        // Performance tracking
        this.metrics = {
            elementsProcessed: 0,
            averageFrameTime: 0,
            lastFrameTime: 0,
            skippedFrames: 0,
            totalFrames: 0
        };
        
        this.init();
    }
    
    init() {
        try {
            this.detectMobile();
            this.setupViewport();
            this.findElements();
            this.setupEventListeners();
            this.startAnimation();
            
            console.log('🎭 Parallax Effect initialized with', this.elements.size, 'elements');
            
        } catch (error) {
            console.error('❌ Parallax initialization failed:', error);
        }
    }
    
    detectMobile() {
        this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       window.innerWidth <= 768;
        
        if (this.isMobile && !this.options.mobile) {
            console.log('📱 Parallax disabled on mobile for performance');
            return;
        }
    }
    
    setupViewport() {
        this.updateViewport();
    }
    
    updateViewport() {
        this.windowHeight = window.innerHeight;
        this.windowWidth = window.innerWidth;
        this.scrollY = window.pageYOffset || document.documentElement.scrollTop;
        this.scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    }
    
    findElements() {
        const elements = document.querySelectorAll(this.options.selector);
        
        elements.forEach((element, index) => {
            const elementData = this.processElement(element, index);
            this.elements.set(element, elementData);
        });
        
        this.metrics.elementsProcessed = this.elements.size;
    }
    
    processElement(element, index) {
        const rect = element.getBoundingClientRect();
        
        // Get element-specific options from data attributes
        const speed = parseFloat(element.dataset.parallaxSpeed) || this.options.speed;
        const offset = parseFloat(element.dataset.parallaxOffset) || this.options.offset;
        const direction = element.dataset.parallaxDirection || this.options.direction;
        const intensity = parseFloat(element.dataset.parallaxIntensity) || this.options.intensity;
        
        return {
            element,
            index,
            speed,
            offset,
            direction,
            intensity,
            originalTransform: element.style.transform || '',
            bounds: {
                top: rect.top + this.scrollY,
                left: rect.left + this.scrollX,
                width: rect.width,
                height: rect.height
            },
            isInView: false,
            lastTransform: { x: 0, y: 0 }
        };
    }
    
    setupEventListeners() {
        // Scroll listener with throttling
        let scrollTimeout;
        const handleScroll = () => {
            this.isScrolling = true;
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.isScrolling = false;
            }, 150);
            
            this.requestUpdate();
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Resize listener with debouncing
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        };
        
        window.addEventListener('resize', handleResize);
        
        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 500);
        });
        
        // Page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimation();
            } else {
                this.resumeAnimation();
            }
        });
    }
    
    handleResize() {
        this.detectMobile();
        this.updateViewport();
        this.recalculateBounds();
        this.requestUpdate();
    }
    
    recalculateBounds() {
        this.elements.forEach((data, element) => {
            const rect = element.getBoundingClientRect();
            data.bounds = {
                top: rect.top + this.scrollY,
                left: rect.left + this.scrollX,
                width: rect.width,
                height: rect.height
            };
        });
    }
    
    requestUpdate() {
        if (!this.ticking) {
            requestAnimationFrame(() => this.update());
            this.ticking = true;
        }
    }
    
    update() {
        if (this.isMobile && !this.options.mobile) {
            this.ticking = false;
            return;
        }
        
        const startTime = performance.now();
        
        this.updateViewport();
        
        this.elements.forEach((data) => {
            this.updateElement(data);
        });
        
        // Performance tracking
        const frameTime = performance.now() - startTime;
        this.updateMetrics(frameTime);
        
        this.ticking = false;
    }
    
    updateElement(data) {
        const { element, speed, offset, direction, intensity, bounds } = data;
        
        // Check if element is in viewport (with buffer)
        const buffer = this.windowHeight * 0.2; // 20% buffer
        const isInView = (
            bounds.top < this.scrollY + this.windowHeight + buffer &&
            bounds.top + bounds.height > this.scrollY - buffer
        );
        
        if (!isInView && !data.isInView) {
            return; // Skip if not in view
        }
        
        data.isInView = isInView;
        
        // Calculate parallax offset
        const elementCenter = bounds.top + bounds.height / 2;
        const viewportCenter = this.scrollY + this.windowHeight / 2;
        const relativePosition = elementCenter - viewportCenter;
        
        let translateX = 0;
        let translateY = 0;
        
        switch (direction) {
            case 'vertical':
                translateY = (relativePosition * speed * intensity) + offset;
                break;
            case 'horizontal':
                translateX = (relativePosition * speed * intensity) + offset;
                break;
            case 'both':
                translateY = (relativePosition * speed * intensity) + offset;
                translateX = (relativePosition * speed * intensity * 0.5) + offset;
                break;
        }
        
        // Apply smooth interpolation if enabled
        if (this.options.smooth) {
            const lerp = 0.1;
            translateX = this.lerp(data.lastTransform.x, translateX, lerp);
            translateY = this.lerp(data.lastTransform.y, translateY, lerp);
        }
        
        // Store last transform for smooth interpolation
        data.lastTransform = { x: translateX, y: translateY };
        
        // Apply transform
        this.applyTransform(element, translateX, translateY, data.originalTransform);
    }
    
    applyTransform(element, x, y, originalTransform) {
        const transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) ${originalTransform}`;
        
        // Use will-change for better performance
        element.style.willChange = 'transform';
        element.style.transform = transform;
        
        // Remove will-change after animation to save memory
        if (!this.isScrolling) {
            setTimeout(() => {
                element.style.willChange = 'auto';
            }, 500);
        }
    }
    
    lerp(start, end, factor) {
        return start * (1 - factor) + end * factor;
    }
    
    startAnimation() {
        this.requestUpdate();
    }
    
    pauseAnimation() {
        this.ticking = false;
        
        // Remove will-change to save resources
        this.elements.forEach((data) => {
            data.element.style.willChange = 'auto';
        });
    }
    
    resumeAnimation() {
        this.requestUpdate();
    }
    
    updateMetrics(frameTime) {
        this.metrics.totalFrames++;
        this.metrics.lastFrameTime = frameTime;
        
        // Calculate average frame time
        if (this.metrics.averageFrameTime === 0) {
            this.metrics.averageFrameTime = frameTime;
        } else {
            this.metrics.averageFrameTime = (
                (this.metrics.averageFrameTime * 0.9) + (frameTime * 0.1)
            );
        }
        
        // Track skipped frames (> 16.67ms for 60fps)
        if (frameTime > 16.67) {
            this.metrics.skippedFrames++;
        }
    }
    
    // Public API methods
    addElement(element) {
        if (!element || this.elements.has(element)) return;
        
        const elementData = this.processElement(element, this.elements.size);
        this.elements.set(element, elementData);
        this.metrics.elementsProcessed++;
        
        this.requestUpdate();
    }
    
    removeElement(element) {
        if (!this.elements.has(element)) return;
        
        // Reset transform
        element.style.transform = '';
        element.style.willChange = 'auto';
        
        this.elements.delete(element);
    }
    
    updateElementOptions(element, options) {
        const data = this.elements.get(element);
        if (!data) return;
        
        Object.assign(data, options);
        this.requestUpdate();
    }
    
    setGlobalSpeed(speed) {
        this.options.speed = speed;
        
        this.elements.forEach((data) => {
            if (!data.element.dataset.parallaxSpeed) {
                data.speed = speed;
            }
        });
        
        this.requestUpdate();
    }
    
    disable() {
        this.pauseAnimation();
        
        this.elements.forEach((data) => {
            data.element.style.transform = data.originalTransform;
            data.element.style.willChange = 'auto';
        });
    }
    
    enable() {
        this.resumeAnimation();
    }
    
    refresh() {
        this.recalculateBounds();
        this.requestUpdate();
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            elementsActive: this.elements.size,
            fps: this.metrics.averageFrameTime > 0 ? 1000 / this.metrics.averageFrameTime : 0,
            dropRate: this.metrics.totalFrames > 0 ? 
                (this.metrics.skippedFrames / this.metrics.totalFrames) * 100 : 0
        };
    }
    
    destroy() {
        this.pauseAnimation();
        
        // Remove all event listeners
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Reset all elements
        this.elements.forEach((data) => {
            data.element.style.transform = data.originalTransform;
            data.element.style.willChange = 'auto';
        });
        
        this.elements.clear();
        
        console.log('🎭 Parallax Effect destroyed');
    }
}

// Advanced Parallax Effects Collection
class AdvancedParallaxEffects {
    constructor() {
        this.effects = new Map();
        this.init();
    }
    
    init() {
        // Floating elements effect
        this.createFloatingEffect();
        
        // Depth layer effect
        this.createDepthEffect();
        
        // Rotate on scroll effect
        this.createRotateEffect();
        
        // Scale on scroll effect
        this.createScaleEffect();
    }
    
    createFloatingEffect() {
        const floatingElements = document.querySelectorAll('[data-parallax="floating"]');
        
        floatingElements.forEach((element, index) => {
            const amplitude = 20 + (index % 3) * 10;
            const frequency = 0.002 + (index % 2) * 0.001;
            const phase = index * Math.PI / 3;
            
            let animationId;
            const animate = () => {
                const time = Date.now();
                const y = Math.sin(time * frequency + phase) * amplitude;
                
                element.style.transform = `translateY(${y}px)`;
                animationId = requestAnimationFrame(animate);
            };
            
            animate();
            
            this.effects.set(element, {
                type: 'floating',
                cleanup: () => cancelAnimationFrame(animationId)
            });
        });
    }
    
    createDepthEffect() {
        const depthElements = document.querySelectorAll('[data-parallax="depth"]');
        
        depthElements.forEach((element) => {
            const depth = parseFloat(element.dataset.depth) || 0.5;
            const parallax = new ParallaxEffect({
                selector: element,
                speed: depth,
                direction: 'vertical'
            });
            
            this.effects.set(element, {
                type: 'depth',
                instance: parallax,
                cleanup: () => parallax.destroy()
            });
        });
    }
    
    createRotateEffect() {
        const rotateElements = document.querySelectorAll('[data-parallax="rotate"]');
        
        const handleScroll = () => {
            const scrollPercent = window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight);
            
            rotateElements.forEach((element) => {
                const maxRotation = parseFloat(element.dataset.maxRotation) || 360;
                const rotation = scrollPercent * maxRotation;
                
                element.style.transform = `rotate(${rotation}deg)`;
            });
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        this.effects.set('rotate', {
            type: 'rotate',
            cleanup: () => window.removeEventListener('scroll', handleScroll)
        });
    }
    
    createScaleEffect() {
        const scaleElements = document.querySelectorAll('[data-parallax="scale"]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const element = entry.target;
                const minScale = parseFloat(element.dataset.minScale) || 0.8;
                const maxScale = parseFloat(element.dataset.maxScale) || 1.2;
                
                const scale = minScale + (entry.intersectionRatio * (maxScale - minScale));
                element.style.transform = `scale(${scale})`;
            });
        }, {
            threshold: Array.from({length: 101}, (_, i) => i / 100)
        });
        
        scaleElements.forEach((element) => {
            observer.observe(element);
        });
        
        this.effects.set('scale', {
            type: 'scale',
            cleanup: () => observer.disconnect()
        });
    }
    
    destroy() {
        this.effects.forEach((effect) => {
            if (effect.cleanup) {
                effect.cleanup();
            }
        });
        
        this.effects.clear();
    }
}

// Auto-initialization
function initializeParallax() {
    if (typeof window !== 'undefined') {
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            console.log('🎭 Parallax disabled due to reduced motion preference');
            return;
        }
        
        window.ParallaxEffect = ParallaxEffect;
        window.AdvancedParallaxEffects = AdvancedParallaxEffects;
        
        // Create global instances
        window.parallax = new ParallaxEffect();
        window.advancedParallax = new AdvancedParallaxEffects();
        
        // Listen for dynamic content
        document.addEventListener('contentAdded', (event) => {
            const newElements = event.detail?.container?.querySelectorAll('[data-parallax]');
            
            if (newElements?.length) {
                newElements.forEach(element => {
                    window.parallax.addElement(element);
                });
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeParallax);
} else {
    initializeParallax();
}

export { ParallaxEffect, AdvancedParallaxEffects }; 