/**
 * Add Item Modal - Dynamic Modal Form System
 * Apple UI tasarımlı proje ve yetenek ekleme modal'ı
 */

/**
 * AddItemModal Sınıfı
 * Projeler ve yetenekler için dinamik modal form sistemi
 */
class AddItemModal {
    constructor() {
        this.isOpen = false;
        this.currentType = null;
        this.dataSyncManager = null;
        this.previewPanel = null;
        this.modal = null;
        this.focusableElements = [];
        this.firstFocusable = null;
        this.lastFocusable = null;
        
        // Form data
        this.formData = {};
        
        this.init();
    }

    /**
     * Modal sistemini başlatır
     */
    async init() {
        try {
            console.log('🔄 Add Item Modal başlatılıyor...');
            
            // Dependencies'i bekle
            await this.waitForDependencies();
            
            // Modal root'u oluştur
            this.ensureModalRoot();
            
            // Global event listeners
            this.setupGlobalEventListeners();
            
            console.log('✅ Add Item Modal hazır');
            
        } catch (error) {
            console.error('❌ Add Item Modal başlatma hatası:', error);
        }
    }

    /**
     * Dependencies'lerin hazır olmasını bekler
     */
    async waitForDependencies() {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            if (window.dataSyncManager && window.previewPanel && window.toast) {
                this.dataSyncManager = window.dataSyncManager;
                this.previewPanel = window.previewPanel;
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!this.dataSyncManager || !this.previewPanel) {
            throw new Error('Dependencies bulunamadı - timeout');
        }
    }

    /**
     * Modal root elementini oluşturur
     */
    ensureModalRoot() {
        let modalRoot = document.getElementById('modal-root');
        if (!modalRoot) {
            modalRoot = document.createElement('div');
            modalRoot.id = 'modal-root';
            modalRoot.style.position = 'fixed';
            modalRoot.style.top = '0';
            modalRoot.style.left = '0';
            modalRoot.style.width = '100%';
            modalRoot.style.height = '100%';
            modalRoot.style.zIndex = '10000';
            modalRoot.style.pointerEvents = 'none';
            document.body.appendChild(modalRoot);
        }
    }

