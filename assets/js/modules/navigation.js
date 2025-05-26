class NavigationManager {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.navMenu = document.querySelector('.nav-menu');
        this.mobileToggle = document.querySelector('.nav-mobile-toggle');
        this.navLinks = document.querySelectorAll('.nav-menu a');
        this.sections = document.querySelectorAll('section[id]');
        
        this.lastScrollY = window.scrollY;
        this.isMenuOpen = false;
        
        this.init();
    }

    init() {
        this.setupScrollEffects();
        this.setupMobileMenu();
        this.setupSmoothScrolling();
        this.setupActiveLinks();
        this.setupKeyboardNavigation();
    }

    setupScrollEffects() {
        let scrollTimer = null;
        
        window.addEventListener('scroll', () => {
            if (scrollTimer) clearTimeout(scrollTimer);
            
            scrollTimer = setTimeout(() => {
                this.handleScroll();
            }, 10);
        });
    }

    handleScroll() {
        const currentScrollY = window.scrollY;
        
        // Add scrolled class
        if (currentScrollY > 50) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }

        // Hide/show navbar on scroll
        if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
            this.navbar.classList.add('hidden');
        } else {
            this.navbar.classList.remove('hidden');
        }
        
        this.lastScrollY = currentScrollY;
        
        // Update active navigation link
        this.updateActiveLink();
    }

    setupMobileMenu() {
        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());
            
            // Close menu when clicking on links
            this.navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    if (this.isMenuOpen) {
                        this.closeMobileMenu();
                    }
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (this.isMenuOpen && !this.navbar.contains(e.target)) {
                    this.closeMobileMenu();
                }
            });

            // Escape key to close menu
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isMenuOpen) {
                    this.closeMobileMenu();
                }
            });
        }
    }

    toggleMobileMenu() {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        this.isMenuOpen = true;
        this.mobileToggle.classList.add('active');
        this.navMenu.classList.add('active');
        this.mobileToggle.setAttribute('aria-expanded', 'true');
        this.mobileToggle.setAttribute('aria-label', 'Menüyü kapat');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus first menu item
        const firstLink = this.navMenu.querySelector('a');
        if (firstLink) firstLink.focus();
    }

    closeMobileMenu() {
        this.isMenuOpen = false;
        this.mobileToggle.classList.remove('active');
        this.navMenu.classList.remove('active');
        this.mobileToggle.setAttribute('aria-expanded', 'false');
        this.mobileToggle.setAttribute('aria-label', 'Menüyü aç');
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    setupSmoothScrolling() {
        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetSection = document.getElementById(targetId);
                    
                    if (targetSection) {
                        const offsetTop = targetSection.offsetTop - 70; // Account for fixed navbar
                        
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                        
                        // Update URL without jumping
                        history.pushState(null, null, href);
                        
                        // Focus the target section for accessibility
                        targetSection.setAttribute('tabindex', '-1');
                        targetSection.focus();
                        setTimeout(() => {
                            targetSection.removeAttribute('tabindex');
                        }, 1000);
                    }
                });
            }
        });
    }

    updateActiveLink() {
        let current = '';
        
        this.sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    setupActiveLinks() {
        // Set initial active link based on current hash
        const currentHash = window.location.hash;
        if (currentHash) {
            this.navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === currentHash) {
                    link.classList.add('active');
                }
            });
        }
    }

    setupKeyboardNavigation() {
        this.navLinks.forEach((link, index) => {
            link.addEventListener('keydown', (e) => {
                let targetIndex = -1;
                
                switch (e.key) {
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        e.preventDefault();
                        targetIndex = index > 0 ? index - 1 : this.navLinks.length - 1;
                        break;
                    case 'ArrowRight':
                    case 'ArrowDown':
                        e.preventDefault();
                        targetIndex = index < this.navLinks.length - 1 ? index + 1 : 0;
                        break;
                    case 'Home':
                        e.preventDefault();
                        targetIndex = 0;
                        break;
                    case 'End':
                        e.preventDefault();
                        targetIndex = this.navLinks.length - 1;
                        break;
                }
                
                if (targetIndex >= 0) {
                    this.navLinks[targetIndex].focus();
                }
            });
        });
    }
}

// Initialize navigation manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});

export default NavigationManager; 