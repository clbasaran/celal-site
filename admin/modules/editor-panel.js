/**
 * JSON Editor Panel - Real-time JSON Editörü
 * DataSyncManager ile entegre JSON düzenleme arayüzü
 */

/**
 * EditorPanel Sınıfı
 * Projeler ve yetenekler için gerçek zamanlı JSON editörü
 */
class EditorPanel {
    constructor() {
        this.currentType = 'projects';
        this.container = null;
        this.textarea = null;
        this.statusElement = null;
        this.isInitialized = false;
        this.dataSyncManager = null;
        this.autoSaveTimeout = null;
        this.lastValidContent = '';
        
        // UI Elements
        this.elements = {
            container: null,
            typeSelector: null,
            textarea: null,
            statusBar: null,
            charCounter: null,
            lineCounter: null,
            actionButtons: {},
            validationStatus: null
        };
        
        this.init();
    }

    /**
     * Editör panelini başlatır
     */
    async init() {
        try {
            console.log('🔄 JSON Editor Panel başlatılıyor...');
            
            // DataSyncManager'ın hazır olmasını bekle
            await this.waitForDataSyncManager();
            
            // UI'yi oluştur
            this.createUI();
            
            // Event listener'ları kur
            this.setupEventListeners();
            
            // İlk veriyi yükle
            await this.loadFromStorage(this.currentType);
            
            this.isInitialized = true;
            console.log('✅ JSON Editor Panel hazır');
            
            this.showToast('JSON Editor hazır! 🎉', 'success');
            
        } catch (error) {
            console.error('❌ JSON Editor Panel başlatma hatası:', error);
            this.showToast('JSON Editor başlatılamadı: ' + error.message, 'error');
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
     * Editor Panel'i belirtilen container'a mount eder
     * @param {HTMLElement} container - Mount edilecek container
     */
    async mount(container) {
        if (!container) {
            console.error('❌ Mount container bulunamadı');
            return;
        }
        
        try {
            console.log('🔄 EditorPanel mount ediliyor...');
            this.container = container;
            
            // DataSyncManager'ın hazır olmasını bekle
            if (!this.dataSyncManager) {
                await this.waitForDataSyncManager();
            }
            
            this.createUIForContainer(container);
            
            if (!this.isInitialized) {
                this.setupEventListeners();
                await this.loadFromStorage(this.currentType);
                this.isInitialized = true;
                console.log('✅ EditorPanel mount edildi');
            }
        } catch (error) {
            console.error('❌ EditorPanel mount hatası:', error);
        }
    }

    /**
     * Belirtilen container için UI oluşturur
     */
    createUIForContainer(container) {
        container.innerHTML = `
            <div class="json-editor-panel" id="json-editor">
                <div class="editor-header">
                    <div class="editor-controls">
                        <div class="type-selector-group">
                            <label for="data-type-selector" class="control-label">
                                📊 Veri Tipi:
                            </label>
                            <select id="data-type-selector" class="type-selector">
                                <option value="projects">📱 Projeler</option>
                                <option value="skills">🛠️ Yetenekler</option>
                            </select>
                        </div>
                        
                        <div class="editor-actions">
                            <button id="load-btn" class="editor-btn btn-secondary" title="Veriyi Yükle (Ctrl+L)">
                                📥 Yükle
                            </button>
                            <button id="save-btn" class="editor-btn btn-primary" title="Kaydet (Ctrl+S)">
                                💾 Kaydet
                            </button>
                            <button id="reset-btn" class="editor-btn btn-danger" title="Sıfırla">
                                🔄 Sıfırla
                            </button>
                            <button id="export-btn" class="editor-btn btn-secondary" title="Dışa Aktar (Ctrl+E)">
                                📤 Export
                            </button>
                        </div>
                    </div>
                    
                    <div class="editor-status">
                        <div class="validation-status" id="validation-status">
                            <span class="status-indicator valid">✅</span>
                            <span class="status-text">Geçerli JSON</span>
                        </div>
                        
                        <div class="editor-counters">
                            <span class="counter" id="char-counter">0 karakter</span>
                            <span class="counter" id="line-counter">0 satır</span>
                        </div>
                    </div>
                </div>
                
                <div class="editor-content">
                    <div class="editor-wrapper">
                        <textarea 
                            id="json-textarea" 
                            class="json-editor-textarea"
                            placeholder="JSON verisi buraya yüklenecek..."
                            spellcheck="false"
                            autocomplete="off"
                        ></textarea>
                        
                        <div class="editor-overlay">
                            <div class="line-numbers" id="line-numbers"></div>
                        </div>
                    </div>
                </div>
                
                <div class="editor-footer">
                    <div class="editor-tips">
                        <span class="tip">💡 <strong>İpuçları:</strong></span>
                        <span class="tip-item">Ctrl+S: Kaydet</span>
                        <span class="tip-item">Ctrl+E: Export</span>
                        <span class="tip-item">Tab: Girinti</span>
                        <span class="tip-item">Auto-save: 3 saniye</span>
                    </div>
                </div>
            </div>
        `;
        
        // Element referanslarını kaydet
        this.elements = {
            container: container,
            typeSelector: container.querySelector('#data-type-selector'),
            textarea: container.querySelector('#json-textarea'),
            statusBar: container.querySelector('#validation-status'),
            charCounter: container.querySelector('#char-counter'),
            lineCounter: container.querySelector('#line-counter'),
            actionButtons: {
                load: container.querySelector('#load-btn'),
                save: container.querySelector('#save-btn'),
                reset: container.querySelector('#reset-btn'),
                export: container.querySelector('#export-btn')
            },
            validationStatus: container.querySelector('#validation-status')
        };
    }

    /**
     * UI'yi oluşturur ve DOM'a ekler
     */
    createUI() {
        // Container'ı bul veya oluştur
        let targetContainer = document.getElementById('editor-wrapper');
        if (!targetContainer) {
            // Editor section'ını dinamik olarak oluştur
            const adminContent = document.getElementById('admin-content');
            if (adminContent) {
                const editorSection = document.createElement('section');
                editorSection.id = 'editor-section';
                editorSection.className = 'content-section';
                editorSection.innerHTML = `
                    <div class="section-header">
                        <h1>📝 JSON Editor</h1>
                        <p>Proje ve yetenek verilerini doğrudan düzenleyin</p>
                    </div>
                    <div id="editor-wrapper"></div>
                `;
                adminContent.querySelector('.content-sections').appendChild(editorSection);
                targetContainer = document.getElementById('editor-wrapper');
                
                // Navigation'a ekle
                const sidebar = document.getElementById('sidebar-nav');
                if (sidebar) {
                    const navItem = document.createElement('li');
                    navItem.className = 'nav-item';
                    navItem.innerHTML = `
                        <a href="#editor" class="nav-link" data-section="editor">
                            📝 JSON Editor
                        </a>
                    `;
                    sidebar.appendChild(navItem);
                    
                    // Click event ekle
                    navItem.querySelector('.nav-link').addEventListener('click', (e) => {
                        e.preventDefault();
                        this.showEditorSection();
                    });
                }
            }
        }

        if (!targetContainer) {
            throw new Error('Editor container bulunamadı');
        }

        // Ana editor UI'sini oluştur
        targetContainer.innerHTML = `
            <div class="json-editor-panel" id="json-editor">
                <div class="editor-header">
                    <div class="editor-controls">
                        <div class="type-selector-group">
                            <label for="data-type-selector" class="control-label">
                                📊 Veri Tipi:
                            </label>
                            <select id="data-type-selector" class="type-selector">
                                <option value="projects">📱 Projeler</option>
                                <option value="skills">🛠️ Yetenekler</option>
                            </select>
                        </div>
                        
                        <div class="editor-actions">
                            <button id="load-btn" class="editor-btn btn-secondary" title="Veriyi Yükle (Ctrl+L)">
                                📥 Yükle
                            </button>
                            <button id="save-btn" class="editor-btn btn-primary" title="Kaydet (Ctrl+S)">
                                💾 Kaydet
                            </button>
                            <button id="reset-btn" class="editor-btn btn-danger" title="Sıfırla">
                                🔄 Sıfırla
                            </button>
                            <button id="export-btn" class="editor-btn btn-secondary" title="Dışa Aktar (Ctrl+E)">
                                📤 Export
                            </button>
                        </div>
                    </div>
                    
                    <div class="editor-status">
                        <div class="validation-status" id="validation-status">
                            <span class="status-indicator valid">✅</span>
                            <span class="status-text">Geçerli JSON</span>
                        </div>
                        
                        <div class="editor-counters">
                            <span class="counter" id="char-counter">0 karakter</span>
                            <span class="counter" id="line-counter">0 satır</span>
                        </div>
                    </div>
                </div>
                
                <div class="editor-content">
                    <div class="editor-wrapper">
                        <textarea 
                            id="json-textarea" 
                            class="json-editor-textarea"
                            placeholder="JSON verisi buraya yüklenecek..."
                            spellcheck="false"
                            autocomplete="off"
                        ></textarea>
                        
                        <div class="editor-overlay">
                            <div class="line-numbers" id="line-numbers"></div>
                        </div>
                    </div>
                </div>
                
                <div class="editor-footer">
                    <div class="editor-tips">
                        <span class="tip">💡 <strong>İpuçları:</strong></span>
                        <span class="tip-item">Ctrl+S: Kaydet</span>
                        <span class="tip-item">Ctrl+E: Export</span>
                        <span class="tip-item">Tab: Girinti</span>
                    </div>
                    
                    <div class="editor-actions-extra">
                        <button class="editor-btn btn-backup" id="show-backups-btn" title="Backup geçmişini göster">
                            🗂️ Backup Listesi
                        </button>
                    </div>
                    
                    <div class="auto-save-status" id="auto-save-status">
                        <span class="auto-save-indicator">⏱️ Otomatik kayıt kapalı</span>
                    </div>
                </div>
            </div>
        `;

        // Element referanslarını kaydet
        this.elements = {
            container: document.getElementById('json-editor'),
            typeSelector: document.getElementById('data-type-selector'),
            textarea: document.getElementById('json-textarea'),
            statusBar: document.getElementById('validation-status'),
            charCounter: document.getElementById('char-counter'),
            lineCounter: document.getElementById('line-counter'),
            validationStatus: document.getElementById('validation-status'),
            autoSaveStatus: document.getElementById('auto-save-status'),
            actionButtons: {
                load: document.getElementById('load-btn'),
                save: document.getElementById('save-btn'),
                reset: document.getElementById('reset-btn'),
                export: document.getElementById('export-btn')
            },
            showBackupsBtn: document.getElementById('show-backups-btn')
        };

        // Auto-resize için textarea ayarları
        this.setupTextareaAutoResize();
        
        // Syntax highlighting için basic setup
        this.setupSyntaxHelpers();
    }

    /**
     * Event listener'ları kurar
     */
    setupEventListeners() {
        // Type selector değişimi
        this.elements.typeSelector.addEventListener('change', (e) => {
            this.currentType = e.target.value;
            this.loadFromStorage(this.currentType);
        });

        // Action button'ları
        this.elements.actionButtons.load.addEventListener('click', () => {
            this.loadFromStorage(this.currentType);
        });

        this.elements.actionButtons.save.addEventListener('click', () => {
            this.saveToStorage(this.currentType);
        });

        this.elements.actionButtons.reset.addEventListener('click', () => {
            this.resetData(this.currentType);
        });

        this.elements.actionButtons.export.addEventListener('click', () => {
            this.exportData(this.currentType);
        });

        // Backup butonu
        this.elements.showBackupsBtn.addEventListener('click', () => {
            this.showBackupModal(this.currentType);
        });

        // Textarea event'leri
        this.elements.textarea.addEventListener('input', (e) => {
            this.handleTextareaInput(e);
        });

        this.elements.textarea.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        this.elements.textarea.addEventListener('scroll', () => {
            this.updateLineNumbers();
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isEditorActive()) {
                this.handleGlobalShortcuts(e);
            }
        });

        // Auto-save toggle (right-click menu)
        this.elements.textarea.addEventListener('contextmenu', (e) => {
            // Custom context menu için gelecekteki özellik
        });
    }

    /**
     * Textarea auto-resize özelliğini kurar
     */
    setupTextareaAutoResize() {
        const textarea = this.elements.textarea;
        
        const resize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.max(400, textarea.scrollHeight) + 'px';
        };

        textarea.addEventListener('input', resize);
        
        // Initial resize
        setTimeout(resize, 100);
    }

