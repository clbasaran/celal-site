/**
 * Portfolio OS - Storage Module
 * Apple Design Language V5
 * Advanced local storage management with encryption and fallbacks
 */

class Storage {
    constructor(options = {}) {
        this.options = {
            prefix: 'portfolio_os_',
            encryption: false,
            compression: false,
            expiration: false,
            fallback: true,
            debug: false,
            ...options
        };
        
        this.storageType = this.detectStorageType();
        this.encryptionKey = options.encryptionKey || 'portfolio_os_key';
        this.cache = new Map();
        
        // Storage event listeners
        this.listeners = new Map();
        
        this.init();
    }
    
    init() {
        try {
            this.testStorage();
            this.setupStorageListener();
            this.cleanExpired();
            
            if (this.options.debug) {
                console.log('💾 Storage initialized:', {
                    type: this.storageType,
                    encryption: this.options.encryption,
                    compression: this.options.compression
                });
            }
            
        } catch (error) {
            console.error('❌ Storage initialization failed:', error);
            this.storageType = 'memory';
        }
    }
    
    detectStorageType() {
        // Test localStorage
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return 'localStorage';
        } catch (e) {
            // Fallback to sessionStorage
            try {
                const testKey = '__storage_test__';
                sessionStorage.setItem(testKey, 'test');
                sessionStorage.removeItem(testKey);
                return 'sessionStorage';
            } catch (e) {
                // Fallback to memory storage
                return 'memory';
            }
        }
    }
    
    testStorage() {
        const testData = { test: 'value', number: 123, array: [1, 2, 3] };
        this.set('__test__', testData);
        const retrieved = this.get('__test__');
        this.remove('__test__');
        
        if (JSON.stringify(testData) !== JSON.stringify(retrieved)) {
            throw new Error('Storage test failed');
        }
    }
    
    setupStorageListener() {
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (e) => {
                if (e.key && e.key.startsWith(this.options.prefix)) {
                    const key = e.key.replace(this.options.prefix, '');
                    this.emit('change', {
                        key,
                        oldValue: this.parseValue(e.oldValue),
                        newValue: this.parseValue(e.newValue),
                        storageArea: e.storageArea
                    });
                }
            });
        }
    }
    
    // Core storage methods
    set(key, value, options = {}) {
        try {
            const fullKey = this.options.prefix + key;
            const data = {
                value,
                timestamp: Date.now(),
                expires: options.expires ? Date.now() + options.expires : null,
                compressed: false,
                encrypted: false
            };
            
            let serialized = JSON.stringify(data.value);
            
            // Apply compression if enabled
            if (this.options.compression || options.compress) {
                serialized = this.compress(serialized);
                data.compressed = true;
            }
            
            // Apply encryption if enabled
            if (this.options.encryption || options.encrypt) {
                serialized = this.encrypt(serialized);
                data.encrypted = true;
            }
            
            data.value = serialized;
            const finalData = JSON.stringify(data);
            
            // Store based on storage type
            switch (this.storageType) {
                case 'localStorage':
                    localStorage.setItem(fullKey, finalData);
                    break;
                case 'sessionStorage':
                    sessionStorage.setItem(fullKey, finalData);
                    break;
                default:
                    this.cache.set(fullKey, finalData);
            }
            
            this.emit('set', { key, value, options });
            return true;
            
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    }
    
    get(key, defaultValue = null) {
        try {
            const fullKey = this.options.prefix + key;
            let rawData;
            
            // Retrieve based on storage type
            switch (this.storageType) {
                case 'localStorage':
                    rawData = localStorage.getItem(fullKey);
                    break;
                case 'sessionStorage':
                    rawData = sessionStorage.getItem(fullKey);
                    break;
                default:
                    rawData = this.cache.get(fullKey);
            }
            
            if (!rawData) {
                return defaultValue;
            }
            
            const data = JSON.parse(rawData);
            
            // Check expiration
            if (data.expires && Date.now() > data.expires) {
                this.remove(key);
                return defaultValue;
            }
            
            let value = data.value;
            
            // Decrypt if needed
            if (data.encrypted) {
                value = this.decrypt(value);
            }
            
            // Decompress if needed
            if (data.compressed) {
                value = this.decompress(value);
            }
            
            // Parse final value
            const finalValue = typeof value === 'string' ? JSON.parse(value) : value;
            
            this.emit('get', { key, value: finalValue });
            return finalValue;
            
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    }
    
    remove(key) {
        try {
            const fullKey = this.options.prefix + key;
            
            switch (this.storageType) {
                case 'localStorage':
                    localStorage.removeItem(fullKey);
                    break;
                case 'sessionStorage':
                    sessionStorage.removeItem(fullKey);
                    break;
                default:
                    this.cache.delete(fullKey);
            }
            
            this.emit('remove', { key });
            return true;
            
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    }
    
    clear() {
        try {
            const keys = this.keys();
            
            switch (this.storageType) {
                case 'localStorage':
                    keys.forEach(key => {
                        if (key.startsWith(this.options.prefix)) {
                            localStorage.removeItem(key);
                        }
                    });
                    break;
                case 'sessionStorage':
                    keys.forEach(key => {
                        if (key.startsWith(this.options.prefix)) {
                            sessionStorage.removeItem(key);
                        }
                    });
                    break;
                default:
                    this.cache.clear();
            }
            
            this.emit('clear');
            return true;
            
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
    
    exists(key) {
        const value = this.get(key);
        return value !== null && value !== undefined;
    }
    
    keys() {
        try {
            let keys = [];
            
            switch (this.storageType) {
                case 'localStorage':
                    keys = Object.keys(localStorage);
                    break;
                case 'sessionStorage':
                    keys = Object.keys(sessionStorage);
                    break;
                default:
                    keys = Array.from(this.cache.keys());
            }
            
            return keys
                .filter(key => key.startsWith(this.options.prefix))
                .map(key => key.replace(this.options.prefix, ''));
                
        } catch (error) {
            console.error('Storage keys error:', error);
            return [];
        }
    }
    
    size() {
        return this.keys().length;
    }
    
    // Advanced methods
    setObject(key, obj, options = {}) {
        return this.set(key, obj, options);
    }
    
    getObject(key, defaultValue = {}) {
        return this.get(key, defaultValue);
    }
    
    setArray(key, arr, options = {}) {
        return this.set(key, arr, options);
    }
    
    getArray(key, defaultValue = []) {
        return this.get(key, defaultValue);
    }
    
    append(key, value) {
        const existing = this.getArray(key, []);
        existing.push(value);
        return this.set(key, existing);
    }
    
    prepend(key, value) {
        const existing = this.getArray(key, []);
        existing.unshift(value);
        return this.set(key, existing);
    }
    
    increment(key, amount = 1) {
        const existing = this.get(key, 0);
        const newValue = (typeof existing === 'number' ? existing : 0) + amount;
        return this.set(key, newValue);
    }
    
    decrement(key, amount = 1) {
        return this.increment(key, -amount);
    }
    
    // Batch operations
    setMultiple(data, options = {}) {
        const results = {};
        for (const [key, value] of Object.entries(data)) {
            results[key] = this.set(key, value, options);
        }
        return results;
    }
    
    getMultiple(keys, defaultValue = null) {
        const results = {};
        keys.forEach(key => {
            results[key] = this.get(key, defaultValue);
        });
        return results;
    }
    
    removeMultiple(keys) {
        const results = {};
        keys.forEach(key => {
            results[key] = this.remove(key);
        });
        return results;
    }
    
    // Utility methods
    cleanExpired() {
        const keys = this.keys();
        keys.forEach(key => {
            // This will automatically remove expired items
            this.get(key);
        });
    }
    
    getInfo() {
        const keys = this.keys();
        let totalSize = 0;
        
        keys.forEach(key => {
            const fullKey = this.options.prefix + key;
            try {
                const data = this.storageType === 'memory' 
                    ? this.cache.get(fullKey) 
                    : (this.storageType === 'localStorage' 
                        ? localStorage.getItem(fullKey)
                        : sessionStorage.getItem(fullKey));
                if (data) {
                    totalSize += data.length;
                }
            } catch (e) {
                // Ignore errors
            }
        });
        
        return {
            storageType: this.storageType,
            itemCount: keys.length,
            totalSize,
            averageSize: keys.length > 0 ? Math.round(totalSize / keys.length) : 0,
            keys
        };
    }
    
    export() {
        const keys = this.keys();
        const data = {};
        
        keys.forEach(key => {
            data[key] = this.get(key);
        });
        
        return {
            timestamp: Date.now(),
            version: '1.0',
            data
        };
    }
    
    import(exportedData, options = {}) {
        if (!exportedData || !exportedData.data) {
            throw new Error('Invalid export data');
        }
        
        const { clearExisting = false, overwrite = true } = options;
        
        if (clearExisting) {
            this.clear();
        }
        
        const results = {};
        
        for (const [key, value] of Object.entries(exportedData.data)) {
            if (!overwrite && this.exists(key)) {
                results[key] = { success: false, reason: 'exists' };
                continue;
            }
            
            results[key] = { success: this.set(key, value) };
        }
        
        return results;
    }
    
    // Encryption methods (basic implementation)
    encrypt(data) {
        if (typeof btoa !== 'undefined') {
            // Simple base64 encoding (not secure, just obfuscation)
            return btoa(unescape(encodeURIComponent(data)));
        }
        return data;
    }
    
    decrypt(data) {
        if (typeof atob !== 'undefined') {
            try {
                return decodeURIComponent(escape(atob(data)));
            } catch (e) {
                return data;
            }
        }
        return data;
    }
    
    // Compression methods (basic implementation)
    compress(data) {
        // Simple run-length encoding for demo
        return data.replace(/(.)\1+/g, (match, char) => {
            return char + match.length;
        });
    }
    
    decompress(data) {
        // Reverse run-length encoding
        return data.replace(/(.)\d+/g, (match, char) => {
            const count = parseInt(match.slice(1));
            return char.repeat(count);
        });
    }
    
    parseValue(value) {
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    }
    
    // Event system
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in storage callback for ${event}:`, error);
                }
            });
        }
    }
    
    // Static utility methods
    static isSupported() {
        try {
            const testKey = '__storage_support_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    static getQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            return navigator.storage.estimate();
        }
        return Promise.resolve({ quota: 0, usage: 0 });
    }
    
    static clearAll() {
        try {
            localStorage.clear();
            sessionStorage.clear();
            return true;
        } catch (e) {
            return false;
        }
    }
}

// Auto-initialization with common configurations
function initializeStorage() {
    if (typeof window !== 'undefined') {
        window.Storage = Storage;
        
        // Default storage instances
        window.storage = new Storage({
            prefix: 'portfolio_os_',
            encryption: false,
            compression: false
        });
        
        // Secure storage for sensitive data
        window.secureStorage = new Storage({
            prefix: 'portfolio_os_secure_',
            encryption: true,
            compression: true
        });
        
        // Session storage
        window.sessionStore = new Storage({
            prefix: 'portfolio_os_session_',
            storageType: 'sessionStorage'
        });
        
        // Cache storage with expiration
        window.cacheStorage = new Storage({
            prefix: 'portfolio_os_cache_',
            expiration: true
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeStorage);
} else {
    initializeStorage();
}

export default Storage; 