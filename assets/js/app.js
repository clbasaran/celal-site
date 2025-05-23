/*
 * ============================================================================
 * CELAL BAŞARAN - ULTRA-ADVANCED PORTFOLIO
 * Main Application JavaScript - AI-Powered Interactive Portfolio
 * ============================================================================
 * Features:
 * - Advanced Loading Screen with Progress Tracking
 * - Smooth Navigation with 3D Transforms
 * - Theme Management System
 * - Language Switching
 * - Advanced Search Functionality
 * - Voice Commands Integration
 * - AI Assistant Integration
 * - Performance Monitoring
 * - Analytics Integration
 * ============================================================================
 */

// Advanced Application Class
class PortfolioApp {
    constructor() {
        this.version = "3.0.0";
        this.theme = localStorage.getItem('theme') || 'dark';
        this.language = localStorage.getItem('language') || 'tr';
        this.isLoading = true;
        this.loadingProgress = 0;
        this.modules = new Map();
        
        // Performance monitoring
        this.performanceMetrics = {
            startTime: performance.now(),
            loadTime: 0,
            interactionTime: 0,
            renderTime: 0
        };
        
        this.init();
    }
    
    async init() {
        console.log(`🚀 Portfolio v${this.version} initializing...`);
        
        try {
            // Start loading process
            await this.showLoadingScreen();
            
            // Initialize core systems
            await this.initializeCore();
            
            // Load modules
            await this.loadModules();
            
            // Initialize UI components
            await this.initializeUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Apply theme and language
            this.applyTheme();
            this.applyLanguage();
            
            // Hide loading screen
            await this.hideLoadingScreen();
            
            // Initialize animations
            this.initializeAnimations();
            
            // Track performance
            this.trackPerformance();
            
            console.log('✅ Portfolio initialized successfully!');
            
        } catch (error) {
            console.error('❌ Error initializing portfolio:', error);
            this.handleError(error);
        }
    }
    
    async showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (!loadingScreen) return;
        
        loadingScreen.style.display = 'flex';
        
        // Simulate loading progress
        const steps = [
            { name: 'Loading Core...', duration: 300 },
            { name: 'Initializing 3D Engine...', duration: 500 },
            { name: 'Loading AI Assistant...', duration: 400 },
            { name: 'Setting up Voice Commands...', duration: 350 },
            { name: 'Preparing Animations...', duration: 300 },
            { name: 'Finalizing...', duration: 200 }
        ];
        
