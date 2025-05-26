/**
 * Data Sync Manager - Veri Senkronizasyon Yöneticisi
 * JSON dosyaları ve localStorage arasında veri senkronizasyonu sağlar
 */

/**
 * DataSyncManager Sınıfı
 * Projeler ve yetenekler için merkezi veri yönetimi
 */
class DataSyncManager {
    constructor() {
        this.supportedTypes = ['projects', 'skills'];
        this.storagePrefix = 'portfolio-';
        this.dataPath = '../data/';
        this.isInitialized = false;
        
        // Default data structures
        this.defaultData = {
            projects: [],
            skills: {
                categories: [],
                stats: {
                    totalSkills: 0,
                    averageLevel: 0,
                    lastUpdated: new Date().toISOString()
                }
            }
        };
        
        this.init();
    }

    /**
     * Manager'ı başlatır
     */
    async init() {
        try {
            console.log('🔄 DataSyncManager başlatılıyor...');
            
            // Toast sistemi kontrolü
            if (!window.toast) {
                console.warn('⚠️ Toast sistemi bulunamadı, fallback log kullanılacak');
            }
            
            this.isInitialized = true;
            this.log('DataSyncManager hazır! 🚀', 'success');
            
        } catch (error) {
            console.error('❌ DataSyncManager başlatma hatası:', error);
            this.log('DataSyncManager başlatılamadı: ' + error.message, 'error');
        }
    }

    /**
     * Belirtilen tipte veriyi JSON dosyasından yükler ve localStorage'a senkronize eder
     * @param {string} type - Veri tipi ('projects' veya 'skills')
     * @returns {Promise<Object>} Yüklenen veri
     */
    async load(type) {
        try {
            // Tip validasyonu
            if (!this.isValidType(type)) {
                throw new Error(`Geçersiz veri tipi: ${type}`);
            }

            this.log(`📥 ${type} verileri yükleniyor...`, 'info');

            // JSON dosyasından veri yükle
            const response = await fetch(`${this.dataPath}${type}.json`);
            
            if (!response.ok) {
                console.warn(`⚠️ ${type}.json dosyası bulunamadı, varsayılan veri kullanılacak`);
                const defaultData = this.defaultData[type];
                await this.saveToLocal(type, defaultData);
                return defaultData;
            }

            const data = await response.json();
            
            // Veri validasyonu
            if (!this.validateData(type, data)) {
                throw new Error(`${type} verisi geçersiz format içeriyor`);
            }

            // localStorage'a kaydet
            await this.saveToLocal(type, data);
            
            this.log(`✅ ${type} verileri başarıyla yüklendi`, 'success');
            
            return data;

        } catch (error) {
            console.error(`❌ ${type} yükleme hatası:`, error);
            this.log(`${type} yükleme hatası: ${error.message}`, 'error');
            
            // Fallback: localStorage'dan yükle veya varsayılan veri döndür
            const localData = this.getFromLocal(type);
            if (localData) {
                this.log(`🔄 ${type} için localStorage verisi kullanılıyor`, 'warning');
                return localData;
            }
            
            return this.defaultData[type];
        }
    }

