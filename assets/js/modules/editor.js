/**
 * Portfolio OS V6 - JSON Editor Module
 * CodeMirror-based JSON editor with validation and theme support
 */

export class JSONEditor {
    constructor(container, options = {}) {
        this.container = container;
        this.editor = null;
        this.originalValue = '';
        this.hasChanges = false;
        
        // Configuration
        this.config = {
            mode: 'application/json',
            theme: 'default',
            lineNumbers: true,
            lineWrapping: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            styleActiveLine: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
            lint: true,
            tabSize: 2,
            indentUnit: 2,
            smartIndent: true,
            electricChars: true,
            extraKeys: {
                'Ctrl-Space': 'autocomplete',
                'Cmd-Space': 'autocomplete',
                'Ctrl-S': () => this.save(),
                'Cmd-S': () => this.save(),
                'Ctrl-Z': () => this.undo(),
                'Cmd-Z': () => this.undo(),
                'Ctrl-Y': () => this.redo(),
                'Cmd-Y': () => this.redo(),
                'Ctrl-F': 'findPersistent',
                'Cmd-F': 'findPersistent',
                'F11': () => this.toggleFullscreen(),
                'Esc': () => this.exitFullscreen()
            },
            ...options
        };
        
        // State
        this.isFullscreen = false;
        this.validationErrors = [];
        this.changeListeners = new Set();
        this.saveListeners = new Set();
        
        // Bind methods
        this.init = this.init.bind(this);
        this.setValue = this.setValue.bind(this);
        this.getValue = this.getValue.bind(this);
        this.save = this.save.bind(this);
        this.validate = this.validate.bind(this);
        this.formatJSON = this.formatJSON.bind(this);
    }
    
    // ===== INITIALIZATION =====
    async init() {
        try {
            if (!window.CodeMirror) {
                throw new Error('CodeMirror library not loaded');
            }
            
            // Create editor instance
            this.createEditor();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup theme
            this.updateTheme();
            
            // Setup validation
            this.setupValidation();
            
            console.log('📝 JSON Editor initialized');
            
        } catch (error) {
            console.error('JSON Editor initialization failed:', error);
            this.createFallbackEditor();
        }
    }
    
    createEditor() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create CodeMirror editor
        this.editor = CodeMirror(this.container, this.config);
        
        // Set initial styling
        this.editor.setSize('100%', 'auto');
        
        // Setup change handler
        this.editor.on('change', () => {
            this.hasChanges = true;
            this.validateDebounced();
            this.notifyChangeListeners();
        });
        
        // Setup cursor activity handler
        this.editor.on('cursorActivity', () => {
            this.updateStatusBar();
        });
        
        // Setup focus/blur handlers
        this.editor.on('focus', () => {
            this.container.classList.add('focused');
        });
        
