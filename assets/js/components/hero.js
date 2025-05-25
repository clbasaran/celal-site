/**
 * Portfolio OS V6 - Hero Section Manager
 * Apple Design Language V6 - Advanced Hero Management
 * Features: Typewriter effect, particle system, scroll animations, performance optimization
 */

export class HeroManager {
    constructor() {
        // DOM Elements
        this.heroSection = null;
        this.heroContent = null;
        this.heroElements = [];
        this.typewriterElement = null;
        this.particleContainer = null;
        this.exploreBtn = null;
        this.downloadBtn = null;
        
        // Animation State
        this.animationState = {
            isVisible: false,
            hasAnimated: false,
            animationQueue: [],
            currentTypewriterIndex: 0,
            isTypewriting: false
        };
        
        // Configuration
        this.config = {
            // Typewriter settings
            typewriterTexts: [
                'iOS & macOS Developer',
                'SwiftUI Enthusiast',
                'AI & ML Explorer', 
                'Photography Lover',
                'Open Source Contributor'
            ],
            typewriterSpeed: 100,
            typewriterDeleteSpeed: 50,
            typewriterPauseTime: 2000,
            
            // Particle system
            particleCount: 30,
            particleSpeed: 0.5,
            particleLifetime: 10000,
            
            // Animation timing
            staggerDelay: 150,
            fadeInDuration: 800,
            slideDistance: 40,
            
            // Intersection observer
            rootMargin: '0px 0px -20% 0px',
            threshold: 0.3,
            
            // Performance
            rafEnabled: true,
            particlesEnabled: true,
            typewriterEnabled: true
        };
        
        // Particles array
        this.particles = [];
        
        // RAF and timers
        this.rafId = null;
        this.typewriterTimeout = null;
        this.particleInterval = null;
        
        // Event listeners
        this.eventListeners = new Map();
        
        // Bound methods
        this.handleScroll = this.throttle(this.handleScroll.bind(this), 16);
        this.handleResize = this.debounce(this.handleResize.bind(this), 250);
        this.animateParticles = this.animateParticles.bind(this);
        this.handleIntersection = this.handleIntersection.bind(this);
    }
    
