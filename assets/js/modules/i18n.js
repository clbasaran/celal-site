/**
 * Portfolio OS - Internationalization Module
 * Apple Design Language V5
 * Advanced i18n system with dynamic loading and formatting
 */

class I18n {
    constructor(options = {}) {
        this.options = {
            defaultLocale: 'tr',
            fallbackLocale: 'en',
            loadPath: '/assets/locales/{locale}.json',
            interpolation: {
                prefix: '{{',
                suffix: '}}'
            },
            pluralRules: true,
            numberFormat: true,
            dateFormat: true,
            autoDetect: true,
            storage: true,
            debug: false,
            ...options
        };
        
        this.currentLocale = this.options.defaultLocale;
        this.translations = new Map();
        this.formatters = new Map();
        this.listeners = new Map();
        this.loadedLocales = new Set();
        
        // Initialize formatters
        this.initializeFormatters();
        
        this.init();
    }
    
    init() {
        try {
            // Auto-detect locale if enabled
            if (this.options.autoDetect) {
                this.currentLocale = this.detectLocale();
            }
            
            // Load locale from storage if enabled
            if (this.options.storage) {
                const storedLocale = this.getStoredLocale();
                if (storedLocale) {
                    this.currentLocale = storedLocale;
                }
            }
            
            // Load initial locale
            this.loadLocale(this.currentLocale);
            
            // Setup DOM observer for dynamic content
            this.setupDOMObserver();
            
            if (this.options.debug) {
                console.log('🌍 I18n initialized:', {
                    currentLocale: this.currentLocale,
                    defaultLocale: this.options.defaultLocale,
                    fallbackLocale: this.options.fallbackLocale
                });
            }
            
        } catch (error) {
            console.error('❌ I18n initialization failed:', error);
        }
    }
    
    detectLocale() {
        // Priority: URL param > localStorage > navigator > default
        const urlParams = new URLSearchParams(window.location.search);
        const urlLocale = urlParams.get('lang') || urlParams.get('locale');
        
        if (urlLocale && this.isValidLocale(urlLocale)) {
            return urlLocale;
        }
        
        // Check localStorage
        const storedLocale = this.getStoredLocale();
        if (storedLocale && this.isValidLocale(storedLocale)) {
            return storedLocale;
        }
        
        // Check navigator languages
        const navigatorLocales = [
            navigator.language,
            ...(navigator.languages || [])
        ].map(locale => locale.split('-')[0]);
        
        for (const locale of navigatorLocales) {
            if (this.isValidLocale(locale)) {
                return locale;
            }
        }
        
        return this.options.defaultLocale;
    }
    
    isValidLocale(locale) {
        // Basic locale validation
        return /^[a-z]{2}(-[A-Z]{2})?$/.test(locale);
    }
    
    getStoredLocale() {
        if (typeof localStorage !== 'undefined') {
            return localStorage.getItem('portfolio_os_locale');
        }
        return null;
    }
    
