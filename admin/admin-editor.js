class JSONEditor {
    constructor() {
        this.currentFile = null;
        this.currentData = null;
        this.originalData = null;
        this.isModified = false;
        this.autoSaveInterval = null;
        this.init();
    }

    init() {
        this.createEditorInterface();
        this.setupEventListeners();
        this.loadDefaultFile();
    }

    createEditorInterface() {
        const settingsSection = document.getElementById('settings-section');
        if (!settingsSection) return;

        let settingsGrid = settingsSection.querySelector('.settings-grid');
        if (!settingsGrid) {
            settingsGrid = document.createElement('div');
            settingsGrid.className = 'settings-grid';
            settingsSection.appendChild(settingsGrid);
        }

        const editorCard = document.createElement('div');
        editorCard.className = 'setting-card json-editor-card';
        editorCard.style.gridColumn = '1 / -1'; // Tam genişlik
        
        editorCard.innerHTML = `
            <div class="json-editor-header">
                <h3>🔧 JSON Veri Editörü</h3>
                <div class="editor-controls">
                    <select id="file-selector" class="editor-select">
                        <option value="">Dosya Seçin</option>
                        <option value="projects">📱 Projeler (projects.json)</option>
                        <option value="skills">🛠️ Yetenekler (skills.json)</option>
                    </select>
                    <div class="editor-status" id="editor-status">
                        <span class="status-indicator"></span>
                        <span class="status-text">Hazır</span>
                    </div>
                </div>
            </div>
            
            <div class="json-editor-content">
                <div class="editor-toolbar">
                    <button class="btn-secondary" id="format-json">🎨 Formatla</button>
                    <button class="btn-secondary" id="validate-json">✅ Doğrula</button>
                    <button class="btn-secondary" id="reset-json">🔄 Sıfırla</button>
                    <button class="btn-primary" id="save-json">💾 Kaydet</button>
                    <button class="btn-success" id="export-json">📤 Dışa Aktar</button>
                </div>
                
                <div class="editor-main">
                    <div class="editor-wrapper">
                        <textarea 
                            id="json-editor-textarea" 
                            class="json-textarea"
                            placeholder="JSON dosyası seçin ve düzenlemeye başlayın..."
                            spellcheck="false"
                        ></textarea>
                        <div class="editor-line-numbers" id="line-numbers"></div>
                    </div>
                    
                    <div class="editor-sidebar">
                        <div class="editor-info">
                            <h4>📊 Dosya Bilgileri</h4>
                            <div class="info-item">
                                <span class="info-label">Satır:</span>
                                <span id="line-count">0</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Karakter:</span>
                                <span id="char-count">0</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Boyut:</span>
                                <span id="file-size">0 KB</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Son Değişiklik:</span>
                                <span id="last-modified">-</span>
                            </div>
                        </div>
                        
                        <div class="editor-shortcuts">
                            <h4>⌨️ Kısayollar</h4>
                            <div class="shortcut-item">
                                <kbd>Ctrl/Cmd + S</kbd> Kaydet
                            </div>
                            <div class="shortcut-item">
                                <kbd>Ctrl/Cmd + F</kbd> Formatla
                            </div>
                            <div class="shortcut-item">
                                <kbd>Ctrl/Cmd + Z</kbd> Geri Al
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="editor-footer">
                    <div id="validation-result" class="validation-result"></div>
                </div>
            </div>
        `;

        settingsGrid.appendChild(editorCard);
        this.updateLineNumbers();
    }

    setupEventListeners() {
        // Dosya seçici
        document.getElementById('file-selector').addEventListener('change', (e) => {
            this.loadFile(e.target.value);
        });

        // Toolbar butonları
        document.getElementById('format-json').addEventListener('click', () => this.formatJSON());
        document.getElementById('validate-json').addEventListener('click', () => this.validateJSON());
        document.getElementById('reset-json').addEventListener('click', () => this.resetJSON());
        document.getElementById('save-json').addEventListener('click', () => this.saveJSON());
        document.getElementById('export-json').addEventListener('click', () => this.exportJSON());

        // Textarea events
        const textarea = document.getElementById('json-editor-textarea');
        if (textarea) {
            textarea.addEventListener('input', () => {
                this.onContentChange();
            });

            textarea.addEventListener('scroll', () => {
                this.syncLineNumbers();
            });

            textarea.addEventListener('keydown', (e) => {
                this.handleKeyboardShortcuts(e);
            });

            // Cursor pozisyon takibi
            textarea.addEventListener('click', () => this.updateCursorInfo());
            textarea.addEventListener('keyup', () => this.updateCursorInfo());
        }

        // Auto-save
        this.setupAutoSave();
    }

    loadFile(fileType) {
        if (!fileType) {
            this.clearEditor();
            return;
        }

        this.setStatus('loading', 'Yükleniyor...');
        
        const loadingToast = toast.loading('JSON dosyası yükleniyor...');

        const urls = {
            projects: '../data/projects.json',
            skills: '../data/skills.json'
        };

        fetch(urls[fileType])
            .then(response => {
                if (!response.ok) throw new Error('Dosya bulunamadı');
                return response.json();
            })
            .then(data => {
                this.currentFile = fileType;
                this.currentData = data;
                this.originalData = JSON.parse(JSON.stringify(data));
                this.displayJSON(data);
                this.setStatus('ready', 'Hazır');
                this.isModified = false;
                toast.hide(loadingToast);
                toast.success(`${fileType}.json başarıyla yüklendi`);
            })
            .catch(error => {
                this.setStatus('error', 'Yükleme hatası');
                toast.hide(loadingToast);
                toast.error(`Dosya yüklenemedi: ${error.message}`);
            });
    }

    displayJSON(data) {
        const textarea = document.getElementById('json-editor-textarea');
        if (textarea) {
            textarea.value = JSON.stringify(data, null, 2);
            this.updateLineNumbers();
            this.updateFileInfo();
            this.validateJSON(true); // Sessiz doğrulama
        }
    }

    formatJSON() {
        const textarea = document.getElementById('json-editor-textarea');
        if (!textarea.value.trim()) {
            toast.warning('Formatlanacak içerik bulunamadı');
            return;
        }

        try {
            const parsed = JSON.parse(textarea.value);
            textarea.value = JSON.stringify(parsed, null, 2);
            this.updateLineNumbers();
            this.updateFileInfo();
            toast.success('JSON formatlandı');
        } catch (error) {
            toast.error('JSON formatlanamadı: Geçersiz syntax');
        }
    }

    validateJSON(silent = false) {
        const textarea = document.getElementById('json-editor-textarea');
        const resultDiv = document.getElementById('validation-result');
        
        if (!textarea.value.trim()) {
            if (!silent) {
                resultDiv.innerHTML = '<div class="validation-warning">⚠️ Boş içerik</div>';
            }
            return false;
        }

        try {
            JSON.parse(textarea.value);
            if (!silent) {
                resultDiv.innerHTML = '<div class="validation-success">✅ Geçerli JSON</div>';
                toast.success('JSON doğrulandı');
            }
            return true;
        } catch (error) {
            const errorMsg = `❌ JSON Hatası: ${error.message}`;
            if (!silent) {
                resultDiv.innerHTML = `<div class="validation-error">${errorMsg}</div>`;
                toast.error('Geçersiz JSON syntax');
            }
            return false;
        }
    }

    resetJSON() {
        if (!this.originalData) {
            toast.warning('Sıfırlanacak orijinal veri bulunamadı');
            return;
        }

        if (this.isModified && !confirm('Değişiklikler kaybolacak. Devam etmek istiyor musunuz?')) {
            return;
        }

        this.displayJSON(this.originalData);
        this.isModified = false;
        toast.info('JSON orijinal haline sıfırlandı');
    }

    saveJSON() {
        if (!this.validateJSON(true)) {
            toast.error('Geçersiz JSON kaydedilemez');
            return;
        }

        try {
            const newData = JSON.parse(document.getElementById('json-editor-textarea').value);
            this.currentData = newData;
            
            // localStorage'a kaydet
            localStorage.setItem(`${this.currentFile}_backup`, JSON.stringify(newData));
            
            this.isModified = false;
            this.setStatus('saved', 'Kaydedildi');
            toast.success('JSON başarıyla kaydedildi');
            
            // AdminManager'a bildir
            if (window.adminManager) {
                if (this.currentFile === 'projects') {
                    window.adminManager.projectsData = newData;
                    window.adminManager.renderProjects();
                } else if (this.currentFile === 'skills') {
                    window.adminManager.skillsData = newData;
                    window.adminManager.renderSkills();
                }
                window.adminManager.updateDashboard();
            }
            
        } catch (error) {
            toast.error(`Kaydetme hatası: ${error.message}`);
        }
    }

    exportJSON() {
        if (!this.currentData || !this.currentFile) {
            toast.warning('Dışa aktarılacak veri bulunamadı');
            return;
        }

        const dataStr = JSON.stringify(this.currentData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentFile}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        toast.success('JSON dosyası indirildi');
    }

    onContentChange() {
        this.isModified = true;
        this.updateLineNumbers();
        this.updateFileInfo();
        this.setStatus('modified', 'Değiştirildi');
        
        // Auto-validation (throttled)
        clearTimeout(this.validationTimeout);
        this.validationTimeout = setTimeout(() => {
            this.validateJSON(true);
        }, 1000);
    }

    updateLineNumbers() {
        const textarea = document.getElementById('json-editor-textarea');
        const lineNumbers = document.getElementById('line-numbers');
        
        if (!textarea || !lineNumbers) return;

        const lines = textarea.value.split('\n');
        const numbers = lines.map((_, index) => index + 1).join('\n');
        lineNumbers.textContent = numbers;
    }

    updateFileInfo() {
        const textarea = document.getElementById('json-editor-textarea');
        if (!textarea) return;

        const content = textarea.value;
        const lineCount = content.split('\n').length;
        const charCount = content.length;
        const fileSize = new Blob([content]).size;

        document.getElementById('line-count').textContent = lineCount;
        document.getElementById('char-count').textContent = charCount;
        document.getElementById('file-size').textContent = `${(fileSize / 1024).toFixed(2)} KB`;
        document.getElementById('last-modified').textContent = new Date().toLocaleTimeString();
    }

    updateCursorInfo() {
        const textarea = document.getElementById('json-editor-textarea');
        if (!textarea) return;

        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = textarea.value.substring(0, cursorPos);
        const lineNumber = textBeforeCursor.split('\n').length;
        const columnNumber = textBeforeCursor.split('\n').pop().length + 1;

        // Cursor bilgisini göster (isteğe bağlı)
        console.log(`Cursor: Line ${lineNumber}, Column ${columnNumber}`);
    }

    syncLineNumbers() {
        const textarea = document.getElementById('json-editor-textarea');
        const lineNumbers = document.getElementById('line-numbers');
        
        if (textarea && lineNumbers) {
            lineNumbers.scrollTop = textarea.scrollTop;
        }
    }

    handleKeyboardShortcuts(e) {
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        if (isCtrlOrCmd) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveJSON();
                    break;
                case 'f':
                    e.preventDefault();
                    this.formatJSON();
                    break;
                case 'z':
                    // Varsayılan undo davranışını korur
                    break;
            }
        }
    }

    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.isModified && this.currentFile && this.validateJSON(true)) {
                localStorage.setItem(`${this.currentFile}_autosave`, 
                    document.getElementById('json-editor-textarea').value);
            }
        }, 30000); // Her 30 saniyede bir auto-save
    }

    loadDefaultFile() {
        // Sayfa yüklendiğinde projects.json'u yükle
        setTimeout(() => {
            document.getElementById('file-selector').value = 'projects';
            this.loadFile('projects');
        }, 500);
    }

    setStatus(type, message) {
        const indicator = document.querySelector('.status-indicator');
        const text = document.querySelector('.status-text');
        
        if (indicator && text) {
            indicator.className = `status-indicator status-${type}`;
            text.textContent = message;
        }
    }

    clearEditor() {
        const textarea = document.getElementById('json-editor-textarea');
        if (textarea) {
            textarea.value = '';
            this.updateLineNumbers();
            this.updateFileInfo();
        }
        
        this.currentFile = null;
        this.currentData = null;
        this.originalData = null;
        this.isModified = false;
        this.setStatus('ready', 'Hazır');
    }

    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
        }
    }
}

export default JSONEditor; 