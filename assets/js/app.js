/**
 * Portfolio OS V6 - Main Application
 * Modern ES6+ JavaScript with modular architecture
 */

// ===== IMPORTS =====
import { ThemeManager } from './components/theme-manager.js';
import { NavigationManager } from './components/navigation.js';
import { DataManager } from './components/data-manager.js';
import { AnimationManager } from './components/animation-manager.js';
import { PerformanceManager } from './components/performance-manager.js';

// ===== APPLICATION CLASS =====
class PortfolioOSV6 {
    constructor() {
        this.version = '6.0.0';
        this.buildDate = '2024.02.15';
        this.startTime = Date.now();
        
        // Component managers
        this.theme = null;
        this.navigation = null;
        this.data = null;
        this.animation = null;
        this.performance = null;
        
        // State
        this.state = {
            loading: true,
            theme: 'auto',
            navigation: {
                currentPage: this.getCurrentPage(),
                menuOpen: false
            },
            data: {
                projects: null,
                blog: null,
                loaded: false
            },
            user: {
                preferences: this.loadUserPreferences()
            }
        };
        
        // Bind methods
        this.init = this.init.bind(this);
        this.loadComponents = this.loadComponents.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
        this.handleLoading = this.handleLoading.bind(this);
    }
    
    // ===== INITIALIZATION =====
    async init() {
        try {
            console.log(`🚀 Portfolio OS V6 ${this.version} starting...`);
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize performance monitoring
            this.performance = new PerformanceManager();
            this.performance.startSession();
            
            // Load critical components first
            await this.loadCriticalComponents();
            
            // Load data
            await this.loadData();
            
            // Initialize remaining components
            await this.loadComponents();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize animations
            this.initializeAnimations();
            
            // Complete loading
            await this.completeLoading();
            
            console.log(`✅ Portfolio OS V6 loaded in ${Date.now() - this.startTime}ms`);
            
        } catch (error) {
            console.error('❌ Failed to initialize Portfolio OS V6:', error);
            this.handleError(error);
        }
    }
    
    // ===== COMPONENT LOADING =====
    async loadCriticalComponents() {
        // Theme manager (critical for visual consistency)
        this.theme = new ThemeManager();
        await this.theme.init();
        
        // Navigation manager
        this.navigation = new NavigationManager();
        await this.navigation.init();
        
        // Update loading progress
        this.updateLoadingProgress(30, 'Temel bileşenler yüklendi');
    }
    
    async loadComponents() {
        // Animation manager
        this.animation = new AnimationManager();
        await this.animation.init();
        
        // Update loading progress
        this.updateLoadingProgress(70, 'Animasyonlar hazırlandı');
    }
    
