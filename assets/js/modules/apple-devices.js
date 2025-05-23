/**
 * ============================================================================
 * APPLE DEVICES OPTIMIZATION MODULE
 * Advanced optimizations for iPhone and MacBook
 * ============================================================================
 */

class AppleDeviceOptimizer {
    constructor() {
        this.deviceInfo = this.detectAppleDevice();
        this.init();
    }

    /**
     * Detect Apple device type and specifications
     */
    detectAppleDevice() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        const maxTouchPoints = navigator.maxTouchPoints;
        
        const device = {
            isApple: false,
            isIOS: false,
            isMacOS: false,
            isIPad: false,
            isIPhone: false,
            isMacBook: false,
            isRetina: false,
            hasNotch: false,
            hasFaceID: false,
            safariVersion: null,
            devicePixelRatio: window.devicePixelRatio || 1,
            screenSize: {
                width: window.screen.width,
                height: window.screen.height
            },
            viewportSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            model: 'unknown'
        };

        // Detect iOS
        if (/iPad|iPhone|iPod/.test(userAgent) || 
            (platform === 'MacIntel' && maxTouchPoints > 1)) {
            device.isApple = true;
            device.isIOS = true;
            
            // Detect specific iOS devices
            if (/iPad/.test(userAgent) || 
                (platform === 'MacIntel' && maxTouchPoints > 1)) {
                device.isIPad = true;
                device.model = this.detectIPadModel();
            } else if (/iPhone/.test(userAgent)) {
                device.isIPhone = true;
                device.model = this.detectIPhoneModel();
                device.hasNotch = this.detectNotch();
                device.hasFaceID = this.detectFaceID();
            }
        }
        
        // Detect macOS
        else if (platform.indexOf('Mac') !== -1) {
            device.isApple = true;
            device.isMacOS = true;
            device.isMacBook = this.detectMacBook();
            device.model = this.detectMacModel();
        }

        // Detect Retina display
        device.isRetina = device.devicePixelRatio >= 2;

        // Detect Safari version
        const safariMatch = userAgent.match(/Version\/(\d+\.\d+)/);
        if (safariMatch) {
            device.safariVersion = parseFloat(safariMatch[1]);
        }