    setStoredLocale(locale) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('portfolio_os_locale', locale);
        }
    }
    
    async loadLocale(locale) {
        if (this.loadedLocales.has(locale)) {
            return this.translations.get(locale);
        }
        
        try {
            const url = this.options.loadPath.replace('{locale}', locale);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to load locale ${locale}: ${response.status}`);
            }
            
            const translations = await response.json();
            this.translations.set(locale, translations);
            this.loadedLocales.add(locale);
            
            this.emit('localeLoaded', { locale, translations });
            
            if (this.options.debug) {
                console.log(`🌍 Locale loaded: ${locale}`, translations);
            }
            
            return translations;
            
        } catch (error) {
            console.error(`Failed to load locale ${locale}:`, error);
            
            // Try to load fallback locale
            if (locale !== this.options.fallbackLocale) {
                return this.loadLocale(this.options.fallbackLocale);
            }
            
            return {};
        }
    }
    
    // Core translation methods
    t(key, options = {}) {
        const {
            locale = this.currentLocale,
            count,
            context,
            defaultValue = key,
            interpolation = {}
        } = options;
        
        let translation = this.getTranslation(key, locale);
        
        // Handle pluralization
        if (typeof count === 'number' && translation && typeof translation === 'object') {
            translation = this.getPluralForm(translation, count, locale);
        }
        
        // Handle context
        if (context && translation && typeof translation === 'object') {
            translation = translation[context] || translation.default || defaultValue;
        }
        
        // Fallback to default value
        if (!translation) {
            translation = defaultValue;
        }
        
        // Handle interpolation
        if (typeof translation === 'string') {
            translation = this.interpolate(translation, interpolation);
        }
        
        return translation;
    }
    
    getTranslation(key, locale) {
        const translations = this.translations.get(locale);
        if (!translations) {
            return null;
        }
        
        // Support nested keys (e.g., 'user.profile.name')
        const keys = key.split('.');
        let value = translations;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return value;
    }
    
    getPluralForm(translation, count, locale) {
        // Simple pluralization rules
        const rules = this.getPluralRules(locale);
        const form = rules(count);
        
        if (translation[form] !== undefined) {
            return translation[form];
        }
        
        // Fallback order: other > one > zero
        return translation.other || translation.one || translation.zero || translation;
    }
    
    getPluralRules(locale) {
        // Simplified plural rules
        const rules = {
            'en': (n) => n === 1 ? 'one' : 'other',
            'tr': (n) => 'other', // Turkish doesn't have plural forms like English
            'de': (n) => n === 1 ? 'one' : 'other',
            'fr': (n) => n === 0 || n === 1 ? 'one' : 'other',
            'es': (n) => n === 1 ? 'one' : 'other'
        };
        
        const baseLocale = locale.split('-')[0];
        return rules[baseLocale] || rules['en'];
    }
    
    interpolate(text, data) {
        const { prefix, suffix } = this.options.interpolation;
        
        return text.replace(
            new RegExp(`${this.escapeRegex(prefix)}([^${suffix}]+)${this.escapeRegex(suffix)}`, 'g'),
            (match, key) => {
                const value = this.getNestedValue(data, key.trim());
                return value !== undefined ? value : match;
            }
        );
    }
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }
    
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Locale management
    async setLocale(locale) {
        if (locale === this.currentLocale) {
            return;
        }
        
        const oldLocale = this.currentLocale;
        
        try {
            // Load new locale if not already loaded
            if (!this.loadedLocales.has(locale)) {
                await this.loadLocale(locale);
            }
            
            this.currentLocale = locale;
            
            // Store locale preference
            if (this.options.storage) {
                this.setStoredLocale(locale);
            }
            
            // Update formatters
            this.updateFormatters();
            
            // Update DOM
            this.updateDOM();
            
            // Update document language
            document.documentElement.lang = locale;
            
            this.emit('localeChanged', {
                oldLocale,
                newLocale: locale
            });
            
            if (this.options.debug) {
                console.log(`🌍 Locale changed: ${oldLocale} → ${locale}`);
            }
            
        } catch (error) {
            console.error(`Failed to set locale to ${locale}:`, error);
            this.currentLocale = oldLocale;
        }
    }
    
    getLocale() {
        return this.currentLocale;
    }
    
    getAvailableLocales() {
        return Array.from(this.loadedLocales);
    }
    
    // Formatting methods
    initializeFormatters() {
        if (typeof Intl !== 'undefined') {
            this.updateFormatters();
        }
    }
    
    updateFormatters() {
        if (typeof Intl === 'undefined') return;
        
        try {
            // Number formatter
            this.formatters.set('number', new Intl.NumberFormat(this.currentLocale));
            
            // Currency formatter
            this.formatters.set('currency', new Intl.NumberFormat(this.currentLocale, {
                style: 'currency',
                currency: this.getCurrency()
            }));
            
            // Date formatter
            this.formatters.set('date', new Intl.DateTimeFormat(this.currentLocale));
            
            // Time formatter
            this.formatters.set('time', new Intl.DateTimeFormat(this.currentLocale, {
                hour: '2-digit',
                minute: '2-digit'
            }));
            
            // Relative time formatter
            if (Intl.RelativeTimeFormat) {
                this.formatters.set('relative', new Intl.RelativeTimeFormat(this.currentLocale));
            }
            
        } catch (error) {
            console.warn('Failed to initialize formatters:', error);
        }
    }
    
    getCurrency() {
        const currencyMap = {
            'tr': 'TRY',
            'en': 'USD',
            'de': 'EUR',
            'fr': 'EUR',
            'es': 'EUR'
        };
        
        const baseLocale = this.currentLocale.split('-')[0];
        return currencyMap[baseLocale] || 'USD';
    }
    
    formatNumber(number, options = {}) {
        const formatter = this.formatters.get('number');
        if (formatter) {
            return formatter.format(number);
        }
        return number.toString();
    }
    
    formatCurrency(amount, currency = null) {
        if (currency) {
            try {
                const formatter = new Intl.NumberFormat(this.currentLocale, {
                    style: 'currency',
                    currency
                });
                return formatter.format(amount);
            } catch (error) {
                console.warn('Currency formatting failed:', error);
            }
        }
        
        const formatter = this.formatters.get('currency');
        if (formatter) {
            return formatter.format(amount);
        }
        return amount.toString();
    }
    
    formatDate(date, options = {}) {
        const formatter = this.formatters.get('date');
        if (formatter) {
            return formatter.format(date);
        }
        return date.toString();
    }
    
    formatTime(date) {
        const formatter = this.formatters.get('time');
        if (formatter) {
            return formatter.format(date);
        }
        return date.toString();
    }
    
    formatRelativeTime(value, unit) {
        const formatter = this.formatters.get('relative');
        if (formatter) {
            return formatter.format(value, unit);
        }
        return `${value} ${unit}`;
    }
    
    // DOM integration
    setupDOMObserver() {
        // Translate existing elements
        this.updateDOM();
        
        // Watch for new elements
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.translateElement(node);
                            this.translateChildren(node);
                        }
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }
    
    updateDOM() {
        // Translate all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            this.translateElement(element);
        });
    }
    
    translateElement(element) {
        const key = element.dataset.i18n;
        if (!key) return;
        
        const options = this.parseDataAttributes(element);
        const translation = this.t(key, options);
        
        // Determine how to apply the translation
        const target = element.dataset.i18nTarget || 'text';
        
        switch (target) {
            case 'html':
                element.innerHTML = translation;
                break;
            case 'placeholder':
                element.placeholder = translation;
                break;
            case 'title':
                element.title = translation;
                break;
            case 'alt':
                element.alt = translation;
                break;
            default:
                element.textContent = translation;
        }
    }
    
    translateChildren(parent) {
        parent.querySelectorAll('[data-i18n]').forEach(element => {
            this.translateElement(element);
        });
    }
    
    parseDataAttributes(element) {
        const options = {};
        
        // Parse count
        if (element.dataset.i18nCount) {
            options.count = parseInt(element.dataset.i18nCount);
        }
        
        // Parse context
        if (element.dataset.i18nContext) {
            options.context = element.dataset.i18nContext;
        }
        
        // Parse interpolation data
        if (element.dataset.i18nData) {
            try {
                options.interpolation = JSON.parse(element.dataset.i18nData);
            } catch (error) {
                console.warn('Failed to parse i18n data:', error);
            }
        }
        
        return options;
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
                    console.error(`Error in i18n callback for ${event}:`, error);
                }
            });
        }
    }
    
    // Utility methods
    addTranslations(locale, translations) {
        const existing = this.translations.get(locale) || {};
        this.translations.set(locale, { ...existing, ...translations });
        this.loadedLocales.add(locale);
    }
    
    getTranslations(locale = this.currentLocale) {
        return this.translations.get(locale) || {};
    }
    
    hasTranslation(key, locale = this.currentLocale) {
        return this.getTranslation(key, locale) !== null;
    }
    
    removeTranslations(locale) {
        this.translations.delete(locale);
        this.loadedLocales.delete(locale);
    }
    
    // Static helper methods
    static detectBrowserLocale() {
        if (typeof navigator !== 'undefined') {
            return navigator.language || navigator.userLanguage || 'en';
        }
        return 'en';
    }
    
    static getSupportedLocales() {
        return ['tr', 'en', 'de', 'fr', 'es'];
    }
}

// Auto-initialization
function initializeI18n() {
    if (typeof window !== 'undefined') {
        window.I18n = I18n;
        window.i18n = new I18n();
        
        // Global translation function
        window.t = (key, options) => window.i18n.t(key, options);
        
        // Add locale switcher functionality
        document.addEventListener('click', (e) => {
            const localeSwitch = e.target.closest('[data-locale-switch]');
            if (localeSwitch) {
                const locale = localeSwitch.dataset.localeSwitch;
                window.i18n.setLocale(locale);
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeI18n);
} else {
    initializeI18n();
}

export default I18n; 