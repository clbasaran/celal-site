/**
 * Utility Functions Module
 * Comprehensive collection of utility functions for DOM manipulation,
 * string operations, date formatting, validation, and performance
 * 
 * @version 2.0.0
 * @author Celal Başaran
 * @license MIT
 */

class Utils {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.throttleTimers = new Map();
        this.observers = new Map();
        
        this.init();
    }

    init() {
        // Setup global error handling
        this.setupErrorHandling();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        console.log('Utils module initialized');
    }

    // ===== DOM UTILITIES =====
    
    /**
     * Enhanced querySelector with caching
     */
    $(selector, context = document, useCache = true) {
        const cacheKey = `${selector}:${context.nodeName || 'document'}`;
        
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const element = context.querySelector(selector);
        
        if (useCache && element) {
            this.cache.set(cacheKey, element);
        }
        
        return element;
    }

    /**
     * Enhanced querySelectorAll with caching
     */
    $$(selector, context = document, useCache = true) {
        const cacheKey = `all:${selector}:${context.nodeName || 'document'}`;
        
        if (useCache && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const elements = Array.from(context.querySelectorAll(selector));
        
        if (useCache && elements.length > 0) {
            this.cache.set(cacheKey, elements);
        }
        
        return elements;
    }

    /**
     * Create element with attributes and children
     */
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else if (key === 'style' && typeof value === 'object') {
                Object.assign(element.style, value);
            } else {
                element[key] = value;
            }
        });
        
        // Add children
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    }

    /**
     * Check if element is in viewport
     */
    isInViewport(element, threshold = 0) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top >= -threshold &&
            rect.left >= -threshold &&
            rect.bottom <= windowHeight + threshold &&
            rect.right <= windowWidth + threshold
        );
    }

    /**
     * Get element's position relative to document
     */
    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        return {
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft,
            right: rect.right + scrollLeft,
            bottom: rect.bottom + scrollTop,
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * Smooth scroll to element
     */
    scrollToElement(element, options = {}) {
        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
            offset: 0
        };
        
        const config = { ...defaultOptions, ...options };
        
        if (config.offset !== 0) {
            const elementPosition = this.getElementPosition(element);
            window.scrollTo({
                top: elementPosition.top - config.offset,
                behavior: config.behavior
            });
        } else {
            element.scrollIntoView({
                behavior: config.behavior,
                block: config.block,
                inline: config.inline
            });
        }
    }

    /**
     * Add multiple event listeners
     */
    addEventListeners(element, events, handler, options = {}) {
        const eventList = Array.isArray(events) ? events : [events];
        
        eventList.forEach(event => {
            element.addEventListener(event, handler, options);
        });
        
        // Return cleanup function
        return () => {
            eventList.forEach(event => {
                element.removeEventListener(event, handler, options);
            });
        };
    }

    /**
     * Delegate event handling
     */
    delegate(parent, selector, event, handler) {
        const delegatedHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && parent.contains(target)) {
                handler.call(target, e);
            }
        };
        
        parent.addEventListener(event, delegatedHandler);
        
        return () => parent.removeEventListener(event, delegatedHandler);
    }

    // ===== STRING UTILITIES =====
    
    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Convert to title case
     */
    titleCase(str) {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    /**
     * Convert to camelCase
     */
    camelCase(str) {
        return str.replace(/[-_\s]+(.)?/g, (_, char) => 
            char ? char.toUpperCase() : ''
        );
    }

    /**
     * Convert to kebab-case
     */
    kebabCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    }

    /**
     * Convert to snake_case
     */
    snakeCase(str) {
        return str
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[\s-]+/g, '_')
            .toLowerCase();
    }

    /**
     * Truncate string with ellipsis
     */
    truncate(str, length, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
    }

    /**
     * Generate random string
     */
    randomString(length = 10, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    }

    /**
     * Generate UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Escape HTML
     */
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Unescape HTML
     */
    unescapeHTML(str) {
        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent || div.innerText || '';
    }

    /**
     * Strip HTML tags
     */
    stripHTML(str) {
        const div = document.createElement('div');
        div.innerHTML = str;
        return div.textContent || div.innerText || '';
    }

    // ===== DATE UTILITIES =====
    
    /**
     * Format date with Turkish locale
     */
    formatDate(date, format = 'dd.MM.yyyy') {
        const d = new Date(date);
        const formats = {
            'dd': d.getDate().toString().padStart(2, '0'),
            'MM': (d.getMonth() + 1).toString().padStart(2, '0'),
            'yyyy': d.getFullYear().toString(),
            'yy': d.getFullYear().toString().slice(-2),
            'HH': d.getHours().toString().padStart(2, '0'),
            'mm': d.getMinutes().toString().padStart(2, '0'),
            'ss': d.getSeconds().toString().padStart(2, '0')
        };
        
        return format.replace(/dd|MM|yyyy|yy|HH|mm|ss/g, match => formats[match]);
    }

    /**
     * Get relative time (e.g., "2 hours ago")
     */
    getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);
        
        if (years > 0) return `${years} yıl önce`;
        if (months > 0) return `${months} ay önce`;
        if (days > 0) return `${days} gün önce`;
        if (hours > 0) return `${hours} saat önce`;
        if (minutes > 0) return `${minutes} dakika önce`;
        return 'Az önce';
    }

    /**
     * Check if date is today
     */
    isToday(date) {
        const today = new Date();
        const checkDate = new Date(date);
        
        return today.toDateString() === checkDate.toDateString();
    }

    /**
     * Check if date is this week
     */
    isThisWeek(date) {
        const now = new Date();
        const checkDate = new Date(date);
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        
        return checkDate >= startOfWeek && checkDate <= endOfWeek;
    }

    // ===== VALIDATION UTILITIES =====
    
    /**
     * Validate email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate URL
     */
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate phone number (Turkish format)
     */
    isValidPhone(phone) {
        const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Validate Turkish ID number
     */
    isValidTurkishID(id) {
        if (!/^\d{11}$/.test(id)) return false;
        
        const digits = id.split('').map(Number);
        const checksum = digits[10];
        
        // First 10 digits sum
        const sum = digits.slice(0, 10).reduce((acc, digit, index) => {
            return acc + digit * (index % 2 === 0 ? 1 : 3);
        }, 0);
        
        return (sum % 10) === checksum;
    }

    /**
     * Validate credit card number (Luhn algorithm)
     */
    isValidCreditCard(number) {
        const num = number.replace(/\s/g, '');
        if (!/^\d+$/.test(num)) return false;
        
        let sum = 0;
        let isEven = false;
        
        for (let i = num.length - 1; i >= 0; i--) {
            let digit = parseInt(num[i]);
            
            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            
            sum += digit;
            isEven = !isEven;
        }
        
        return sum % 10 === 0;
    }

    // ===== PERFORMANCE UTILITIES =====
    
    /**
     * Debounce function
     */
    debounce(func, delay, key = 'default') {
        return (...args) => {
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            const timer = setTimeout(() => {
                func.apply(this, args);
                this.debounceTimers.delete(key);
            }, delay);
            
            this.debounceTimers.set(key, timer);
        };
    }

    /**
     * Throttle function
     */
    throttle(func, delay, key = 'default') {
        return (...args) => {
            if (this.throttleTimers.has(key)) return;
            
            func.apply(this, args);
            
            const timer = setTimeout(() => {
                this.throttleTimers.delete(key);
            }, delay);
            
            this.throttleTimers.set(key, timer);
        };
    }

    /**
     * Measure function execution time
     */
    measureTime(func, label = 'Function') {
        return (...args) => {
            const start = performance.now();
            const result = func.apply(this, args);
            const end = performance.now();
            
            console.log(`${label} executed in ${(end - start).toFixed(2)}ms`);
            return result;
        };
    }

    /**
     * Memoize function results
     */
    memoize(func, keyGenerator = (...args) => JSON.stringify(args)) {
        const cache = new Map();
        
        return (...args) => {
            const key = keyGenerator(...args);
            
            if (cache.has(key)) {
                return cache.get(key);
            }
            
            const result = func.apply(this, args);
            cache.set(key, result);
            
            return result;
        };
    }

    /**
     * Lazy load function
     */
    lazy(func) {
        let result;
        let hasRun = false;
        
        return (...args) => {
            if (!hasRun) {
                result = func.apply(this, args);
                hasRun = true;
            }
            return result;
        };
    }

    // ===== ARRAY UTILITIES =====
    
    /**
     * Chunk array into smaller arrays
     */
    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Remove duplicates from array
     */
    unique(array, key = null) {
        if (key) {
            const seen = new Set();
            return array.filter(item => {
                const value = typeof key === 'function' ? key(item) : item[key];
                if (seen.has(value)) return false;
                seen.add(value);
                return true;
            });
        }
        return [...new Set(array)];
    }

    /**
     * Shuffle array
     */
    shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Group array by key
     */
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const value = typeof key === 'function' ? key(item) : item[key];
            (groups[value] = groups[value] || []).push(item);
            return groups;
        }, {});
    }

    /**
     * Sort array by multiple keys
     */
    sortBy(array, ...keys) {
        return array.sort((a, b) => {
            for (const key of keys) {
                const aVal = typeof key === 'function' ? key(a) : a[key];
                const bVal = typeof key === 'function' ? key(b) : b[key];
                
                if (aVal < bVal) return -1;
                if (aVal > bVal) return 1;
            }
            return 0;
        });
    }

    // ===== OBJECT UTILITIES =====
    
    /**
     * Deep clone object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = this.deepClone(obj[key]);
            });
            return cloned;
        }
    }

    /**
     * Deep merge objects
     */
    deepMerge(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
        
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        
        return this.deepMerge(target, ...sources);
    }

    /**
     * Check if value is object
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * Get nested object property
     */
    get(obj, path, defaultValue = undefined) {
        const keys = path.split('.');
        let result = obj;
        
        for (const key of keys) {
            if (result == null || typeof result !== 'object') {
                return defaultValue;
            }
            result = result[key];
        }
        
        return result !== undefined ? result : defaultValue;
    }

    /**
     * Set nested object property
     */
    set(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let current = obj;
        
        for (const key of keys) {
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[lastKey] = value;
        return obj;
    }

    // ===== NUMBER UTILITIES =====
    
    /**
     * Format number with Turkish locale
     */
    formatNumber(number, options = {}) {
        const defaultOptions = {
            locale: 'tr-TR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        };
        
        return new Intl.NumberFormat(options.locale || defaultOptions.locale, {
            ...defaultOptions,
            ...options
        }).format(number);
    }

    /**
     * Format currency
     */
    formatCurrency(amount, currency = 'TRY') {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    /**
     * Generate random number between min and max
     */
    randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Clamp number between min and max
     */
    clamp(number, min, max) {
        return Math.min(Math.max(number, min), max);
    }

    /**
     * Round to specific decimal places
     */
    round(number, decimals = 0) {
        const factor = Math.pow(10, decimals);
        return Math.round(number * factor) / factor;
    }

    // ===== STORAGE UTILITIES =====
    
    /**
     * Enhanced localStorage with JSON support
     */
    storage = {
        set: (key, value, expiry = null) => {
            const item = {
                value: value,
                expiry: expiry ? Date.now() + expiry : null
            };
            localStorage.setItem(key, JSON.stringify(item));
        },
        
        get: (key, defaultValue = null) => {
            try {
                const item = JSON.parse(localStorage.getItem(key));
                if (!item) return defaultValue;
                
                if (item.expiry && Date.now() > item.expiry) {
                    localStorage.removeItem(key);
                    return defaultValue;
                }
                
                return item.value;
            } catch {
                return defaultValue;
            }
        },
        
        remove: (key) => {
            localStorage.removeItem(key);
        },
        
        clear: () => {
            localStorage.clear();
        },
        
        keys: () => {
            return Object.keys(localStorage);
        }
    };

    // ===== URL UTILITIES =====
    
    /**
     * Get URL parameters
     */
    getURLParams(url = window.location.href) {
        const params = new URLSearchParams(new URL(url).search);
        const result = {};
        
        for (const [key, value] of params) {
            result[key] = value;
        }
        
        return result;
    }

    /**
     * Update URL parameters
     */
    updateURLParams(params, replace = false) {
        const url = new URL(window.location.href);
        
        Object.entries(params).forEach(([key, value]) => {
            if (value === null || value === undefined) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, value);
            }
        });
        
        const method = replace ? 'replaceState' : 'pushState';
        history[method]({}, '', url.toString());
    }

    // ===== ERROR HANDLING =====
    
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.logError(event.error, 'Global Error');
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.logError(event.reason, 'Unhandled Promise Rejection');
        });
    }

    logError(error, context = 'Unknown') {
        const errorInfo = {
            message: error.message || error,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Store error in localStorage for debugging
        const errors = this.storage.get('app_errors', []);
        errors.push(errorInfo);
        
        // Keep only last 50 errors
        if (errors.length > 50) {
            errors.splice(0, errors.length - 50);
        }
        
        this.storage.set('app_errors', errors);
    }

    // ===== PERFORMANCE MONITORING =====
    
    setupPerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    console.log('Page Load Performance:', {
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
                        totalTime: perfData.loadEventEnd - perfData.fetchStart
                    });
                }
            }, 0);
        });
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
            navigation: navigation ? {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                totalTime: navigation.loadEventEnd - navigation.fetchStart
            } : null,
            paint: paint.reduce((acc, entry) => {
                acc[entry.name] = entry.startTime;
                return acc;
            }, {}),
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };
    }

    // ===== CLEANUP =====
    
    clearCache() {
        this.cache.clear();
    }

    clearTimers() {
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.throttleTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        this.throttleTimers.clear();
    }

    destroy() {
        this.clearCache();
        this.clearTimers();
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// Create global instance
const utils = new Utils();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

// Global access
window.utils = utils;
window.Utils = Utils; 