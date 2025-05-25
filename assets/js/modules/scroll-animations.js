/**
 * Scroll Animations Module
 * Advanced scroll-triggered animations with performance optimization
 * and accessibility support
 * 
 * @version 2.0.0
 * @author Celal Başaran
 * @license MIT
 */

class ScrollAnimations {
    constructor(options = {}) {
        this.options = {
            threshold: options.threshold || 0.1,
            rootMargin: options.rootMargin || '0px 0px -50px 0px',
            animationDuration: options.animationDuration || 800,
            animationEasing: options.animationEasing || 'cubic-bezier(0.4, 0, 0.2, 1)',
            staggerDelay: options.staggerDelay || 100,
            respectReducedMotion: options.respectReducedMotion !== false,
            enableDebug: options.enableDebug || false,
            ...options
        };

        this.animations = new Map();
        this.observer = null;
        this.isReducedMotion = false;
        this.animationQueue = [];
        this.isProcessingQueue = false;
        
        this.metrics = {
            totalAnimations: 0,
            completedAnimations: 0,
            averageAnimationTime: 0,
            performanceScore: 100
        };

        this.animationTypes = {
            fadeIn: this.createFadeInAnimation.bind(this),
            fadeInUp: this.createFadeInUpAnimation.bind(this),
            fadeInDown: this.createFadeInDownAnimation.bind(this),
            fadeInLeft: this.createFadeInLeftAnimation.bind(this),
            fadeInRight: this.createFadeInRightAnimation.bind(this),
            slideUp: this.createSlideUpAnimation.bind(this),
            slideDown: this.createSlideDownAnimation.bind(this),
            slideLeft: this.createSlideLeftAnimation.bind(this),
            slideRight: this.createSlideRightAnimation.bind(this),
            scaleIn: this.createScaleInAnimation.bind(this),
            scaleOut: this.createScaleOutAnimation.bind(this),
            rotateIn: this.createRotateInAnimation.bind(this),
            flipIn: this.createFlipInAnimation.bind(this),
            bounceIn: this.createBounceInAnimation.bind(this),
            elastic: this.createElasticAnimation.bind(this),
            typewriter: this.createTypewriterAnimation.bind(this),
            countUp: this.createCountUpAnimation.bind(this),
            progressBar: this.createProgressBarAnimation.bind(this),
            morphing: this.createMorphingAnimation.bind(this),
            parallaxText: this.createParallaxTextAnimation.bind(this)
        };

        this.init();
    }

    init() {
        try {
            this.checkReducedMotion();
            this.setupIntersectionObserver();
            this.scanForAnimations();
            this.setupEventListeners();
            
            if (this.options.enableDebug) {
                this.setupDebugPanel();
            }
            
            this.dispatchEvent('scrollAnimations:initialized', {
                totalAnimations: this.animations.size,
                reducedMotion: this.isReducedMotion
            });
            
            console.log(`Scroll Animations initialized with ${this.animations.size} animations`);
        } catch (error) {
            console.error('Scroll Animations initialization failed:', error);
        }
    }

