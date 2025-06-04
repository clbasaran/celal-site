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

// Main JavaScript for Component Loading and Site Functionality
class SiteManager {
    constructor() {
        this.components = {
            about: 'components/about.html',
            skills: 'components/skills.html', 
            projects: 'components/projects.html',
            contact: 'components/contact.html'
        };
        this.currentSection = 'home';
        this.init();
    }

    async init() {
        await this.loadAllComponents();
        this.setupNavigation();
        this.setupMatrix();
        this.setupAnimations();
        this.hideLoadingScreen();
    }

    async loadComponent(path) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                return await response.text();
            }
            throw new Error(`Failed to load component: ${path}`);
        } catch (error) {
            console.error('Error loading component:', error);
            return '<div class="text-center text-terminal-muted">Failed to load content</div>';
        }
    }

    async loadAllComponents() {
        try {
            const componentPromises = Object.entries(this.components).map(async ([name, path]) => {
                const html = await this.loadComponent(path);
                return { name, html };
            });

            const loadedComponents = await Promise.all(componentPromises);
            
            // Insert components into the main container
            const mainContainer = document.querySelector('main') || document.body;
            
            loadedComponents.forEach(({ name, html }) => {
                const container = document.createElement('div');
                container.id = `${name}-section`;
                container.innerHTML = html;
                
                // Insert after hero section but before footer
                const footer = document.querySelector('footer');
                if (footer) {
                    footer.parentNode.insertBefore(container, footer);
                } else {
                    mainContainer.appendChild(container);
                }
            });

            console.log('✅ All components loaded successfully');
        } catch (error) {
            console.error('❌ Error loading components:', error);
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Smooth scrolling
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').slice(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Active nav highlighting
        this.updateActiveNavigation();
        window.addEventListener('scroll', () => this.updateActiveNavigation());
    }

    updateActiveNavigation() {
        const sections = document.querySelectorAll('section');
        const navLinks = document.querySelectorAll('.nav-link');
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('text-accent');
            link.classList.add('text-muted');
            
            if (link.getAttribute('href').slice(1) === current) {
                link.classList.remove('text-muted');
                link.classList.add('text-accent');
            }
        });
    }

    setupMatrix() {
        const matrix = document.getElementById('matrix');
        if (!matrix) return;

        const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
        const columns = Math.floor(window.innerWidth / 20);

        // Clear existing columns
        matrix.innerHTML = '';

        for (let i = 0; i < columns; i++) {
            const column = document.createElement('div');
            column.className = 'matrix-column';
            column.style.left = i * 20 + 'px';
            column.style.animationDelay = Math.random() * 5 + 's';
            column.style.fontSize = Math.random() * 10 + 10 + 'px';
            
            let text = '';
            for (let j = 0; j < 20; j++) {
                text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
            }
            column.innerHTML = text;
            
            matrix.appendChild(column);
        }
    }

    setupAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                    
                    // Animate skill progress bars
                    const progressBars = entry.target.querySelectorAll('.skill-progress');
                    progressBars.forEach(bar => {
                        const width = bar.getAttribute('data-width');
                        if (width) {
                            setTimeout(() => {
                                bar.style.setProperty('--width', width + '%');
                            }, 300);
                        }
                    });
                }
            });
        }, observerOptions);

        // Observe all terminal windows and glass cards
        setTimeout(() => {
            const elementsToObserve = document.querySelectorAll('.terminal-window, .glass-card');
            elementsToObserve.forEach(el => observer.observe(el));
        }, 1000);

        // Typing effect for specific elements
        this.initializeTypingEffects();
    }

    initializeTypingEffects() {
        const typingElements = document.querySelectorAll('.typing-text');
        typingElements.forEach((element, index) => {
            setTimeout(() => {
                this.typeWriter(element, element.textContent, 50);
            }, index * 1000);
        });
    }

    typeWriter(element, text, speed = 100) {
        element.textContent = '';
        let i = 0;
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

    hideLoadingScreen() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 2000);
    }

    // Utility method for form handling
    handleContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(contactForm);
                const data = Object.fromEntries(formData);
                
                const submitBtn = contactForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                
                // Loading state
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
                submitBtn.disabled = true;
                
                try {
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Success
                    if (window.Toast) {
                        window.Toast.show('Message sent successfully!', 'success');
                    }
                    
                    contactForm.reset();
                    
                } catch (error) {
                    if (window.Toast) {
                        window.Toast.show('Failed to send message', 'error');
                    }
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const siteManager = new SiteManager();
    
    // Handle resize for matrix effect
    window.addEventListener('resize', () => {
        siteManager.setupMatrix();
    });
    
    // Terminal command simulation
    document.addEventListener('keypress', (e) => {
        if (e.key === '`' && e.ctrlKey) {
            console.log('🚀 Terminal access granted');
            console.log('Available commands: help, about, skills, projects, contact');
        }
    });
});