    /**
     * Syntax highlighting yardımcıları kurar
     */
    setupSyntaxHelpers() {
        // Line numbers
        this.updateLineNumbers();
        
        // Tab to spaces conversion
        this.elements.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const value = e.target.value;
                
                e.target.value = value.substring(0, start) + '  ' + value.substring(end);
                e.target.selectionStart = e.target.selectionEnd = start + 2;
            }
        });
    }

    /**
     * Line numbers'ı günceller
     */
    updateLineNumbers() {
        const textarea = this.elements.textarea;
        const lineNumbers = document.getElementById('line-numbers');
        
        if (!lineNumbers) return;

        const lines = textarea.value.split('\n');
        const lineNumbersHtml = lines.map((_, index) => 
            `<span class="line-number">${index + 1}</span>`
        ).join('');
        
        lineNumbers.innerHTML = lineNumbersHtml;
        lineNumbers.scrollTop = textarea.scrollTop;
    }

    /**
     * Textarea input değişikliklerini işler
     */
    handleTextareaInput(e) {
        this.updateCounters();
        this.validateJSON();
        this.updateLineNumbers();
        this.scheduleAutoSave();
    }

    /**
     * Karakter ve satır sayaçlarını günceller
     */
    updateCounters() {
        const content = this.elements.textarea.value;
        const charCount = content.length;
        const lineCount = content ? content.split('\n').length : 0;
        
        this.elements.charCounter.textContent = `${charCount.toLocaleString('tr-TR')} karakter`;
        this.elements.lineCounter.textContent = `${lineCount} satır`;
    }

    /**
     * JSON validasyonu yapar
     */
    validateJSON() {
        const content = this.elements.textarea.value.trim();
        const statusElement = this.elements.validationStatus;
        
        if (!content) {
            this.updateValidationStatus('empty', 'Boş içerik');
            return false;
        }

        try {
            const parsed = JSON.parse(content);
            
            // DataSyncManager ile validate et
            const isValid = this.dataSyncManager.validateData(this.currentType, parsed);
            
            if (isValid) {
                this.updateValidationStatus('valid', 'Geçerli JSON');
                this.lastValidContent = content;
                return true;
            } else {
                this.updateValidationStatus('invalid', `Geçersiz ${this.currentType} formatı`);
                return false;
            }
            
        } catch (error) {
            const errorMessage = this.getJSONErrorMessage(error);
            this.updateValidationStatus('error', `JSON Hatası: ${errorMessage}`);
            return false;
        }
    }

    /**
     * Validation durumunu günceller
     */
    updateValidationStatus(status, message) {
        const statusElement = this.elements.validationStatus;
        const indicator = statusElement.querySelector('.status-indicator');
        const text = statusElement.querySelector('.status-text');
        
        // Status class'larını temizle
        statusElement.className = 'validation-status';
        statusElement.classList.add(status);
        
        // Icon ve mesajı güncelle
        switch (status) {
            case 'valid':
                indicator.textContent = '✅';
                break;
            case 'error':
                indicator.textContent = '❌';
                break;
            case 'invalid':
                indicator.textContent = '⚠️';
                break;
            case 'empty':
                indicator.textContent = '📝';
                break;
            default:
                indicator.textContent = '❓';
        }
        
        text.textContent = message;
    }

    /**
     * JSON error mesajını kullanıcı dostu hale getirir
     */
    getJSONErrorMessage(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('unexpected token')) {
            return 'Beklenmeyen karakter';
        } else if (message.includes('unexpected end')) {
            return 'Eksik kapanış';
        } else if (message.includes('expecting')) {
            return 'Eksik syntax';
        } else {
            return error.message;
        }
    }

    /**
     * Keyboard shortcuts'ları işler
     */
    handleKeyboardShortcuts(e) {
        // Textarea içinde çalışan shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    this.saveToStorage(this.currentType);
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportData(this.currentType);
                    break;
                case 'l':
                    e.preventDefault();
                    this.loadFromStorage(this.currentType);
                    break;
            }
        }
    }

    /**
     * Global keyboard shortcuts'ları işler
     */
    handleGlobalShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'r':
                    if (e.shiftKey) {
                        e.preventDefault();
                        this.resetData(this.currentType);
                    }
                    break;
            }
        }
    }

    /**
     * Editörün aktif olup olmadığını kontrol eder
     */
    isEditorActive() {
        return document.activeElement === this.elements.textarea || 
               this.elements.container.contains(document.activeElement);
    }

    /**
     * Auto-save'i planlar
     */
    scheduleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        this.autoSaveTimeout = setTimeout(() => {
            if (this.validateJSON()) {
                // Silent auto-save (sadece localStorage'a)
                this.autoSaveToLocal();
            }
        }, 3000); // 3 saniye sonra auto-save
    }

    /**
     * Sessiz auto-save (sadece localStorage)
     */
    async autoSaveToLocal() {
        try {
            const content = this.elements.textarea.value.trim();
            if (!content || !this.validateJSON()) return;

            const data = JSON.parse(content);
            await this.dataSyncManager.saveToLocal(this.currentType, data);
            
            this.elements.autoSaveStatus.innerHTML = 
                '<span class="auto-save-indicator auto-saved">✅ Otomatik kaydedildi</span>';
            
            setTimeout(() => {
                this.elements.autoSaveStatus.innerHTML = 
                    '<span class="auto-save-indicator">⏱️ Otomatik kayıt aktif</span>';
            }, 2000);
            
        } catch (error) {
            console.warn('Auto-save hatası:', error);
        }
    }

    /**
     * Storage'dan veri yükler
     */
    async loadFromStorage(type) {
        try {
            this.showToast(`📥 ${type} verileri yükleniyor...`, 'info');
            
            const data = await this.dataSyncManager.load(type);
            
            if (data) {
                const formattedJSON = JSON.stringify(data, null, 2);
                this.elements.textarea.value = formattedJSON;
                this.lastValidContent = formattedJSON;
                
                this.updateCounters();
                this.validateJSON();
                this.updateLineNumbers();
                
                this.showToast(`✅ ${type} verileri yüklendi`, 'success');
            } else {
                this.showToast(`⚠️ ${type} verisi bulunamadı`, 'warning');
            }
            
        } catch (error) {
            console.error('Load hatası:', error);
            this.showToast(`❌ Yükleme hatası: ${error.message}`, 'error');
        }
    }

    /**
     * Storage'a veri kaydeder
     */
    async saveToStorage(type) {
        try {
            if (!this.validateJSON()) {
                this.showToast('❌ Geçersiz JSON - kaydetme iptal edildi', 'error');
                return false;
            }

            const content = this.elements.textarea.value.trim();
            const data = JSON.parse(content);
            
            this.showToast(`💾 ${type} verileri kaydediliyor...`, 'info');
            
            const success = await this.dataSyncManager.save(type, data);
            
            if (success) {
                this.lastValidContent = content;
                this.showToast(`✅ ${type} verileri kaydedildi`, 'success');
                return true;
            } else {
                this.showToast(`❌ ${type} kaydetme hatası`, 'error');
                return false;
            }
            
        } catch (error) {
            console.error('Save hatası:', error);
            this.showToast(`❌ Kaydetme hatası: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Veriyi sıfırlar
     */
    async resetData(type) {
        try {
            const confirmation = confirm(
                `${type} verileri sıfırlanacak ve JSON dosyasından yeniden yüklenecek.\n\n` +
                'Bu işlem geri alınamaz. Devam etmek istiyor musunuz?'
            );

            if (!confirmation) return;

            this.showToast(`🔄 ${type} verileri sıfırlanıyor...`, 'warning');
            
            const freshData = await this.dataSyncManager.reset(type);
            
            if (freshData) {
                const formattedJSON = JSON.stringify(freshData, null, 2);
                this.elements.textarea.value = formattedJSON;
                this.lastValidContent = formattedJSON;
                
                this.updateCounters();
                this.validateJSON();
                this.updateLineNumbers();
                
                this.showToast(`✅ ${type} verileri sıfırlandı`, 'success');
            }
            
        } catch (error) {
            console.error('Reset hatası:', error);
            this.showToast(`❌ Sıfırlama hatası: ${error.message}`, 'error');
        }
    }

    /**
     * Veriyi export eder
     */
    exportData(type) {
        try {
            if (!this.validateJSON()) {
                this.showToast('❌ Geçersiz JSON - export iptal edildi', 'error');
                return;
            }

            const content = this.elements.textarea.value.trim();
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${type}-${timestamp}.json`;
            
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.showToast(`📤 ${type} export edildi: ${filename}`, 'success');
            
        } catch (error) {
            console.error('Export hatası:', error);
            this.showToast(`❌ Export hatası: ${error.message}`, 'error');
        }
    }

    /**
     * Editor section'ını gösterir
     */
    showEditorSection() {
        // Tüm section'ları gizle
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Tüm nav link'leri pasif yap
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Editor section'ını göster
        const editorSection = document.getElementById('editor-section');
        const editorNav = document.querySelector('[data-section="editor"]');
        
        if (editorSection) {
            editorSection.classList.add('active');
        }
        
        if (editorNav) {
            editorNav.classList.add('active');
        }
        
        // Focus to textarea
        setTimeout(() => {
            if (this.elements.textarea) {
                this.elements.textarea.focus();
            }
        }, 100);
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
     * Editor durumunu döndürür
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentType: this.currentType,
            isValidJSON: this.validateJSON(),
            characterCount: this.elements.textarea?.value.length || 0,
            lineCount: this.elements.textarea?.value.split('\n').length || 0,
            hasUnsavedChanges: this.elements.textarea?.value !== this.lastValidContent
        };
    }

    /**
     * Editor'ı temizler
     */
    clear() {
        if (this.elements.textarea) {
            this.elements.textarea.value = '';
            this.updateCounters();
            this.validateJSON();
            this.updateLineNumbers();
        }
    }

    /**
     * Belirli bir veri tipini editor'a yükler
     */
    async loadType(type) {
        if (this.dataSyncManager.isValidType(type)) {
            this.currentType = type;
            this.elements.typeSelector.value = type;
            await this.loadFromStorage(type);
        } else {
            this.showToast(`❌ Geçersiz veri tipi: ${type}`, 'error');
        }
    }

    /**
     * Backup modal'ını gösterir
     */
    showBackupModal(type) {
        try {
            if (!this.dataSyncManager) {
                this.showToast('❌ DataSyncManager bulunamadı', 'error');
                return;
            }

            const backups = this.dataSyncManager.getBackups(type);
            const stats = this.dataSyncManager.getBackupStats(type);
            
            if (backups.length === 0) {
                this.showToast(`⚠️ ${type} için backup bulunamadı`, 'warning');
                return;
            }

            this.createBackupModal(type, backups, stats);

        } catch (error) {
            console.error('Backup modal hatası:', error);
            this.showToast('❌ Backup modal açılamadı: ' + error.message, 'error');
        }
    }

    /**
     * Backup modal'ını oluşturur
     */
    createBackupModal(type, backups, stats) {
        // Mevcut modal'ı temizle
        const existingModal = document.getElementById('backup-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'backup-modal';
        modal.className = 'modal-overlay backup-modal';
        
        const displayName = type === 'projects' ? 'Proje' : 'Yetenek';
        
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>📦 ${displayName} Backup Geçmişi</h3>
                    <button class="modal-close" id="backup-modal-close">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="backup-stats">
                        <div class="stat-item">
                            <span class="stat-label">Toplam Backup:</span>
                            <span class="stat-value">${stats.total}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Toplam Boyut:</span>
                            <span class="stat-value">${stats.formattedSize}</span>
                        </div>
                        ${stats.newest ? `
                        <div class="stat-item">
                            <span class="stat-label">En Yeni:</span>
                            <span class="stat-value">${new Date(stats.newest.timestamp).toLocaleString('tr-TR')}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="backup-list">
                        <div class="backup-list-header">
                            <span class="backup-col-date">Tarih</span>
                            <span class="backup-col-size">Boyut</span>
                            <span class="backup-col-actions">İşlemler</span>
                        </div>
                        
                        <div class="backup-items">
                            ${backups.map(backup => `
                                <div class="backup-item" data-timestamp="${backup.timestamp}">
                                    <div class="backup-col-date">
                                        <span class="backup-date">${new Date(backup.timestamp).toLocaleDateString('tr-TR')}</span>
                                        <span class="backup-time">${new Date(backup.timestamp).toLocaleTimeString('tr-TR')}</span>
                                    </div>
                                    <div class="backup-col-size">
                                        ${this.dataSyncManager.formatBytes(backup.size)}
                                    </div>
                                    <div class="backup-col-actions">
                                        <button class="btn-backup-action btn-restore" 
                                                data-type="${type}" 
                                                data-timestamp="${backup.timestamp}"
                                                title="Bu backup'ı restore et">
                                            🔄 Restore
                                        </button>
                                        <button class="btn-backup-action btn-delete" 
                                                data-key="${backup.key}"
                                                title="Bu backup'ı sil">
                                            🗑️ Sil
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="backup-clear-all" data-type="${type}">
                        🧹 Tümünü Temizle
                    </button>
                    <button class="btn btn-primary" id="backup-export" data-type="${type}">
                        📤 Listeyi Export Et
                    </button>
                    <button class="btn btn-secondary" id="backup-modal-cancel">
                        İptal
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Event listener'ları ekle
        this.setupBackupModalEvents(modal, type);
        
        // Modal'ı göster
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    /**
     * Backup modal event listener'larını kurar
     */
    setupBackupModalEvents(modal, type) {
        // Close butonları
        const closeBtn = modal.querySelector('#backup-modal-close');
        const cancelBtn = modal.querySelector('#backup-modal-cancel');
        
        [closeBtn, cancelBtn].forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            });
        });

        // Modal dışına tıklama
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        });

        // Restore butonları
        modal.querySelectorAll('.btn-restore').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const timestamp = parseInt(e.target.dataset.timestamp);
                const type = e.target.dataset.type;
                
                if (confirm('Bu backup restore edilecek. Mevcut veri backup alınacak. Devam edilsin mi?')) {
                    await this.restoreBackup(type, timestamp);
                    modal.classList.remove('active');
                    setTimeout(() => modal.remove(), 300);
                }
            });
        });

        // Delete butonları
        modal.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.dataset.key;
                
                if (confirm('Bu backup silinecek. Bu işlem geri alınamaz. Devam edilsin mi?')) {
                    localStorage.removeItem(key);
                    e.target.closest('.backup-item').remove();
                    this.showToast('✅ Backup silindi', 'success');
                }
            });
        });

        // Clear all butonu
        const clearAllBtn = modal.querySelector('#backup-clear-all');
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Tüm backup\'lar silinecek. Bu işlem geri alınamaz. Devam edilsin mi?')) {
                this.dataSyncManager.clearAllBackups(type);
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
                this.showToast('🧹 Tüm backup\'lar temizlendi', 'info');
            }
        });

        // Export butonu
        const exportBtn = modal.querySelector('#backup-export');
        exportBtn.addEventListener('click', () => {
            this.exportBackupList(type);
        });

        // ESC tuşu ile kapatma
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    /**
     * Backup restore işlemi
     */
    async restoreBackup(type, timestamp) {
        try {
            this.showToast(`🔄 ${type} backup restore ediliyor...`, 'info');
            
            const success = await this.dataSyncManager.restoreBackup(type, timestamp);
            
            if (success) {
                // Editor'ı yenile
                await this.loadFromStorage(type);
                
                // Preview Panel'i yenile
                if (window.previewPanel && typeof window.previewPanel.forceRefresh === 'function') {
                    await window.previewPanel.forceRefresh();
                }
                
                this.showToast('✅ Backup başarıyla restore edildi', 'warning');
            } else {
                this.showToast('❌ Backup restore edilemedi', 'error');
            }

        } catch (error) {
            console.error('Backup restore hatası:', error);
            this.showToast('❌ Backup restore hatası: ' + error.message, 'error');
        }
    }

    /**
     * Backup listesini export eder
     */
    exportBackupList(type) {
        try {
            const exportData = this.dataSyncManager.exportBackupList(type);
            
            if (!exportData) {
                this.showToast('❌ Backup listesi export edilemedi', 'error');
                return;
            }
            
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${type}-backups-${timestamp}.json`;
            
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.showToast(`📤 Backup listesi export edildi: ${filename}`, 'success');
            
        } catch (error) {
            console.error('Backup export hatası:', error);
            this.showToast('❌ Backup export hatası: ' + error.message, 'error');
        }
    }

    /**
     * Editor'ı yeniler (undo sistemden çağrılabilir)
     */
    async refreshEditor() {
        try {
            await this.loadFromStorage(this.currentType);
            console.log('✅ Editor yenilendi');
        } catch (error) {
            console.error('Editor yenileme hatası:', error);
        }
    }
}

// Global instance oluştur
window.editorPanel = new EditorPanel();

export default EditorPanel; 