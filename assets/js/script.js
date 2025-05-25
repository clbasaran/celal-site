/**
 * Portfolio OS - Module Orchestration Script
 * Apple Design Language V5
 * Coordinates system-wide module communication and interactions
 */

/**
 * ===== MODULE ORCHESTRATION SYSTEM =====
 * Manages inter-module communication and coordination
 */
class ModuleOrchestrator {
    constructor() {
        this.modules = new Map();
        this.config = null;
        this.eventBus = new EventTarget();
        this.sessionData = null;
        this.initializationOrder = [
            'config-loader',
            'session-manager', 
            'accessibility',
            'animation-orchestrator',
            'scroll-persistence',
            'assistant'
        ];
        
        this.moduleConnections = {
            'assistant': ['session-manager'],
            'animation-orchestrator': ['scroll-persistence'],
            'accessibility': ['style-toggles'],
            'config-loader': ['all']
        };
        
        this.systemStatus = {
            initialized: false,
            modulesLoaded: 0,
            totalModules: this.initializationOrder.length,
            errors: [],
            startTime: Date.now()
        };
        
        console.log('📋 Module Orchestrator initialized');
        this.bindEvents();
    }
    
    /**
     * Registers a module with the orchestrator
     */
    registerModule(name, moduleInstance) {
        if (!moduleInstance) {
            console.error(`❌ Module ${name} is null or undefined`);
            return false;
        }
        
        this.modules.set(name, moduleInstance);
        this.systemStatus.modulesLoaded++;
        
        console.log(`✅ Module registered: ${name} (${this.systemStatus.modulesLoaded}/${this.systemStatus.totalModules})`);
        
        // Update loading progress
        this.updateLoadingProgress();
        
        // Emit module registered event
        this.eventBus.dispatchEvent(new CustomEvent('moduleRegistered', {
            detail: { name, module: moduleInstance }
        }));
        
        // Check if all modules are loaded
        if (this.systemStatus.modulesLoaded === this.systemStatus.totalModules) {
            this.initializeConnections();
        }
        
        return true;
    }
    
    /**
     * Gets a registered module
     */
    getModule(name) {
        return this.modules.get(name);
    }
    
    /**
     * Updates loading progress UI
     */
    updateLoadingProgress() {
        const moduleCountEl = document.getElementById('moduleCount');
        const systemStatusEl = document.getElementById('systemStatus');
        
        if (moduleCountEl) {
            moduleCountEl.textContent = `${this.systemStatus.modulesLoaded}/${this.systemStatus.totalModules}`;
        }
        
        if (systemStatusEl) {
            const status = this.systemStatus.modulesLoaded === this.systemStatus.totalModules 
                ? 'Hazır' 
                : `Yükleniyor... (${Math.round((this.systemStatus.modulesLoaded / this.systemStatus.totalModules) * 100)}%)`;
            systemStatusEl.textContent = status;
        }
    }
    
    /**
     * Initializes all module connections
     */
    async initializeConnections() {
        try {
            console.log('🔗 Initializing module connections...');
            
            // 1. Config-loader ⇄ All modules
            await this.setupConfigConnections();
            
            // 2. Assistant ⇄ Session-manager
            await this.setupAssistantSessionConnection();
            
            // 3. Animation-orchestrator ⇄ Scroll-persistence
            await this.setupAnimationScrollConnection();
            
            // 4. Accessibility ⇄ Style toggles
            await this.setupAccessibilityStyleConnection();
            
            this.systemStatus.initialized = true;
            console.log('✅ All module connections initialized');
            
            // Emit system ready event
            this.eventBus.dispatchEvent(new CustomEvent('systemReady', {
                detail: { 
                    modules: Array.from(this.modules.keys()),
                    uptime: Date.now() - this.systemStatus.startTime
                }
            }));
            
            // Hide loading screen
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('❌ Failed to initialize module connections:', error);
            this.systemStatus.errors.push(error);
        }
    }
    
