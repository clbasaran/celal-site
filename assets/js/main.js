/* ===============================================
   MAIN JAVASCRIPT APPLICATION
   Celal Başaran Portfolio - Premium Interactions
   =============================================== */

// ===== MAIN APPLICATION CLASS =====
class MainApp {
    constructor() {
        this.init();
        this.bindEvents();
        this.initializeComponents();
    }

    // ===== INITIALIZATION =====
    init() {
        this.isLoading = true;
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.scrollPosition = 0;
        this.isScrolling = false;
        this.particles = [];
        
        // Set theme on load
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        // Initialize loading screen
        this.initLoadingScreen();
        
        // Initialize particles
        this.initParticles();
        
        // Initialize scroll animations
        this.initScrollAnimations();
        
        console.log('🚀 Main App Initialized');
    }

    // ===== EVENT BINDING =====
    bindEvents() {
        // Window events
        window.addEventListener('load', () => this.handleWindowLoad());
        window.addEventListener('scroll', () => this.handleScroll());
        window.addEventListener('resize', () => this.handleResize());
        
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Mobile menu
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        // Smooth scroll for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => this.handleSmoothScroll(e));
        });
        
        // Parallax effect on hero
        this.initParallax();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // ===== COMPONENT INITIALIZATION =====
    initializeComponents() {
        // Initialize navigation
        this.initNavigation();
        
        // Initialize hero animations
        this.initHeroAnimations();
        
        // Initialize typing effect
        this.initTypingEffect();
        
        // Initialize counter animations
        this.initCounters();
        
        // Initialize skill bars
        this.initSkillBars();
        
        // Initialize testimonial slider
        this.initTestimonialSlider();
        
        // Initialize contact form
        this.initContactForm();
        
        // Initialize project filters
        this.initProjectFilters();
    }

    // ===== LOADING SCREEN =====
    initLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        
        if (loadingScreen) {
            // Simulate loading progress
            const progressBar = loadingScreen.querySelector('.progress-bar');
            let progress = 0;
            
            const loadingInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(loadingInterval);
                    
                    // Hide loading screen after a delay
                    setTimeout(() => {
                        loadingScreen.classList.add('hidden');
                        this.isLoading = false;
                        this.startMainAnimations();
                    }, 500);
                }
                
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                }
            }, 100);
        } else {
            this.isLoading = false;
            this.startMainAnimations();
        }
    }

    // ===== MAIN ANIMATIONS =====
    startMainAnimations() {
        // Animate hero elements
        const heroElements = document.querySelectorAll('.hero-content > *');
        heroElements.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 200);
        });
        
        // Start particle animation
        this.animateParticles();
        
        // Initialize scroll reveal
        this.revealOnScroll();
    }

    // ===== PARTICLE SYSTEM =====
    initParticles() {
        const particleContainer = document.getElementById('hero-particles');
        if (!particleContainer) return;
        
        // Create particles
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 4}s`;
            particle.style.animationDuration = `${3 + Math.random() * 4}s`;
            
            particleContainer.appendChild(particle);
            this.particles.push(particle);
        }
    }

    animateParticles() {
        // Additional particle animations can be added here
        this.particles.forEach(particle => {
            particle.style.opacity = '1';
        });
    }

    // ===== THEME MANAGEMENT =====
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = themeToggle.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
        }
        
        // Add transition effect
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    // ===== NAVIGATION =====
    initNavigation() {
        const nav = document.getElementById('main-nav');
        if (!nav) return;
        
        // Add scroll effect to navigation
        const handleNavScroll = () => {
            if (window.scrollY > 100) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        };
        
        window.addEventListener('scroll', handleNavScroll);
        
        // Active section highlighting
        this.updateActiveNavLink();
    }

    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.dataset.section === sectionId) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, { threshold: 0.3 });
        
        sections.forEach(section => observer.observe(section));
    }

    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        
        if (navMenu && mobileToggle) {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        }
    }

    // ===== SMOOTH SCROLLING =====
    handleSmoothScroll(e) {
        const href = e.currentTarget.getAttribute('href');
        
        if (href.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed nav
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    }

    // ===== SCROLL ANIMATIONS =====
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, observerOptions);
        
        // Observe elements with scroll reveal classes
        document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right').forEach(el => {
            observer.observe(el);
        });
    }

    revealOnScroll() {
        const elements = document.querySelectorAll('.scroll-reveal:not(.revealed)');
        
        elements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                el.classList.add('revealed');
            }
        });
    }

    // ===== HERO ANIMATIONS =====
    initHeroAnimations() {
        // Floating animation for hero elements
        const floatingElements = document.querySelectorAll('.hero-visual');
        
        floatingElements.forEach(el => {
            el.style.animation = 'float 6s ease-in-out infinite';
        });
        
        // Code typing animation
        this.initCodeAnimation();
    }

    initCodeAnimation() {
        const codeLines = document.querySelectorAll('.code-line');
        
        codeLines.forEach((line, index) => {
            line.style.opacity = '0';
            line.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                line.style.transition = 'all 0.5s ease';
                line.style.opacity = '1';
                line.style.transform = 'translateX(0)';
            }, index * 200 + 1000);
        });
    }

    // ===== TYPING EFFECT =====
    initTypingEffect() {
        const typingElements = document.querySelectorAll('.typing-effect');
        
        typingElements.forEach(element => {
            const text = element.textContent;
            element.textContent = '';
            element.style.borderRight = '2px solid var(--primary-color)';
            
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 100);
                } else {
                    // Blinking cursor effect
                    setInterval(() => {
                        element.style.borderRight = element.style.borderRight === 'none' ? 
                            '2px solid var(--primary-color)' : 'none';
                    }, 500);
                }
            };
            
            // Start typing after a delay
            setTimeout(typeWriter, 2000);
        });
    }

    // ===== COUNTER ANIMATIONS =====
    initCounters() {
        const counters = document.querySelectorAll('.stat-number');
        
        const animateCounter = (counter) => {
            const target = parseInt(counter.textContent.replace(/\D/g, ''));
            const increment = target / 100;
            let current = 0;
            
            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    counter.textContent = Math.ceil(current) + '+';
                    setTimeout(updateCounter, 20);
                } else {
                    counter.textContent = target + '+';
                }
            };
            
            updateCounter();
        };
        
        // Animate counters when they come into view
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        });
        
        counters.forEach(counter => counterObserver.observe(counter));
    }

    // ===== SKILL BARS =====
    initSkillBars() {
        const skillBars = document.querySelectorAll('.skill-progress');
        
        const animateSkillBar = (bar) => {
            const width = bar.style.width || bar.getAttribute('data-width') || '0%';
            bar.style.width = '0%';
            
            setTimeout(() => {
                bar.style.transition = 'width 1.5s ease-in-out';
                bar.style.width = width;
            }, 200);
        };
        
        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkillBar(entry.target);
                    skillObserver.unobserve(entry.target);
                }
            });
        });
        
        skillBars.forEach(bar => skillObserver.observe(bar));
    }

    // ===== PARALLAX EFFECTS =====
    initParallax() {
        const parallaxElements = document.querySelectorAll('.parallax');
        
        if (parallaxElements.length === 0) return;
        
        const handleParallax = () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const rate = scrolled * -0.5;
                element.style.transform = `translateY(${rate}px)`;
            });
        };
        
        window.addEventListener('scroll', handleParallax);
    }

    // ===== EVENT HANDLERS =====
    handleWindowLoad() {
        console.log('🌟 Window Loaded');
        // Additional load handlers can be added here
    }

    handleScroll() {
        if (!this.isScrolling) {
            window.requestAnimationFrame(() => {
                this.revealOnScroll();
                this.isScrolling = false;
            });
            this.isScrolling = true;
        }
    }

    handleResize() {
        // Handle responsive adjustments
        this.updateParticles();
    }

    updateParticles() {
        // Adjust particle positions on resize
        this.particles.forEach(particle => {
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
        });
    }

    // ===== KEYBOARD SHORTCUTS =====
    handleKeyboard(e) {
        // Ctrl/Cmd + K for search (if implemented)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            console.log('🔍 Search shortcut triggered');
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeAllModals();
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // ===== TESTIMONIAL SLIDER =====
    initTestimonialSlider() {
        const slider = document.querySelector('.testimonial-slider');
        if (!slider) return;
        
        // Simple slider implementation
        const slides = slider.querySelectorAll('.testimonial-card');
        let currentSlide = 0;
        
        const showSlide = (index) => {
            slides.forEach((slide, i) => {
                slide.style.display = i === index ? 'block' : 'none';
            });
        };
        
        const nextSlide = () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        };
        
        // Auto-advance slides
        if (slides.length > 1) {
            showSlide(0);
            setInterval(nextSlide, 5000);
        }
    }

    // ===== CONTACT FORM =====
    initContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (!contactForm) return;
        
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContactSubmit(contactForm);
        });
    }

    handleContactSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Gönderiliyor...';
        submitBtn.disabled = true;
        
        // Simulate form submission
        setTimeout(() => {
            console.log('📧 Contact form submitted:', data);
            
            // Show success message
            this.showNotification('Mesajınız başarıyla gönderildi!', 'success');
            
            // Reset form
            form.reset();
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }

    // ===== PROJECT FILTERS =====
    initProjectFilters() {
        const filterButtons = document.querySelectorAll('.project-filter');
        const projects = document.querySelectorAll('.project-card');
        
        if (filterButtons.length === 0) return;
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.dataset.filter;
                
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Filter projects
                projects.forEach(project => {
                    const categories = project.dataset.categories?.split(',') || [];
                    
                    if (filter === 'all' || categories.includes(filter)) {
                        project.style.display = 'block';
                        project.style.animation = 'fadeInUp 0.5s ease';
                    } else {
                        project.style.display = 'none';
                    }
                });
            });
        });
    }

    // ===== UTILITY METHODS =====
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ===== PUBLIC API =====
    refresh() {
        this.revealOnScroll();
        this.updateActiveNavLink();
    }

    destroy() {
        // Cleanup event listeners
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
        console.log('🧹 App destroyed');
    }
}

// ===== INITIALIZE APPLICATION =====
document.addEventListener('DOMContentLoaded', () => {
    window.mainApp = new MainApp();
});

// ===== EXPORT FOR MODULE USAGE =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MainApp;
} 