    /**
     * Global event listeners'ı kurar
     */
    setupGlobalEventListeners() {
        // ESC key ile modal kapatma
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Modal'ı açar
     */
    async open(type) {
        if (this.isOpen) {
            this.close();
        }

        if (!['projects', 'skills'].includes(type)) {
            this.showToast(`❌ Geçersiz veri tipi: ${type}`, 'error');
            return;
        }

        this.currentType = type;
        this.formData = {};
        
        try {
            // Modal UI'sini oluştur
            this.createModal();
            
            // Modal'ı göster
            this.showModal();
            
            // Form'u setup et
            this.setupForm();
            
            this.isOpen = true;
            
            this.showToast(`📝 ${type === 'projects' ? 'Yeni Proje' : 'Yeni Yetenek'} Ekleme`, 'info');
            
        } catch (error) {
            console.error('Modal açma hatası:', error);
            this.showToast('Modal açılamadı: ' + error.message, 'error');
        }
    }

    /**
     * Modal UI'sini oluşturur
     */
    createModal() {
        const modalRoot = document.getElementById('modal-root');
        
        const modalHTML = `
            <div class="add-item-modal-overlay" id="modal-overlay">
                <div class="add-item-modal" id="add-item-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                    <div class="modal-header">
                        <h2 id="modal-title" class="modal-title">
                            ${this.currentType === 'projects' ? '📱 Yeni Proje Ekle' : '🛠️ Yeni Yetenek Ekle'}
                        </h2>
                        <button class="modal-close-btn" id="modal-close" type="button" aria-label="Kapat">
                            <span>&times;</span>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <form class="add-item-form" id="add-item-form">
                            ${this.generateFormFields()}
                        </form>
                    </div>
                    
                    <div class="modal-footer">
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="cancel-btn">
                                ❌ İptal
                            </button>
                            <button type="submit" class="btn btn-primary" id="submit-btn" form="add-item-form">
                                ✅ ${this.currentType === 'projects' ? 'Proje Ekle' : 'Yetenek Ekle'}
                            </button>
                        </div>
                        
                        <div class="form-tips">
                            <span class="tip">💡 <strong>İpucu:</strong></span>
                            <span class="tip-item">Tab: Sonraki alan</span>
                            <span class="tip-item">Escape: İptal</span>
                            <span class="tip-item">Enter: Kaydet</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modalRoot.innerHTML = modalHTML;
        this.modal = document.getElementById('add-item-modal');
    }

    /**
     * Form alanlarını generate eder
     */
    generateFormFields() {
        if (this.currentType === 'projects') {
            return this.generateProjectFields();
        } else if (this.currentType === 'skills') {
            return this.generateSkillFields();
        }
        return '';
    }

    /**
     * Proje form alanlarını generate eder
     */
    generateProjectFields() {
        return `
            <div class="form-section">
                <h3 class="section-title">📋 Proje Bilgileri</h3>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="project-title" class="form-label required">
                            📝 Proje Başlığı
                        </label>
                        <input 
                            type="text" 
                            id="project-title" 
                            name="title"
                            class="form-input"
                            placeholder="Örn: Portfolio Website"
                            required
                            autocomplete="off"
                        >
                        <span class="field-error" id="title-error"></span>
                    </div>
                    
                    <div class="form-group">
                        <label for="project-status" class="form-label required">
                            📊 Durum
                        </label>
                        <select id="project-status" name="status" class="form-select" required>
                            <option value="">Durum seçin</option>
                            <option value="planned">📋 Planlandı</option>
                            <option value="in-progress">🔄 Devam Ediyor</option>
                            <option value="completed">✅ Tamamlandı</option>
                            <option value="on-hold">⏸️ Beklemede</option>
                        </select>
                        <span class="field-error" id="status-error"></span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="project-description" class="form-label required">
                        📄 Açıklama
                    </label>
                    <textarea 
                        id="project-description" 
                        name="description"
                        class="form-textarea"
                        placeholder="Proje hakkında detaylı bilgi..."
                        rows="4"
                        required
                    ></textarea>
                    <span class="field-error" id="description-error"></span>
                </div>
                
                <div class="form-group">
                    <label for="project-technologies" class="form-label">
                        🛠️ Teknolojiler
                    </label>
                    <input 
                        type="text" 
                        id="project-technologies" 
                        name="technologies"
                        class="form-input"
                        placeholder="React, JavaScript, CSS (virgülle ayırın)"
                        autocomplete="off"
                    >
                    <div class="field-help">
                        Teknolojileri virgülle ayırarak yazın. Örn: React, Node.js, MongoDB
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="project-featured" name="featured" class="form-checkbox">
                            <span class="checkbox-custom"></span>
                            <span class="checkbox-text">⭐ Öne çıkan proje olarak işaretle</span>
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h3 class="section-title">🔗 Linkler (Opsiyonel)</h3>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="project-github" class="form-label">
                            🔗 GitHub URL
                        </label>
                        <input 
                            type="url" 
                            id="project-github" 
                            name="githubUrl"
                            class="form-input"
                            placeholder="https://github.com/username/repo"
                            autocomplete="off"
                        >
                    </div>
                    
                    <div class="form-group">
                        <label for="project-live" class="form-label">
                            🌐 Canlı URL
                        </label>
                        <input 
                            type="url" 
                            id="project-live" 
                            name="liveUrl"
                            class="form-input"
                            placeholder="https://example.com"
                            autocomplete="off"
                        >
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Yetenek form alanlarını generate eder
     */
    generateSkillFields() {
        return `
            <div class="form-section">
                <h3 class="section-title">🛠️ Yetenek Bilgileri</h3>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="skill-name" class="form-label required">
                            📝 Yetenek Adı
                        </label>
                        <input 
                            type="text" 
                            id="skill-name" 
                            name="name"
                            class="form-input"
                            placeholder="Örn: JavaScript, React, Photoshop"
                            required
                            autocomplete="off"
                        >
                        <span class="field-error" id="name-error"></span>
                    </div>
                    
                    <div class="form-group">
                        <label for="skill-level" class="form-label required">
                            📊 Seviye
                        </label>
                        <select id="skill-level" name="level" class="form-select" required>
                            <option value="">Seviye seçin</option>
                            <option value="beginner">🌱 Başlangıç</option>
                            <option value="intermediate">📈 Orta</option>
                            <option value="advanced">🚀 İleri</option>
                            <option value="expert">⭐ Uzman</option>
                        </select>
                        <span class="field-error" id="level-error"></span>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="skill-experience" class="form-label">
                            📅 Deneyim (Yıl)
                        </label>
                        <input 
                            type="number" 
                            id="skill-experience" 
                            name="yearsOfExperience"
                            class="form-input"
                            placeholder="Örn: 3"
                            min="0"
                            max="50"
                            step="0.5"
                            autocomplete="off"
                        >
                        <div class="field-help">
                            Bu yetenek ile kaç yıldır çalışıyorsunuz?
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="skill-category" class="form-label required">
                            📂 Kategori
                        </label>
                        <select id="skill-category" name="category" class="form-select" required>
                            <option value="">Kategori seçin</option>
                            <option value="frontend">🎨 Frontend</option>
                            <option value="backend">⚙️ Backend</option>
                            <option value="mobile">📱 Mobile</option>
                            <option value="design">🎨 Tasarım</option>
                            <option value="devops">🔧 DevOps</option>
                            <option value="database">🗄️ Veritabanı</option>
                            <option value="tools">🛠️ Araçlar</option>
                            <option value="other">📋 Diğer</option>
                        </select>
                        <span class="field-error" id="category-error"></span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="skill-description" class="form-label">
                        📄 Açıklama (Opsiyonel)
                    </label>
                    <textarea 
                        id="skill-description" 
                        name="description"
                        class="form-textarea"
                        placeholder="Bu yetenek ile ilgili deneyimlerinizi açıklayın..."
                        rows="3"
                    ></textarea>
                </div>
            </div>
        `;
    }

    /**
     * Modal'ı gösterir
     */
    showModal() {
        const modalRoot = document.getElementById('modal-root');
        const overlay = document.getElementById('modal-overlay');
        
        modalRoot.style.pointerEvents = 'all';
        modalRoot.style.opacity = '0';
        modalRoot.style.transition = 'opacity 0.3s ease';
        
        // Animation
        requestAnimationFrame(() => {
            modalRoot.style.opacity = '1';
            this.modal.style.transform = 'translateY(-20px)';
            this.modal.style.opacity = '0';
            this.modal.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            
            requestAnimationFrame(() => {
                this.modal.style.transform = 'translateY(0)';
                this.modal.style.opacity = '1';
            });
        });
        
        // Focus management
        this.setupFocusManagement();
        this.focusFirstElement();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Form'u setup eder
     */
    setupForm() {
        const form = document.getElementById('add-item-form');
        const closeBtn = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('cancel-btn');
        const overlay = document.getElementById('modal-overlay');
        
        // Form submit
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Close handlers
        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        
        // Backdrop click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
        
        // Real-time validation
        this.setupRealtimeValidation();
    }

    /**
     * Focus management'i kurar
     */
    setupFocusManagement() {
        // Focusable elements
        this.focusableElements = this.modal.querySelectorAll(
            'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
        );
        
        this.firstFocusable = this.focusableElements[0];
        this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
        
        // Tab trap
        this.modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === this.firstFocusable) {
                        e.preventDefault();
                        this.lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === this.lastFocusable) {
                        e.preventDefault();
                        this.firstFocusable.focus();
                    }
                }
            }
        });
    }

    /**
     * İlk elemente focus eder
     */
    focusFirstElement() {
        setTimeout(() => {
            if (this.firstFocusable) {
                this.firstFocusable.focus();
            }
        }, 100);
    }

    /**
     * Real-time validation kurar
     */
    setupRealtimeValidation() {
        const inputs = this.modal.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }

    /**
     * Alanı validate eder
     */
    validateField(field) {
        const value = field.value.trim();
        const name = field.name;
        const errorElement = document.getElementById(`${name}-error`);
        
        if (!value && field.hasAttribute('required')) {
            this.showFieldError(field, 'Bu alan zorunludur');
            return false;
        }
        
        // URL validation
        if (field.type === 'url' && value) {
            try {
                new URL(value);
            } catch {
                this.showFieldError(field, 'Geçerli bir URL giriniz');
                return false;
            }
        }
        
        // Number validation
        if (field.type === 'number' && value) {
            const num = parseFloat(value);
            if (isNaN(num) || num < 0) {
                this.showFieldError(field, 'Geçerli bir sayı giriniz');
                return false;
            }
        }
        
        this.clearFieldError(field);
        return true;
    }

    /**
     * Field error gösterir
     */
    showFieldError(field, message) {
        const errorElement = document.getElementById(`${field.name}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        field.classList.add('error');
    }

    /**
     * Field error'ı temizler
     */
    clearFieldError(field) {
        const errorElement = document.getElementById(`${field.name}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        field.classList.remove('error');
    }

    /**
     * Form submit'ini işler
     */
    async handleSubmit() {
        try {
            // Validate form
            if (!this.validateForm()) {
                this.showToast('❌ Lütfen tüm zorunlu alanları doldurun', 'error');
                return;
            }
            
            // Collect form data
            const formData = this.collectFormData();
            
            // Validate JSON structure
            if (!this.validateItemStructure(formData)) {
                this.showToast('❌ Geçersiz veri formatı', 'error');
                return;
            }
            
            // Save to storage
            await this.saveItem(formData);
            
            // Success feedback
            this.showToast(`✅ ${this.currentType === 'projects' ? 'Proje' : 'Yetenek'} başarıyla eklendi!`, 'success');
            
            // Refresh preview
            if (this.previewPanel && typeof this.previewPanel.forceRefresh === 'function') {
                await this.previewPanel.forceRefresh();
            }
            
            // Close modal
            this.close();
            
        } catch (error) {
            console.error('Submit hatası:', error);
            this.showToast('❌ Kaydetme hatası: ' + error.message, 'error');
        }
    }

    /**
     * Form'u validate eder
     */
    validateForm() {
        const inputs = this.modal.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    /**
     * Form datası toplar
     */
    collectFormData() {
        const form = document.getElementById('add-item-form');
        const formData = new FormData(form);
        const data = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                data[key] = value.trim();
            }
        }
        
        // Special handling for checkboxes
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            data[checkbox.name] = checkbox.checked;
        });
        
        // Process technologies array
        if (data.technologies) {
            data.technologies = data.technologies.split(',').map(tech => tech.trim()).filter(tech => tech);
        }
        
        // Convert number fields
        if (data.yearsOfExperience) {
            data.yearsOfExperience = parseFloat(data.yearsOfExperience);
        }
        
        // Add metadata
        data.id = this.generateId();
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
        
        // Type specific defaults
        if (this.currentType === 'projects') {
            data.icon = data.icon || '📱';
            data.completionRate = data.status === 'completed' ? 100 : 0;
        }
        
        return data;
    }

    /**
     * Item yapısını validate eder
     */
    validateItemStructure(data) {
        if (this.currentType === 'projects') {
            return data.title && data.description && data.status;
        } else if (this.currentType === 'skills') {
            return data.name && data.level && data.category;
        }
        return false;
    }

    /**
     * Item'ı kaydeder
     */
    async saveItem(itemData) {
        // Mevcut veriyi al
        const existingData = await this.dataSyncManager.load(this.currentType);
        let updatedData;
        
        if (this.currentType === 'projects') {
            // Projects array'e ekle
            updatedData = Array.isArray(existingData) ? [...existingData, itemData] : [itemData];
        } else if (this.currentType === 'skills') {
            // Skills yapısında kategoriye ekle
            updatedData = existingData || { skills: { categories: [] } };
            
            if (!updatedData.skills) {
                updatedData.skills = { categories: [] };
            }
            
            if (!Array.isArray(updatedData.skills.categories)) {
                updatedData.skills.categories = [];
            }
            
            // Kategoriyi bul veya oluştur
            let category = updatedData.skills.categories.find(cat => cat.name.toLowerCase() === itemData.category.toLowerCase());
            
            if (!category) {
                category = {
                    id: this.generateId(),
                    name: this.getCategoryDisplayName(itemData.category),
                    icon: this.getCategoryIcon(itemData.category),
                    skills: []
                };
                updatedData.skills.categories.push(category);
            }
            
            // Skill'i kategoriye ekle
            const skillData = {
                id: itemData.id,
                name: itemData.name,
                level: itemData.level,
                experience: itemData.yearsOfExperience ? `${itemData.yearsOfExperience} yıl` : '',
                description: itemData.description || '',
                createdAt: itemData.createdAt,
                updatedAt: itemData.updatedAt
            };
            
            category.skills.push(skillData);
        }
        
        // DataSyncManager ile kaydet
        const result = await this.dataSyncManager.save(this.currentType, updatedData);
        
        // Undo sistemi ile toast göster
        if (window.dataUndoManager) {
            window.dataUndoManager.showUndoToast(this.currentType, itemData);
        }
        
        return result;
    }

    /**
     * Kategori görünen adını döndürür
     */
    getCategoryDisplayName(category) {
        const categoryMap = {
            'frontend': 'Frontend Geliştirme',
            'backend': 'Backend Geliştirme',
            'mobile': 'Mobile Geliştirme',
            'design': 'Tasarım',
            'devops': 'DevOps',
            'database': 'Veritabanı',
            'tools': 'Araçlar',
            'other': 'Diğer'
        };
        return categoryMap[category] || category;
    }

    /**
     * Kategori ikonunu döndürür
     */
    getCategoryIcon(category) {
        const iconMap = {
            'frontend': '🎨',
            'backend': '⚙️',
            'mobile': '📱',
            'design': '🎨',
            'devops': '🔧',
            'database': '🗄️',
            'tools': '🛠️',
            'other': '📋'
        };
        return iconMap[category] || '🛠️';
    }

    /**
     * Unique ID generate eder
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Modal'ı kapatır
     */
    close() {
        if (!this.isOpen) return;
        
        const modalRoot = document.getElementById('modal-root');
        
        // Animation out
        this.modal.style.transition = 'all 0.2s ease-out';
        this.modal.style.transform = 'translateY(-20px)';
        this.modal.style.opacity = '0';
        
        modalRoot.style.transition = 'opacity 0.2s ease-out';
        modalRoot.style.opacity = '0';
        
        setTimeout(() => {
            modalRoot.style.pointerEvents = 'none';
            modalRoot.innerHTML = '';
            document.body.style.overflow = '';
        }, 200);
        
        this.isOpen = false;
        this.currentType = null;
        this.formData = {};
        this.modal = null;
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
     * Modal durumunu döndürür
     */
    getStatus() {
        return {
            isOpen: this.isOpen,
            currentType: this.currentType,
            hasUnsavedChanges: Object.keys(this.formData).length > 0
        };
    }
}

// Global instance oluştur
window.addItemModal = new AddItemModal();

export default AddItemModal; 