    /**
     * Initialize the hero manager
     */
    async init() {
        try {
            console.log('🚀 Hero Manager initializing...');
            
            // Cache DOM elements
            this.cacheDOMElements();
            
            if (!this.heroSection) {
                console.warn('Hero section not found');
                return;
            }
            
            // Setup components
            await this.setupIntersectionObserver();
            await this.setupTypewriter();
            await this.setupParticleSystem();
            await this.setupScrollAnimations();
            await this.setupButtonInteractions();
            await this.setupAccessibility();
            
            // Add event listeners
            this.addEventListeners();
            
            // Initial state
            this.updateVisibilityState();
            
            console.log('✅ Hero Manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Hero Manager initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Cache frequently used DOM elements
     */
    cacheDOMElements() {
        this.heroSection = document.querySelector('.hero-section');
        this.heroContent = document.getElementById('heroContent');
        this.typewriterElement = document.getElementById('typewriterText');
        this.particleContainer = document.getElementById('heroParticles');
        this.exploreBtn = document.getElementById('exploreWorkBtn');
        this.downloadBtn = document.getElementById('downloadResumeBtn');
        
        // Cache animatable elements
        this.heroElements = [
            document.querySelector('[data-hero-element="avatar"]'),
            document.querySelector('[data-hero-element="text"]'),
            document.querySelector('[data-hero-element="actions"]'),
            document.querySelector('[data-hero-element="social"]'),
            document.querySelector('[data-hero-element="scroll"]')
        ].filter(Boolean);
    }
    
    /**
     * Setup intersection observer for visibility detection
     */
    async setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            this.triggerAnimations();
            return;
        }
        
        const options = {
            root: null,
            rootMargin: this.config.rootMargin,
            threshold: this.config.threshold
        };
        
        this.intersectionObserver = new IntersectionObserver(this.handleIntersection, options);
        
        if (this.heroSection) {
            this.intersectionObserver.observe(this.heroSection);
        }
    }
    
    /**
     * Handle intersection observer callback
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !this.animationState.hasAnimated) {
                this.triggerAnimations();
            }
        });
    }
    
    /**
     * Setup typewriter effect
     */
    async setupTypewriter() {
        if (!this.config.typewriterEnabled || !this.typewriterElement) return;
        
        // Start typewriter animation
        this.startTypewriter();
    }
    
    /**
     * Start typewriter animation
     */
    startTypewriter() {
        if (this.animationState.isTypewriting) return;
        
        this.animationState.isTypewriting = true;
        this.typeCurrentText();
    }
    
    /**
     * Type current text
     */
    typeCurrentText() {
        const currentText = this.config.typewriterTexts[this.animationState.currentTypewriterIndex];
        let charIndex = 0;
        
        const typeChar = () => {
            if (charIndex < currentText.length) {
                this.typewriterElement.textContent = currentText.substring(0, charIndex + 1);
                charIndex++;
                this.typewriterTimeout = setTimeout(typeChar, this.config.typewriterSpeed);
            } else {
                // Pause before deleting
                this.typewriterTimeout = setTimeout(() => {
                    this.deleteCurrentText();
                }, this.config.typewriterPauseTime);
            }
        };
        
        typeChar();
    }
    
    /**
     * Delete current text
     */
    deleteCurrentText() {
        const currentText = this.typewriterElement.textContent;
        let charIndex = currentText.length;
        
        const deleteChar = () => {
            if (charIndex > 0) {
                this.typewriterElement.textContent = currentText.substring(0, charIndex - 1);
                charIndex--;
                this.typewriterTimeout = setTimeout(deleteChar, this.config.typewriterDeleteSpeed);
            } else {
                // Move to next text
                this.animationState.currentTypewriterIndex = 
                    (this.animationState.currentTypewriterIndex + 1) % this.config.typewriterTexts.length;
                
                // Pause before typing next text
                this.typewriterTimeout = setTimeout(() => {
                    this.typeCurrentText();
                }, 500);
            }
        };
        
        deleteChar();
    }
    
    /**
     * Setup particle system
     */
    async setupParticleSystem() {
        if (!this.config.particlesEnabled || !this.particleContainer) return;
        
        // Create initial particles
        this.createParticles();
        
        // Start particle animation loop
        if (this.config.rafEnabled) {
            this.startParticleAnimation();
        }
        
        // Create new particles periodically
        this.particleInterval = setInterval(() => {
            if (this.particles.length < this.config.particleCount) {
                this.createParticle();
            }
        }, 1000);
    }
    
    /**
     * Create initial particles
     */
    createParticles() {
        for (let i = 0; i < this.config.particleCount; i++) {
            this.createParticle();
        }
    }
    
    /**
     * Create a single particle
     */
    createParticle() {
        const particle = {
            element: document.createElement('div'),
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 50,
            speed: this.config.particleSpeed + Math.random() * 0.5,
            size: 2 + Math.random() * 3,
            opacity: 0.3 + Math.random() * 0.4,
            lifetime: this.config.particleLifetime + Math.random() * 5000,
            age: 0
        };
        
        // Setup particle element
        particle.element.className = 'particle';
        particle.element.style.cssText = `
            left: ${particle.x}px;
            top: ${particle.y}px;
            width: ${particle.size}px;
            height: ${particle.size}px;
            opacity: ${particle.opacity};
            animation-duration: ${particle.lifetime}ms;
        `;
        
        this.particleContainer.appendChild(particle.element);
        this.particles.push(particle);
        
        // Remove particle after lifetime
        setTimeout(() => {
            this.removeParticle(particle);
        }, particle.lifetime);
    }
    
    /**
     * Remove particle
     */
    removeParticle(particle) {
        const index = this.particles.indexOf(particle);
        if (index > -1) {
            this.particles.splice(index, 1);
            if (particle.element.parentNode) {
                particle.element.parentNode.removeChild(particle.element);
            }
        }
    }
    
    /**
     * Start particle animation loop
     */
    startParticleAnimation() {
        const animate = () => {
            this.animateParticles();
            this.rafId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * Animate particles
     */
    animateParticles() {
        this.particles.forEach(particle => {
            particle.y -= particle.speed;
            particle.age += 16; // Approximate frame time
            
            // Update position
            particle.element.style.transform = `translateY(${particle.y}px)`;
            
            // Fade out towards end of lifetime
            const lifetimeProgress = particle.age / particle.lifetime;
            if (lifetimeProgress > 0.8) {
                const fadeOpacity = particle.opacity * (1 - (lifetimeProgress - 0.8) / 0.2);
                particle.element.style.opacity = fadeOpacity;
            }
        });
    }
    
    /**
     * Setup scroll animations
     */
    async setupScrollAnimations() {
        this.addEventListener(window, 'scroll', this.handleScroll, { passive: true });
    }
    
    /**
     * Handle scroll events
     */
    handleScroll() {
        // Add scroll-based animations here if needed
        this.updateVisibilityState();
    }
    
    /**
     * Setup button interactions
     */
    async setupButtonInteractions() {
        // Explore work button - smooth scroll
        if (this.exploreBtn) {
            this.addEventListener(this.exploreBtn, 'click', (e) => {
                e.preventDefault();
                this.handleExploreClick();
            });
        }
        
        // Download resume button
        if (this.downloadBtn) {
            this.addEventListener(this.downloadBtn, 'click', () => {
                this.handleDownloadClick();
            });
        }
        
        // Add ripple effect to buttons
        this.setupButtonRipples();
    }
    
    /**
     * Handle explore work button click
     */
    handleExploreClick() {
        const targetElement = document.getElementById('projects');
        if (targetElement) {
            // Smooth scroll to projects section
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Announce to screen readers
            this.announceToScreenReader('Scrolling to projects section');
        }
    }
    
    /**
     * Handle download resume button click
     */
    handleDownloadClick() {
        // Create download link
        const link = document.createElement('a');
        link.href = '/assets/documents/celal-basaran-resume.pdf';
        link.download = 'Celal-Basaran-Resume.pdf';
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Announce to screen readers
        this.announceToScreenReader('Resume download started');
        
        // Optional: Track download event
        this.trackEvent('resume_download');
    }
    
    /**
     * Setup button ripple effects
     */
    setupButtonRipples() {
        const buttons = this.heroSection.querySelectorAll('.hero-btn, .social-link');
        
        buttons.forEach(button => {
            this.addEventListener(button, 'click', (e) => {
                this.createRipple(e, button);
            });
        });
    }
    
    /**
     * Create ripple effect
     */
    createRipple(event, button) {
        const ripple = button.querySelector('.btn-ripple');
        if (!ripple) return;
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;
        
        // Trigger animation
        ripple.classList.remove('active');
        void ripple.offsetWidth; // Force reflow
        ripple.classList.add('active');
    }
    
    /**
     * Setup accessibility features
     */
    async setupAccessibility() {
        // Add ARIA live region for announcements
        this.createAriaLiveRegion();
        
        // Enhance focus management
        this.setupFocusManagement();
        
        // Add keyboard navigation
        this.setupKeyboardNavigation();
    }
    
    /**
     * Create ARIA live region for announcements
     */
    createAriaLiveRegion() {
        if (!document.getElementById('hero-announcer')) {
            const announcer = document.createElement('div');
            announcer.id = 'hero-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.style.cssText = `
                position: absolute;
                left: -10000px;
                width: 1px;
                height: 1px;
                overflow: hidden;
            `;
            document.body.appendChild(announcer);
        }
    }
    
    /**
     * Setup focus management
     */
    setupFocusManagement() {
        const focusableElements = this.heroSection.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        focusableElements.forEach(element => {
            this.addEventListener(element, 'focus', () => {
                element.classList.add('focused');
            });
            
            this.addEventListener(element, 'blur', () => {
                element.classList.remove('focused');
            });
        });
    }
    
    /**
     * Setup keyboard navigation
     */
    setupKeyboardNavigation() {
        this.addEventListener(this.heroSection, 'keydown', (e) => {
            switch (e.key) {
                case 'Enter':
                case ' ':
                    if (e.target.classList.contains('scroll-indicator')) {
                        e.preventDefault();
                        this.handleExploreClick();
                    }
                    break;
                case 'Escape':
                    // Clear focus
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }
                    break;
            }
        });
    }
    
    /**
     * Trigger hero animations
     */
    triggerAnimations() {
        if (this.animationState.hasAnimated) return;
        
        this.animationState.hasAnimated = true;
        this.animationState.isVisible = true;
        
        // Add loaded class to content
        if (this.heroContent) {
            this.heroContent.classList.add('loaded');
        }
        
        // Animate elements with stagger
        this.heroElements.forEach((element, index) => {
            if (element) {
                setTimeout(() => {
                    element.classList.add('animate-in');
                }, index * this.config.staggerDelay);
            }
        });
        
        // Emit custom event
        this.emit('heroAnimationComplete');
    }
    
    /**
     * Update visibility state
     */
    updateVisibilityState() {
        if (!this.heroSection) return;
        
        const rect = this.heroSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isVisible !== this.animationState.isVisible) {
            this.animationState.isVisible = isVisible;
            
            if (isVisible && !this.animationState.hasAnimated) {
                this.triggerAnimations();
            }
        }
    }
    
    /**
     * Add event listener with cleanup tracking
     */
    addEventListener(element, event, handler, options = {}) {
        if (!element) return;
        
        element.addEventListener(event, handler, options);
        
        // Store for cleanup
        const key = `${element.tagName}-${event}-${Math.random()}`;
        this.eventListeners.set(key, { element, event, handler, options });
    }
    
    /**
     * Add global event listeners
     */
    addEventListeners() {
        this.addEventListener(window, 'resize', this.handleResize);
        this.addEventListener(window, 'visibilitychange', () => {
            if (document.hidden && this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            } else if (!document.hidden && this.config.particlesEnabled) {
                this.startParticleAnimation();
            }
        });
    }
    
    /**
     * Handle resize events
     */
    handleResize() {
        // Update particle container if needed
        if (this.particleContainer) {
            // Recreate particles for new viewport size
            this.clearParticles();
            this.createParticles();
        }
    }
    
    /**
     * Clear all particles
     */
    clearParticles() {
        this.particles.forEach(particle => {
            if (particle.element.parentNode) {
                particle.element.parentNode.removeChild(particle.element);
            }
        });
        this.particles = [];
    }
    
    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        const announcer = document.getElementById('hero-announcer');
        if (announcer) {
            announcer.textContent = message;
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    }
    
    /**
     * Track analytics events
     */
    trackEvent(eventName, properties = {}) {
        // Emit custom event for analytics
        this.emit('heroEvent', { eventName, properties });
        
        // Console log for development
        console.log(`📊 Hero Event: ${eventName}`, properties);
    }
    
    /**
     * Emit custom events
     */
    emit(eventName, detail = {}) {
        const event = new CustomEvent(`hero:${eventName}`, {
            detail: { ...detail, heroState: this.animationState }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Throttle utility
     */
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
    
    /**
     * Debounce utility
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
     * Get current state
     */
    getState() {
        return {
            ...this.animationState,
            particleCount: this.particles.length,
            isTypewriting: this.animationState.isTypewriting
        };
    }
    
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Restart typewriter if speed changed
        if (newConfig.typewriterSpeed && this.config.typewriterEnabled) {
            this.restartTypewriter();
        }
    }
    
    /**
     * Restart typewriter with new config
     */
    restartTypewriter() {
        if (this.typewriterTimeout) {
            clearTimeout(this.typewriterTimeout);
        }
        
        this.animationState.isTypewriting = false;
        this.startTypewriter();
    }
    
    /**
     * Pause animations
     */
    pause() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        if (this.typewriterTimeout) {
            clearTimeout(this.typewriterTimeout);
        }
        
        if (this.particleInterval) {
            clearInterval(this.particleInterval);
        }
    }
    
    /**
     * Resume animations
     */
    resume() {
        if (this.config.particlesEnabled && !this.rafId) {
            this.startParticleAnimation();
        }
        
        if (this.config.typewriterEnabled && !this.animationState.isTypewriting) {
            this.startTypewriter();
        }
        
        if (!this.particleInterval) {
            this.particleInterval = setInterval(() => {
                if (this.particles.length < this.config.particleCount) {
                    this.createParticle();
                }
            }, 1000);
        }
    }
    
    /**
     * Destroy hero manager and cleanup
     */
    destroy() {
        // Cancel animations
        this.pause();
        
        // Clear all particles
        this.clearParticles();
        
        // Remove event listeners
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.eventListeners.clear();
        
        // Disconnect intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        // Remove ARIA live region
        const announcer = document.getElementById('hero-announcer');
        if (announcer) {
            announcer.remove();
        }
        
        console.log('🚀 Hero Manager destroyed');
    }
}

// Auto-initialize if not in module context
if (typeof window !== 'undefined' && !window.heroManager) {
    window.heroManager = new HeroManager();
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.heroManager.init();
        });
    } else {
        window.heroManager.init();
    }
}

export default HeroManager; 