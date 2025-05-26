/**
 * Preview Panel - Real-time Preview UI
 * DataSyncManager ile entegre canlı önizleme arayüzü
 */

/**
 * PreviewPanel Sınıfı
 * Projeler ve yetenekler için gerçek zamanlı önizleme paneli
 */
class PreviewPanel {
    constructor() {
        this.currentType = 'projects';
        this.container = null;
        this.isInitialized = false;
        this.dataSyncManager = null;
        this.searchQuery = '';
        this.isVisible = true;
        this.refreshInterval = null;
        
        // UI Elements
        this.elements = {
            container: null,
            typeToggle: null,
            searchInput: null,
            refreshBtn: null,
            previewContent: null,
            statusIndicator: null,
            itemCounter: null
        };
        
        this.init();
    }

    /**
     * Preview panelini başlatır
     */
    async init() {
        try {
            // DataSyncManager'ın hazır olmasını bekle
            await this.waitForDataSyncManager();
            
            // UI'yi oluştur
            this.createUI();
            
            // Event listener'ları kur
            this.setupEventListeners();
            
            // İlk veriyi yükle
            await this.refreshPreview();
            
            // Auto-refresh'i başlat
            this.startAutoRefresh();
            
            this.isInitialized = true;
            
            this.showToast('Preview Panel hazır! 👁️', 'success');
            
        } catch (error) {
            console.error('❌ Preview Panel başlatma hatası:', error);
            this.showToast('Preview Panel başlatılamadı: ' + error.message, 'error');
        }
    }

    /**
     * DataSyncManager'ın hazır olmasını bekler
     */
    async waitForDataSyncManager() {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            if (window.dataSyncManager && window.dataSyncManager.isInitialized) {
                this.dataSyncManager = window.dataSyncManager;
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!this.dataSyncManager) {
            throw new Error('DataSyncManager bulunamadı - timeout');
        }
    }

    /**
     * UI'yi oluşturur ve DOM'a ekler
     */
    createUI() {
        // Container'ı bul veya oluştur
        let targetContainer = document.getElementById('preview-panel');
        if (!targetContainer) {
            targetContainer = document.getElementById('preview-wrapper');
        }
        if (!targetContainer) {
            targetContainer = document.getElementById('preview-section');
        }

        if (!targetContainer) {
            console.warn('Preview container bulunamadı, yeni container oluşturuluyor...');
            targetContainer = document.createElement('div');
            targetContainer.id = 'preview-panel';
            
            // Admin content içinde uygun bir yere ekle
            const adminContent = document.getElementById('admin-content') || document.body;
            adminContent.appendChild(targetContainer);
        }

        // Ana preview UI'sini oluştur
        targetContainer.innerHTML = `
            <div class="preview-panel-container" id="preview-panel-main">
                <div class="preview-header">
                    <div class="preview-controls">
                        <div class="type-toggle-group">
                            <label class="control-label">📊 Önizleme Tipi:</label>
                            <div class="toggle-buttons">
                                <button class="toggle-btn active" data-type="projects">
                                    📱 Projeler
                                </button>
                                <button class="toggle-btn" data-type="skills">
                                    🛠️ Yetenekler
                                </button>
                            </div>
                        </div>
                        
                        <div class="preview-actions">
                            <div class="search-group">
                                <input 
                                    type="text" 
                                    id="preview-search" 
                                    class="search-input"
                                    placeholder="Ara..."
                                >
                                <span class="search-icon">🔍</span>
                            </div>
                            
                            <button id="refresh-preview-btn" class="action-btn btn-primary" title="Yenile (Ctrl+R)">
                                🔄 Yenile
                            </button>
                            
                            <button id="toggle-visibility-btn" class="action-btn btn-secondary" title="Gizle/Göster">
                                👁️ Gizle
                            </button>
                        </div>
                    </div>
                    
                    <div class="preview-status">
                        <div class="status-indicator" id="preview-status">
                            <span class="status-dot"></span>
                            <span class="status-text">Yükleniyor...</span>
                        </div>
                        
                        <div class="preview-meta">
                            <span class="item-counter" id="item-counter">0 öğe</span>
                            <span class="last-updated" id="last-updated">-</span>
                        </div>
                    </div>
                </div>
                
                <div class="preview-viewport" id="preview-viewport">
                    <div class="preview-content" id="preview-content">
                        <div class="loading-state">
                            <div class="loading-spinner"></div>
                            <p>Veriler yükleniyor...</p>
                        </div>
                    </div>
                </div>
                
                <div class="preview-footer">
                    <div class="preview-info">
                        <span class="info-item">💡 <strong>İpucu:</strong> Veriler otomatik güncellenir</span>
                        <span class="info-item">⌨️ Ctrl+R: Yenile</span>
                    </div>
                    
                    <div class="auto-refresh-status" id="auto-refresh-status">
                        <span class="refresh-indicator">🔄 Otomatik yenileme: Aktif</span>
                    </div>
                </div>
            </div>
        `;

        // Element referanslarını kaydet
        this.elements = {
            container: document.getElementById('preview-panel-main'),
            typeToggle: document.querySelectorAll('.toggle-btn'),
            searchInput: document.getElementById('preview-search'),
            refreshBtn: document.getElementById('refresh-preview-btn'),
            toggleBtn: document.getElementById('toggle-visibility-btn'),
            previewContent: document.getElementById('preview-content'),
            statusIndicator: document.getElementById('preview-status'),
            itemCounter: document.getElementById('item-counter'),
            lastUpdated: document.getElementById('last-updated'),
            viewport: document.getElementById('preview-viewport')
        };
    }

