/**
 * Portfolio OS V6 - Navigation Manager
 * Advanced navigation management with responsive behavior
 */

export class NavigationManager {
    constructor() {
        this.navbar = null;
        this.menuToggle = null;
        this.navMenu = null;
        this.dropdowns = [];
        
        // State
        this.isMenuOpen = false;
        this.isScrolled = false;
        this.lastScrollY = 0;
        this.scrollDirection = 'up';
        
        // Configuration
        this.config = {
            scrollThreshold: 100,
            hideOnScrollDown: false,
            closeMenuOnScroll: true,
            closeMenuOnResize: true
        };
        
        // Bind methods
        this.init = this.init.bind(this);
        this.toggleMenu = this.toggleMenu.bind(this);
        this.closeMenu = this.closeMenu.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }
    
    // ===== INITIALIZATION =====
    async init() {
        try {
            // Get DOM elements
            this.navbar = document.querySelector('.navbar');
            this.menuToggle = document.getElementById('menuToggle');
            this.navMenu = document.getElementById('navMenu');
            
            if (!this.navbar) {
                console.warn('Navigation bar not found');
                return;
            }
            
            // Setup menu toggle
            this.setupMenuToggle();
            
            // Setup dropdowns
            this.setupDropdowns();
            
            // Setup keyboard navigation
            this.setupKeyboardNavigation();
            
            // Setup mobile menu
            this.setupMobileMenu();
            
            // Setup active page highlighting
            this.highlightActivePage();
            
            console.log('🧭 Navigation Manager initialized');
            
        } catch (error) {
            console.warn('Navigation Manager initialization failed:', error);
        }
    }
    
    // ===== MENU MANAGEMENT =====
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.updateMenuState();
        