// Export for global access
window.SiteManager = SiteManager;

// Main Site JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme
    initTheme();
    
    // Load dynamic content
    loadProjects();
    
    // Initialize contact form
    initContactForm();
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Load admin-managed content if available
    loadAdminContent();
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Load projects from admin panel or default data
function loadProjects() {
    // Try to load from admin panel data first
    let projects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    // If no admin data, use default projects
    if (projects.length === 0) {
        projects = getDefaultProjects();
    }
    
    displayProjects(projects);
}

function getDefaultProjects() {
    return [
        {
            id: 'default-1',
            title: 'E-ticaret Platformu',
            description: 'Modern ve kullanıcı dostu e-ticaret çözümü. React ve Node.js teknolojileri ile geliştirildi.',
            image: 'assets/images/ecommerce-project.jpg',
            technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
            liveDemo: '#',
            sourceCode: '#',
            featured: true
        },
        {
            id: 'default-2',
            title: 'Task Management App',
            description: 'Ekip çalışması için geliştirilmiş modern görev yönetim uygulaması.',
            image: 'assets/images/task-app.jpg',
            technologies: ['Vue.js', 'Firebase', 'Vuetify'],
            liveDemo: '#',
            sourceCode: '#',
            featured: true
        },
        {
            id: 'default-3',
            title: 'Portfolio Website',
            description: 'Responsive ve modern tasarım ile hazırlanmış kişisel portfolio sitesi.',
            image: 'assets/images/portfolio.jpg',
            technologies: ['HTML5', 'CSS3', 'JavaScript', 'SASS'],
            liveDemo: '#',
            sourceCode: '#',
            featured: false
        }
    ];
}

function displayProjects(projects) {
    const projectsContainer = document.getElementById('projects-container');
    if (!projectsContainer) return;
    
    projectsContainer.innerHTML = '';
    
    projects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsContainer.appendChild(projectCard);
    });
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
        <div class="project-image">
            <img src="${project.image}" alt="${project.title}" onerror="this.src='assets/images/project-placeholder.jpg'">
            <div class="project-overlay">
                <div class="project-links">
                    <a href="${project.liveDemo}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt"></i> Demo
                    </a>
                    <a href="${project.sourceCode}" target="_blank" class="btn btn-secondary">
                        <i class="fab fa-github"></i> Kod
                    </a>
                </div>
            </div>
        </div>
        <div class="project-content">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <div class="project-technologies">
                ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
            </div>
        </div>
    `;
    
    return card;
}

// Contact Form
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message')
        };
        
        // Simulate form submission
        showNotification('Mesajınız gönderildi! En kısa sürede size dönüş yapacağım.', 'success');
        contactForm.reset();
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements with animation classes
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// Load admin-managed content
function loadAdminContent() {
    // Load admin settings if available
    const adminSettings = JSON.parse(localStorage.getItem('admin-settings') || '{}');
    
    if (adminSettings.siteTitle) {
        document.title = adminSettings.siteTitle;
        const titleElements = document.querySelectorAll('.site-title');
        titleElements.forEach(el => el.textContent = adminSettings.siteTitle);
    }
    
    if (adminSettings.siteDescription) {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', adminSettings.siteDescription);
        }
    }
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Mobile Navigation
function toggleMobileMenu() {
    const mobileMenu = document.querySelector('.navbar-menu');
    const hamburger = document.querySelector('.hamburger');
    
    if (mobileMenu && hamburger) {
        mobileMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    }
}

// Smooth scroll for navigation links
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Admin Panel Access
function checkAdminAccess() {
    // Simple admin access check
    const password = prompt('Admin paneline erişim için şifre girin:');
    if (password === 'admin123') {
        window.location.href = 'admin/index.html';
    } else if (password !== null) {
        alert('Yanlış şifre!');
    }
}

// Export functions to global scope
window.toggleTheme = toggleTheme;
window.toggleMobileMenu = toggleMobileMenu;
window.checkAdminAccess = checkAdminAccess; 