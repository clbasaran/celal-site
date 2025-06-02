/**
 * Data Undo Manager - Reversible Operations System
 * DataSyncManager ile entegre geri alma sistemi
 */

/**
 * DataUndoManager Sinifi
 * Veri degisikliklerini geri alabilmek icin undo sistemi
 */
class DataUndoManager {
    constructor() {
        this.undoStack = new Map(); // type -> previous state
        this.undoTimeouts = new Map(); // type -> timeout id
        this.dataSyncManager = null;
        this.isInitialized = false;
        this.undoTimeWindow = 10000; // 10 saniye undo suresi
        
        this.init();
    }

    /**
     * Undo sistemini baslatir
     */
    async init() {
        try {
            console.log('🔄 Data Undo Manager baslatiliyor...');
            
            // DataSyncManager'i bekle
            await this.waitForDataSyncManager();
            
            // Direct save method'unu ekle
            this.setupDirectSaveMethod();
            
            // Original save method'unu override et
            this.interceptDataSyncManager();
            
            this.isInitialized = true;
            console.log('✅ Data Undo Manager hazir');
            
        } catch (error) {
            console.error('❌ Data Undo Manager baslatma hatasi:', error);
        }
    }

    /**
     * DataSyncManager'in hazir olmasini bekler
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
            throw new Error('DataSyncManager bulunamadi - timeout');
        }
    }

    /**
     * Direct save method ekler
     */
    setupDirectSaveMethod() {
        if (this.dataSyncManager && !this.dataSyncManager.saveDirectly) {
            // DataSyncManager icin bypass save method'u
            this.dataSyncManager.saveDirectly = async (type, data) => {
                // Undo bypass icin direkt localStorage'a yaz
                if (this.dataSyncManager.isValidType(type)) {
                    const key = this.dataSyncManager.getStorageKey(type);
                    localStorage.setItem(key, JSON.stringify(data));
                    
                    // Event'i tetikle
                    if (typeof this.dataSyncManager.notifyChange === 'function') {
                        this.dataSyncManager.notifyChange(type, data);
                    }
                    
                    console.log(`💾 ${type} verisi direkt kaydedildi (undo bypass)`);
                    return data;
                } else {
                    throw new Error(`Gecersiz veri tipi: ${type}`);
                }
            };
        }
    }

    /**
     * DataSyncManager'in save methodunu intercept eder
     */
    interceptDataSyncManager() {
        const originalSave = this.dataSyncManager.save.bind(this.dataSyncManager);
        
        this.dataSyncManager.save = async (type, data) => {
            // Once mevcut veriyi backup'la
            await this.backupBeforeSave(type);
            
            // Original save'i cagir
            const result = await originalSave(type, data);
            
            // Undo toast'ini goster
            this.showUndoToast(type);
            
            return result;
        };
    }

    /**
     * Save isleminden once backup yapar
     */
    async backupBeforeSave(type) {
        try {
            // Mevcut veriyi al
            const currentData = await this.dataSyncManager.load(type);
            
            if (currentData) {
                // Undo stack'e ekle
                this.undoStack.set(type, {
                    data: JSON.parse(JSON.stringify(currentData)), // Deep clone
                    timestamp: new Date().toISOString(),
                    type: type
                });
                
                // Onceki timeout'u temizle
                if (this.undoTimeouts.has(type)) {
                    clearTimeout(this.undoTimeouts.get(type));
                }
                
                // Yeni timeout ayarla (10 saniye sonra undo'yu devre disi birak)
                const timeoutId = setTimeout(() => {
                    this.clearUndo(type);
                }, this.undoTimeWindow);
                
                this.undoTimeouts.set(type, timeoutId);
                
                console.log(`📦 ${type} icin undo backup olusturuldu`);
            }
        } catch (error) {
            console.error('Backup hatasi:', error);
        }
    }

    /**
     * Undo toast'ini gosterir
     */
    showUndoToast(type) {
        if (!window.toast) return;
        
        const displayName = type === 'projects' ? 'Proje' : 'Yetenek';
        const message = `✅ ${displayName} eklendi.`;
        
        // Custom toast with undo button
        this.showCustomToast(message, type, 'success');
    }