        return device;
    }

    /**
     * Detect iPhone model based on screen dimensions
     */
    detectIPhoneModel() {
        const { width, height } = this.deviceInfo.screenSize;
        const ratio = this.deviceInfo.devicePixelRatio;

        // iPhone models based on screen size and pixel ratio
        const models = {
            'iPhone SE (1st gen)': { w: 320, h: 568, r: 2 },
            'iPhone 6/7/8': { w: 375, h: 667, r: 2 },
            'iPhone 6/7/8 Plus': { w: 414, h: 736, r: 3 },
            'iPhone X/XS/11 Pro': { w: 375, h: 812, r: 3 },
            'iPhone XR/11': { w: 414, h: 896, r: 2 },
            'iPhone XS Max/11 Pro Max': { w: 414, h: 896, r: 3 },
            'iPhone 12 mini': { w: 375, h: 812, r: 3 },
            'iPhone 12/12 Pro': { w: 390, h: 844, r: 3 },
            'iPhone 12 Pro Max': { w: 428, h: 926, r: 3 },
            'iPhone 13 mini': { w: 375, h: 812, r: 3 },
            'iPhone 13/13 Pro': { w: 390, h: 844, r: 3 },
            'iPhone 13 Pro Max': { w: 428, h: 926, r: 3 },
            'iPhone 14/14 Pro': { w: 393, h: 852, r: 3 },
            'iPhone 14 Plus': { w: 428, h: 926, r: 3 },
            'iPhone 14 Pro Max': { w: 430, h: 932, r: 3 },
            'iPhone 15/15 Pro': { w: 393, h: 852, r: 3 },
            'iPhone 15 Plus/15 Pro Max': { w: 430, h: 932, r: 3 }
        };

        for (const [model, specs] of Object.entries(models)) {
            if ((width === specs.w || height === specs.w) &&
                (height === specs.h || width === specs.h) &&
                ratio === specs.r) {
                return model;
            }
        }

        return 'iPhone (Unknown Model)';
    }

    /**
     * Detect iPad model
     */
    detectIPadModel() {
        const { width, height } = this.deviceInfo.screenSize;
        const ratio = this.deviceInfo.devicePixelRatio;

        if (width === 768 && ratio === 2) return 'iPad (7th-9th gen)';
        if (width === 810 && ratio === 2) return 'iPad (10th gen)';
        if (width === 834 && ratio === 2) return 'iPad Air';
        if (width === 1024 && ratio === 2) return 'iPad Pro 12.9"';
        if (width === 1194 && ratio === 2) return 'iPad Pro 12.9" (5th gen)';

        return 'iPad (Unknown Model)';
    }

    /**
     * Detect MacBook model based on screen resolution
     */
    detectMacModel() {
        const { width, height } = this.deviceInfo.screenSize;

        if (width === 1366 && height === 768) return 'MacBook Air 11"';
        if (width === 1440 && height === 900) return 'MacBook Air 13"';
        if (width === 1680 && height === 1050) return 'MacBook Pro 15"';
        if (width === 1728 && height === 1117) return 'MacBook Pro 15" (2016+)';
        if (width === 1800 && height === 1169) return 'MacBook Pro 15" (2021+)';
        if (width === 1512 && height === 982) return 'MacBook Pro 16"';
        if (width === 3456 && height === 2234) return 'MacBook Pro 16" (M1 Pro/Max)';

        return 'Mac (Unknown Model)';
    }

    /**
     * Detect if device is MacBook (vs iMac/Mac Pro)
     */
    detectMacBook() {
        // Simple heuristic: MacBooks typically have smaller screens
        const { width, height } = this.deviceInfo.screenSize;
        return width <= 1920 && height <= 1200;
    }

    /**
     * Detect iPhone X-style notch
     */
    detectNotch() {
        const { height } = this.deviceInfo.screenSize;
        // iPhones with notch typically have heights: 812, 844, 852, 896, 926, 932
        const notchHeights = [812, 844, 852, 896, 926, 932];
        return notchHeights.includes(height);
    }

    /**
     * Detect Face ID capability
     */
    detectFaceID() {
        // Face ID introduced with iPhone X (375×812)
        return this.detectNotch();
    }

    /**
     * Initialize optimizations
     */
    init() {
        this.applyDeviceClasses();
        this.setupIOSOptimizations();
        this.setupMacOSOptimizations();
        this.setupRetinaOptimizations();
        this.setupSafeAreaSupport();
        this.setupPerformanceOptimizations();
        this.setupAccessibilityFeatures();
        
        console.log('🍎 Apple Device Optimizer initialized:', this.deviceInfo);
    }

    /**
     * Apply device-specific CSS classes
     */
    applyDeviceClasses() {
        const body = document.body;
        
        if (this.deviceInfo.isApple) body.classList.add('apple-device');
        if (this.deviceInfo.isIOS) body.classList.add('ios-device');
        if (this.deviceInfo.isMacOS) body.classList.add('macos-device');
        if (this.deviceInfo.isIPhone) body.classList.add('iphone-device');
        if (this.deviceInfo.isIPad) body.classList.add('ipad-device');
        if (this.deviceInfo.isMacBook) body.classList.add('macbook-device');
        if (this.deviceInfo.isRetina) body.classList.add('retina-device');
        if (this.deviceInfo.hasNotch) body.classList.add('has-notch');
        if (this.deviceInfo.hasFaceID) body.classList.add('has-faceid');
        
        // Add model-specific classes
        const modelClass = this.deviceInfo.model.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        body.classList.add(`device-${modelClass}`);
    }

    /**
     * Setup iOS-specific optimizations
     */
    setupIOSOptimizations() {
        if (!this.deviceInfo.isIOS) return;

        // Disable bounce scrolling
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.scrollable')) return;
            e.preventDefault();
        }, { passive: false });

        // Setup viewport height fix for iOS Safari
        this.setupIOSViewportFix();

        // Setup iOS-specific touch handling
        this.setupIOSTouchHandling();

        // Setup status bar management
        this.setupIOSStatusBar();

        // Add to home screen detection
        this.detectStandaloneMode();
    }

    /**
     * Setup macOS-specific optimizations
     */
    setupMacOSOptimizations() {
        if (!this.deviceInfo.isMacOS) return;

        // Setup trackpad/mouse scrolling
        this.setupMacOSScrolling();

        // Setup window controls
        this.setupMacOSWindowControls();

        // Setup keyboard shortcuts
        this.setupMacOSKeyboardShortcuts();

        // Setup hover effects
        this.setupMacOSHoverEffects();
    }

    /**
     * Setup Retina display optimizations
     */
    setupRetinaOptimizations() {
        if (!this.deviceInfo.isRetina) return;

        // Optimize images for Retina
        this.optimizeRetinaImages();

        // Setup high-DPI canvas
        this.setupRetinaCanvas();

        // Apply Retina-specific styles
        document.documentElement.style.setProperty('--pixel-ratio', this.deviceInfo.devicePixelRatio);
    }

    /**
     * Setup Safe Area support for newer iPhones
     */
    setupSafeAreaSupport() {
        if (!this.deviceInfo.hasNotch) return;

        // Apply safe area variables
        const root = document.documentElement;
        root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top, 44px)');
        root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 34px)');
        root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left, 0px)');
        root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right, 0px)');

        // Add safe area padding to body
        document.body.style.paddingTop = 'var(--safe-area-top)';
        document.body.style.paddingBottom = 'var(--safe-area-bottom)';
    }

    /**
     * iOS viewport height fix
     */
    setupIOSViewportFix() {
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', () => {
            setTimeout(setVH, 100);
        });
    }

    /**
     * iOS touch handling
     */
    setupIOSTouchHandling() {
        // Prevent double-tap zoom
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Improve touch responsiveness
        document.addEventListener('touchstart', () => {}, { passive: true });
    }

    /**
     * iOS status bar management
     */
    setupIOSStatusBar() {
        // Set status bar style
        const statusBarMeta = document.createElement('meta');
        statusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
        statusBarMeta.content = 'black-translucent';
        document.head.appendChild(statusBarMeta);

        // Hide status bar in standalone mode
        if (window.navigator.standalone) {
            document.body.classList.add('standalone-mode');
        }
    }

    /**
     * Detect standalone mode (added to home screen)
     */
    detectStandaloneMode() {
        if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) {
            document.body.classList.add('standalone-mode');
            this.setupStandaloneFeatures();
        }
    }

    /**
     * Setup features for standalone mode
     */
    setupStandaloneFeatures() {
        // Add custom navigation for standalone mode
        this.addStandaloneNavigation();
        
        // Prevent external links from opening in app
        this.handleExternalLinks();
    }

    /**
     * macOS scrolling optimizations
     */
    setupMacOSScrolling() {
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Custom scrollbar styling is handled in CSS
    }

    /**
     * macOS window controls
     */
    setupMacOSWindowControls() {
        const controls = document.querySelector('.macos-window-controls');
        if (!controls) return;

        controls.addEventListener('click', (e) => {
            const control = e.target.closest('.window-control');
            if (!control) return;

            if (control.classList.contains('control-close')) {
                window.close();
            } else if (control.classList.contains('control-minimize')) {
                // Minimize animation
                document.body.style.transform = 'scale(0.8)';
                document.body.style.opacity = '0.5';
                setTimeout(() => {
                    document.body.style.transform = '';
                    document.body.style.opacity = '';
                }, 300);
            } else if (control.classList.contains('control-maximize')) {
                document.documentElement.requestFullscreen?.();
            }
        });
    }

    /**
     * macOS keyboard shortcuts
     */
    setupMacOSKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Command+R: Refresh
            if (e.metaKey && e.key === 'r') {
                e.preventDefault();
                location.reload();
            }
            
            // Command+Plus/Minus: Zoom
            if (e.metaKey && (e.key === '+' || e.key === '=')) {
                e.preventDefault();
                this.zoomIn();
            }
            if (e.metaKey && e.key === '-') {
                e.preventDefault();
                this.zoomOut();
            }
            
            // Command+0: Reset zoom
            if (e.metaKey && e.key === '0') {
                e.preventDefault();
                this.resetZoom();
            }
        });
    }

    /**
     * macOS hover effects
     */
    setupMacOSHoverEffects() {
        // Add hover classes only for devices with hover capability
        if (window.matchMedia('(hover: hover)').matches) {
            document.body.classList.add('hover-enabled');
        }
    }

    /**
     * Performance optimizations
     */
    setupPerformanceOptimizations() {
        // Optimize scroll performance
        let ticking = false;
        const updateScrollPosition = () => {
            const scrolled = window.pageYOffset;
            document.documentElement.style.setProperty('--scroll-y', scrolled);
            ticking = false;
        };

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollPosition);
                ticking = true;
            }
        }, { passive: true });

        // Optimize resize performance
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    }

    /**
     * Setup accessibility features
     */
    setupAccessibilityFeatures() {
        // Respect reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }

        // Respect high contrast preference
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }

        // Setup focus management
        this.setupFocusManagement();

        // Setup VoiceOver optimizations for iOS
        if (this.deviceInfo.isIOS) {
            this.setupVoiceOverOptimizations();
        }
    }

    /**
     * Optimize images for Retina displays
     */
    optimizeRetinaImages() {
        const images = document.querySelectorAll('img[data-src-retina]');
        images.forEach(img => {
            if (this.deviceInfo.devicePixelRatio >= 2) {
                img.src = img.dataset.srcRetina;
            }
        });
    }

    /**
     * Setup high-DPI canvas
     */
    setupRetinaCanvas() {
        const canvases = document.querySelectorAll('canvas');
        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            const ratio = this.deviceInfo.devicePixelRatio;
            
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * ratio;
            canvas.height = rect.height * ratio;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            
            ctx.scale(ratio, ratio);
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.deviceInfo.viewportSize = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        // Update viewport height for iOS
        if (this.deviceInfo.isIOS) {
            this.setupIOSViewportFix();
        }

        // Dispatch custom resize event
        window.dispatchEvent(new CustomEvent('appleDeviceResize', {
            detail: this.deviceInfo
        }));
    }

    /**
     * Zoom functionality for macOS
     */
    zoomIn() {
        const currentScale = parseFloat(getComputedStyle(document.body).getPropertyValue('--zoom-scale') || '1');
        const newScale = Math.min(currentScale * 1.1, 2);
        document.body.style.setProperty('--zoom-scale', newScale);
        document.body.style.transform = `scale(${newScale})`;
    }

    zoomOut() {
        const currentScale = parseFloat(getComputedStyle(document.body).getPropertyValue('--zoom-scale') || '1');
        const newScale = Math.max(currentScale / 1.1, 0.5);
        document.body.style.setProperty('--zoom-scale', newScale);
        document.body.style.transform = `scale(${newScale})`;
    }

    resetZoom() {
        document.body.style.setProperty('--zoom-scale', '1');
        document.body.style.transform = '';
    }

    /**
     * Focus management
     */
    setupFocusManagement() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    /**
     * VoiceOver optimizations for iOS
     */
    setupVoiceOverOptimizations() {
        // Add aria-labels for better VoiceOver support
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(button => {
            const text = button.textContent.trim();
            if (text) {
                button.setAttribute('aria-label', text);
            }
        });

        // Announce page changes
        this.announcePageChanges();
    }

    /**
     * Announce page changes for screen readers
     */
    announcePageChanges() {
        const announcer = document.createElement('div');
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.position = 'absolute';
        announcer.style.left = '-10000px';
        announcer.style.width = '1px';
        announcer.style.height = '1px';
        announcer.style.overflow = 'hidden';
        document.body.appendChild(announcer);

        window.announceToScreenReader = (message) => {
            announcer.textContent = message;
        };
    }

    /**
     * Add navigation for standalone mode
     */
    addStandaloneNavigation() {
        // This would create a custom navigation bar for PWA mode
        // Implementation depends on app structure
    }

    /**
     * Handle external links in standalone mode
     */
    handleExternalLinks() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.hostname !== window.location.hostname) {
                e.preventDefault();
                window.open(link.href, '_blank');
            }
        });
    }

    /**
     * Get device information
     */
    getDeviceInfo() {
        return this.deviceInfo;
    }

    /**
     * Check if specific Apple device
     */
    isDevice(deviceType) {
        switch (deviceType.toLowerCase()) {
            case 'iphone':
                return this.deviceInfo.isIPhone;
            case 'ipad':
                return this.deviceInfo.isIPad;
            case 'macbook':
                return this.deviceInfo.isMacBook;
            case 'ios':
                return this.deviceInfo.isIOS;
            case 'macos':
                return this.deviceInfo.isMacOS;
            case 'retina':
                return this.deviceInfo.isRetina;
            default:
                return false;
        }
    }
}

// Initialize Apple Device Optimizer
const appleOptimizer = new AppleDeviceOptimizer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppleDeviceOptimizer;
} else if (typeof window !== 'undefined') {
    window.AppleDeviceOptimizer = AppleDeviceOptimizer;
    window.appleOptimizer = appleOptimizer;
}

console.log('🍎 Apple Device Optimizer loaded successfully'); 