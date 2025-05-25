/**
 * Portfolio OS V6 - Admin Manager
 * Main admin dashboard controller with content management
 */

import { JSONEditor } from './editor.js';
import { ThemeManager } from '../components/theme-manager.js';

export class AdminManager {
    constructor() {
        // State
        this.currentModule = 'dashboard';
        this.currentEditor = null;
        this.hasUnsavedChanges = false;
        this.isLoading = false;
        
        // Data cache
        this.dataCache = new Map();
        this.dataEndpoints = {
            projects: 'data/projects.json',
            blog: 'data/blog.json',
            skills: 'data/skills.json',
            settings: 'data/config.json'
        };
        
        // UI references
        this.sidebar = null;
        this.content = null;
        this.loadingScreen = null;
        this.themeManager = null;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.loadModule = this.loadModule.bind(this);
        this.handleNavigation = this.handleNavigation.bind(this);
        this.saveData = this.saveData.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
    }
    
    // ===== INITIALIZATION =====
    async init() {
        try {
            console.log('🛠️ Admin Dashboard başlatılıyor...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Get UI references
            this.getUIReferences();
            
            // Initialize theme manager
            await this.initializeThemeManager();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup navigation
            this.setupNavigation();
            
            // Load initial data
            await this.loadInitialData();
            
            // Load default module
            await this.loadModule('dashboard');
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            console.log('✅ Admin Dashboard hazır');
            
        } catch (error) {
            console.error('❌ Admin Dashboard başlatma hatası:', error);
            this.handleInitializationError(error);
        }
    }
    
    getUIReferences() {
        this.sidebar = document.getElementById('adminSidebar');
        this.content = document.getElementById('adminContent');
        this.loadingScreen = document.getElementById('adminLoadingScreen');
        
        if (!this.sidebar || !this.content) {
            throw new Error('Required UI elements not found');
        }
    }
    
    async initializeThemeManager() {
        this.themeManager = new ThemeManager();
        await this.themeManager.init();
        
        // Setup admin theme toggle
        const adminThemeToggle = document.getElementById('adminThemeToggle');
        if (adminThemeToggle) {
            adminThemeToggle.addEventListener('click', () => {
                this.themeManager.toggle();
            });
        }
    }
    
    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Navigation events
        document.addEventListener('click', this.handleNavigation);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Before unload warning
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // Editor notifications
        document.addEventListener('editornotification', this.handleEditorNotification.bind(this));
        
        // Mobile menu
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }
        
        // Action buttons
        const saveAllBtn = document.getElementById('saveAllBtn');
        const backupBtn = document.getElementById('backupBtn');
        
        if (saveAllBtn) {
            saveAllBtn.addEventListener('click', this.saveAllData.bind(this));
        }
        