        this.editor.on('blur', () => {
            this.container.classList.remove('focused');
        });
    }
    
    createFallbackEditor() {
        // Fallback textarea if CodeMirror fails
        const textarea = document.createElement('textarea');
        textarea.className = 'fallback-editor';
        textarea.style.cssText = `
            width: 100%;
            min-height: 400px;
            font-family: var(--font-mono);
            font-size: var(--text-sm);
            padding: var(--space-4);
            border: 1px solid var(--color-border-secondary);
            border-radius: var(--radius-lg);
            background: var(--color-bg-primary);
            color: var(--color-text-primary);
            resize: vertical;
        `;
        
        textarea.addEventListener('input', () => {
            this.hasChanges = true;
            this.validateDebounced();
            this.notifyChangeListeners();
        });
        
        this.container.innerHTML = '';
        this.container.appendChild(textarea);
        this.editor = { getValue: () => textarea.value, setValue: (val) => textarea.value = val };
        
        console.warn('Using fallback textarea editor');
    }
    
    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Theme change listener
        document.addEventListener('themechange', (e) => {
            this.updateTheme(e.detail.actualTheme);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.container.contains(document.activeElement)) {
                this.handleKeyboardShortcuts(e);
            }
        });
        
        // Debounced validation
        this.validateDebounced = this.debounce(this.validate, 500);
    }
    
    handleKeyboardShortcuts(event) {
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        
        if (isCtrlOrCmd) {
            switch (event.key) {
                case 's':
                    event.preventDefault();
                    this.save();
                    break;
                case 'd':
                    event.preventDefault();
                    this.duplicateLine();
                    break;
                case '/':
                    event.preventDefault();
                    this.toggleComment();
                    break;
            }
        }
        
        // Function keys
        switch (event.key) {
            case 'F9':
                event.preventDefault();
                this.formatJSON();
                break;
            case 'F11':
                event.preventDefault();
                this.toggleFullscreen();
                break;
        }
    }
    
    // ===== CORE METHODS =====
    setValue(value, maintainHistory = false) {
        if (!this.editor) return;
        
        this.originalValue = value;
        
        if (maintainHistory) {
            this.editor.setValue(value);
        } else {
            // Clear history for new content
            this.editor.setValue(value);
            this.editor.clearHistory();
        }
        
        this.hasChanges = false;
        this.validate();
        this.notifyChangeListeners();
    }
    
    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }
    
    getOriginalValue() {
        return this.originalValue;
    }
    
    hasUnsavedChanges() {
        return this.hasChanges && this.getValue() !== this.originalValue;
    }
    
    // ===== VALIDATION =====
    setupValidation() {
        // Enable JSON linting if available
        if (window.jsonlint) {
            window.CodeMirror.registerHelper('lint', 'json', function(text) {
                const found = [];
                try {
                    jsonlint.parse(text);
                } catch (e) {
                    const loc = e.location || {};
                    found.push({
                        from: CodeMirror.Pos(loc.first_line - 1, loc.first_column),
                        to: CodeMirror.Pos(loc.last_line - 1, loc.last_column),
                        message: e.message
                    });
                }
                return found;
            });
        }
    }
    
    validate() {
        const content = this.getValue();
        this.validationErrors = [];
        
        if (!content.trim()) {
            this.updateValidationUI([]);
            return { isValid: true, errors: [] };
        }
        
        try {
            // Parse JSON to validate syntax
            const parsed = JSON.parse(content);
            
            // Additional semantic validation
            const semanticErrors = this.validateSemantics(parsed);
            
            if (semanticErrors.length > 0) {
                this.validationErrors = semanticErrors;
                this.updateValidationUI(semanticErrors);
                return { isValid: false, errors: semanticErrors };
            }
            
            this.updateValidationUI([]);
            return { isValid: true, errors: [], data: parsed };
            
        } catch (error) {
            const syntaxError = {
                type: 'syntax',
                message: error.message,
                line: this.extractLineNumber(error.message),
                column: this.extractColumnNumber(error.message)
            };
            
            this.validationErrors = [syntaxError];
            this.updateValidationUI([syntaxError]);
            return { isValid: false, errors: [syntaxError] };
        }
    }
    
    validateSemantics(data) {
        const errors = [];
        
        // Example semantic validations
        if (Array.isArray(data)) {
            // Validate array items
            data.forEach((item, index) => {
                if (typeof item === 'object' && item !== null) {
                    if (!item.id && !item.slug) {
                        errors.push({
                            type: 'semantic',
                            message: `Item at index ${index} missing required 'id' or 'slug' field`,
                            line: null,
                            column: null
                        });
                    }
                }
            });
        }
        
        return errors;
    }
    
    updateValidationUI(errors) {
        // Remove existing error indicators
        this.container.classList.remove('has-errors');
        
        // Add error indicators if needed
        if (errors.length > 0) {
            this.container.classList.add('has-errors');
        }
        
        // Dispatch validation event
        this.dispatchValidationEvent(errors);
    }
    
    extractLineNumber(errorMessage) {
        const match = errorMessage.match(/line (\d+)/i);
        return match ? parseInt(match[1]) - 1 : null;
    }
    
    extractColumnNumber(errorMessage) {
        const match = errorMessage.match(/column (\d+)/i);
        return match ? parseInt(match[1]) - 1 : null;
    }
    
    // ===== FORMATTING =====
    formatJSON() {
        const content = this.getValue();
        
        try {
            const parsed = JSON.parse(content);
            const formatted = JSON.stringify(parsed, null, 2);
            
            // Preserve cursor position
            const cursor = this.editor.getCursor();
            this.editor.setValue(formatted);
            
            // Try to restore cursor position
            try {
                this.editor.setCursor(cursor);
            } catch (e) {
                // Fallback to beginning
                this.editor.setCursor(0, 0);
            }
            
            this.notifySuccess('JSON formatlandı');
            
        } catch (error) {
            this.notifyError('JSON formatlanamadı: ' + error.message);
        }
    }
    
    minifyJSON() {
        const content = this.getValue();
        
        try {
            const parsed = JSON.parse(content);
            const minified = JSON.stringify(parsed);
            this.editor.setValue(minified);
            this.notifySuccess('JSON minify edildi');
            
        } catch (error) {
            this.notifyError('JSON minify edilemedi: ' + error.message);
        }
    }
    
    // ===== ACTIONS =====
    save() {
        const validation = this.validate();
        
        if (!validation.isValid) {
            this.notifyError('Kaydetmeden önce hataları düzeltin');
            return false;
        }
        
        // Notify save listeners
        this.notifySaveListeners(validation.data);
        
        // Reset change tracking
        this.originalValue = this.getValue();
        this.hasChanges = false;
        
        this.notifySuccess('JSON kaydedildi');
        return true;
    }
    
    undo() {
        if (this.editor && this.editor.undo) {
            this.editor.undo();
        }
    }
    
    redo() {
        if (this.editor && this.editor.redo) {
            this.editor.redo();
        }
    }
    
    duplicateLine() {
        if (!this.editor.duplicateLine) return;
        this.editor.duplicateLine();
    }
    
    toggleComment() {
        if (!this.editor.toggleComment) return;
        this.editor.toggleComment();
    }
    
    find() {
        if (this.editor.execCommand) {
            this.editor.execCommand('findPersistent');
        }
    }
    
    replace() {
        if (this.editor.execCommand) {
            this.editor.execCommand('replace');
        }
    }
    
    // ===== FULLSCREEN =====
    toggleFullscreen() {
        this.isFullscreen = !this.isFullscreen;
        
        if (this.isFullscreen) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
    }
    
    enterFullscreen() {
        this.container.classList.add('fullscreen');
        this.editor.setSize('100vw', '100vh');
        this.isFullscreen = true;
        
        // Add fullscreen styles
        document.body.style.overflow = 'hidden';
        
        this.notifySuccess('Tam ekran modu açık (ESC ile çık)');
    }
    
    exitFullscreen() {
        this.container.classList.remove('fullscreen');
        this.editor.setSize('100%', 'auto');
        this.isFullscreen = false;
        
        // Remove fullscreen styles
        document.body.style.overflow = '';
    }
    
    // ===== THEME MANAGEMENT =====
    updateTheme(theme) {
        if (!this.editor) return;
        
        const currentTheme = theme || document.documentElement.getAttribute('data-theme') || 'light';
        const editorTheme = currentTheme === 'dark' ? 'material-darker' : 'eclipse';
        
        this.editor.setOption('theme', editorTheme);
    }
    
    // ===== STATUS BAR =====
    updateStatusBar() {
        if (!this.editor) return;
        
        const cursor = this.editor.getCursor();
        const selection = this.editor.getSelection();
        const totalLines = this.editor.lineCount();
        const content = this.getValue();
        
        const statusInfo = {
            line: cursor.line + 1,
            column: cursor.ch + 1,
            selection: selection.length,
            totalLines: totalLines,
            totalChars: content.length,
            hasErrors: this.validationErrors.length > 0,
            hasChanges: this.hasChanges
        };
        
        this.dispatchStatusEvent(statusInfo);
    }
    
    // ===== EVENT DISPATCHING =====
    dispatchValidationEvent(errors) {
        const event = new CustomEvent('editorvalidation', {
            detail: {
                isValid: errors.length === 0,
                errors: errors,
                editor: this
            }
        });
        
        this.container.dispatchEvent(event);
    }
    
    dispatchStatusEvent(status) {
        const event = new CustomEvent('editorstatus', {
            detail: {
                status: status,
                editor: this
            }
        });
        
        this.container.dispatchEvent(event);
    }
    
    // ===== LISTENERS =====
    onChange(callback) {
        this.changeListeners.add(callback);
        return () => this.changeListeners.delete(callback);
    }
    
    onSave(callback) {
        this.saveListeners.add(callback);
        return () => this.saveListeners.delete(callback);
    }
    
    notifyChangeListeners() {
        const content = this.getValue();
        const hasChanges = this.hasUnsavedChanges();
        
        this.changeListeners.forEach(callback => {
            try {
                callback({ content, hasChanges, editor: this });
            } catch (error) {
                console.error('Change listener error:', error);
            }
        });
    }
    
    notifySaveListeners(data) {
        this.saveListeners.forEach(callback => {
            try {
                callback({ data, editor: this });
            } catch (error) {
                console.error('Save listener error:', error);
            }
        });
    }
    
    // ===== NOTIFICATIONS =====
    notifySuccess(message) {
        this.notify(message, 'success');
    }
    
    notifyError(message) {
        this.notify(message, 'error');
    }
    
    notifyWarning(message) {
        this.notify(message, 'warning');
    }
    
    notify(message, type = 'info') {
        const event = new CustomEvent('editornotification', {
            detail: {
                message: message,
                type: type,
                editor: this
            }
        });
        
        document.dispatchEvent(event);
    }
    
    // ===== UTILITY METHODS =====
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
    
    focus() {
        if (this.editor && this.editor.focus) {
            this.editor.focus();
        }
    }
    
    refresh() {
        if (this.editor && this.editor.refresh) {
            this.editor.refresh();
        }
    }
    
    getInfo() {
        return {
            hasChanges: this.hasChanges,
            hasUnsavedChanges: this.hasUnsavedChanges(),
            validationErrors: this.validationErrors,
            isFullscreen: this.isFullscreen,
            theme: this.editor?.getOption('theme'),
            lineCount: this.editor?.lineCount(),
            characterCount: this.getValue().length
        };
    }
    
    // ===== CLEANUP =====
    destroy() {
        // Remove event listeners
        this.changeListeners.clear();
        this.saveListeners.clear();
        
        // Exit fullscreen if active
        if (this.isFullscreen) {
            this.exitFullscreen();
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // Nullify editor reference
        this.editor = null;
        
        console.log('📝 JSON Editor destroyed');
    }
} 