    /**
     * Sets up config-loader connections with all modules
     */
    async setupConfigConnections() {
        const configLoader = this.getModule('config-loader');
        if (!configLoader) {
            console.warn('⚠️ Config-loader module not found');
            return;
        }
        
        try {
            // Load system configuration
            this.config = await configLoader.loadConfig();
            console.log('📋 System config loaded:', this.config);
            
            // Pass config to all modules
            for (const [moduleName, moduleInstance] of this.modules) {
                if (moduleName !== 'config-loader' && moduleInstance.setConfig) {
                    try {
                        await moduleInstance.setConfig(this.config);
                        console.log(`⚙️ Config passed to ${moduleName}`);
                    } catch (error) {
                        console.error(`❌ Failed to set config for ${moduleName}:`, error);
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Config setup failed:', error);
            this.systemStatus.errors.push(error);
        }
    }
    
    /**
     * Sets up assistant ⇄ session-manager connection
     */
    async setupAssistantSessionConnection() {
        const assistant = this.getModule('assistant');
        const sessionManager = this.getModule('session-manager');
        
        if (!assistant || !sessionManager) {
            console.warn('⚠️ Assistant or session-manager module not found');
            return;
        }
        
        try {
            // Get current session data
            this.sessionData = await sessionManager.getCurrentSession();
            
            // Pass session data to assistant
            if (assistant.setSessionData) {
                await assistant.setSessionData(this.sessionData);
            }
            
            // Set up bidirectional communication
            sessionManager.addEventListener('sessionUpdated', (event) => {
                if (assistant.onSessionUpdate) {
                    assistant.onSessionUpdate(event.detail);
                }
            });
            
            assistant.addEventListener('needsSessionData', async (event) => {
                const sessionData = await sessionManager.getSessionInsights(event.detail.query);
                if (assistant.receiveSessionInsights) {
                    assistant.receiveSessionInsights(sessionData);
                }
            });
            
            console.log('🤖 Assistant ⇄ Session-manager connection established');
            
        } catch (error) {
            console.error('❌ Assistant-session connection failed:', error);
            this.systemStatus.errors.push(error);
        }
    }
    
    /**
     * Sets up animation-orchestrator ⇄ scroll-persistence connection
     */
    async setupAnimationScrollConnection() {
        const animationOrchestrator = this.getModule('animation-orchestrator');
        const scrollPersistence = this.getModule('scroll-persistence');
        
        if (!animationOrchestrator || !scrollPersistence) {
            console.warn('⚠️ Animation-orchestrator or scroll-persistence module not found');
            return;
        }
        
        try {
            // Get saved scroll positions
            const scrollData = await scrollPersistence.getAllScrollData();
            
            // Set up scroll-triggered animation resets
            scrollPersistence.addEventListener('scrollRestored', (event) => {
                if (animationOrchestrator.resetAnimationsForElement) {
                    animationOrchestrator.resetAnimationsForElement(event.detail.element);
                }
            });
            
            animationOrchestrator.addEventListener('animationTriggered', (event) => {
                if (scrollPersistence.markAnimationTriggered) {
                    scrollPersistence.markAnimationTriggered(event.detail.element);
                }
            });
            
            // Coordinate scroll-triggered animation timing
            scrollPersistence.addEventListener('beforeScrollRestore', (event) => {
                if (animationOrchestrator.pauseAnimations) {
                    animationOrchestrator.pauseAnimations();
                }
            });
            
            scrollPersistence.addEventListener('scrollRestoreComplete', (event) => {
                if (animationOrchestrator.resumeAnimations) {
                    animationOrchestrator.resumeAnimations();
                }
            });
            
            console.log('✨ Animation-orchestrator ⇄ Scroll-persistence connection established');
            
        } catch (error) {
            console.error('❌ Animation-scroll connection failed:', error);
            this.systemStatus.errors.push(error);
        }
    }
    
    /**
     * Sets up accessibility ⇄ style toggles connection
     */
    async setupAccessibilityStyleConnection() {
        const accessibility = this.getModule('accessibility');
        
        if (!accessibility) {
            console.warn('⚠️ Accessibility module not found');
            return;
        }
        
        try {
            // Set up live UI adaptations based on accessibility settings
            accessibility.addEventListener('settingsChanged', (event) => {
                const settings = event.detail;
                this.applyAccessibilityStyles(settings);
            });
            
            // Apply initial accessibility settings
            const currentSettings = accessibility.getSettings();
            if (currentSettings) {
                this.applyAccessibilityStyles(currentSettings);
            }
            
            console.log('♿ Accessibility ⇄ Style toggles connection established');
            
        } catch (error) {
            console.error('❌ Accessibility-style connection failed:', error);
            this.systemStatus.errors.push(error);
        }
    }
    
    /**
     * Applies accessibility styles to the UI
     */
    applyAccessibilityStyles(settings) {
        const root = document.documentElement;
        
        // High contrast mode
        if (settings.highContrast) {
            root.setAttribute('data-high-contrast', 'true');
        } else {
            root.removeAttribute('data-high-contrast');
        }
        
        // Reduced motion
        if (settings.reducedMotion) {
            root.setAttribute('data-reduced-motion', 'true');
        } else {
            root.removeAttribute('data-reduced-motion');
        }
        
        // Large fonts
        if (settings.largeFonts) {
            root.setAttribute('data-large-fonts', 'true');
        } else {
            root.removeAttribute('data-large-fonts');
        }
        
        // Focus indicators
        if (settings.enhancedFocus) {
            root.setAttribute('data-enhanced-focus', 'true');
        } else {
            root.removeAttribute('data-enhanced-focus');
        }
        
        // Dark mode override
        if (settings.forceDarkMode) {
            root.setAttribute('data-theme', 'dark');
        } else if (settings.forceLightMode) {
            root.setAttribute('data-theme', 'light');
        } else {
            root.setAttribute('data-theme', 'auto');
        }
        
        console.log('🎨 Accessibility styles applied:', settings);
    }
    
    /**
     * Binds global event listeners
     */
    bindEvents() {
        // Navigation button handlers
        document.addEventListener('DOMContentLoaded', () => {
            this.setupNavigationHandlers();
            this.setupQuickAccessHandlers();
        });
        
        // Global error handling
        window.addEventListener('error', (event) => {
            console.error('💥 Global error:', event.error);
            this.systemStatus.errors.push(event.error);
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('💥 Unhandled promise rejection:', event.reason);
            this.systemStatus.errors.push(event.reason);
        });
    }
    
    /**
     * Sets up navigation button handlers
     */
    setupNavigationHandlers() {
        // Accessibility toggle
        const accessibilityToggle = document.getElementById('accessibilityToggle');
        if (accessibilityToggle) {
            accessibilityToggle.addEventListener('click', () => {
                const accessibility = this.getModule('accessibility');
                if (accessibility && accessibility.openPanel) {
                    accessibility.openPanel();
                }
            });
        }
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }
    
    /**
     * Sets up quick access button handlers
     */
    setupQuickAccessHandlers() {
        // Quick accessibility
        const quickAccessibility = document.getElementById('quickAccessibility');
        if (quickAccessibility) {
            quickAccessibility.addEventListener('click', () => {
                const accessibility = this.getModule('accessibility');
                if (accessibility && accessibility.openPanel) {
                    accessibility.openPanel();
                }
            });
        }
        
        // Quick stats
        const quickStats = document.getElementById('quickStats');
        if (quickStats) {
            quickStats.addEventListener('click', () => {
                window.location.href = '/stats.html';
            });
        }
        
        // Quick theme
        const quickTheme = document.getElementById('quickTheme');
        if (quickTheme) {
            quickTheme.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }
    
    /**
     * Toggles the application theme
     */
    toggleTheme() {
        const root = document.documentElement;
        const currentTheme = root.getAttribute('data-theme');
        
        let newTheme;
        switch (currentTheme) {
            case 'light':
                newTheme = 'dark';
                break;
            case 'dark':
                newTheme = 'auto';
                break;
            default:
                newTheme = 'light';
                break;
        }
        
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('portfolio-theme', newTheme);
        
        // Update theme toggle icon
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
        
        // Update quick theme status
        const themeQuickStatus = document.getElementById('themeQuickStatus');
        if (themeQuickStatus) {
            themeQuickStatus.textContent = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);
        }
        
        console.log(`🎨 Theme changed to: ${newTheme}`);
    }
    
    /**
     * Hides the loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    /**
     * Gets system status
     */
    getSystemStatus() {
        return {
            ...this.systemStatus,
            uptime: Date.now() - this.systemStatus.startTime,
            modules: Array.from(this.modules.keys()),
            config: this.config
        };
    }
    
    /**
     * Sends announcement to screen readers
     */
    announce(message, priority = 'polite') {
        const announcer = document.getElementById(priority === 'assertive' ? 'assertive-announcements' : 'polite-announcements');
        if (announcer) {
            announcer.textContent = message;
            setTimeout(() => {
                announcer.textContent = '';
            }, 1000);
        }
    }
    
    /**
     * Logs system information
     */
    logSystemInfo() {
        const status = this.getSystemStatus();
        console.group('📋 Portfolio OS System Status');
        console.log('Modules loaded:', status.modulesLoaded, '/', status.totalModules);
        console.log('Initialized:', status.initialized);
        console.log('Uptime:', Math.round(status.uptime / 1000), 'seconds');
        console.log('Errors:', status.errors.length);
        console.log('Active modules:', status.modules);
        if (status.errors.length > 0) {
            console.error('Error log:', status.errors);
        }
        console.groupEnd();
        
        return status;
    }
}

/**
 * ===== GLOBAL MODULE ORCHESTRATOR INSTANCE =====
 */
window.PortfolioOS = window.PortfolioOS || {};
window.PortfolioOS.orchestrator = new ModuleOrchestrator();

/**
 * ===== SYSTEM INITIALIZATION =====
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Portfolio OS initializing...');
    
    try {
        // Initialize theme from localStorage
        const savedTheme = localStorage.getItem('portfolio-theme') || 'auto';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update system uptime periodically
        setInterval(() => {
            const systemUptime = document.getElementById('systemUptime');
            if (systemUptime) {
                const uptime = Math.round((Date.now() - window.PortfolioOS.orchestrator.systemStatus.startTime) / 1000);
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = uptime % 60;
                systemUptime.textContent = `Uptime: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
        
        // Update system status indicators
        window.PortfolioOS.orchestrator.eventBus.addEventListener('systemReady', () => {
            // Update navigation indicators
            const indicators = ['aiStatus', 'accessibilityStatus', 'analyticsStatus'];
            indicators.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.classList.add('indicator--ready');
                }
            });
            
            // Announce system ready
            window.PortfolioOS.orchestrator.announce('Portfolio OS sistem hazır', 'polite');
        });
        
    } catch (error) {
        console.error('❌ System initialization failed:', error);
    }
});

/**
 * ===== EXPORT FOR MODULE SYSTEM =====
 */
export { ModuleOrchestrator };
export default window.PortfolioOS.orchestrator; 