        if (backupBtn) {
            backupBtn.addEventListener('click', this.createBackup.bind(this));
        }
    }
    
    handleNavigation(event) {
        const navLink = event.target.closest('[data-module]');
        if (!navLink) return;
        
        event.preventDefault();
        const module = navLink.dataset.module;
        
        if (module !== this.currentModule) {
            this.loadModule(module);
        }
    }
    
    handleKeyboardShortcuts(event) {
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        
        if (isCtrlOrCmd) {
            switch (event.key) {
                case 's':
                    event.preventDefault();
                    this.saveCurrentData();
                    break;
                case 'b':
                    event.preventDefault();
                    this.createBackup();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                    event.preventDefault();
                    const modules = ['dashboard', 'projects', 'blog', 'skills'];
                    const moduleIndex = parseInt(event.key) - 1;
                    if (modules[moduleIndex]) {
                        this.loadModule(modules[moduleIndex]);
                    }
                    break;
            }
        }
    }
    
    handleBeforeUnload(event) {
        if (this.hasUnsavedChanges) {
            const message = 'Kaydedilmemiş değişiklikler var. Sayfadan çıkmak istediğinizden emin misiniz?';
            event.returnValue = message;
            return message;
        }
    }
    
    handleEditorNotification(event) {
        const { message, type } = event.detail;
        this.showNotification(message, type);
    }
    
    // ===== NAVIGATION =====
    setupNavigation() {
        // Update badges with data counts
        this.updateNavigationBadges();
        
        // Set initial active state
        this.updateActiveNavigation('dashboard');
    }
    
    updateNavigationBadges() {
        const badges = {
            projects: this.getDataCount('projects'),
            blog: this.getDataCount('blog'),
            skills: this.getDataCount('skills')
        };
        
        Object.entries(badges).forEach(([module, count]) => {
            const badge = document.getElementById(`${module}Badge`);
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'block' : 'none';
            }
        });
    }
    
    updateActiveNavigation(module) {
        // Remove active class from all nav links
        document.querySelectorAll('.admin-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to current module
        const activeLink = document.querySelector(`[data-module="${module}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = this.getModuleTitle(module);
        }
    }
    
    getModuleTitle(module) {
        const titles = {
            dashboard: 'Dashboard',
            projects: 'Projeler',
            blog: 'Blog',
            skills: 'Yetenekler',
            settings: 'Ayarlar',
            logs: 'Loglar'
        };
        
        return titles[module] || module;
    }
    
    toggleMobileMenu() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('open');
        }
    }
    
    // ===== MODULE LOADING =====
    async loadModule(module) {
        if (this.isLoading) return;
        
        try {
            // Check for unsaved changes
            if (this.hasUnsavedChanges) {
                const shouldProceed = await this.confirmUnsavedChanges();
                if (!shouldProceed) return;
            }
            
            this.isLoading = true;
            this.showLoading();
            
            // Clean up current editor
            if (this.currentEditor) {
                this.currentEditor.destroy();
                this.currentEditor = null;
            }
            
            // Update navigation
            this.updateActiveNavigation(module);
            this.currentModule = module;
            
            // Load module content
            switch (module) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'projects':
                    await this.loadDataEditor('projects');
                    break;
                case 'blog':
                    await this.loadDataEditor('blog');
                    break;
                case 'skills':
                    await this.loadDataEditor('skills');
                    break;
                case 'settings':
                    await this.loadSettings();
                    break;
                case 'logs':
                    await this.loadLogs();
                    break;
                default:
                    throw new Error(`Unknown module: ${module}`);
            }
            
            this.hideLoading();
            this.isLoading = false;
            
        } catch (error) {
            console.error(`Error loading module ${module}:`, error);
            this.showError(`Modül yüklenirken hata oluştu: ${error.message}`);
            this.hideLoading();
            this.isLoading = false;
        }
    }
    
    // ===== DASHBOARD =====
    async loadDashboard() {
        const dashboardHTML = `
            <div class="admin-dashboard-grid">
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="admin-card-title">Projeler</h3>
                        <span class="admin-card-icon">💼</span>
                    </div>
                    <div class="admin-card-content">
                        <div class="admin-stat">
                            <span class="admin-stat-value">${this.getDataCount('projects')}</span>
                            <span class="admin-stat-label">Toplam Proje</span>
                        </div>
                        <div class="admin-stat">
                            <span class="admin-stat-value">${this.getFeaturedCount('projects')}</span>
                            <span class="admin-stat-label">Öne Çıkan</span>
                        </div>
                    </div>
                </div>
                
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="admin-card-title">Blog</h3>
                        <span class="admin-card-icon">📝</span>
                    </div>
                    <div class="admin-card-content">
                        <div class="admin-stat">
                            <span class="admin-stat-value">${this.getDataCount('blog')}</span>
                            <span class="admin-stat-label">Toplam Yazı</span>
                        </div>
                        <div class="admin-stat">
                            <span class="admin-stat-value">${this.getPublishedCount('blog')}</span>
                            <span class="admin-stat-label">Yayınlanan</span>
                        </div>
                    </div>
                </div>
                
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="admin-card-title">Yetenekler</h3>
                        <span class="admin-card-icon">🎯</span>
                    </div>
                    <div class="admin-card-content">
                        <div class="admin-stat">
                            <span class="admin-stat-value">${this.getDataCount('skills')}</span>
                            <span class="admin-stat-label">Toplam Yetenek</span>
                        </div>
                        <div class="admin-stat">
                            <span class="admin-stat-value">${this.getSkillCategoryCount()}</span>
                            <span class="admin-stat-label">Kategori</span>
                        </div>
                    </div>
                </div>
                
                <div class="admin-card">
                    <div class="admin-card-header">
                        <h3 class="admin-card-title">Sistem Durumu</h3>
                        <span class="admin-card-icon">⚡</span>
                    </div>
                    <div class="admin-card-content">
                        <div class="admin-stat">
                            <span class="admin-stat-value">Aktif</span>
                            <span class="admin-stat-label">Durum</span>
                        </div>
                        <div class="admin-stat">
                            <span class="admin-stat-value">${this.formatFileSize(this.getTotalDataSize())}</span>
                            <span class="admin-stat-label">Veri Boyutu</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="admin-card">
                <div class="admin-card-header">
                    <h3 class="admin-card-title">Son Aktiviteler</h3>
                    <span class="admin-card-icon">📊</span>
                </div>
                <div class="admin-card-content">
                    <div id="recentActivities">
                        <p>Aktivite logları yükleniyor...</p>
                    </div>
                </div>
            </div>
        `;
        
        this.content.innerHTML = dashboardHTML;
        this.loadRecentActivities();
    }
    
    loadRecentActivities() {
        const activitiesContainer = document.getElementById('recentActivities');
        if (!activitiesContainer) return;
        
        const activities = this.getRecentActivities();
        
        if (activities.length === 0) {
            activitiesContainer.innerHTML = '<p>Henüz aktivite bulunmuyor.</p>';
            return;
        }
        
        const activitiesHTML = activities.map(activity => `
            <div class="activity-item">
                <span class="activity-time">${activity.time}</span>
                <span class="activity-description">${activity.description}</span>
            </div>
        `).join('');
        
        activitiesContainer.innerHTML = activitiesHTML;
    }
    
    // ===== DATA EDITOR =====
    async loadDataEditor(dataType) {
        const data = await this.loadData(dataType);
        
        const editorHTML = `
            <div class="admin-editor-container">
                <div class="admin-editor-header">
                    <h3 class="admin-editor-title">${this.getModuleTitle(dataType)} - JSON Editör</h3>
                    <div class="admin-editor-actions">
                        <button class="admin-btn admin-btn-secondary" id="formatBtn">
                            <span class="btn-icon">🎨</span>
                            <span class="btn-text">Formatla</span>
                        </button>
                        <button class="admin-btn admin-btn-secondary" id="validateBtn">
                            <span class="btn-icon">✅</span>
                            <span class="btn-text">Doğrula</span>
                        </button>
                        <button class="admin-btn admin-btn-primary" id="saveBtn">
                            <span class="btn-icon">💾</span>
                            <span class="btn-text">Kaydet</span>
                        </button>
                    </div>
                </div>
                <div class="admin-editor-body" id="jsonEditor"></div>
                <div class="admin-editor-footer">
                    <div class="editor-status" id="editorStatus">
                        <span class="status-text">Hazır</span>
                    </div>
                    <div class="editor-info" id="editorInfo">
                        <span class="info-text">Satır: 1, Sütun: 1</span>
                    </div>
                </div>
            </div>
        `;
        
        this.content.innerHTML = editorHTML;
        
        // Initialize JSON editor
        const editorContainer = document.getElementById('jsonEditor');
        this.currentEditor = new JSONEditor(editorContainer);
        await this.currentEditor.init();
        
        // Set data
        const jsonString = JSON.stringify(data, null, 2);
        this.currentEditor.setValue(jsonString);
        
        // Setup editor event listeners
        this.setupEditorListeners(dataType);
        
        // Setup action buttons
        this.setupEditorActions();
    }
    
    setupEditorListeners(dataType) {
        if (!this.currentEditor) return;
        
        // Change listener
        this.currentEditor.onChange(({ hasChanges }) => {
            this.hasUnsavedChanges = hasChanges;
            this.updateSaveStatus(hasChanges);
        });
        
        // Save listener
        this.currentEditor.onSave(({ data }) => {
            this.saveData(dataType, data);
        });
        
        // Status listener
        document.addEventListener('editorstatus', (event) => {
            this.updateEditorStatus(event.detail.status);
        });
        
        // Validation listener
        document.addEventListener('editorvalidation', (event) => {
            this.updateValidationStatus(event.detail);
        });
    }
    
    setupEditorActions() {
        const formatBtn = document.getElementById('formatBtn');
        const validateBtn = document.getElementById('validateBtn');
        const saveBtn = document.getElementById('saveBtn');
        
        if (formatBtn) {
            formatBtn.addEventListener('click', () => {
                if (this.currentEditor) {
                    this.currentEditor.formatJSON();
                }
            });
        }
        
        if (validateBtn) {
            validateBtn.addEventListener('click', () => {
                if (this.currentEditor) {
                    const result = this.currentEditor.validate();
                    this.showValidationResult(result);
                }
            });
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCurrentData();
            });
        }
    }
    
    updateEditorStatus(status) {
        const statusElement = document.getElementById('editorStatus');
        const infoElement = document.getElementById('editorInfo');
        
        if (statusElement) {
            const statusText = status.hasErrors ? 'Hatalar var' : 
                             status.hasChanges ? 'Değiştirildi' : 'Hazır';
            statusElement.innerHTML = `<span class="status-text">${statusText}</span>`;
        }
        
        if (infoElement) {
            infoElement.innerHTML = `
                <span class="info-text">
                    Satır: ${status.line}, Sütun: ${status.column} | 
                    ${status.totalLines} satır, ${status.totalChars} karakter
                </span>
            `;
        }
    }
    
    updateValidationStatus(validation) {
        const statusElement = document.getElementById('editorStatus');
        if (!statusElement) return;
        
        if (validation.isValid) {
            statusElement.innerHTML = '<span class="status-text status-success">✅ Geçerli JSON</span>';
        } else {
            const errorCount = validation.errors.length;
            statusElement.innerHTML = `<span class="status-text status-error">❌ ${errorCount} hata</span>`;
        }
    }
    
    showValidationResult(result) {
        if (result.isValid) {
            this.showNotification('JSON geçerli', 'success');
        } else {
            const errorMessages = result.errors.map(error => error.message).join(', ');
            this.showNotification(`Doğrulama hataları: ${errorMessages}`, 'error');
        }
    }
    
    // ===== DATA MANAGEMENT =====
    async loadInitialData() {
        const loadPromises = Object.keys(this.dataEndpoints).map(async (key) => {
            try {
                await this.loadData(key);
            } catch (error) {
                console.warn(`Failed to load ${key}:`, error);
            }
        });
        
        await Promise.allSettled(loadPromises);
        this.updateNavigationBadges();
    }
    
    async loadData(dataType) {
        if (this.dataCache.has(dataType)) {
            return this.dataCache.get(dataType);
        }
        
        const endpoint = this.dataEndpoints[dataType];
        if (!endpoint) {
            throw new Error(`Unknown data type: ${dataType}`);
        }
        
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.dataCache.set(dataType, data);
            return data;
            
        } catch (error) {
            console.error(`Failed to load ${dataType}:`, error);
            // Return empty fallback data
            return this.getFallbackData(dataType);
        }
    }
    
    getFallbackData(dataType) {
        const fallbacks = {
            projects: { projects: [], categories: [], technologies: [] },
            blog: { posts: [], categories: [], tags: [] },
            skills: { skills: [], categories: [] },
            settings: { version: '1.0', title: 'Portfolio OS V6' }
        };
        
        return fallbacks[dataType] || {};
    }
    
    async saveData(dataType, data) {
        try {
            // Validate data before saving
            if (!this.validateDataStructure(dataType, data)) {
                throw new Error('Invalid data structure');
            }
            
            // In a real implementation, this would save to server
            // For now, we'll save to localStorage and update cache
            const dataKey = `portfolioOS_admin_${dataType}`;
            localStorage.setItem(dataKey, JSON.stringify(data));
            
            // Update cache
            this.dataCache.set(dataType, data);
            
            // Update UI
            this.updateNavigationBadges();
            this.hasUnsavedChanges = false;
            this.updateSaveStatus(false);
            
            // Log activity
            this.logActivity(`${dataType} veri güncellemesi`, 'success');
            
            this.showNotification(`${this.getModuleTitle(dataType)} kaydedildi`, 'success');
            
        } catch (error) {
            console.error(`Failed to save ${dataType}:`, error);
            this.showNotification(`Kaydetme hatası: ${error.message}`, 'error');
        }
    }
    
    validateDataStructure(dataType, data) {
        // Basic structure validation
        switch (dataType) {
            case 'projects':
                return data && Array.isArray(data.projects);
            case 'blog':
                return data && Array.isArray(data.posts);
            case 'skills':
                return data && Array.isArray(data.skills);
            case 'settings':
                return data && typeof data === 'object';
            default:
                return true;
        }
    }
    
    saveCurrentData() {
        if (!this.currentEditor) {
            this.showNotification('Aktif editör bulunamadı', 'warning');
            return;
        }
        
        return this.currentEditor.save();
    }
    
    async saveAllData() {
        try {
            this.showLoading('Tüm veriler kaydediliyor...');
            
            if (this.currentEditor) {
                await this.saveCurrentData();
            }
            
            // Additional save operations can be added here
            
            this.showNotification('Tüm veriler kaydedildi', 'success');
            
        } catch (error) {
            this.showNotification(`Kaydetme hatası: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    // ===== BACKUP =====
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backup = {
                timestamp: timestamp,
                version: '6.0',
                data: {}
            };
            
            // Collect all data
            for (const [key, data] of this.dataCache.entries()) {
                backup.data[key] = data;
            }
            
            // Create downloadable file
            const blob = new Blob([JSON.stringify(backup, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `portfolio-backup-${timestamp}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.logActivity('Veri yedekleme', 'success');
            this.showNotification('Yedek dosyası indirildi', 'success');
            
        } catch (error) {
            console.error('Backup failed:', error);
            this.showNotification(`Yedekleme hatası: ${error.message}`, 'error');
        }
    }
    
    // ===== SETTINGS =====
    async loadSettings() {
        const settingsHTML = `
            <div class="admin-card">
                <div class="admin-card-header">
                    <h3 class="admin-card-title">Genel Ayarlar</h3>
                    <span class="admin-card-icon">⚙️</span>
                </div>
                <div class="admin-card-content">
                    <div class="settings-form">
                        <div class="form-group">
                            <label>Site Başlığı</label>
                            <input type="text" value="Portfolio OS V6" class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Tema</label>
                            <select class="form-control">
                                <option value="auto">Otomatik</option>
                                <option value="light">Açık</option>
                                <option value="dark">Koyu</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Dil</label>
                            <select class="form-control">
                                <option value="tr">Türkçe</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.content.innerHTML = settingsHTML;
    }
    
    // ===== LOGS =====
    async loadLogs() {
        const logs = this.getActivityLogs();
        
        const logsHTML = `
            <div class="admin-card">
                <div class="admin-card-header">
                    <h3 class="admin-card-title">Aktivite Logları</h3>
                    <span class="admin-card-icon">📋</span>
                </div>
                <div class="admin-card-content">
                    <div class="logs-container">
                        ${logs.map(log => `
                            <div class="log-entry log-${log.type}">
                                <span class="log-time">${log.time}</span>
                                <span class="log-message">${log.message}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.content.innerHTML = logsHTML;
    }
    
    // ===== UTILITY METHODS =====
    getDataCount(dataType) {
        const data = this.dataCache.get(dataType);
        if (!data) return 0;
        
        switch (dataType) {
            case 'projects':
                return data.projects?.length || 0;
            case 'blog':
                return data.posts?.length || 0;
            case 'skills':
                return data.skills?.length || 0;
            default:
                return 0;
        }
    }
    
    getFeaturedCount(dataType) {
        const data = this.dataCache.get(dataType);
        if (!data) return 0;
        
        switch (dataType) {
            case 'projects':
                return data.projects?.filter(p => p.featured)?.length || 0;
            case 'blog':
                return data.posts?.filter(p => p.featured)?.length || 0;
            default:
                return 0;
        }
    }
    
    getPublishedCount(dataType) {
        const data = this.dataCache.get(dataType);
        if (!data) return 0;
        
        if (dataType === 'blog') {
            return data.posts?.filter(p => p.status === 'published')?.length || 0;
        }
        
        return 0;
    }
    
    getSkillCategoryCount() {
        const data = this.dataCache.get('skills');
        if (!data || !data.skills) return 0;
        
        const categories = new Set(data.skills.map(skill => skill.category));
        return categories.size;
    }
    
    getTotalDataSize() {
        let totalSize = 0;
        for (const data of this.dataCache.values()) {
            totalSize += JSON.stringify(data).length;
        }
        return totalSize;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // ===== UI HELPERS =====
    showLoading(message = 'Yükleniyor...') {
        if (this.content) {
            this.content.innerHTML = `
                <div class="loading-placeholder">
                    <div class="loading-spinner"></div>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    hideLoading() {
        // Content will be replaced by module content
    }
    
    showLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('loaded');
            
            // Simulate loading progress
            const progressBar = document.getElementById('adminLoadingProgress');
            if (progressBar) {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += Math.random() * 15;
                    if (progress >= 100) {
                        progress = 100;
                        clearInterval(interval);
                    }
                    progressBar.style.width = `${progress}%`;
                }, 100);
            }
        }
    }
    
    hideLoadingScreen() {
        if (this.loadingScreen) {
            setTimeout(() => {
                this.loadingScreen.classList.add('loaded');
            }, 500);
        }
    }
    
    updateSaveStatus(hasChanges) {
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) {
            const dot = saveStatus.querySelector('.status-dot');
            const text = saveStatus.querySelector('.status-text');
            
            if (hasChanges) {
                dot.className = 'status-dot status-warning';
                text.textContent = 'Değişiklikler var';
            } else {
                dot.className = 'status-dot status-success';
                text.textContent = 'Kaydedildi';
            }
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} show`;
        notification.innerHTML = `
            <div class="notification-header">
                <h4 class="notification-title">${this.getNotificationTitle(type)}</h4>
                <button class="notification-close">×</button>
            </div>
            <p class="notification-message">${message}</p>
        `;
        
        const container = document.getElementById('notificationContainer');
        if (container) {
            container.appendChild(notification);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                notification.classList.add('hide');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }, 5000);
            
            // Close button
            const closeBtn = notification.querySelector('.notification-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    notification.classList.remove('show');
                    notification.classList.add('hide');
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                    }, 300);
                });
            }
        }
    }
    
    getNotificationTitle(type) {
        const titles = {
            success: 'Başarılı',
            error: 'Hata',
            warning: 'Uyarı',
            info: 'Bilgi'
        };
        
        return titles[type] || 'Bildirim';
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    async confirmUnsavedChanges() {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const title = document.getElementById('confirmTitle');
            const message = document.getElementById('confirmMessage');
            const confirmBtn = document.getElementById('confirmAction');
            const cancelBtn = document.getElementById('confirmCancel');
            
            if (!modal) {
                resolve(true);
                return;
            }
            
            title.textContent = 'Kaydedilmemiş Değişiklikler';
            message.textContent = 'Kaydedilmemiş değişiklikler var. Devam etmek istediğinizden emin misiniz?';
            
            const handleConfirm = () => {
                modal.classList.remove('active');
                cleanup();
                resolve(true);
            };
            
            const handleCancel = () => {
                modal.classList.remove('active');
                cleanup();
                resolve(false);
            };
            
            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            
            modal.classList.add('active');
        });
    }
    
    handleInitializationError(error) {
        const errorHTML = `
            <div class="admin-error">
                <h2>Başlatma Hatası</h2>
                <p>Admin Dashboard başlatılırken bir hata oluştu:</p>
                <pre>${error.message}</pre>
                <button class="admin-btn admin-btn-primary" onclick="window.location.reload()">
                    Sayfayı Yenile
                </button>
            </div>
        `;
        
        if (this.content) {
            this.content.innerHTML = errorHTML;
        }
        
        this.hideLoadingScreen();
    }
    
    // ===== ACTIVITY LOGGING =====
    logActivity(description, type = 'info') {
        const activity = {
            time: new Date().toLocaleString('tr-TR'),
            description: description,
            type: type,
            timestamp: Date.now()
        };
        
        const logs = this.getActivityLogs();
        logs.unshift(activity);
        
        // Keep only last 100 entries
        if (logs.length > 100) {
            logs.splice(100);
        }
        
        localStorage.setItem('portfolioOS_admin_logs', JSON.stringify(logs));
    }
    
    getActivityLogs() {
        try {
            const stored = localStorage.getItem('portfolioOS_admin_logs');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }
    
    getRecentActivities() {
        return this.getActivityLogs().slice(0, 10);
    }
    
    // ===== CLEANUP =====
    destroy() {
        // Clean up editor
        if (this.currentEditor) {
            this.currentEditor.destroy();
            this.currentEditor = null;
        }
        
        // Clean up theme manager
        if (this.themeManager) {
            this.themeManager.destroy();
            this.themeManager = null;
        }
        
        // Clear data cache
        this.dataCache.clear();
        
        console.log('🛠️ Admin Dashboard destroyed');
    }
} 