        for (const [index, step] of steps.entries()) {
            await this.updateLoadingProgress(step.name, (index + 1) / steps.length * 100);
            await this.delay(step.duration);
        }
    }
    
    async updateLoadingProgress(text, progress) {
        const progressBar = document.querySelector('.loading-progress-bar');
        const loadingText = document.querySelector('.loading-text');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (loadingText) {
            loadingText.textContent = text;
        }
        
        this.loadingProgress = progress;
    }
    
    async hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (!loadingScreen) return;
        
        await this.delay(500); // Wait a bit for visual effect
        
        loadingScreen.classList.add('fade-out');
        
        await this.delay(1000); // Wait for fade animation
        
        loadingScreen.style.display = 'none';
        this.isLoading = false;
    }
    
    async initializeCore() {
        // Initialize theme system
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Initialize viewport handling
        this.setupViewport();
        
        // Initialize scroll behavior
        this.setupScrollBehavior();
        
        // Initialize intersection observer for animations
        this.setupIntersectionObserver();
    }
    
    async loadModules() {
        const modules = [
            { name: '3d-engine', path: './modules/3d-engine.js' },
            { name: 'ai-assistant', path: './modules/ai-assistant.js' },
            { name: 'voice-commands', path: './modules/voice-commands.js' },
            { name: 'analytics', path: './modules/analytics.js' },
            { name: 'performance-monitor', path: './modules/performance-monitor.js' }
        ];
        
        for (const module of modules) {
            try {
                const imported = await import(module.path);
                this.modules.set(module.name, imported.default || imported);
                console.log(`📦 Module loaded: ${module.name}`);
            } catch (error) {
                console.warn(`⚠️ Failed to load module ${module.name}:`, error);
            }
        }
    }
    
    async initializeUI() {
        // Initialize navigation
        this.initializeNavigation();
        
        // Initialize theme toggle
        this.initializeThemeToggle();
        
        // Initialize language selector
        this.initializeLanguageSelector();
        
        // Initialize search
        this.initializeSearch();
        
        // Initialize mobile navigation
        this.initializeMobileNavigation();
        
        // Initialize typewriter effect
        this.initializeTypewriter();
        
        // Initialize statistics counter
        this.initializeStatsCounter();
        
        // Initialize AI assistant
        this.initializeAIAssistant();
    }
    
    initializeNavigation() {
        const navbar = document.getElementById('navbar');
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Handle scroll-based navbar styling
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (navbar) {
                if (currentScrollY > 100) {
                    navbar.style.backdropFilter = 'blur(30px)';
                    navbar.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
                } else {
                    navbar.style.backdropFilter = 'blur(20px)';
                    navbar.style.backgroundColor = 'rgba(28, 28, 30, 0.8)';
                }
                
                // Hide/show navbar on scroll
                if (currentScrollY > lastScrollY && currentScrollY > 200) {
                    navbar.style.transform = 'translateY(-100%)';
                } else {
                    navbar.style.transform = 'translateY(0)';
                }
            }
            
            lastScrollY = currentScrollY;
        });
        
        // Handle active link highlighting
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Smooth scroll to target
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    this.smoothScrollTo(targetElement);
                }
            });
        });
        
        // Handle section-based active link
        this.updateActiveNavLink();
    }
    
    initializeThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }
    
    toggleTheme() {
        const themes = ['dark', 'light'];
        const currentIndex = themes.indexOf(this.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.theme = themes[nextIndex];
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
        
        // Animate theme transition
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }
    
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Update theme icon
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            const sunIcon = themeIcon.querySelector('.sun-icon');
            const moonIcon = themeIcon.querySelector('.moon-icon');
            
            if (this.theme === 'light') {
                sunIcon?.style.setProperty('opacity', '0');
                sunIcon?.style.setProperty('transform', 'rotate(180deg)');
                moonIcon?.style.setProperty('opacity', '1');
                moonIcon?.style.setProperty('transform', 'rotate(0deg)');
            } else {
                sunIcon?.style.setProperty('opacity', '1');
                sunIcon?.style.setProperty('transform', 'rotate(0deg)');
                moonIcon?.style.setProperty('opacity', '0');
                moonIcon?.style.setProperty('transform', 'rotate(180deg)');
            }
        }
        
        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', this.theme === 'dark' ? '#000000' : '#ffffff');
        }
    }
    
    initializeLanguageSelector() {
        const langToggle = document.getElementById('langToggle');
        const langDropdown = document.getElementById('langDropdown');
        const langOptions = document.querySelectorAll('.lang-option');
        
        if (langToggle && langDropdown) {
            langToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const selector = langToggle.closest('.language-selector');
                selector.classList.toggle('open');
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                const selector = langToggle.closest('.language-selector');
                selector?.classList.remove('open');
            });
        }
        
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = option.getAttribute('data-lang');
                this.changeLanguage(lang);
            });
        });
    }
    
    changeLanguage(lang) {
        this.language = lang;
        localStorage.setItem('language', lang);
        this.applyLanguage();
        
        // Update UI
        const langText = document.querySelector('.lang-text');
        const langOptions = document.querySelectorAll('.lang-option');
        
        if (langText) {
            langText.textContent = lang.toUpperCase();
        }
        
        langOptions.forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-lang') === lang) {
                option.classList.add('active');
            }
        });
        
        // Close dropdown
        const selector = document.querySelector('.language-selector');
        selector?.classList.remove('open');
    }
    
    applyLanguage() {
        // This would typically load translations
        console.log(`Language set to: ${this.language}`);
        
        // Update document language
        document.documentElement.setAttribute('lang', this.language);
    }
    
    initializeSearch() {
        const searchToggle = document.getElementById('searchToggle');
        const searchOverlay = document.getElementById('searchOverlay');
        const searchClose = document.getElementById('searchClose');
        const searchInput = document.getElementById('searchInput');
        
        if (searchToggle && searchOverlay) {
            searchToggle.addEventListener('click', () => {
                this.openSearch();
            });
        }
        
        if (searchClose) {
            searchClose.addEventListener('click', () => {
                this.closeSearch();
            });
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeSearch();
                }
            });
        }
        
        // Close search with ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && searchOverlay?.classList.contains('active')) {
                this.closeSearch();
            }
        });
    }
    
    openSearch() {
        const searchOverlay = document.getElementById('searchOverlay');
        const searchInput = document.getElementById('searchInput');
        
        if (searchOverlay) {
            searchOverlay.classList.add('active');
            setTimeout(() => {
                searchInput?.focus();
            }, 100);
        }
    }
    
    closeSearch() {
        const searchOverlay = document.getElementById('searchOverlay');
        
        if (searchOverlay) {
            searchOverlay.classList.remove('active');
        }
    }
    
    handleSearch(query) {
        if (query.length < 2) return;
        
        // This would implement actual search functionality
        console.log(`Searching for: ${query}`);
        
        // Mock search results
        const results = [
            { type: 'project', title: 'AI-Powered iOS App', url: '#projects' },
            { type: 'skill', title: 'SwiftUI Development', url: '#skills' },
            { type: 'blog', title: 'Machine Learning Guide', url: '#blog' }
        ].filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase())
        );
        
        this.displaySearchResults(results);
    }
    
    displaySearchResults(results) {
        const searchResults = document.getElementById('searchResults');
        
        if (!searchResults) return;
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No results found</div>';
            return;
        }
        
        const html = results.map(result => `
            <div class="search-result-item">
                <div class="result-type">${result.type}</div>
                <div class="result-title">${result.title}</div>
            </div>
        `).join('');
        
        searchResults.innerHTML = html;
    }
    
    initializeMobileNavigation() {
        const mobileToggle = document.getElementById('mobileToggle');
        const mobileNav = document.getElementById('mobileNav');
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        
        if (mobileToggle && mobileNav) {
            mobileToggle.addEventListener('click', () => {
                mobileToggle.classList.toggle('active');
                mobileNav.classList.toggle('active');
                
                // Prevent body scroll when menu is open
                if (mobileNav.classList.contains('active')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            });
        }
        
        // Close mobile nav when clicking on a link
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle?.classList.remove('active');
                mobileNav?.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
    
    initializeTypewriter() {
        const typewriterElement = document.getElementById('typewriter');
        
        if (!typewriterElement) return;
        
        const texts = [
            'Senior iOS Architect',
            'AI Developer',
            'Full-Stack Engineer',
            'Innovation Leader',
            'Tech Visionary'
        ];
        
        let currentTextIndex = 0;
        let currentCharIndex = 0;
        let isDeleting = false;
        
        const typeSpeed = 100;
        const deleteSpeed = 50;
        const pauseDuration = 2000;
        
        const type = () => {
            const currentText = texts[currentTextIndex];
            
            if (isDeleting) {
                typewriterElement.textContent = currentText.substring(0, currentCharIndex - 1);
                currentCharIndex--;
            } else {
                typewriterElement.textContent = currentText.substring(0, currentCharIndex + 1);
                currentCharIndex++;
            }
            
            let timeoutDuration = isDeleting ? deleteSpeed : typeSpeed;
            
            if (!isDeleting && currentCharIndex === currentText.length) {
                timeoutDuration = pauseDuration;
                isDeleting = true;
            } else if (isDeleting && currentCharIndex === 0) {
                isDeleting = false;
                currentTextIndex = (currentTextIndex + 1) % texts.length;
            }
            
            setTimeout(type, timeoutDuration);
        };
        
        // Start typing effect
        setTimeout(type, 1000);
    }
    
    initializeStatsCounter() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;
            
            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    stat.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    stat.textContent = target;
                }
            };
            
            // Start animation when element is visible
            this.observeElement(stat, () => {
                updateCounter();
            });
        });
    }
    
    initializeAIAssistant() {
        const aiToggle = document.getElementById('aiToggle');
        const aiClose = document.getElementById('aiClose');
        const aiAssistant = document.getElementById('aiAssistant');
        
        if (aiToggle && aiAssistant) {
            aiToggle.addEventListener('click', () => {
                aiAssistant.classList.toggle('open');
            });
        }
        
        if (aiClose && aiAssistant) {
            aiClose.addEventListener('click', () => {
                aiAssistant.classList.remove('open');
            });
        }
    }
    
    setupEventListeners() {
        // Smooth scroll for anchor links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    this.smoothScrollTo(targetElement);
                }
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 100));
        
        // Handle scroll events
        window.addEventListener('scroll', this.throttle(() => {
            this.handleScroll();
        }, 16)); // 60fps
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }
    
    setupViewport() {
        // Handle mobile viewport units
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
    }
    
    setupScrollBehavior() {
        // Add smooth scrolling polyfill for older browsers
        if (!CSS.supports('scroll-behavior', 'smooth')) {
            const smoothScrollPolyfill = document.createElement('script');
            smoothScrollPolyfill.src = 'https://polyfill.io/v3/polyfill.min.js?features=smoothscroll';
            document.head.appendChild(smoothScrollPolyfill);
        }
    }
    
    setupIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        
                        // Trigger any callbacks
                        const callback = entry.target._animationCallback;
                        if (callback) {
                            callback();
                            entry.target._animationCallback = null;
                        }
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '50px'
            }
        );
        
        // Observe elements with animation attributes
        document.querySelectorAll('[data-aos]').forEach(el => {
            this.intersectionObserver.observe(el);
        });
    }
    
    observeElement(element, callback) {
        element._animationCallback = callback;
        this.intersectionObserver.observe(element);
    }
    
    initializeAnimations() {
        // Add CSS classes for animations
        document.querySelectorAll('[data-aos]').forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            el.style.transitionDelay = `${index * 0.1}s`;
        });
        
        // Initialize parallax effects
        this.initializeParallax();
        
        // Initialize scroll-triggered animations
        this.initializeScrollAnimations();
    }
    
    initializeParallax() {
        const parallaxElements = document.querySelectorAll('.floating-element');
        
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            
            parallaxElements.forEach((el, index) => {
                const speed = 0.5 + (index * 0.1);
                const yPos = -(scrollY * speed);
                el.style.transform = `translateY(${yPos}px)`;
            });
        });
    }
    
    initializeScrollAnimations() {
        // Update active navigation link based on scroll position
        this.updateActiveNavLink();
    }
    
    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        window.addEventListener('scroll', () => {
            let current = '';
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                
                if (window.scrollY >= (sectionTop - 200)) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }
    
    smoothScrollTo(element, offset = 100) {
        const targetPosition = element.offsetTop - offset;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
    
    handleResize() {
        // Update viewport dimensions
        this.setupViewport();
        
        // Trigger resize event for modules
        this.modules.forEach(module => {
            if (module.handleResize) {
                module.handleResize();
            }
        });
    }
    
    handleScroll() {
        // Update scroll progress
        const scrollProgress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        document.documentElement.style.setProperty('--scroll-progress', scrollProgress);
        
        // Trigger scroll event for modules
        this.modules.forEach(module => {
            if (module.handleScroll) {
                module.handleScroll(window.scrollY);
            }
        });
    }
    
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.openSearch();
        }
        
        // Ctrl/Cmd + D for theme toggle
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.toggleTheme();
        }
        
        // Escape to close overlays
        if (e.key === 'Escape') {
            this.closeSearch();
            const aiAssistant = document.getElementById('aiAssistant');
            aiAssistant?.classList.remove('open');
        }
    }
    
    trackPerformance() {
        this.performanceMetrics.loadTime = performance.now() - this.performanceMetrics.startTime;
        
        // Track Web Vitals
        if ('web-vitals' in window) {
            // This would integrate with web-vitals library
        }
        
        // Log performance metrics
        console.log('📊 Performance Metrics:', this.performanceMetrics);
    }
    
    handleError(error) {
        console.error('Application Error:', error);
        
        // Show user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-notification';
        errorMessage.innerHTML = `
            <div class="error-content">
                <h3>Something went wrong</h3>
                <p>We're working to fix this issue. Please refresh the page.</p>
                <button onclick="window.location.reload()">Refresh Page</button>
            </div>
        `;
        
        document.body.appendChild(errorMessage);
        
        setTimeout(() => {
            errorMessage.remove();
        }, 10000);
    }
    
    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
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
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioApp = new PortfolioApp();
});

// Export for module usage
export default PortfolioApp; 