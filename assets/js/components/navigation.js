/**
 * Portfolio OS V6 - Navigation Manager
 * Apple Design Language V6 - Advanced Navigation Management
 * Features: Full accessibility, mobile interactions, keyboard navigation, focus management
 */

export class NavigationManager {
    constructor() {
        // DOM Elements
        this.nav = null;
        this.mobileMenuToggle = null;
        this.mobileNavOverlay = null;
        this.mobileNavClose = null;
        this.adminDropdown = null;
        this.themeToggles = [];
        this.searchToggles = [];
        
        // State Management
        this.state = {
            isMobileMenuOpen: false,
            isAdminDropdownOpen: false,
            isScrolled: false,
            lastScrollY: 0,
            scrollDirection: 'up',
            activeNavLink: null,
            focusedElement: null
        };
        
        // Configuration
        this.config = {
            scrollThreshold: 60,
            mobileBreakpoint: 768,
            animationDuration: 300,
            debounceDelay: 16,
            keyboardNavigationEnabled: true,
            autoCloseDelay: 5000
        };
        
        // Event listeners store
        this.eventListeners = new Map();
        
        // Bound methods
        this.handleScroll = this.debounce(this.handleScroll.bind(this), this.config.debounceDelay);
        this.handleResize = this.debounce(this.handleResize.bind(this), 100);
        this.handleKeydown = this.handleKeydown.bind(this);
        this.handleFocusIn = this.handleFocusIn.bind(this);
        this.handleFocusOut = this.handleFocusOut.bind(this);
    }
    
