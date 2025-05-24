/**
 * ============================================================================
 * CELAL BAŞARAN PORTFOLIO - JAVASCRIPT
 * Professional interactive features with smooth performance
 * ============================================================================
 */

class PortfolioApp {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'dark';
        this.isLoaded = false;
        this.scrollPosition = 0;
        
        this.init();
    }

    init() {
        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.setTheme(this.theme);
        this.setupNavigation();
        this.setupThemeToggle();
        this.setupSmoothScrolling();
        this.setupLoadingScreen();
        this.setupScrollAnimations();
        this.setupContactForm();
        this.setupSkillBars();
        this.setupParallax();
        
        // Complete loading
        this.completeLoading();
    }

    // ===== LOADING SCREEN =====
    setupLoadingScreen() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (!loadingOverlay) return;

        // Ensure minimum loading time for smooth experience
        setTimeout(() => {
            this.completeLoading();
        }, 1000);
    }

    completeLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.remove();
            }, 500);
        }
        
        this.isLoaded = true;
        this.animateInElements();
    }

    // ===== THEME SYSTEM =====
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        themeToggle.addEventListener('click', () => {
            const newTheme = this.theme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
    }

    setTheme(theme) {
        this.theme = theme;
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    }

    // ===== NAVIGATION =====
    setupNavigation() {
        this.setupActiveNavigation();
        this.setupMobileNavigation();
        this.setupNavbarHide();
    }

    setupActiveNavigation() {
        const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
        const sections = document.querySelectorAll('section[id]');

        if (!navLinks.length || !sections.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        this.updateActiveNavLink(id);
                    }
                });
            },
            { 
                threshold: 0.3,
                rootMargin: '-20% 0px -70% 0px'
            }
        );

        sections.forEach(section => observer.observe(section));
    }

    updateActiveNavLink(activeId) {
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${activeId}`) {
                link.classList.add('active');
            }
        });
    }

    setupMobileNavigation() {
        // Mobile navigation logic can be added here if needed
    }

    setupNavbarHide() {
        let lastScrollTop = 0;
        const navbar = document.querySelector('.nav');
        
        if (!navbar) return;

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                if (scrollTop > lastScrollTop) {
                    // Scrolling down
                    navbar.style.transform = 'translateY(-100%)';
                } else {
                    // Scrolling up
                    navbar.style.transform = 'translateY(0)';
                }
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        }, { passive: true });
    }

    // ===== SMOOTH SCROLLING =====
    setupSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');
        
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;
                
                e.preventDefault();
                const target = document.querySelector(href);
                
                if (target) {
                    const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                    
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ===== SCROLL ANIMATIONS =====
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animatableElements = document.querySelectorAll(`
            .card,
            .hero-stats,
            .hero-actions,
            .timeline-item,
            .project-card,
            .skill-category,
            .testimonial
        `);

        animatableElements.forEach(el => {
            observer.observe(el);
        });
    }

    animateInElements() {
        // Animate hero elements immediately after loading
        const heroElements = document.querySelectorAll(`
            .hero-badge,
            .hero-title,
            .hero-subtitle,
            .hero-visual
        `);

        heroElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('animate-in');
            }, index * 200);
        });
    }

    // ===== SKILL BARS ANIMATION =====
    setupSkillBars() {
        const skillBars = document.querySelectorAll('.skill-progress');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const progressBar = entry.target;
                    const width = progressBar.style.width;
                    
                    // Reset and animate
                    progressBar.style.width = '0%';
                    setTimeout(() => {
                        progressBar.style.width = width;
                    }, 100);
                    
                    observer.unobserve(progressBar);
                }
            });
        }, { threshold: 0.5 });

        skillBars.forEach(bar => observer.observe(bar));
    }

    // ===== PARALLAX EFFECTS =====
    setupParallax() {
        const parallaxElements = document.querySelectorAll('.hero::before, .tech-icons');
        
        if (!parallaxElements.length) return;

        let ticking = false;

        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;

            parallaxElements.forEach(el => {
                el.style.transform = `translateY(${rate}px)`;
            });

            ticking = false;
        };

        const requestParallaxUpdate = () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    }

    // ===== CONTACT FORM =====
    setupContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const button = form.querySelector('button[type="submit"]');
            const originalText = button.innerHTML;
            
            // Loading state
            button.innerHTML = `
                <div class="spinner" style="width: 16px; height: 16px; margin-right: 0.5rem;"></div>
                <span>Gönderiliyor...</span>
            `;
            button.disabled = true;

            try {
                // Simulate form submission
                await this.submitForm(new FormData(form));
                
                // Success state
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span>Başarıyla Gönderildi!</span>
                `;
                button.classList.add('success');
                
                // Reset form
                form.reset();
                
                // Show success message
                this.showNotification('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağım.', 'success');
                
            } catch (error) {
                // Error state
                button.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <span>Gönderim Başarısız</span>
                `;
                
                this.showNotification('Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.', 'error');
            }

            // Reset button after 3 seconds
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
                button.classList.remove('success');
            }, 3000);
        });
    }

    async submitForm(formData) {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate success (90% chance)
                if (Math.random() > 0.1) {
                    resolve();
                } else {
                    reject(new Error('Submission failed'));
                }
            }, 2000);
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? 'var(--color-green)' : 'var(--color-red)',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 'var(--z-maximum)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
    }

    removeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // ===== UTILITY METHODS =====
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
}

// ===== ADDITIONAL FEATURES =====

// Counter Animation
class CounterAnimator {
    static animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.textContent.replace(/\D/g, ''));
                    const suffix = counter.textContent.replace(/\d/g, '');
                    
                    this.animateValue(counter, 0, target, 2000, suffix);
                    observer.unobserve(counter);
                }
            });
        });

        counters.forEach(counter => observer.observe(counter));
    }

    static animateValue(element, start, end, duration, suffix = '') {
        const startTimestamp = performance.now();
        
        const step = (timestamp) => {
            const elapsed = timestamp - startTimestamp;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuad = 1 - (1 - progress) * (1 - progress);
            const current = Math.floor(start + (end - start) * easeOutQuad);
            
            element.textContent = current + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    }
}

// Typing Effect
class TypeWriter {
    constructor(element, words, speed = 100) {
        this.element = element;
        this.words = words;
        this.speed = speed;
        this.wordIndex = 0;
        this.charIndex = 0;
        this.isDeleting = false;
        
        this.type();
    }

    type() {
        const currentWord = this.words[this.wordIndex];
        
        if (this.isDeleting) {
            this.element.textContent = currentWord.substring(0, this.charIndex - 1);
            this.charIndex--;
        } else {
            this.element.textContent = currentWord.substring(0, this.charIndex + 1);
            this.charIndex++;
        }

        let typeSpeed = this.speed;

        if (this.isDeleting) {
            typeSpeed /= 2;
        }

        if (!this.isDeleting && this.charIndex === currentWord.length) {
            typeSpeed = 2000; // Pause at end
            this.isDeleting = true;
        } else if (this.isDeleting && this.charIndex === 0) {
            this.isDeleting = false;
            this.wordIndex++;
            if (this.wordIndex >= this.words.length) {
                this.wordIndex = 0;
            }
            typeSpeed = 500; // Pause before next word
        }

        setTimeout(() => this.type(), typeSpeed);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize main app
    window.portfolioApp = new PortfolioApp();
    
    // Initialize counter animation
    CounterAnimator.animateCounters();
    
    // Initialize typing effect for hero role
    const heroRole = document.querySelector('.hero-role');
    if (heroRole) {
        const roles = [
            'Senior iOS Architect',
            'AI Developer',
            'SwiftUI Expert',
            'ML Engineer',
            'Innovation Leader'
        ];
        new TypeWriter(heroRole, roles, 150);
    }
});

// ===== PERFORMANCE OPTIMIZATIONS =====

// Preload critical resources
const preloadResources = () => {
    const criticalImages = [
        '/avatar.jpg',
        '/hero-bg.jpg'
    ];

    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
};

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PortfolioApp, CounterAnimator, TypeWriter };
} 