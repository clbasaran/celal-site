/**
 * Portfolio OS V6 - Animation Manager
 * Advanced animation system with performance optimization
 */

export class AnimationManager {
    constructor() {
        this.observers = new Map();
        this.animations = new Map();
        this.reducedMotion = false;
        
        // Configuration
        this.config = {
            rootMargin: '50px',
            threshold: [0, 0.25, 0.5, 0.75, 1],
            animationDuration: 600,
            staggerDelay: 100,
            easingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)'
        };
        
        // Performance tracking
        this.performanceMetrics = {
            animationsTriggered: 0,
            averageDuration: 0,
            droppedFrames: 0
        };
        
        // Bind methods
        this.init = this.init.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.observeElement = this.observeElement.bind(this);
    }
    
    // ===== INITIALIZATION =====
    async init() {
        try {
            // Check for reduced motion preference
            this.checkReducedMotionPreference();
            
            // Initialize intersection observers
            this.setupIntersectionObservers();
            
            // Setup scroll animations
            this.setupScrollAnimations();
            
            // Initialize page animations
            this.initializePageAnimations();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            console.log('✨ Animation Manager initialized');
            
        } catch (error) {
            console.warn('Animation Manager initialization failed:', error);
        }
    }
    
    // ===== MOTION PREFERENCE =====
    checkReducedMotionPreference() {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.reducedMotion = mediaQuery.matches;
        
        // Listen for changes
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', (e) => {
                this.reducedMotion = e.matches;
                this.updateAnimationStyles();
            });
        }
        
        this.updateAnimationStyles();
    }
    
    updateAnimationStyles() {
        const root = document.documentElement;
        
        if (this.reducedMotion) {
            root.style.setProperty('--duration-fast', '0.01ms');
            root.style.setProperty('--duration-base', '0.01ms');
            root.style.setProperty('--duration-slow', '0.01ms');
            console.log('🚫 Animations disabled (reduced motion preference)');
        } else {
            root.style.removeProperty('--duration-fast');
            root.style.removeProperty('--duration-base');
            root.style.removeProperty('--duration-slow');
            console.log('✨ Animations enabled');
        }
    }
    
    // ===== INTERSECTION OBSERVERS =====
    setupIntersectionObservers() {
        // Main scroll animation observer
        const scrollObserver = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                rootMargin: this.config.rootMargin,
                threshold: this.config.threshold
            }
        );
        
        this.observers.set('scroll', scrollObserver);
        
        // Performance observer for animations
        const performanceObserver = new IntersectionObserver(
            this.handlePerformanceIntersection.bind(this),
            { threshold: [0, 1] }
        );
        
        this.observers.set('performance', performanceObserver);
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            const element = entry.target;
            const animationType = element.dataset.animation || 'fadeIn';
            
            if (entry.isIntersecting) {
                this.triggerAnimation(element, animationType);
            } else if (element.dataset.animationRepeat === 'true') {
                this.resetAnimation(element);
            }
        });
    }
    
    handlePerformanceIntersection(entries) {
        entries.forEach(entry => {
            const element = entry.target;
            
            if (entry.isIntersecting) {
                // Element is visible, enable complex animations
                element.classList.add('animation-enabled');
            } else {
                // Element not visible, disable complex animations
                element.classList.remove('animation-enabled');
            }
        });
    }
    
    // ===== SCROLL ANIMATIONS =====
    setupScrollAnimations() {
        // Find all elements with data-aos attribute
        const animatedElements = document.querySelectorAll('[data-aos]');
        
        animatedElements.forEach(element => {
            this.prepareElementForAnimation(element);
            this.observeElement(element);
        });
        
        console.log(`📱 Observing ${animatedElements.length} animated elements`);
    }
    
    prepareElementForAnimation(element) {
        const animationType = element.dataset.aos;
        const delay = parseInt(element.dataset.aosDelay) || 0;
        const duration = parseInt(element.dataset.aosDuration) || this.config.animationDuration;
        
        // Set initial state
        element.style.opacity = '0';
        element.style.transform = this.getInitialTransform(animationType);
        element.style.transition = `opacity ${duration}ms ${this.config.easingFunction} ${delay}ms, 
                                   transform ${duration}ms ${this.config.easingFunction} ${delay}ms`;
        
        // Add animation class
        element.classList.add('aos-element');
    }
    
    getInitialTransform(animationType) {
        const transforms = {
            'fade-up': 'translateY(30px)',
            'fade-down': 'translateY(-30px)',
            'fade-left': 'translateX(-30px)',
            'fade-right': 'translateX(30px)',
            'zoom-in': 'scale(0.9)',
            'zoom-out': 'scale(1.1)',
            'flip-left': 'rotateY(-90deg)',
            'flip-right': 'rotateY(90deg)',
            'slide-up': 'translateY(100%)',
            'slide-down': 'translateY(-100%)'
        };
        
        return transforms[animationType] || 'translateY(20px)';
    }
    
    triggerAnimation(element, animationType) {
        if (this.reducedMotion) return;
        
        // Remove initial transforms
        element.style.opacity = '1';
        element.style.transform = 'none';
        
        // Add animated class
        element.classList.add('aos-animate');
        
        // Track performance
        this.performanceMetrics.animationsTriggered++;
        
        // Dispatch animation event
        this.dispatchAnimationEvent(element, 'start', animationType);
        
        // Listen for animation end
        const duration = parseInt(element.dataset.aosDuration) || this.config.animationDuration;
        const delay = parseInt(element.dataset.aosDelay) || 0;
        
        setTimeout(() => {
            this.dispatchAnimationEvent(element, 'end', animationType);
        }, duration + delay);
    }
    
    resetAnimation(element) {
        element.style.opacity = '0';
        element.style.transform = this.getInitialTransform(element.dataset.aos);
        element.classList.remove('aos-animate');
    }
    
    // ===== PAGE ANIMATIONS =====
    initializePageAnimations() {
        // Stagger animation for card grids
        this.setupStaggerAnimations();
        
        // Loading animations
        this.setupLoadingAnimations();
        
        // Interactive hover animations
        this.setupHoverAnimations();
        
        // Page transition animations
        this.setupPageTransitions();
    }
    
    setupStaggerAnimations() {
        const staggerContainers = document.querySelectorAll('[data-stagger]');
        
        staggerContainers.forEach(container => {
            const children = Array.from(container.children);
            const staggerDelay = parseInt(container.dataset.staggerDelay) || this.config.staggerDelay;
            
            children.forEach((child, index) => {
                if (!child.dataset.aosDelay) {
                    child.dataset.aosDelay = (index * staggerDelay).toString();
                }
                
                this.prepareElementForAnimation(child);
                this.observeElement(child);
            });
        });
    }
    
    setupLoadingAnimations() {
        // Shimmer effect for loading states
        const shimmerElements = document.querySelectorAll('.loading-shimmer');
        
        shimmerElements.forEach(element => {
            if (!this.reducedMotion) {
                element.style.animation = 'shimmer 2s infinite linear';
            }
        });
    }
    
    setupHoverAnimations() {
        // Card hover animations
        const interactiveCards = document.querySelectorAll('.card-clickable, .project-card, .blog-card');
        
        interactiveCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                if (!this.reducedMotion) {
                    this.animateCardHover(card, 'enter');
                }
            });
            
            card.addEventListener('mouseleave', () => {
                if (!this.reducedMotion) {
                    this.animateCardHover(card, 'leave');
                }
            });
        });
    }
    
    animateCardHover(card, direction) {
        const scale = direction === 'enter' ? 'scale(1.02)' : 'scale(1)';
        const shadow = direction === 'enter' ? 'var(--shadow-xl)' : 'var(--shadow-base)';
        
        card.style.transform = scale;
        card.style.boxShadow = shadow;
    }
    
    setupPageTransitions() {
        // Smooth page transitions using View Transitions API (if supported)
        if ('startViewTransition' in document) {
            this.setupViewTransitions();
        } else {
            this.setupFallbackTransitions();
        }
    }
    
    setupViewTransitions() {
        // Modern browser support for View Transitions
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.href && !link.target && link.origin === location.origin) {
                e.preventDefault();
                
                document.startViewTransition(() => {
                    window.location.href = link.href;
                });
            }
        });
    }
    
    setupFallbackTransitions() {
        // Fallback for browsers without View Transitions
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (link && link.href && !link.target && link.origin === location.origin) {
                e.preventDefault();
                
                this.fadeOutPage(() => {
                    window.location.href = link.href;
                });
            }
        });
    }
    
    fadeOutPage(callback) {
        if (this.reducedMotion) {
            callback();
            return;
        }
        
        document.body.style.transition = 'opacity 300ms ease-out';
        document.body.style.opacity = '0';
        
        setTimeout(callback, 300);
    }
    
    // ===== SCROLL HANDLING =====
    handleScroll() {
        // Parallax effects
        this.updateParallaxElements();
        
        // Progress indicators
        this.updateProgressIndicators();
        
        // Floating elements
        this.updateFloatingElements();
    }
    
    updateParallaxElements() {
        if (this.reducedMotion) return;
        
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        const scrollY = window.scrollY;
        
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallax) || 0.5;
            const yPos = -(scrollY * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }
    
    updateProgressIndicators() {
        const progressBars = document.querySelectorAll('.progress-bar[data-progress]');
        
        progressBars.forEach(bar => {
            const rect = bar.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible && !bar.classList.contains('animated')) {
                const progress = parseInt(bar.dataset.progress) || 0;
                this.animateProgress(bar, progress);
                bar.classList.add('animated');
            }
        });
    }
    
    animateProgress(bar, targetProgress) {
        if (this.reducedMotion) {
            bar.style.width = `${targetProgress}%`;
            return;
        }
        
        let currentProgress = 0;
        const duration = 1000;
        const increment = targetProgress / (duration / 16);
        
        const animate = () => {
            currentProgress += increment;
            
            if (currentProgress >= targetProgress) {
                currentProgress = targetProgress;
                bar.style.width = `${currentProgress}%`;
                return;
            }
            
            bar.style.width = `${currentProgress}%`;
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    updateFloatingElements() {
        if (this.reducedMotion) return;
        
        const floatingElements = document.querySelectorAll('[data-float]');
        const time = Date.now() * 0.001;
        
        floatingElements.forEach((element, index) => {
            const amplitude = parseFloat(element.dataset.floatAmplitude) || 10;
            const frequency = parseFloat(element.dataset.floatFrequency) || 2;
            const offset = index * 0.5;
            
            const y = Math.sin(time * frequency + offset) * amplitude;
            element.style.transform = `translateY(${y}px)`;
        });
    }
    
    // ===== RESIZE HANDLING =====
    handleResize() {
        // Recalculate animation triggers on resize
        this.refreshObservers();
    }
    
    refreshObservers() {
        // Disconnect and reconnect observers to recalculate positions
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        
        setTimeout(() => {
            this.setupScrollAnimations();
        }, 100);
    }
    
    // ===== PERFORMANCE MONITORING =====
    setupPerformanceMonitoring() {
        // Monitor frame rate during animations
        let lastFrameTime = performance.now();
        let frameCount = 0;
        
        const checkFrameRate = (currentTime) => {
            frameCount++;
            
            if (currentTime - lastFrameTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastFrameTime));
                
                if (fps < 30) {
                    this.performanceMetrics.droppedFrames++;
                    console.warn(`⚠️ Low frame rate detected: ${fps}fps`);
                }
                
                frameCount = 0;
                lastFrameTime = currentTime;
            }
            
            if (this.performanceMetrics.animationsTriggered > 0) {
                requestAnimationFrame(checkFrameRate);
            }
        };
        
        requestAnimationFrame(checkFrameRate);
    }
    
    // ===== UTILITY METHODS =====
    observeElement(element) {
        const scrollObserver = this.observers.get('scroll');
        const performanceObserver = this.observers.get('performance');
        
        if (scrollObserver) {
            scrollObserver.observe(element);
        }
        
        if (performanceObserver && element.dataset.heavyAnimation) {
            performanceObserver.observe(element);
        }
    }
    
    dispatchAnimationEvent(element, phase, type) {
        const event = new CustomEvent('animation', {
            detail: {
                element: element,
                phase: phase,
                type: type,
                timestamp: performance.now()
            }
        });
        
        document.dispatchEvent(event);
    }
    
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            reducedMotion: this.reducedMotion,
            observedElements: Array.from(this.observers.values())
                .reduce((total, observer) => total + observer.observe?.length || 0, 0)
        };
    }
    
    // ===== CLEANUP =====
    destroy() {
        // Disconnect all observers
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        
        // Clear animations map
        this.animations.clear();
        
        console.log('✨ Animation Manager destroyed');
    }
} 