    /**
     * Event listener'ları kurar
     */
    setupEventListeners() {
        // Type toggle buttons
        this.elements.typeToggle.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.switchType(type);
            });
        });

        // Search input
        this.elements.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterContent();
        });

        // Action buttons
        this.elements.refreshBtn.addEventListener('click', () => {
            this.refreshPreview();
        });

        this.elements.toggleBtn.addEventListener('click', () => {
            this.toggleVisibility();
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isPreviewActive()) {
                this.handleKeyboardShortcuts(e);
            }
        });

        // DataSyncManager events (if available)
        if (this.dataSyncManager && typeof this.dataSyncManager.on === 'function') {
            this.dataSyncManager.on('dataChanged', (type) => {
                if (type === this.currentType) {
                    this.refreshPreview();
                }
            });
        }
    }

    /**
     * Veri tipini değiştirir
     */
    async switchType(type) {
        if (type === this.currentType) return;
        
        this.currentType = type;
        
        // Toggle button'ları güncelle
        this.elements.typeToggle.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        
        // Search'i temizle
        this.elements.searchInput.value = '';
        this.searchQuery = '';
        
        // Preview'ı yenile
        await this.refreshPreview();
        
        this.showToast(`📊 ${type === 'projects' ? 'Projeler' : 'Yetenekler'} önizlemesi`, 'info');
    }

    /**
     * Preview'ı yeniler
     */
    async refreshPreview() {
        try {
            this.updateStatus('loading', 'Veriler yükleniyor...');
            
            const data = await this.dataSyncManager.load(this.currentType);
            
            if (data) {
                this.renderPreview(data);
                this.updateStatus('success', 'Güncel');
                this.updateLastUpdated();
            } else {
                this.renderEmptyState();
                this.updateStatus('warning', 'Veri bulunamadı');
            }
            
        } catch (error) {
            console.error('❌ Preview refresh hatası:', error);
            this.renderErrorState(error);
            this.updateStatus('error', 'Hata: ' + error.message);
            this.showToast('Preview güncellenirken hata oluştu: ' + error.message, 'error');
        }
    }

    /**
     * Preview içeriğini render eder
     */
    renderPreview(data) {
        const content = this.elements.previewContent;
        
        if (this.currentType === 'projects') {
            this.renderProjectsPreview(data, content);
        } else if (this.currentType === 'skills') {
            this.renderSkillsPreview(data, content);
        }
        
        // Arama filtresi uygula
        if (this.searchQuery) {
            this.filterContent();
        }
    }

    /**
     * Proje önizlemesini render eder
     */
    renderProjectsPreview(projects, container) {
        if (!Array.isArray(projects) || projects.length === 0) {
            this.renderEmptyState('Henüz proje eklenmemiş');
            return;
        }
        
        // Veri formatı doğrulaması ve tech array fallback
        projects = projects.map(project => ({
            ...project,
            tech: Array.isArray(project.tech) ? project.tech : []
        }));
        
        const invalidProjects = projects.filter(project => 
            !project.id || !project.title || !project.description || 
            !project.status || typeof project.featured !== 'boolean'
        );
        
        if (invalidProjects.length > 0) {
            console.error('❌ Geçersiz proje verileri:', invalidProjects);
            this.showToast(`Proje veri formatı hatalı: ${invalidProjects.length} geçersiz proje`, 'error');
            // Sadece geçerli projeleri göster
            projects = projects.filter(project => 
                project.id && project.title && project.description && 
                project.status && typeof project.featured === 'boolean'
            );
        }

        const projectsHtml = projects.map(project => `
            <div class="preview-project-card" data-searchable="${(project.title + ' ' + project.description + ' ' + (Array.isArray(project.tech) ? project.tech.join(' ') : '')).toLowerCase()}">
                <div class="project-header">
                    <div class="project-icon">${project.icon || '📱'}</div>
                    <div class="project-status">
                        <span class="status-badge ${this.getStatusClass(project.status)}">${this.getStatusText(project.status)}</span>
                    </div>
                </div>
                
                <div class="project-content">
                    <h3 class="project-title">${project.title || 'Başlıksız Proje'}</h3>
                    <p class="project-description">${project.description || 'Açıklama bulunmuyor.'}</p>
                    
                    ${Array.isArray(project.tech) && project.tech.length > 0 ? `
                        <div class="project-technologies">
                            ${project.tech.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                    ` : ''}
                    
                    ${project.featured ? '<div class="featured-badge">⭐ Öne Çıkan</div>' : ''}
                </div>
                
                <div class="project-footer">
                    <div class="project-meta">
                        ${project.startDate ? `<span class="meta-item">📅 ${new Date(project.startDate).toLocaleDateString('tr-TR')}</span>` : ''}
                        ${project.completionRate ? `<span class="meta-item">📊 %${project.completionRate}</span>` : ''}
                    </div>
                    
                    <div class="project-links">
                        ${project.github ? `<a href="${project.github}" class="project-link" target="_blank">🔗 GitHub</a>` : ''}
                        ${project.live ? `<a href="${project.live}" class="project-link" target="_blank">🌐 Canlı</a>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="preview-grid projects-grid">
                ${projectsHtml}
            </div>
        `;

        this.updateItemCounter(projects.length);
        this.animateCards();
    }

    /**
     * Yetenek önizlemesini render eder
     */
    renderSkillsPreview(skillsData, container) {
        if (!skillsData || !skillsData.skills || !Array.isArray(skillsData.skills.categories)) {
            this.renderEmptyState('Henüz yetenek kategorisi eklenmemiş');
            return;
        }

        const categories = skillsData.skills.categories;
        
        if (categories.length === 0) {
            this.renderEmptyState('Henüz yetenek kategorisi eklenmemiş');
            return;
        }

        const categoriesHtml = categories.map(category => `
            <div class="preview-skill-category" data-searchable="${(category.name + ' ' + category.skills.map(s => s.name).join(' ')).toLowerCase()}">
                <div class="category-header">
                    <h3 class="category-title">${category.icon || '🛠️'} ${category.name}</h3>
                    <div class="category-stats">
                        <span class="skill-count">${category.skills.length} yetenek</span>
                    </div>
                </div>
                
                <div class="skills-list">
                    ${category.skills.map(skill => `
                        <div class="preview-skill-item">
                            <div class="skill-header">
                                <span class="skill-name">${skill.name}</span>
                                <span class="skill-level-badge level-${skill.level}">${this.getLevelText(skill.level)}</span>
                            </div>
                            
                            <div class="skill-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill level-${skill.level}" style="width: ${this.getLevelPercentage(skill.level)}%"></div>
                                </div>
                                <span class="progress-text">${this.getLevelPercentage(skill.level)}%</span>
                            </div>
                            
                            ${skill.experience ? `<div class="skill-experience">${skill.experience}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="preview-grid skills-grid">
                ${categoriesHtml}
            </div>
        `;

        const totalSkills = categories.reduce((total, cat) => total + cat.skills.length, 0);
        this.updateItemCounter(totalSkills);
        this.animateCards();
    }

    /**
     * Boş durum render eder
     */
    renderEmptyState(message = 'Veri bulunamadı') {
        this.elements.previewContent.innerHTML = `
            <div class="preview-empty-state">
                <div class="empty-icon">📋</div>
                <h3>Önizleme Yok</h3>
                <p>${message}</p>
                <button class="empty-action-btn" onclick="window.previewPanel.refreshPreview()">
                    🔄 Yeniden Dene
                </button>
            </div>
        `;
        this.updateItemCounter(0);
    }

    /**
     * Hata durumu render eder
     */
    renderErrorState(error) {
        this.elements.previewContent.innerHTML = `
            <div class="preview-error-state">
                <div class="error-icon">❌</div>
                <h3>Önizleme Hatası</h3>
                <p>${error.message}</p>
                <button class="error-action-btn" onclick="window.previewPanel.refreshPreview()">
                    🔄 Tekrar Dene
                </button>
            </div>
        `;
        this.updateItemCounter(0);
    }

    /**
     * İçeriği filtreler
     */
    filterContent() {
        const searchableItems = this.elements.previewContent.querySelectorAll('[data-searchable]');
        let visibleCount = 0;

        searchableItems.forEach(item => {
            const searchableText = item.dataset.searchable;
            const isVisible = !this.searchQuery || searchableText.includes(this.searchQuery);
            
            item.style.display = isVisible ? 'block' : 'none';
            if (isVisible) visibleCount++;
        });

        // Filtrelenmiş öğe sayısını güncelle
        if (this.searchQuery) {
            this.updateItemCounter(visibleCount, `(${searchableItems.length} toplam)`);
        } else {
            this.updateItemCounter(searchableItems.length);
        }
    }

    /**
     * Kart animasyonları
     */
    animateCards() {
        const cards = this.elements.previewContent.querySelectorAll('.preview-project-card, .preview-skill-category');
        
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    /**
     * Durumu günceller
     */
    updateStatus(type, message) {
        const statusElement = this.elements.statusIndicator;
        const dot = statusElement.querySelector('.status-dot');
        const text = statusElement.querySelector('.status-text');
        
        statusElement.className = `status-indicator status-${type}`;
        text.textContent = message;
    }

    /**
     * Öğe sayacını günceller
     */
    updateItemCounter(count, extra = '') {
        this.elements.itemCounter.textContent = `${count} öğe ${extra}`;
    }

    /**
     * Son güncelleme zamanını günceller
     */
    updateLastUpdated() {
        const now = new Date();
        this.elements.lastUpdated.textContent = `Son güncelleme: ${now.toLocaleTimeString('tr-TR')}`;
    }

    /**
     * Görünürlük toggle
     */
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        
        this.elements.viewport.style.display = this.isVisible ? 'block' : 'none';
        this.elements.toggleBtn.innerHTML = this.isVisible ? '👁️ Gizle' : '👁️ Göster';
        
        if (this.isVisible) {
            this.refreshPreview();
        }
    }

    /**
     * Keyboard shortcuts işler
     */
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'r':
                    e.preventDefault();
                    this.refreshPreview();
                    break;
                case 'f':
                    e.preventDefault();
                    this.elements.searchInput.focus();
                    break;
            }
        }
    }

    /**
     * Preview'ın aktif olup olmadığını kontrol eder
     */
    isPreviewActive() {
        return this.elements.container.contains(document.activeElement) || 
               document.activeElement === this.elements.searchInput;
    }

    /**
     * Auto-refresh başlatır
     */
    startAutoRefresh() {
        // 10 saniyede bir kontrol et
        this.refreshInterval = setInterval(() => {
            if (this.isVisible && document.visibilityState === 'visible') {
                this.refreshPreview();
            }
        }, 10000);
    }

    /**
     * Auto-refresh durdurur
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Yardımcı metotlar
     */
    getStatusText(status) {
        const statusMap = {
            // İngilizce mappings
            'completed': 'Tamamlandı',
            'in-progress': 'Devam Ediyor',
            'planned': 'Planlandı',
            'on-hold': 'Beklemede',
            'cancelled': 'İptal Edildi',
            'paused': 'Duraklatıldı',
            
            // Türkçe mappings  
            'Tamamlandı': 'Tamamlandı',
            'Devam Ediyor': 'Devam Ediyor',
            'Planlandı': 'Planlandı',
            'Beklemede': 'Beklemede',
            'İptal Edildi': 'İptal Edildi',
            'Duraklatıldı': 'Duraklatıldı',
            
            // Fallback variants
            'tamamlandı': 'Tamamlandı',
            'devam ediyor': 'Devam Ediyor',
            'planlandı': 'Planlandı'
        };
        return statusMap[status] || 'Belirsiz';
    }

    getStatusClass(status) {
        const classMap = {
            // İngilizce mappings
            'completed': 'status-completed',
            'in-progress': 'status-in-progress',
            'planned': 'status-planned',
            'on-hold': 'status-on-hold',
            'cancelled': 'status-cancelled',
            'paused': 'status-paused',
            
            // Türkçe mappings
            'Tamamlandı': 'status-completed',
            'Devam Ediyor': 'status-in-progress',
            'Planlandı': 'status-planned',
            'Beklemede': 'status-on-hold',
            'İptal Edildi': 'status-cancelled',
            'Duraklatıldı': 'status-paused',
            
            // Fallback variants
            'tamamlandı': 'status-completed',
            'devam ediyor': 'status-in-progress',
            'planlandı': 'status-planned'
        };
        return classMap[status] || 'status-planned';
    }

    getLevelText(level) {
        const levelMap = {
            'beginner': 'Başlangıç',
            'intermediate': 'Orta',
            'advanced': 'İleri',
            'expert': 'Uzman'
        };
        return levelMap[level] || 'Belirsiz';
    }

    getLevelPercentage(level) {
        const percentageMap = {
            'beginner': 25,
            'intermediate': 50,
            'advanced': 75,
            'expert': 90
        };
        return percentageMap[level] || 0;
    }

    /**
     * Toast mesajı gösterir
     */
    showToast(message, type = 'info') {
        if (window.toast && typeof window.toast[type] === 'function') {
            window.toast[type](message);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Panel durumunu döndürür
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentType: this.currentType,
            isVisible: this.isVisible,
            searchQuery: this.searchQuery,
            autoRefreshActive: !!this.refreshInterval
        };
    }

    /**
     * Panel temizleme
     */
    destroy() {
        this.stopAutoRefresh();
        if (this.elements.container) {
            this.elements.container.remove();
        }
    }

    /**
     * Belirli bir veri tipini preview'da gösterir
     */
    async showType(type) {
        if (this.dataSyncManager.isValidType(type)) {
            await this.switchType(type);
        } else {
            this.showToast(`❌ Geçersiz veri tipi: ${type}`, 'error');
        }
    }

    /**
     * Preview'ı force refresh eder
     */
    async forceRefresh() {
        await this.refreshPreview();
        this.showToast('🔄 Preview yenilendi', 'success');
    }

    /**
     * Manuel render fonksiyonu
     */
    async render(type = 'projects') {
        try {
            const data = await this.dataSyncManager.load(type);
            
            if (type === 'projects') {
                this.renderProjectsPreview(data, this.elements.previewContent);
            } else if (type === 'skills') {
                this.renderSkillsPreview(data, this.elements.previewContent);
            }
            
            this.currentType = type;
            this.updateStatus('success', 'Güncel');
            this.showToast(`📊 ${type} önizlemesi yenilendi`, 'info');
            
        } catch (error) {
            console.error('❌ Render hatası:', error);
            this.showToast('❌ Render hatası: ' + error.message, 'error');
        }
    }

    /**
     * Toast modülünü test eder
     */
    testToast() {
        this.showToast('Preview Panel başarıyla yüklendi!', 'success');
        
        setTimeout(() => {
            this.showToast('Demo uyarı!', 'warning');
        }, 1000);
        
        setTimeout(() => {
            this.showToast('Demo hata mesajı!', 'error');
        }, 2000);
    }

    /**
     * Proje veri formatını validate eder
     */
    validateProjectData(project, index) {
        const errors = [];
        const warnings = [];
        
        // Zorunlu alanlar kontrolü
        const requiredFields = ['id', 'title', 'description', 'status', 'tech', 'featured'];
        requiredFields.forEach(field => {
            if (!project.hasOwnProperty(field) || project[field] === null || project[field] === undefined) {
                errors.push(`Eksik alan: ${field}`);
            }
        });
        
        // Tip kontrolü
        if (project.id && typeof project.id !== 'string') {
            errors.push('id string olmalı');
        }
        if (project.title && typeof project.title !== 'string') {
            errors.push('title string olmalı');
        }
        if (project.description && typeof project.description !== 'string') {
            errors.push('description string olmalı');
        }
        if (project.featured !== undefined && typeof project.featured !== 'boolean') {
            errors.push('featured boolean olmalı');
        }
        if (project.tech && !Array.isArray(project.tech)) {
            errors.push('tech array olmalı');
        }
        
        // Status değer kontrolü
        const validStatuses = ['Tamamlandı', 'Devam Ediyor', 'Planlandı', 'Beklemede', 'İptal Edildi', 'Duraklatıldı'];
        if (project.status && !validStatuses.includes(project.status)) {
            warnings.push(`Bilinmeyen status: "${project.status}"`);
        }
        
        // URL kontrolü
        if (project.github && typeof project.github !== 'string') {
            warnings.push('github string olmalı');
        }
        if (project.live && typeof project.live !== 'string') {
            warnings.push('live string olmalı');
        }
        
        return { errors, warnings };
    }

    /**
     * Toplu veri validation
     */
    validateAllProjectData(projects) {
        let totalErrors = 0;
        let totalWarnings = 0;
        const projectIssues = [];
        
        projects.forEach((project, index) => {
            const validation = this.validateProjectData(project, index);
            if (validation.errors.length > 0 || validation.warnings.length > 0) {
                projectIssues.push({
                    index: index + 1,
                    id: project.id || `Proje ${index + 1}`,
                    errors: validation.errors,
                    warnings: validation.warnings
                });
                totalErrors += validation.errors.length;
                totalWarnings += validation.warnings.length;
            }
        });
        
        return {
            totalErrors,
            totalWarnings,
            projectIssues,
            isValid: totalErrors === 0
        };
    }

    /**
     * Preview Panel'ı test eder
     */
    async testPreviewPanel() {
        try {
            // Veri yükleme testi
            const data = await this.dataSyncManager.load('projects');
            
            if (!data || !Array.isArray(data)) {
                this.showToast('❌ Projects verisi geçersiz format', 'error');
                return false;
            }
            
            // Kapsamlı validation
            const validation = this.validateAllProjectData(data);
            
            // Sonuçları logla
            if (validation.projectIssues.length > 0) {
                console.group('📋 Proje Validation Raporu');
                validation.projectIssues.forEach(issue => {
                    console.group(`❗ ${issue.id}`);
                    if (issue.errors.length > 0) {
                        console.error('🔴 Hatalar:', issue.errors);
                    }
                    if (issue.warnings.length > 0) {
                        console.warn('🟡 Uyarılar:', issue.warnings);
                    }
                    console.groupEnd();
                });
                console.groupEnd();
            }
            
            // Toast mesajları
            if (validation.totalErrors > 0) {
                this.showToast(`❌ ${validation.totalErrors} kritik hata bulundu`, 'error');
                return false;
            }
            
            if (validation.totalWarnings > 0) {
                this.showToast(`⚠️ ${validation.totalWarnings} uyarı var`, 'warning');
            }
            
            // Render testi
            await this.render('projects');
            
            this.showToast('✅ Preview Panel data render başarılı', 'success');
            return true;
            
        } catch (error) {
            console.error('❌ Preview Panel test hatası:', error);
            this.showToast('❌ Preview Panel test başarısız: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Stress test - Büyük veri ile test
     */
    async testLargeData() {
        try {
            const data = await this.dataSyncManager.load('projects');
            console.time('📊 Large Data Render');
            
            // 100 kopya oluştur
            const largeData = [];
            for (let i = 0; i < 10; i++) {
                data.forEach((project, index) => {
                    largeData.push({
                        ...project,
                        id: `${project.id}-copy-${i}-${index}`,
                        title: `${project.title} (Kopya ${i})`
                    });
                });
            }
            
            this.renderProjectsPreview(largeData, this.elements.previewContent);
            console.timeEnd('📊 Large Data Render');
            
            this.showToast(`✅ ${largeData.length} proje render edildi`, 'success');
            
        } catch (error) {
            console.error('❌ Large data test hatası:', error);
            this.showToast('❌ Large data test başarısız', 'error');
        }
    }

    /**
     * Hata toleransı testi - Bozuk veri ile test
     */
    async testErrorTolerance() {
        const brokenData = [
            { id: 'test-1', title: 'Normal Proje', description: 'Normal açıklama', status: 'Tamamlandı', tech: ['React'], featured: true },
            { id: null, title: 'Broken ID', description: 'ID null', status: 'Tamamlandı', tech: ['Vue'], featured: true },
            { title: 'Missing ID', description: 'ID eksik', status: 'Devam Ediyor', tech: ['Angular'], featured: false },
            { id: 'test-3', description: 'Title eksik', status: 'Planlandı', tech: [], featured: true },
            { id: 'test-4', title: 'Tech broken', description: 'Tech string', status: 'Beklemede', tech: 'Not an array', featured: true },
            { id: 'test-5', title: 'Featured broken', description: 'Featured string', status: 'Tamamlandı', tech: ['Node.js'], featured: 'yes' }
        ];
        
        try {
            console.group('🧪 Error Tolerance Test');
            const validation = this.validateAllProjectData(brokenData);
            
            console.log(`📊 Test Sonuçları:`);
            console.log(`   • Total Errors: ${validation.totalErrors}`);
            console.log(`   • Total Warnings: ${validation.totalWarnings}`);
            console.log(`   • Problematic Projects: ${validation.projectIssues.length}`);
            
            this.renderProjectsPreview(brokenData, this.elements.previewContent);
            console.groupEnd();
            
            this.showToast(`🧪 Error tolerance test: ${validation.totalErrors} hata, ${validation.totalWarnings} uyarı`, 'info');
            
        } catch (error) {
            console.error('❌ Error tolerance test hatası:', error);
            this.showToast('❌ Error tolerance test başarısız', 'error');
        }
    }

    /**
     * Tüm testleri çalıştır
     */
    async runAllTests() {
        console.group('🚀 Preview Panel Full Test Suite');
        
        this.showToast('🧪 Test paketi başlatıldı...', 'info');
        
        await this.testPreviewPanel();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.testErrorTolerance();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.testLargeData();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.testToast();
        
        console.groupEnd();
        this.showToast('✅ Tüm testler tamamlandı!', 'success');
    }
}

// Global instance oluştur
window.previewPanel = new PreviewPanel();

export default PreviewPanel; 