    /**
     * Undo butonu ile custom toast gosterir
     */
    showCustomToast(message, type, toastType) {
        // Mevcut toast'lari temizle
        document.querySelectorAll('.toast-undo').forEach(toast => {
            toast.remove();
        });
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${toastType} toast-undo`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-undo-btn" data-type="${type}">
                🔙 Geri Al
            </button>
            <button class="toast-close">&times;</button>
        `;
        
        document.body.appendChild(toast);
        
        // Undo button click handler
        const undoBtn = toast.querySelector('.toast-undo-btn');
        undoBtn.addEventListener('click', () => {
            this.undo(type);
            toast.remove();
        });
        
        // Close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });
        
        // Auto remove after undo window expires
        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.remove();
            }
        }, this.undoTimeWindow);
        
        // Slide in animation
        toast.style.transform = 'translateX(100%)';
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
    }

    /**
     * Belirtilen tip icin undo islemi yapar
     */
    async undo(type) {
        try {
            if (!this.hasUndo(type)) {
                this.showToast('❌ Geri alinacak degisiklik bulunamadi', 'error');
                return false;
            }
            
            const undoData = this.undoStack.get(type);
            
            // Original data'yi restore et
            await this.dataSyncManager.saveDirectly(type, undoData.data);
            
            // Undo'yu temizle
            this.clearUndo(type);
            
            // Success feedback
            const displayName = type === 'projects' ? 'Proje' : 'Yetenek';
            this.showToast(`🔙 ${displayName} ekleme islemi geri alindi`, 'warning');
            
            // UI'yi yenile
            await this.refreshUI(type);
            
            console.log(`✅ ${type} undo islemi tamamlandi`);
            return true;
            
        } catch (error) {
            console.error('Undo hatasi:', error);
            this.showToast('❌ Geri alma islemi basarisiz: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * UI'yi yeniler
     */
    async refreshUI(type) {
        try {
            // Preview Panel'i yenile
            if (window.previewPanel && typeof window.previewPanel.forceRefresh === 'function') {
                await window.previewPanel.forceRefresh();
            }
            
            // Editor Panel'i yenile
            if (window.editorPanel && typeof window.editorPanel.refreshEditor === 'function') {
                await window.editorPanel.refreshEditor();
            }
            
            // Admin Panel dashboard'unu guncelle
            if (window.adminPanel && typeof window.adminPanel.updateDashboardStats === 'function') {
                window.adminPanel.updateDashboardStats();
            }
            
        } catch (error) {
            console.warn('UI refresh sirasinda hata:', error);
        }
    }

    /**
     * Belirtilen tip icin undo mevcut mu kontrol eder
     */
    hasUndo(type) {
        return this.undoStack.has(type) && this.undoTimeouts.has(type);
    }

    /**
     * Undo durumunu dondurur
     */
    getUndoState(type) {
        if (!this.hasUndo(type)) {
            return null;
        }
        
        const undoData = this.undoStack.get(type);
        
        return {
            available: true,
            timestamp: undoData.timestamp,
            type: undoData.type,
            timeRemaining: this.undoTimeWindow - (Date.now() - new Date(undoData.timestamp).getTime())
        };
    }

    /**
     * Tum undo durumlarini dondurur
     */
    getAllUndoStates() {
        const states = {};
        
        for (const [type] of this.undoStack) {
            states[type] = this.getUndoState(type);
        }
        
        return states;
    }

    /**
     * Belirtilen tip icin undo'yu temizler
     */
    clearUndo(type) {
        // Timeout'u temizle
        if (this.undoTimeouts.has(type)) {
            clearTimeout(this.undoTimeouts.get(type));
            this.undoTimeouts.delete(type);
        }
        
        // Stack'ten kaldir
        this.undoStack.delete(type);
        
        // Undo toast'larini temizle
        document.querySelectorAll(`.toast-undo[data-type="${type}"]`).forEach(toast => {
            toast.remove();
        });
        
        console.log(`🗑️ ${type} undo temizlendi`);
    }

    /**
     * Tum undo'lari temizler
     */
    clearAllUndo() {
        // Tum timeout'lari temizle
        for (const [type, timeoutId] of this.undoTimeouts) {
            clearTimeout(timeoutId);
        }
        
        // Stack'leri temizle
        this.undoStack.clear();
        this.undoTimeouts.clear();
        
        // Toast'lari temizle
        document.querySelectorAll('.toast-undo').forEach(toast => {
            toast.remove();
        });
        
        console.log('🗑️ Tum undo\'lar temizlendi');
    }

    /**
     * Undo time window'unu degistirir
     */
    setUndoTimeWindow(milliseconds) {
        this.undoTimeWindow = milliseconds;
    }

    /**
     * Toast mesaji gosterir
     */
    showToast(message, type = 'info') {
        if (window.toast && typeof window.toast[type] === 'function') {
            window.toast[type](message);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Sistem durumunu dondurur
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            undoTimeWindow: this.undoTimeWindow,
            activeUndos: this.undoStack.size,
            availableTypes: Array.from(this.undoStack.keys()),
            states: this.getAllUndoStates()
        };
    }

    /**
     * Manual undo tetikleyici (test icin)
     */
    triggerUndo(type) {
        return this.undo(type);
    }

    /**
     * Undo sistemi temizleme
     */
    destroy() {
        this.clearAllUndo();
        
        // DataSyncManager'i restore et
        if (this.dataSyncManager && this.dataSyncManager.constructor.prototype.save) {
            this.dataSyncManager.save = this.dataSyncManager.constructor.prototype.save;
        }
        
        this.isInitialized = false;
    }
}

// Global instance olustur
window.dataUndoManager = new DataUndoManager();

export default DataUndoManager; 