    async loadData() {
        // Data manager
        this.data = new DataManager();
        
        try {
            // Load projects and blog data
            const [projects, blog] = await Promise.all([
                this.data.loadProjects(),
                this.data.loadBlog()
            ]);
            
            this.state.data.projects = projects;
            this.state.data.blog = blog;
            this.state.data.loaded = true;
            
            // Update UI with loaded data
            this.renderDynamicContent();
            
            this.updateLoadingProgress(50, 'Veriler yüklendi');
            
        } catch (error) {
            console.warn('⚠️ Failed to load some data:', error);
            // Continue with cached or default data
        }
    }
    
    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeydown.bind(this));
        
        // Window events
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('scroll', this.handleScroll.bind(this));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.theme.toggle();
            });
        }
        
        // Search toggle
        const searchToggle = document.getElementById('searchToggle');
        if (searchToggle) {
            searchToggle.addEventListener('click', this.handleSearchToggle.bind(this));
        }
        
        // Menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.navigation.toggleMenu();
            });
        }
        
        // System status updates
        this.updateSystemStatus();
        setInterval(() => this.updateSystemStatus(), 10000); // Update every 10s
    }
    
    // ===== EVENT HANDLERS =====
    handleKeydown(event) {
        // Global keyboard shortcuts
        if (event.metaKey || event.ctrlKey) {
            switch (event.key) {
                case '/':
                    event.preventDefault();
                    // Toggle AI Assistant (if available)
                    break;
                case 'k':
                    event.preventDefault();
                    this.handleSearchToggle();
                    break;
                case 'd':
                    event.preventDefault();
                    this.theme.toggle();
                    break;
            }
        }
        
        // Escape key
        if (event.key === 'Escape') {
            // Close any open modals or menus
            this.navigation.closeMenu();
        }
    }
    
    handleResize() {
        // Debounced resize handler
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.navigation.handleResize();
            this.animation.handleResize();
        }, 100);
    }
    
    handleScroll() {
        // Throttled scroll handler
        if (!this.scrollTicking) {
            requestAnimationFrame(() => {
                this.navigation.handleScroll();
                this.animation.handleScroll();
                this.scrollTicking = false;
            });
            this.scrollTicking = true;
        }
    }
    
    handleBeforeUnload() {
        // Save user preferences
        this.saveUserPreferences();
        
        // Performance cleanup
        if (this.performance) {
            this.performance.endSession();
        }
    }
    
    handleSearchToggle() {
        // TODO: Implement search functionality
        console.log('Search functionality coming soon...');
    }
    
    // ===== LOADING MANAGEMENT =====
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.remove('loaded');
        }
    }
    
    updateLoadingProgress(percentage, status) {
        const progressBar = document.querySelector('.progress-bar');
        const systemStatus = document.getElementById('systemStatus');
        const moduleCount = document.getElementById('moduleCount');
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        if (systemStatus) {
            systemStatus.textContent = status;
        }
        
        if (moduleCount) {
            const loaded = Math.floor((percentage / 100) * 15);
            moduleCount.textContent = `${loaded}/15`;
        }
    }
    
    async completeLoading() {
        // Final loading phase
        this.updateLoadingProgress(90, 'Son dokunuşlar');
        
        // Small delay for smooth transition
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.updateLoadingProgress(100, 'Hazır');
        
        // Hide loading screen
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('loaded');
            
            // Remove from DOM after transition
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
        
        this.state.loading = false;
        
        // Announce to screen readers
        this.announceToScreenReader('Portfolio OS V6 yüklendi ve hazır.');
    }
    
    // ===== ANIMATION INITIALIZATION =====
    initializeAnimations() {
        // Initialize AOS (Animate On Scroll) or custom animations
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 600,
                easing: 'ease-out-cubic',
                once: true,
                offset: 50
            });
        }
        
        // Initialize custom animations
        if (this.animation) {
            this.animation.initializePageAnimations();
        }
    }
    
    // ===== DYNAMIC CONTENT RENDERING =====
    renderDynamicContent() {
        // Render project previews on homepage
        if (this.getCurrentPage() === 'home') {
            this.renderProjectPreviews();
        }
        
        // Update footer build info
        this.updateFooterInfo();
    }
    
    renderProjectPreviews() {
        const projectsContainer = document.getElementById('projectsPreview');
        if (!projectsContainer || !this.state.data.projects) return;
        
        const featuredProjects = this.state.data.projects.projects
            .filter(project => project.featured)
            .slice(0, 3);
        
        projectsContainer.innerHTML = featuredProjects.map(project => `
            <div class="card project-card card-clickable" data-project-id="${project.id}">
                <div class="project-card-image-container">
                    <img src="${project.image}" alt="${project.title}" class="project-card-image" loading="lazy">
                    <div class="project-card-badge">${project.status === 'active' ? 'Aktif' : 'Tamamlandı'}</div>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${project.title}</h3>
                    <p class="card-subtitle">${project.subtitle}</p>
                    <p class="feature-description">${project.description}</p>
                    <div class="project-card-tech">
                        ${project.technologies.slice(0, 3).map(tech => 
                            `<span class="tech-tag">${tech}</span>`
                        ).join('')}
                    </div>
                </div>
                <div class="card-footer">
                    <a href="/projects.html#${project.id}" class="btn btn-sm btn-tertiary">
                        Detayları Gör →
                    </a>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        projectsContainer.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn')) {
                    const projectId = card.dataset.projectId;
                    window.location.href = `/projects.html#${projectId}`;
                }
            });
        });
    }
    
    updateFooterInfo() {
        const buildInfo = document.getElementById('buildInfo');
        const systemUptime = document.getElementById('systemUptime');
        
        if (buildInfo) {
            buildInfo.textContent = `Build ${this.buildDate}`;
        }
        
        if (systemUptime) {
            const uptime = Math.floor((Date.now() - this.startTime) / 1000);
            systemUptime.textContent = `Uptime: ${this.formatUptime(uptime)}`;
        }
    }
    
    // ===== SYSTEM STATUS =====
    updateSystemStatus() {
        // Update system status indicators
        const statusItems = {
            v6Status: 'success',
            cmsStatus: this.state.data.loaded ? 'success' : 'warning',
            adminStatus: 'success'
        };
        
        Object.entries(statusItems).forEach(([id, status]) => {
            const element = document.getElementById(id);
            if (element) {
                const dot = element.querySelector('.status-dot');
                if (dot) {
                    dot.className = `status-dot status-dot--${status}`;
                }
            }
        });
    }
    
    // ===== UTILITY METHODS =====
    getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html' || path === '/public/index.html') {
            return 'home';
        }
        return path.split('/').pop().split('.')[0];
    }
    
    loadUserPreferences() {
        try {
            const stored = localStorage.getItem('portfolioOS_preferences');
            return stored ? JSON.parse(stored) : {
                theme: 'auto',
                reducedMotion: false,
                language: 'tr'
            };
        } catch (error) {
            console.warn('Failed to load user preferences:', error);
            return {
                theme: 'auto',
                reducedMotion: false,
                language: 'tr'
            };
        }
    }
    
    saveUserPreferences() {
        try {
            localStorage.setItem('portfolioOS_preferences', JSON.stringify(this.state.user.preferences));
        } catch (error) {
            console.warn('Failed to save user preferences:', error);
        }
    }
    
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}s ${minutes}d ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}d ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    announceToScreenReader(message) {
        const announcer = document.getElementById('polite-announcements');
        if (announcer) {
            announcer.textContent = message;
        }
    }
    
    handleError(error) {
        console.error('Portfolio OS V6 Error:', error);
        
        // Show user-friendly error message
        const errorMessage = 'Sistem yüklenirken bir hata oluştu. Sayfa yenileniyor...';
        this.announceToScreenReader(errorMessage);
        
        // Hide loading screen and show error
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <div class="loading-logo">⚠️</div>
                    <div class="loading-text">Sistem Hatası</div>
                    <div class="loading-error">${errorMessage}</div>
                </div>
            `;
        }
        
        // Auto-reload after 3 seconds
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }
}

// ===== AUTO-INITIALIZATION =====
// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.portfolioOS = new PortfolioOSV6();
        window.portfolioOS.init();
    });
} else {
    window.portfolioOS = new PortfolioOSV6();
    window.portfolioOS.init();
}

// ===== GLOBAL EXPORTS =====
window.PortfolioOSV6 = PortfolioOSV6;

// ===== DEBUG MODE =====
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.DEBUG = true;
    console.log('🔧 Portfolio OS V6 Debug Mode Enabled');
}