/**
 * ============================================================================
 * PROGRESSIVE LOADER - PERFORMANCE FIRST
 * Step-by-step content loading for smooth user experience
 * ============================================================================
 */

class ProgressiveLoader {
    constructor() {
        this.isLoaded = false;
        this.loadingSteps = [];
        this.currentStep = 0;
        this.loadingStartTime = performance.now();
        
        // Bind methods
        this.handleDOMContentLoaded = this.handleDOMContentLoaded.bind(this);
        this.handleWindowLoad = this.handleWindowLoad.bind(this);
        
        this.init();
    }

    init() {
        // Add loading class to body
        document.body.classList.add('loading');
        
        // Setup loading steps
        this.setupLoadingSteps();
        
        // Listen for DOM events
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.handleDOMContentLoaded);
        } else {
            this.handleDOMContentLoaded();
        }
        
        if (document.readyState === 'complete') {
            this.handleWindowLoad();
        } else {
            window.addEventListener('load', this.handleWindowLoad);
        }
    }

    setupLoadingSteps() {
        this.loadingSteps = [
            {
                name: 'DOM Content',
                duration: 200,
                action: () => this.loadDOMContent()
            },
            {
                name: 'Critical CSS',
                duration: 100,
                action: () => this.loadCriticalCSS()
            },
            {
                name: 'Hero Section',
                duration: 300,
                action: () => this.loadHeroSection()
            },
            {
                name: 'Core Features',
                duration: 200,
                action: () => this.loadCoreFeatures()
            },
            {
                name: 'Secondary Content',
                duration: 400,
                action: () => this.loadSecondaryContent()
            },
            {
                name: 'Animations',
                duration: 100,
                action: () => this.enableAnimations()
            }
        ];
    }

    async handleDOMContentLoaded() {
        console.log('🚀 DOM Content Loaded');
        await this.executeStep(0); // DOM Content
        await this.executeStep(1); // Critical CSS
    }

    async handleWindowLoad() {
        console.log('✅ Window Loaded');
        
        // Execute remaining steps
        for (let i = 2; i < this.loadingSteps.length; i++) {
            await this.executeStep(i);
        }
        
        // Complete loading
        await this.completeLoading();
    }

    async executeStep(stepIndex) {
        if (stepIndex >= this.loadingSteps.length) return;
        
        const step = this.loadingSteps[stepIndex];
        console.log(`📋 Loading: ${step.name}`);
        
        // Execute step action
        await step.action();
        
        // Wait for step duration
        await this.wait(step.duration);
        
        this.currentStep = stepIndex + 1;
    }

    async loadDOMContent() {
        // Remove any existing loading conflicts
        const conflictingElements = document.querySelectorAll('[data-aos]');
        conflictingElements.forEach(el => {
            el.removeAttribute('data-aos');
            el.removeAttribute('data-aos-delay');
        });
        
        // Add progressive load classes
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.classList.add('progressive-load');
        });
    }

    async loadCriticalCSS() {
        // Load performance-first CSS
        const perfCSS = document.createElement('link');
        perfCSS.rel = 'stylesheet';
        perfCSS.href = '/assets/css/performance-first-animations.css';
        document.head.appendChild(perfCSS);
        
        return new Promise(resolve => {
            perfCSS.onload = resolve;
            perfCSS.onerror = resolve; // Continue even if fails
        });
    }

    async loadHeroSection() {
        const hero = document.querySelector('.hero');
        const heroAvatar = document.querySelector('.hero-avatar');
        const heroText = document.querySelector('.hero-text');
        
        if (hero) {
            hero.classList.add('loaded');
            
            // Stagger hero elements
            setTimeout(() => {
                if (heroAvatar) heroAvatar.classList.add('loaded');
            }, 200);
            
            setTimeout(() => {
                if (heroText) heroText.classList.add('loaded');
            }, 400);
        }
    }

    async loadCoreFeatures() {
        const navbar = document.querySelector('.navbar');
        const heroActions = document.querySelector('.hero-actions');
        
        if (navbar) {
            navbar.classList.add('loaded');
        }
        
        if (heroActions) {
            heroActions.classList.add('loaded');
        }
        
        // Load visible sections
        const visibleSections = document.querySelectorAll('section');
        visibleSections.forEach((section, index) => {
            if (this.isElementInViewport(section)) {
                setTimeout(() => {
                    section.classList.add('loaded', 'in-view');
                }, index * 100);
            }
        });
    }

    async loadSecondaryContent() {
        // Setup intersection observer for remaining content
        this.setupIntersectionObserver();
        
        // Load non-critical elements
        const secondaryElements = document.querySelectorAll('.hero-stats, .hero-social-proof, .floating-elements');
        secondaryElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('loaded');
            }, index * 150);
        });
    }

    async enableAnimations() {
        // Enable all animations
        document.body.classList.add('animations-enabled');
        document.body.classList.remove('loading');
        document.body.classList.add('content-loaded');
        
        console.log('🎬 Animations Enabled');
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('loaded', 'in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observe all sections that aren't loaded yet
        const sections = document.querySelectorAll('section:not(.loaded)');
        sections.forEach(section => observer.observe(section));
    }

    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    async completeLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        
        // Calculate total loading time
        const totalTime = performance.now() - this.loadingStartTime;
        console.log(`⚡ Total loading time: ${Math.round(totalTime)}ms`);
        
        // Ensure minimum loading time for smooth experience
        const minLoadingTime = 1500;
        if (totalTime < minLoadingTime) {
            await this.wait(minLoadingTime - totalTime);
        }
        
        // Hide loading screen
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
        
        this.isLoaded = true;
        console.log('🎉 Loading Complete!');
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('portfolioLoaded', {
            detail: { loadingTime: totalTime }
        }));
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Public methods
    getLoadingProgress() {
        return Math.round((this.currentStep / this.loadingSteps.length) * 100);
    }

    isLoadingComplete() {
        return this.isLoaded;
    }
}

// Auto-initialize
const progressiveLoader = new ProgressiveLoader();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressiveLoader;
}

// Global access
window.ProgressiveLoader = progressiveLoader; 