    checkReducedMotion() {
        if (!this.options.respectReducedMotion) return;
        
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Listen for changes
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addEventListener('change', (e) => {
            this.isReducedMotion = e.matches;
            this.updateAnimationsForMotionPreference();
        });
    }

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                threshold: this.options.threshold,
                rootMargin: this.options.rootMargin
            }
        );
    }

    scanForAnimations() {
        const elements = document.querySelectorAll('[data-animate]');
        
        elements.forEach((element, index) => {
            const animationType = element.dataset.animate;
            const delay = parseInt(element.dataset.animateDelay) || 0;
            const duration = parseInt(element.dataset.animateDuration) || this.options.animationDuration;
            const stagger = element.dataset.animateStagger === 'true';
            const repeat = element.dataset.animateRepeat === 'true';
            const trigger = element.dataset.animateTrigger || 'intersection';
            
            const animationConfig = {
                element,
                type: animationType,
                delay: stagger ? delay + (index * this.options.staggerDelay) : delay,
                duration,
                repeat,
                trigger,
                state: 'pending',
                startTime: null,
                endTime: null
            };
            
            this.animations.set(element, animationConfig);
            
            if (trigger === 'intersection') {
                this.observer.observe(element);
            }
            
            // Prepare element for animation
            this.prepareElement(element, animationType);
        });
    }

    prepareElement(element, animationType) {
        if (this.isReducedMotion) return;
        
        // Set initial styles based on animation type
        const initialStyles = this.getInitialStyles(animationType);
        Object.assign(element.style, initialStyles);
        
        // Add animation class
        element.classList.add('scroll-animate-element');
    }

    getInitialStyles(animationType) {
        const styles = {
            transition: 'none',
            willChange: 'transform, opacity'
        };
        
        switch (animationType) {
            case 'fadeIn':
                styles.opacity = '0';
                break;
            case 'fadeInUp':
                styles.opacity = '0';
                styles.transform = 'translateY(30px)';
                break;
            case 'fadeInDown':
                styles.opacity = '0';
                styles.transform = 'translateY(-30px)';
                break;
            case 'fadeInLeft':
                styles.opacity = '0';
                styles.transform = 'translateX(-30px)';
                break;
            case 'fadeInRight':
                styles.opacity = '0';
                styles.transform = 'translateX(30px)';
                break;
            case 'slideUp':
                styles.transform = 'translateY(100%)';
                break;
            case 'slideDown':
                styles.transform = 'translateY(-100%)';
                break;
            case 'slideLeft':
                styles.transform = 'translateX(100%)';
                break;
            case 'slideRight':
                styles.transform = 'translateX(-100%)';
                break;
            case 'scaleIn':
                styles.opacity = '0';
                styles.transform = 'scale(0.8)';
                break;
            case 'scaleOut':
                styles.opacity = '0';
                styles.transform = 'scale(1.2)';
                break;
            case 'rotateIn':
                styles.opacity = '0';
                styles.transform = 'rotate(-180deg) scale(0.8)';
                break;
            case 'flipIn':
                styles.opacity = '0';
                styles.transform = 'perspective(400px) rotateY(-90deg)';
                break;
            case 'bounceIn':
                styles.opacity = '0';
                styles.transform = 'scale(0.3)';
                break;
            case 'elastic':
                styles.transform = 'scale(0)';
                break;
        }
        
        return styles;
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            const animation = this.animations.get(entry.target);
            if (!animation) return;
            
            if (entry.isIntersecting && animation.state === 'pending') {
                this.queueAnimation(animation);
            } else if (!entry.isIntersecting && animation.repeat && animation.state === 'completed') {
                animation.state = 'pending';
                this.prepareElement(animation.element, animation.type);
            }
        });
        
        this.processAnimationQueue();
    }

    queueAnimation(animation) {
        animation.state = 'queued';
        this.animationQueue.push(animation);
    }

    async processAnimationQueue() {
        if (this.isProcessingQueue || this.animationQueue.length === 0) return;
        
        this.isProcessingQueue = true;
        
        while (this.animationQueue.length > 0) {
            const animation = this.animationQueue.shift();
            await this.executeAnimation(animation);
        }
        
        this.isProcessingQueue = false;
    }

    async executeAnimation(animation) {
        if (this.isReducedMotion) {
            this.applyFinalStyles(animation);
            return;
        }
        
        return new Promise((resolve) => {
            setTimeout(() => {
                this.startAnimation(animation);
                
                setTimeout(() => {
                    this.completeAnimation(animation);
                    resolve();
                }, animation.duration);
                
            }, animation.delay);
        });
    }

    startAnimation(animation) {
        const { element, type, duration } = animation;
        
        animation.state = 'running';
        animation.startTime = performance.now();
        this.metrics.totalAnimations++;
        
        // Apply animation styles
        const animationFunction = this.animationTypes[type];
        if (animationFunction) {
            animationFunction(element, duration);
        }
        
        this.dispatchEvent('scrollAnimations:animationStart', { animation });
    }

    completeAnimation(animation) {
        animation.state = 'completed';
        animation.endTime = performance.now();
        
        const animationTime = animation.endTime - animation.startTime;
        this.updateMetrics(animationTime);
        
        // Clean up will-change property
        animation.element.style.willChange = 'auto';
        
        this.dispatchEvent('scrollAnimations:animationComplete', { 
            animation, 
            duration: animationTime 
        });
    }

    applyFinalStyles(animation) {
        const { element, type } = animation;
        
        // Apply final state immediately for reduced motion
        const finalStyles = this.getFinalStyles(type);
        Object.assign(element.style, finalStyles);
        
        animation.state = 'completed';
        this.dispatchEvent('scrollAnimations:animationComplete', { animation });
    }

    getFinalStyles(animationType) {
        const styles = {
            opacity: '1',
            transform: 'none',
            transition: 'none'
        };
        
        return styles;
    }

    // Animation type implementations
    createFadeInAnimation(element, duration) {
        element.style.transition = `opacity ${duration}ms ${this.options.animationEasing}`;
        element.style.opacity = '1';
    }

    createFadeInUpAnimation(element, duration) {
        element.style.transition = `opacity ${duration}ms ${this.options.animationEasing}, transform ${duration}ms ${this.options.animationEasing}`;
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }

    createFadeInDownAnimation(element, duration) {
        element.style.transition = `opacity ${duration}ms ${this.options.animationEasing}, transform ${duration}ms ${this.options.animationEasing}`;
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
    }

    createFadeInLeftAnimation(element, duration) {
        element.style.transition = `opacity ${duration}ms ${this.options.animationEasing}, transform ${duration}ms ${this.options.animationEasing}`;
        element.style.opacity = '1';
        element.style.transform = 'translateX(0)';
    }

    createFadeInRightAnimation(element, duration) {
        element.style.transition = `opacity ${duration}ms ${this.options.animationEasing}, transform ${duration}ms ${this.options.animationEasing}`;
        element.style.opacity = '1';
        element.style.transform = 'translateX(0)';
    }

    createSlideUpAnimation(element, duration) {
        element.style.transition = `transform ${duration}ms ${this.options.animationEasing}`;
        element.style.transform = 'translateY(0)';
    }

    createSlideDownAnimation(element, duration) {
        element.style.transition = `transform ${duration}ms ${this.options.animationEasing}`;
        element.style.transform = 'translateY(0)';
    }

    createSlideLeftAnimation(element, duration) {
        element.style.transition = `transform ${duration}ms ${this.options.animationEasing}`;
        element.style.transform = 'translateX(0)';
    }

    createSlideRightAnimation(element, duration) {
        element.style.transition = `transform ${duration}ms ${this.options.animationEasing}`;
        element.style.transform = 'translateX(0)';
    }

    createScaleInAnimation(element, duration) {
        element.style.transition = `opacity ${duration}ms ${this.options.animationEasing}, transform ${duration}ms ${this.options.animationEasing}`;
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
    }

    createScaleOutAnimation(element, duration) {
        element.style.transition = `opacity ${duration}ms ${this.options.animationEasing}, transform ${duration}ms ${this.options.animationEasing}`;
        element.style.opacity = '1';
        element.style.transform = 'scale(1)';
    }

    createRotateInAnimation(element, duration) {
        element.style.transition = `opacity ${duration}ms ${this.options.animationEasing}, transform ${duration}ms ${this.options.animationEasing}`;
        element.style.opacity = '1';
        element.style.transform = 'rotate(0deg) scale(1)';
    }

    createFlipInAnimation(element, duration) {
        element.style.transition = `opacity ${duration}ms ${this.options.animationEasing}, transform ${duration}ms ${this.options.animationEasing}`;
        element.style.opacity = '1';
        element.style.transform = 'perspective(400px) rotateY(0deg)';
    }

    createBounceInAnimation(element, duration) {
        const keyframes = [
            { opacity: 0, transform: 'scale(0.3)' },
            { opacity: 1, transform: 'scale(1.05)' },
            { opacity: 1, transform: 'scale(0.9)' },
            { opacity: 1, transform: 'scale(1)' }
        ];
        
        element.animate(keyframes, {
            duration: duration,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            fill: 'forwards'
        });
    }

    createElasticAnimation(element, duration) {
        const keyframes = [
            { transform: 'scale(0)' },
            { transform: 'scale(1.2)' },
            { transform: 'scale(0.8)' },
            { transform: 'scale(1.1)' },
            { transform: 'scale(1)' }
        ];
        
        element.animate(keyframes, {
            duration: duration,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            fill: 'forwards'
        });
    }

    createTypewriterAnimation(element, duration) {
        const text = element.textContent;
        const chars = text.split('');
        element.textContent = '';
        element.style.opacity = '1';
        
        const charDelay = duration / chars.length;
        
        chars.forEach((char, index) => {
            setTimeout(() => {
                element.textContent += char;
            }, index * charDelay);
        });
    }

    createCountUpAnimation(element, duration) {
        const target = parseInt(element.dataset.countTarget) || parseInt(element.textContent) || 100;
        const start = parseInt(element.dataset.countStart) || 0;
        const increment = (target - start) / (duration / 16); // 60fps
        
        let current = start;
        element.style.opacity = '1';
        
        const counter = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(counter);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }

    createProgressBarAnimation(element, duration) {
        const progress = element.dataset.progress || '100';
        element.style.opacity = '1';
        element.style.transition = `width ${duration}ms ${this.options.animationEasing}`;
        element.style.width = `${progress}%`;
    }

    createMorphingAnimation(element, duration) {
        const shapes = element.dataset.morphShapes ? element.dataset.morphShapes.split(',') : ['circle', 'square'];
        let currentShape = 0;
        
        element.style.opacity = '1';
        element.style.transition = `border-radius ${duration}ms ${this.options.animationEasing}`;
        
        const morphInterval = setInterval(() => {
            currentShape = (currentShape + 1) % shapes.length;
            const shape = shapes[currentShape];
            
            switch (shape) {
                case 'circle':
                    element.style.borderRadius = '50%';
                    break;
                case 'square':
                    element.style.borderRadius = '0';
                    break;
                case 'rounded':
                    element.style.borderRadius = '20px';
                    break;
            }
        }, duration / shapes.length);
        
        setTimeout(() => clearInterval(morphInterval), duration);
    }

    createParallaxTextAnimation(element, duration) {
        element.style.opacity = '1';
        element.style.transition = `transform ${duration}ms ${this.options.animationEasing}`;
        
        const handleScroll = () => {
            const rect = element.getBoundingClientRect();
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            element.style.transform = `translateY(${rate}px)`;
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Clean up after animation
        setTimeout(() => {
            window.removeEventListener('scroll', handleScroll);
        }, duration * 2);
    }

    setupEventListeners() {
        // Manual trigger support
        document.addEventListener('click', (e) => {
            if (e.target.dataset.animateTrigger === 'click') {
                const animation = this.animations.get(e.target);
                if (animation && animation.state === 'pending') {
                    this.queueAnimation(animation);
                    this.processAnimationQueue();
                }
            }
        });
        
        // Hover trigger support
        document.addEventListener('mouseenter', (e) => {
            if (e.target.dataset.animateTrigger === 'hover') {
                const animation = this.animations.get(e.target);
                if (animation && animation.state === 'pending') {
                    this.queueAnimation(animation);
                    this.processAnimationQueue();
                }
            }
        }, true);
        
        // Keyboard trigger support
        document.addEventListener('keydown', (e) => {
            if (e.target.dataset.animateTrigger === 'focus' && e.key === 'Tab') {
                const animation = this.animations.get(e.target);
                if (animation && animation.state === 'pending') {
                    this.queueAnimation(animation);
                    this.processAnimationQueue();
                }
            }
        });
    }

    updateAnimationsForMotionPreference() {
        this.animations.forEach((animation) => {
            if (animation.state === 'pending') {
                if (this.isReducedMotion) {
                    this.applyFinalStyles(animation);
                } else {
                    this.prepareElement(animation.element, animation.type);
                }
            }
        });
    }

    updateMetrics(animationTime) {
        this.metrics.completedAnimations++;
        
        // Calculate average animation time
        const totalTime = this.metrics.averageAnimationTime * (this.metrics.completedAnimations - 1) + animationTime;
        this.metrics.averageAnimationTime = totalTime / this.metrics.completedAnimations;
        
        // Calculate performance score
        const targetTime = this.options.animationDuration;
        const efficiency = Math.max(0, 100 - ((animationTime - targetTime) / targetTime * 100));
        this.metrics.performanceScore = (this.metrics.performanceScore + efficiency) / 2;
    }

    setupDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.className = 'scroll-animations-debug';
        debugPanel.innerHTML = `
            <h3>Scroll Animations Debug</h3>
            <div class="debug-stats">
                <div>Total: <span id="debug-total">0</span></div>
                <div>Completed: <span id="debug-completed">0</span></div>
                <div>Avg Time: <span id="debug-avg-time">0ms</span></div>
                <div>Performance: <span id="debug-performance">100%</span></div>
            </div>
            <div class="debug-controls">
                <button onclick="scrollAnimations.resetAllAnimations()">Reset All</button>
                <button onclick="scrollAnimations.triggerAllAnimations()">Trigger All</button>
            </div>
        `;
        
        debugPanel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            min-width: 200px;
        `;
        
        document.body.appendChild(debugPanel);
        
        // Update debug panel periodically
        setInterval(() => this.updateDebugPanel(), 1000);
    }

    updateDebugPanel() {
        const totalEl = document.getElementById('debug-total');
        const completedEl = document.getElementById('debug-completed');
        const avgTimeEl = document.getElementById('debug-avg-time');
        const performanceEl = document.getElementById('debug-performance');
        
        if (totalEl) totalEl.textContent = this.metrics.totalAnimations;
        if (completedEl) completedEl.textContent = this.metrics.completedAnimations;
        if (avgTimeEl) avgTimeEl.textContent = `${Math.round(this.metrics.averageAnimationTime)}ms`;
        if (performanceEl) performanceEl.textContent = `${Math.round(this.metrics.performanceScore)}%`;
    }

    // Public API methods
    addAnimation(element, type, options = {}) {
        const animationConfig = {
            element,
            type,
            delay: options.delay || 0,
            duration: options.duration || this.options.animationDuration,
            repeat: options.repeat || false,
            trigger: options.trigger || 'intersection',
            state: 'pending'
        };
        
        this.animations.set(element, animationConfig);
        
        if (animationConfig.trigger === 'intersection') {
            this.observer.observe(element);
        }
        
        this.prepareElement(element, type);
    }

    removeAnimation(element) {
        const animation = this.animations.get(element);
        if (animation) {
            this.observer.unobserve(element);
            this.animations.delete(element);
            element.style.willChange = 'auto';
        }
    }

    triggerAnimation(element) {
        const animation = this.animations.get(element);
        if (animation && animation.state === 'pending') {
            this.queueAnimation(animation);
            this.processAnimationQueue();
        }
    }

    resetAnimation(element) {
        const animation = this.animations.get(element);
        if (animation) {
            animation.state = 'pending';
            this.prepareElement(element, animation.type);
        }
    }

    resetAllAnimations() {
        this.animations.forEach((animation) => {
            this.resetAnimation(animation.element);
        });
    }

    triggerAllAnimations() {
        this.animations.forEach((animation) => {
            if (animation.state === 'pending') {
                this.queueAnimation(animation);
            }
        });
        this.processAnimationQueue();
    }

    getMetrics() {
        return { ...this.metrics };
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: { ...detail, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        this.animations.clear();
        this.animationQueue = [];
        
        // Remove debug panel
        const debugPanel = document.querySelector('.scroll-animations-debug');
        if (debugPanel) {
            debugPanel.remove();
        }
        
        this.dispatchEvent('scrollAnimations:destroyed');
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('[data-animate]')) {
        window.scrollAnimations = new ScrollAnimations();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollAnimations;
}

// Global access
window.ScrollAnimations = ScrollAnimations; 