    /**
     * Veriyi localStorage'a kaydeder ve JSON dosyasını günceller
     * @param {string} type - Veri tipi
     * @param {Object} data - Kaydedilecek veri
     * @returns {Promise<boolean>} Başarı durumu
     */
    async save(type, data) {
        try {
            // Tip ve veri validasyonu
            if (!this.isValidType(type)) {
                throw new Error(`Geçersiz veri tipi: ${type}`);
            }

            if (!data) {
                throw new Error('Kaydedilecek veri boş olamaz');
            }

            if (!this.validateData(type, data)) {
                throw new Error(`${type} verisi geçersiz format içeriyor`);
            }

            this.log(`💾 ${type} verileri kaydediliyor...`, 'info');

            // Backup oluştur (yeni özellik)
            await this.createBackup(type);

            // localStorage'a kaydet
            await this.saveToLocal(type, data);

            // JSON dosyasına kaydet (stub method)
            await this.writeToFile(type, data);

            this.log(`✅ ${type} verileri başarıyla kaydedildi`, 'success');
            
            return true;

        } catch (error) {
            console.error(`❌ ${type} kaydetme hatası:`, error);
            this.log(`${type} kaydetme hatası: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Belirtilen tip için localStorage'ı temizler ve fresh JSON verisini yükler
     * @param {string} type - Veri tipi
     * @returns {Promise<Object>} Yeniden yüklenen veri
     */
    async reset(type) {
        try {
            if (!this.isValidType(type)) {
                throw new Error(`Geçersiz veri tipi: ${type}`);
            }

            this.log(`🔄 ${type} verileri sıfırlanıyor...`, 'warning');

            // localStorage'ı temizle
            this.clearFromLocal(type);

            // Backup verisini de temizle
            this.clearFromLocal(`${type}-backup`);

            // Fresh JSON verisini yükle
            const freshData = await this.load(type);

            this.log(`✅ ${type} verileri sıfırlandı ve yeniden yüklendi`, 'success');
            
            return freshData;

        } catch (error) {
            console.error(`❌ ${type} sıfırlama hatası:`, error);
            this.log(`${type} sıfırlama hatası: ${error.message}`, 'error');
            return this.defaultData[type];
        }
    }

    /**
     * Mevcut veriyi JSON string olarak export eder
     * @param {string} type - Veri tipi
     * @returns {string} JSON string
     */
    export(type) {
        try {
            if (!this.isValidType(type)) {
                throw new Error(`Geçersiz veri tipi: ${type}`);
            }

            const data = this.getFromLocal(type);
            
            if (!data) {
                throw new Error(`${type} verisi bulunamadı`);
            }

            const exportData = {
                type: type,
                data: data,
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                source: 'DataSyncManager'
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            
            this.log(`📤 ${type} verileri export edildi`, 'success');
            
            return jsonString;

        } catch (error) {
            console.error(`❌ ${type} export hatası:`, error);
            this.log(`${type} export hatası: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * JSON string'i parse eder ve localStorage'ı günceller
     * @param {string} type - Veri tipi
     * @param {string} jsonString - Parse edilecek JSON string
     * @returns {Object|null} Parse edilen veri
     */
    async import(type, jsonString) {
        try {
            if (!this.isValidType(type)) {
                throw new Error(`Geçersiz veri tipi: ${type}`);
            }

            if (!jsonString || typeof jsonString !== 'string') {
                throw new Error('Geçersiz JSON string');
            }

            this.log(`📥 ${type} verileri import ediliyor...`, 'info');

            // JSON'ı parse et
            const importData = JSON.parse(jsonString);
            
            // Import formatını kontrol et
            let actualData;
            if (importData.type && importData.data) {
                // DataSyncManager export formatı
                if (importData.type !== type) {
                    throw new Error(`Type uyumsuzluğu: beklenen ${type}, alınan ${importData.type}`);
                }
                actualData = importData.data;
            } else {
                // Direct data format
                actualData = importData;
            }

            // Veri validasyonu
            if (!this.validateData(type, actualData)) {
                throw new Error(`Import edilen ${type} verisi geçersiz format içeriyor`);
            }

            // Mevcut veriyi backup'la
            const currentData = this.getFromLocal(type);
            if (currentData) {
                await this.saveToLocal(`${type}-backup`, currentData);
            }

            // Yeni veriyi kaydet
            await this.save(type, actualData);

            this.log(`✅ ${type} verileri başarıyla import edildi`, 'success');
            
            return actualData;

        } catch (error) {
            console.error(`❌ ${type} import hatası:`, error);
            this.log(`${type} import hatası: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * localStorage'dan veri getirir
     * @param {string} type - Veri tipi
     * @returns {Object|null} Veri veya null
     */
    getFromLocal(type) {
        try {
            if (!this.isValidType(type)) {
                console.warn(`Geçersiz veri tipi: ${type}`);
                return null;
            }

            const storageKey = this.getStorageKey(type);
            const stored = localStorage.getItem(storageKey);
            
            if (!stored) {
                return null;
            }

            const data = JSON.parse(stored);
            return data;

        } catch (error) {
            console.error(`localStorage okuma hatası (${type}):`, error);
            return null;
        }
    }

    /**
     * localStorage'a veri kaydeder
     * @param {string} type - Veri tipi
     * @param {Object} data - Kaydedilecek veri
     * @returns {Promise<boolean>} Başarı durumu
     */
    async saveToLocal(type, data) {
        try {
            const storageKey = this.getStorageKey(type);
            const jsonString = JSON.stringify(data);
            
            localStorage.setItem(storageKey, jsonString);
            
            return true;

        } catch (error) {
            console.error(`localStorage kaydetme hatası (${type}):`, error);
            return false;
        }
    }

    /**
     * localStorage'dan veriyi temizler
     * @param {string} type - Veri tipi
     */
    clearFromLocal(type) {
        try {
            const storageKey = this.getStorageKey(type);
            localStorage.removeItem(storageKey);
            console.log(`🗑️ ${type} localStorage'dan temizlendi`);
        } catch (error) {
            console.error(`localStorage temizleme hatası (${type}):`, error);
        }
    }

    /**
     * JSON dosyasına yazma (gelecekteki file system entegrasyonu için stub)
     * @param {string} type - Veri tipi
     * @param {Object} data - Yazılacak veri
     * @returns {Promise<boolean>} Başarı durumu
     */
    async writeToFile(type, data) {
        // Not: Bu metod şu anda bir stub'dır
        // Gerçek file system yazma işlemleri için gelecekteki entegrasyon
        
        try {
            console.log(`📝 [STUB] ${type}.json dosyasına yazılıyor:`, data);
            
            // Simulated file write delay
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Gerçek implementasyon için:
            // - Node.js fs modülü ile server-side yazma
            // - Electron fs API ile desktop app yazma
            // - Browser File System Access API ile modern browser yazma
            
            console.log(`✅ [STUB] ${type}.json dosyası güncellendi`);
            
            return true;

        } catch (error) {
            console.error(`❌ [STUB] ${type} dosya yazma hatası:`, error);
            return false;
        }
    }

    /**
     * Toast-style feedback gösterir
     * @param {string} message - Gösterilecek mesaj
     * @param {string} type - Mesaj tipi ('success', 'error', 'warning', 'info')
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        const logMessage = `[${timestamp}] DataSync: ${message}`;
        
        // Console'a yazdır
        switch (type) {
            case 'success':
                console.log(`✅ ${logMessage}`);
                break;
            case 'error':
                console.error(`❌ ${logMessage}`);
                break;
            case 'warning':
                console.warn(`⚠️ ${logMessage}`);
                break;
            default:
                console.log(`ℹ️ ${logMessage}`);
        }

        // Toast sistemi varsa kullan
        if (window.toast && typeof window.toast[type] === 'function') {
            window.toast[type](message);
        }
    }

    /**
     * Veri tipinin geçerli olup olmadığını kontrol eder
     * @param {string} type - Kontrol edilecek tip
     * @returns {boolean} Geçerli olup olmadığı
     */
    isValidType(type) {
        return this.supportedTypes.includes(type);
    }

    /**
     * Storage key'i oluşturur
     * @param {string} type - Veri tipi
     * @returns {string} Storage key
     */
    getStorageKey(type) {
        return `${this.storagePrefix}${type}`;
    }

    /**
     * Veri formatını validate eder
     * @param {string} type - Veri tipi
     * @param {Object} data - Validate edilecek veri
     * @returns {boolean} Geçerli olup olmadığı
     */
    validateData(type, data) {
        try {
            if (!data) return false;

            switch (type) {
                case 'projects':
                    return Array.isArray(data);
                    
                case 'skills':
                    return (
                        typeof data === 'object' &&
                        Array.isArray(data.categories) &&
                        typeof data.stats === 'object'
                    );
                    
                default:
                    return false;
            }
        } catch (error) {
            console.error(`Veri validasyon hatası (${type}):`, error);
            return false;
        }
    }

    /**
     * Mevcut desteklenen tipleri döndürür
     * @returns {Array} Desteklenen tipler
     */
    getSupportedTypes() {
        return [...this.supportedTypes];
    }

    /**
     * Manager durumunu döndürür
     * @returns {Object} Manager durumu
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            supportedTypes: this.supportedTypes,
            storagePrefix: this.storagePrefix,
            dataPath: this.dataPath,
            hasToastSystem: !!window.toast
        };
    }

    /**
     * Tüm localStorage verilerini döndürür
     * @returns {Object} Tüm veriler
     */
    getAllLocalData() {
        const allData = {};
        
        this.supportedTypes.forEach(type => {
            allData[type] = this.getFromLocal(type);
        });
        
        return allData;
    }

    /**
     * localStorage boyutunu hesaplar
     * @returns {Object} Boyut bilgisi
     */
    getStorageSize() {
        try {
            let totalSize = 0;
            const sizes = {};
            
            this.supportedTypes.forEach(type => {
                const key = this.getStorageKey(type);
                const data = localStorage.getItem(key);
                const size = data ? new Blob([data]).size : 0;
                sizes[type] = size;
                totalSize += size;
            });
            
            return {
                total: totalSize,
                formatted: this.formatBytes(totalSize),
                byType: sizes
            };
        } catch (error) {
            console.error('Storage boyutu hesaplanamadı:', error);
            return { total: 0, formatted: '0 B', byType: {} };
        }
    }

    /**
     * Byte'ları okunabilir formata çevirir
     * @param {number} bytes - Byte sayısı
     * @returns {string} Formatlanmış boyut
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Mevcut veri için backup oluşturur
     * @param {string} type - Veri tipi
     * @returns {Promise<boolean>} Başarı durumu
     */
    async createBackup(type) {
        try {
            if (!this.isValidType(type)) {
                return false;
            }

            // Mevcut veriyi al
            const currentData = this.getFromLocal(type);
            if (!currentData) {
                return false; // Veri yoksa backup gerek yok
            }

            // Timestamp ile backup key oluştur
            const timestamp = Date.now();
            const backupKey = `${type}.bak.${timestamp}`;
            
            // Backup oluştur
            const backupData = {
                data: currentData,
                timestamp: timestamp,
                date: new Date().toISOString(),
                type: type,
                version: '1.0.0'
            };

            // localStorage'a kaydet
            localStorage.setItem(this.storagePrefix + backupKey, JSON.stringify(backupData));

            // Eski backup'ları temizle (max 5 adet tut)
            this.cleanupOldBackups(type);

            console.log(`📦 ${type} için backup oluşturuldu: ${backupKey}`);
            return true;

        } catch (error) {
            console.error(`❌ ${type} backup oluşturma hatası:`, error);
            return false;
        }
    }

    /**
     * Belirtilen tip için backup listesini döndürür
     * @param {string} type - Veri tipi
     * @returns {Array} Backup listesi
     */
    getBackups(type) {
        try {
            if (!this.isValidType(type)) {
                return [];
            }

            const backups = [];
            const prefix = this.storagePrefix + `${type}.bak.`;

            // localStorage'da backup'ları ara
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    try {
                        const backupData = JSON.parse(localStorage.getItem(key));
                        backups.push({
                            key: key,
                            timestamp: backupData.timestamp,
                            date: backupData.date,
                            type: backupData.type,
                            size: JSON.stringify(backupData.data).length
                        });
                    } catch (error) {
                        console.warn(`Geçersiz backup verisi: ${key}`);
                    }
                }
            }

            // Timestamp'e göre sırala (en yeni önce)
            backups.sort((a, b) => b.timestamp - a.timestamp);

            return backups;

        } catch (error) {
            console.error(`❌ ${type} backup listesi alınırken hata:`, error);
            return [];
        }
    }

    /**
     * Belirtilen backup'ı restore eder
     * @param {string} type - Veri tipi
     * @param {number} timestamp - Backup timestamp'i
     * @returns {Promise<boolean>} Başarı durumu
     */
    async restoreBackup(type, timestamp) {
        try {
            if (!this.isValidType(type)) {
                throw new Error(`Geçersiz veri tipi: ${type}`);
            }

            const backupKey = this.storagePrefix + `${type}.bak.${timestamp}`;
            const backupString = localStorage.getItem(backupKey);

            if (!backupString) {
                throw new Error(`Backup bulunamadı: ${timestamp}`);
            }

            const backupData = JSON.parse(backupString);
            
            if (!backupData.data) {
                throw new Error('Backup verisi geçersiz');
            }

            // Mevcut veriyi backup'la (restore öncesi)
            await this.createBackup(type);

            // Backup'ı restore et
            await this.saveToLocal(type, backupData.data);

            this.log(`🔄 ${type} backup'ı restore edildi (${new Date(timestamp).toLocaleString('tr-TR')})`, 'warning');
            
            return true;

        } catch (error) {
            console.error(`❌ ${type} backup restore hatası:`, error);
            this.log(`Backup restore hatası: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Backup listesini export eder
     * @param {string} type - Veri tipi
     * @returns {string} JSON string
     */
    exportBackupList(type) {
        try {
            if (!this.isValidType(type)) {
                throw new Error(`Geçersiz veri tipi: ${type}`);
            }

            const backups = this.getBackups(type);
            const exportData = {
                type: type,
                backups: backups,
                totalBackups: backups.length,
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };

            return JSON.stringify(exportData, null, 2);

        } catch (error) {
            console.error(`❌ ${type} backup listesi export hatası:`, error);
            return null;
        }
    }

    /**
     * Eski backup'ları temizler (max 5 adet tutar)
     * @param {string} type - Veri tipi
     */
    cleanupOldBackups(type) {
        try {
            const backups = this.getBackups(type);
            const maxBackups = 5;

            if (backups.length > maxBackups) {
                // En eski backup'ları sil
                const toDelete = backups.slice(maxBackups);
                
                toDelete.forEach(backup => {
                    localStorage.removeItem(backup.key);
                    console.log(`🗑️ Eski backup silindi: ${backup.key}`);
                });

                console.log(`🧹 ${toDelete.length} eski backup temizlendi`);
            }

        } catch (error) {
            console.error(`❌ ${type} backup temizleme hatası:`, error);
        }
    }

    /**
     * Tüm backup'ları siler
     * @param {string} type - Veri tipi (opsiyonel, belirtilmezse tümü)
     */
    clearAllBackups(type = null) {
        try {
            let deletedCount = 0;
            
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storagePrefix)) {
                    if (key.includes('.bak.')) {
                        if (!type || key.includes(`${type}.bak.`)) {
                            localStorage.removeItem(key);
                            deletedCount++;
                        }
                    }
                }
            }

            const typeText = type ? ` (${type})` : '';
            console.log(`🧹 ${deletedCount} backup temizlendi${typeText}`);
            this.log(`${deletedCount} backup temizlendi${typeText}`, 'info');

        } catch (error) {
            console.error('❌ Backup temizleme hatası:', error);
        }
    }

    /**
     * Backup istatistiklerini döndürür
     * @param {string} type - Veri tipi
     * @returns {Object} İstatistikler
     */
    getBackupStats(type) {
        try {
            if (!this.isValidType(type)) {
                return null;
            }

            const backups = this.getBackups(type);
            
            if (backups.length === 0) {
                return {
                    total: 0,
                    size: 0,
                    oldest: null,
                    newest: null
                };
            }

            const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
            const oldest = backups[backups.length - 1];
            const newest = backups[0];

            return {
                total: backups.length,
                size: totalSize,
                formattedSize: this.formatBytes(totalSize),
                oldest: {
                    date: oldest.date,
                    timestamp: oldest.timestamp
                },
                newest: {
                    date: newest.date,
                    timestamp: newest.timestamp
                }
            };

        } catch (error) {
            console.error(`❌ ${type} backup istatistikleri alınırken hata:`, error);
            return null;
        }
    }
}

// Global instance oluştur
window.dataSyncManager = new DataSyncManager();

export default DataSyncManager; 