    /**
     * Initialize the navigation manager
     */
    async init() {
        try {
            console.log('🧭 Navigation Manager initializing...');
            
            // Cache DOM elements
            this.cacheDOMElements();
            
            if (!this.nav) {
                console.warn('Navigation header not found');
                return;
            }
            
            // Setup core functionality
            await this.setupNavigation();
            await this.setupMobileMenu();
            await this.setupDropdowns();
            await this.setupThemeToggles();
            await this.setupSearchToggles();
            await this.setupKeyboardNavigation();
            await this.setupScrollBehavior();
            await this.setupAccessibility();
            
            // Initialize state
            this.updateActiveNavLink();
            this.updateScrollState();
            
            // Add global event listeners
            this.addGlobalEventListeners();
            
            console.log('✅ Navigation Manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Navigation Manager initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Cache frequently used DOM elements
     */
    cacheDOMElements() {
        this.nav = document.querySelector('.nav-header');
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.mobileNavOverlay = document.getElementById('mobileNavOverlay');
        this.mobileNavClose = document.getElementById('mobileNavClose');
        this.adminDropdown = document.getElementById('adminDropdown');
        
        // Cache all theme toggles
        this.themeToggles = [
            document.getElementById('themeToggle'),
            document.querySelector('.theme-toggle-dropdown'),
            document.querySelector('.theme-toggle-mobile')
        ].filter(Boolean);
        
        // Cache all search toggles
        this.searchToggles = [
            document.getElementById('searchToggle'),
            document.querySelector('.search-toggle-mobile')
        ].filter(Boolean);
    }
    
    /**
     * Setup core navigation functionality
     */
    async setupNavigation() {
        // Highlight active navigation link
        this.updateActiveNavLink();
        
        // Setup navigation link interactions
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        navLinks.forEach(link => {
            this.addEventListener(link, 'click', (e) => {
                this.handleNavLinkClick(e, link);
            });
            
            this.addEventListener(link, 'focus', () => {
                this.state.focusedElement = link;
            });
        });
    }
    
    /**
     * Setup mobile menu functionality
     */
    async setupMobileMenu() {
        if (!this.mobileMenuToggle || !this.mobileNavOverlay) return;
        
        // Mobile menu toggle button
        this.addEventListener(this.mobileMenuToggle, 'click', () => {
            this.toggleMobileMenu();
        });
        
        // Mobile menu close button
        if (this.mobileNavClose) {
            this.addEventListener(this.mobileNavClose, 'click', () => {
                this.closeMobileMenu();
            });
        }
        
        // Close mobile menu when clicking overlay
        this.addEventListener(this.mobileNavOverlay, 'click', (e) => {
            if (e.target === this.mobileNavOverlay) {
                this.closeMobileMenu();
            }
        });
        
        // Close mobile menu when clicking mobile nav links
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
        mobileNavLinks.forEach(link => {
            this.addEventListener(link, 'click', () => {
                this.closeMobileMenu();
            });
        });
    }
    
    /**
     * Setup dropdown functionality
     */
    async setupDropdowns() {
        if (!this.adminDropdown) return;
        
        const dropdownToggle = this.adminDropdown.querySelector('.dropdown-toggle');
        const dropdownMenu = this.adminDropdown.querySelector('.dropdown-menu');
        
        if (!dropdownToggle || !dropdownMenu) return;
        
        // Toggle dropdown on click
        this.addEventListener(dropdownToggle, 'click', (e) => {
            e.preventDefault();
            this.toggleAdminDropdown();
        });
        
        // Close dropdown when clicking outside
        this.addEventListener(document, 'click', (e) => {
            if (!this.adminDropdown.contains(e.target)) {
                this.closeAdminDropdown();
            }
        });
        
        // Handle dropdown links
        const dropdownLinks = dropdownMenu.querySelectorAll('.dropdown-link');
        dropdownLinks.forEach(link => {
            this.addEventListener(link, 'click', () => {
                this.closeAdminDropdown();
            });
        });
    }
    
    /**
     * Setup theme toggle functionality
     */
    async setupThemeToggles() {
        this.themeToggles.forEach(toggle => {
            if (!toggle) return;
            
            this.addEventListener(toggle, 'click', async () => {
                await this.handleThemeToggle();
            });
        });
    }
    
    /**
     * Setup search toggle functionality
     */
    async setupSearchToggles() {
        this.searchToggles.forEach(toggle => {
            if (!toggle) return;
            
            this.addEventListener(toggle, 'click', () => {
                this.handleSearchToggle();
            });
        });
    }
    
    /**
     * Setup keyboard navigation
     */
    async setupKeyboardNavigation() {
        if (!this.config.keyboardNavigationEnabled) return;
        
        this.addEventListener(document, 'keydown', this.handleKeydown);
        this.addEventListener(document, 'focusin', this.handleFocusIn);
        this.addEventListener(document, 'focusout', this.handleFocusOut);
    }
    
    /**
     * Setup scroll behavior
     */
    async setupScrollBehavior() {
        this.addEventListener(window, 'scroll', this.handleScroll, { passive: true });
        this.addEventListener(window, 'resize', this.handleResize);
    }
    
    /**
     * Setup accessibility features
     */
    async setupAccessibility() {
        // Add ARIA labels and descriptions
        this.setupARIA();
        
        // Setup focus management
        this.setupFocusManagement();
        
        // Setup screen reader announcements
        this.setupScreenReaderSupport();
    }
    
    /**
     * Setup ARIA attributes
     */
    setupARIA() {
        // Mobile menu controls
        if (this.mobileMenuToggle && this.mobileNavOverlay) {
            this.mobileMenuToggle.setAttribute('aria-controls', this.mobileNavOverlay.id);
        }
        
        // Dropdown controls
        if (this.adminDropdown) {
            const toggle = this.adminDropdown.querySelector('.dropdown-toggle');
            const menu = this.adminDropdown.querySelector('.dropdown-menu');
            if (toggle && menu) {
                toggle.setAttribute('aria-controls', menu.id || 'adminDropdownMenu');
                if (!menu.id) menu.id = 'adminDropdownMenu';
            }
        }
    }
    
    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Focus trap for mobile menu
        this.setupMobileFocusTrap();
        
        // Focus management for dropdowns
        this.setupDropdownFocusManagement();
    }
    
    /**
     * Setup mobile focus trap
     */
    setupMobileFocusTrap() {
        if (!this.mobileNavOverlay) return;
        
        const focusableElements = this.getFocusableElements(this.mobileNavOverlay);
        if (focusableElements.length === 0) return;
        
        this.addEventListener(this.mobileNavOverlay, 'keydown', (e) => {
            if (e.key !== 'Tab' || !this.state.isMobileMenuOpen) return;
            
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }
    
    /**
     * Setup dropdown focus management
     */
    setupDropdownFocusManagement() {
        if (!this.adminDropdown) return;
        
        const dropdownMenu = this.adminDropdown.querySelector('.dropdown-menu');
        if (!dropdownMenu) return;
        
        this.addEventListener(dropdownMenu, 'keydown', (e) => {
            if (!this.state.isAdminDropdownOpen) return;
            
            const focusableElements = this.getFocusableElements(dropdownMenu);
            const currentIndex = focusableElements.indexOf(document.activeElement);
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.focusNextElement(focusableElements, currentIndex);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.focusPreviousElement(focusableElements, currentIndex);
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
    
    /**
     * Setup screen reader support
     */
    setupScreenReaderSupport() {
        // Create announcer element
        if (!document.getElementById('nav-announcer')) {
            const announcer = document.createElement('div');
            announcer.id = 'nav-announcer';
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
     * Handle navigation link clicks
     */
    handleNavLinkClick(event, link) {
        // Update active state
        this.updateActiveNavLink(link.getAttribute('href'));
        
        // Close mobile menu if open
        if (this.state.isMobileMenuOpen) {
            this.closeMobileMenu();
        }
        
        // Announce navigation to screen readers
        const linkText = link.querySelector('.nav-link-text, .mobile-nav-text')?.textContent;
        if (linkText) {
            this.announceToScreenReader(`${linkText} sayfasına gidiliyor`);
        }
    }
    
    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        if (this.state.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }
    
    /**
     * Open mobile menu
     */
    openMobileMenu() {
        this.state.isMobileMenuOpen = true;
        
        // Update UI
        this.mobileMenuToggle?.setAttribute('aria-expanded', 'true');
        this.mobileNavOverlay?.setAttribute('aria-hidden', 'false');
        document.body.classList.add('mobile-nav-open');
        
        // Focus management
        const firstFocusable = this.getFocusableElements(this.mobileNavOverlay)[0];
        firstFocusable?.focus();
        
        // Announce to screen readers
        this.announceToScreenReader('Navigasyon menüsü açıldı');
        
        // Emit event
        this.emit('mobileMenuOpen');
    }
    
    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        this.state.isMobileMenuOpen = false;
        
        // Update UI
        this.mobileMenuToggle?.setAttribute('aria-expanded', 'false');
        this.mobileNavOverlay?.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('mobile-nav-open');
        
        // Focus management
        this.mobileMenuToggle?.focus();
        
        // Announce to screen readers
        this.announceToScreenReader('Navigasyon menüsü kapatıldı');
        
        // Emit event
        this.emit('mobileMenuClose');
    }
    
    /**
     * Toggle admin dropdown
     */
    toggleAdminDropdown() {
        if (this.state.isAdminDropdownOpen) {
            this.closeAdminDropdown();
        } else {
            this.openAdminDropdown();
        }
    }
    
    /**
     * Open admin dropdown
     */
    openAdminDropdown() {
        this.state.isAdminDropdownOpen = true;
        
        // Update UI
        this.adminDropdown?.setAttribute('aria-expanded', 'true');
        
        // Focus first menu item
        const firstMenuItem = this.adminDropdown?.querySelector('.dropdown-link');
        firstMenuItem?.focus();
        
        // Auto-close after delay
        setTimeout(() => {
            if (this.state.isAdminDropdownOpen && 
                !this.adminDropdown?.matches(':hover') && 
                !this.adminDropdown?.contains(document.activeElement)) {
                this.closeAdminDropdown();
            }
        }, this.config.autoCloseDelay);
        
        // Emit event
        this.emit('adminDropdownOpen');
    }
    
    /**
     * Close admin dropdown
     */
    closeAdminDropdown() {
        this.state.isAdminDropdownOpen = false;
        
        // Update UI
        this.adminDropdown?.setAttribute('aria-expanded', 'false');
        
        // Emit event
        this.emit('adminDropdownClose');
    }
    
    /**
     * Handle theme toggle
     */
    async handleThemeToggle() {
        try {
            // Import ThemeManager if available
            const { ThemeManager } = await import('./theme-manager.js');
            if (ThemeManager && ThemeManager.toggle) {
                await ThemeManager.toggle();
                this.announceToScreenReader('Tema değiştirildi');
            }
        } catch (error) {
            console.warn('Theme toggle failed:', error);
            // Fallback theme toggle
            this.fallbackThemeToggle();
        }
    }
    
    /**
     * Fallback theme toggle
     */
    fallbackThemeToggle() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        this.announceToScreenReader(`${newTheme === 'dark' ? 'Karanlık' : 'Aydınlık'} tema aktif`);
    }
    
    /**
     * Handle search toggle
     */
    handleSearchToggle() {
        // TODO: Implement search functionality
        console.log('Search toggle clicked');
        this.announceToScreenReader('Arama özelliği yakında eklenecek');
    }
    
    /**
     * Handle scroll events
     */
    handleScroll() {
        const currentScrollY = window.scrollY;
        
        // Update scroll state
        this.state.scrollDirection = currentScrollY > this.state.lastScrollY ? 'down' : 'up';
        this.state.lastScrollY = currentScrollY;
        
        // Update scrolled class
        const wasScrolled = this.state.isScrolled;
        this.state.isScrolled = currentScrollY > this.config.scrollThreshold;
        
        if (this.state.isScrolled !== wasScrolled) {
            this.updateScrollState();
        }
        
        // Close mobile menu on scroll if open
        if (this.state.isMobileMenuOpen && currentScrollY > this.config.scrollThreshold) {
            this.closeMobileMenu();
        }
    }
    
    /**
     * Handle resize events
     */
    handleResize() {
        const isMobile = window.innerWidth <= this.config.mobileBreakpoint;
        
        // Close mobile menu if resizing to desktop
        if (!isMobile && this.state.isMobileMenuOpen) {
            this.closeMobileMenu();
        }
        
        // Close dropdown on resize
        if (this.state.isAdminDropdownOpen) {
            this.closeAdminDropdown();
        }
    }
    
    /**
     * Handle global keydown events
     */
    handleKeydown(event) {
        switch (event.key) {
            case 'Escape':
                this.handleEscapeKey();
                break;
            case 'Enter':
            case ' ':
                this.handleActivationKey(event);
                break;
            case 'ArrowDown':
            case 'ArrowUp':
                this.handleArrowKeys(event);
                break;
            case 'Tab':
                this.handleTabKey(event);
                break;
        }
    }
    
    /**
     * Handle escape key
     */
    handleEscapeKey() {
        if (this.state.isMobileMenuOpen) {
            this.closeMobileMenu();
        } else if (this.state.isAdminDropdownOpen) {
            this.closeAdminDropdown();
        }
    }
    
    /**
     * Handle activation keys (Enter/Space)
     */
    handleActivationKey(event) {
        const target = event.target;
        
        if (target.classList.contains('dropdown-toggle') ||
            target.classList.contains('mobile-menu-toggle')) {
            event.preventDefault();
            target.click();
        }
    }
    
    /**
     * Handle arrow keys
     */
    handleArrowKeys(event) {
        if (this.state.isAdminDropdownOpen) {
            const dropdownMenu = this.adminDropdown?.querySelector('.dropdown-menu');
            if (dropdownMenu && dropdownMenu.contains(event.target)) {
                // Let the dropdown focus management handle this
                return;
            }
        }
    }
    
    /**
     * Handle tab key
     */
    handleTabKey(event) {
        // Focus trap handling is done in specific trap functions
    }
    
    /**
     * Handle focus in events
     */
    handleFocusIn(event) {
        this.state.focusedElement = event.target;
    }
    
    /**
     * Handle focus out events
     */
    handleFocusOut(event) {
        // Clear focused element after a short delay
        setTimeout(() => {
            if (!this.nav?.contains(document.activeElement)) {
                this.state.focusedElement = null;
            }
        }, 100);
    }
    
    /**
     * Update scroll state
     */
    updateScrollState() {
        this.nav?.classList.toggle('scrolled', this.state.isScrolled);
    }
    
    /**
     * Update active navigation link
     */
    updateActiveNavLink(href = null) {
        const currentPath = href || window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
        
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            const isActive = this.isLinkActive(linkHref, currentPath);
            
            if (isActive) {
                link.setAttribute('aria-current', 'page');
                this.state.activeNavLink = link;
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }
    
    /**
     * Check if link is active
     */
    isLinkActive(linkHref, currentPath) {
        if (!linkHref || !currentPath) return false;
        
        // Exact match for home page
        if (linkHref === '/' && currentPath === '/') return true;
        
        // Path matching for other pages
        if (linkHref !== '/' && currentPath.startsWith(linkHref)) return true;
        
        return false;
    }
    
    /**
     * Get focusable elements within a container
     */
    getFocusableElements(container) {
        if (!container) return [];
        
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ].join(', ');
        
        return Array.from(container.querySelectorAll(focusableSelectors))
            .filter(el => el.offsetParent !== null); // Only visible elements
    }
    
    /**
     * Focus next element
     */
    focusNextElement(elements, currentIndex) {
        const nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0;
        elements[nextIndex]?.focus();
    }
    
    /**
     * Focus previous element
     */
    focusPreviousElement(elements, currentIndex) {
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1;
        elements[prevIndex]?.focus();
    }
    
    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        const announcer = document.getElementById('nav-announcer');
        if (announcer) {
            announcer.textContent = message;
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
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
    addGlobalEventListeners() {
        // Performance optimized scroll and resize
        let ticking = false;
        
        const optimizedScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        this.addEventListener(window, 'scroll', optimizedScroll, { passive: true });
    }
    
    /**
     * Emit custom events
     */
    emit(eventName, detail = {}) {
        const event = new CustomEvent(`navigation:${eventName}`, {
            detail: { ...detail, navigationState: this.state }
        });
        document.dispatchEvent(event);
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
     * Get current navigation state
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    
    /**
     * Destroy navigation manager and cleanup
     */
    destroy() {
        // Remove all event listeners
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            element.removeEventListener(event, handler, options);
        });
        this.eventListeners.clear();
        
        // Close open menus
        if (this.state.isMobileMenuOpen) {
            this.closeMobileMenu();
        }
        if (this.state.isAdminDropdownOpen) {
            this.closeAdminDropdown();
        }
        
        // Reset body classes
        document.body.classList.remove('mobile-nav-open');
        
        // Remove announcer
        const announcer = document.getElementById('nav-announcer');
        announcer?.remove();
        
        console.log('🧭 Navigation Manager destroyed');
    }
}

// Auto-initialize if not in module context
if (typeof window !== 'undefined' && !window.navigationManager) {
    window.navigationManager = new NavigationManager();
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.navigationManager.init();
        });
    } else {
        window.navigationManager.init();
    }
}

export default NavigationManager; 