        // Announce to screen readers
        const message = this.isMenuOpen ? 'Menü açıldı' : 'Menü kapatıldı';
        this.announceToScreenReader(message);
    }
    
    openMenu() {
        if (!this.isMenuOpen) {
            this.isMenuOpen = true;
            this.updateMenuState();
        }
    }
    
    closeMenu() {
        if (this.isMenuOpen) {
            this.isMenuOpen = false;
            this.updateMenuState();
        }
        
        // Also close any open dropdowns
        this.closeAllDropdowns();
    }
    
    updateMenuState() {
        if (!this.navMenu || !this.menuToggle) return;
        
        // Update menu classes
        this.navMenu.classList.toggle('active', this.isMenuOpen);
        
        // Update toggle button
        this.menuToggle.setAttribute('aria-expanded', this.isMenuOpen.toString());
        
        // Prevent body scroll when menu is open (mobile)
        if (window.innerWidth <= 768) {
            document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
        }
        
        // Focus management
        if (this.isMenuOpen) {
            this.focusFirstMenuItem();
        } else {
            this.menuToggle.focus();
        }
    }
    
    // ===== DROPDOWN MANAGEMENT =====
    setupDropdowns() {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        
        dropdownToggles.forEach(toggle => {
            const dropdown = toggle.closest('.nav-dropdown');
            if (!dropdown) return;
            
            // Store dropdown reference
            this.dropdowns.push(dropdown);
            
            // Setup click handler
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDropdown(dropdown);
            });
            
            // Setup keyboard handler
            toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleDropdown(dropdown);
                } else if (e.key === 'Escape') {
                    this.closeDropdown(dropdown);
                }
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!dropdown.contains(e.target)) {
                    this.closeDropdown(dropdown);
                }
            });
        });
    }
    
    toggleDropdown(dropdown) {
        const isExpanded = dropdown.getAttribute('aria-expanded') === 'true';
        
        // Close all other dropdowns first
        this.closeAllDropdowns();
        
        if (!isExpanded) {
            this.openDropdown(dropdown);
        }
    }
    
    openDropdown(dropdown) {
        dropdown.setAttribute('aria-expanded', 'true');
        
        // Focus first menu item
        const firstMenuItem = dropdown.querySelector('.dropdown-link');
        if (firstMenuItem) {
            firstMenuItem.focus();
        }
    }
    
    closeDropdown(dropdown) {
        dropdown.setAttribute('aria-expanded', 'false');
    }
    
    closeAllDropdowns() {
        this.dropdowns.forEach(dropdown => {
            this.closeDropdown(dropdown);
        });
    }
    
    // ===== SCROLL BEHAVIOR =====
    handleScroll() {
        const currentScrollY = window.scrollY;
        
        // Update scroll state
        const wasScrolled = this.isScrolled;
        this.isScrolled = currentScrollY > this.config.scrollThreshold;
        
        // Update navbar appearance
        if (this.isScrolled !== wasScrolled) {
            this.navbar.classList.toggle('scrolled', this.isScrolled);
        }
        
        // Determine scroll direction
        this.scrollDirection = currentScrollY > this.lastScrollY ? 'down' : 'up';
        this.lastScrollY = currentScrollY;
        
        // Hide/show navbar on scroll
        if (this.config.hideOnScrollDown && this.isScrolled) {
            if (this.scrollDirection === 'down') {
                this.navbar.classList.add('navbar-hide');
            } else {
                this.navbar.classList.remove('navbar-hide');
                this.navbar.classList.add('navbar-show');
            }
        }
        
        // Close mobile menu on scroll
        if (this.config.closeMenuOnScroll && this.isMenuOpen) {
            this.closeMenu();
        }
    }
    
    // ===== RESIZE HANDLING =====
    handleResize() {
        // Close menu on resize to larger screen
        if (this.config.closeMenuOnResize && window.innerWidth > 768 && this.isMenuOpen) {
            this.closeMenu();
        }
        
        // Reset body overflow
        if (window.innerWidth > 768) {
            document.body.style.overflow = '';
        }
    }
    
    // ===== SETUP METHODS =====
    setupMenuToggle() {
        if (!this.menuToggle) return;
        
        this.menuToggle.addEventListener('click', this.toggleMenu);
        
        // Initialize ARIA attributes
        this.menuToggle.setAttribute('aria-expanded', 'false');
        this.menuToggle.setAttribute('aria-controls', 'navMenu');
    }
    
    setupMobileMenu() {
        if (!this.navMenu) return;
        
        // Setup navigation links
        const navLinks = this.navMenu.querySelectorAll('.nav-link:not(.dropdown-toggle)');
        
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Close menu when navigating (mobile)
                if (window.innerWidth <= 768) {
                    this.closeMenu();
                }
            });
        });
    }
    
    setupKeyboardNavigation() {
        if (!this.navMenu) return;
        
        // Setup keyboard navigation for menu items
        this.navMenu.addEventListener('keydown', (e) => {
            const focusableElements = this.getFocusableElements();
            const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
            
            switch (e.key) {
                case 'Escape':
                    this.closeMenu();
                    this.closeAllDropdowns();
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    this.focusNext(focusableElements, currentIndex);
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    this.focusPrevious(focusableElements, currentIndex);
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    focusableElements[0]?.focus();
                    break;
                    
                case 'End':
                    e.preventDefault();
                    focusableElements[focusableElements.length - 1]?.focus();
                    break;
            }
        });
    }
    
    // ===== ACTIVE PAGE HIGHLIGHTING =====
    highlightActivePage() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                // Remove existing active states
                link.classList.remove('active');
                link.removeAttribute('aria-current');
                
                // Check if this link matches current page
                if (this.isLinkActive(href, currentPath)) {
                    link.classList.add('active');
                    link.setAttribute('aria-current', 'page');
                }
            }
        });
    }
    
    isLinkActive(href, currentPath) {
        // Normalize paths
        const normalizedHref = href.replace(/\/$/, '') || '/';
        const normalizedPath = currentPath.replace(/\/$/, '') || '/';
        
        // Exact match
        if (normalizedHref === normalizedPath) {
            return true;
        }
        
        // Home page special case
        if (normalizedHref === '/' && (normalizedPath === '/' || normalizedPath === '/index.html')) {
            return true;
        }
        
        return false;
    }
    
    // ===== FOCUS MANAGEMENT =====
    getFocusableElements() {
        if (!this.navMenu) return [];
        
        const selector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
        return this.navMenu.querySelectorAll(selector);
    }
    
    focusFirstMenuItem() {
        const focusableElements = this.getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
    
    focusNext(elements, currentIndex) {
        const nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
        elements[nextIndex]?.focus();
    }
    
    focusPrevious(elements, currentIndex) {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
        elements[prevIndex]?.focus();
    }
    
    // ===== UTILITY METHODS =====
    announceToScreenReader(message) {
        const announcer = document.getElementById('polite-announcements');
        if (announcer) {
            announcer.textContent = message;
        }
    }
    
    getNavigationState() {
        return {
            isMenuOpen: this.isMenuOpen,
            isScrolled: this.isScrolled,
            scrollDirection: this.scrollDirection,
            activeDropdowns: this.dropdowns.filter(d => 
                d.getAttribute('aria-expanded') === 'true'
            ).length
        };
    }
    
    // ===== CLEANUP =====
    destroy() {
        // Remove event listeners
        if (this.menuToggle) {
            this.menuToggle.removeEventListener('click', this.toggleMenu);
        }
        
        // Reset body overflow
        document.body.style.overflow = '';
        
        // Close menu
        this.closeMenu();
    }
} 