/**
 * Portfolio OS - Config Loader Module
 * Apple Design Language V5
 * Dynamic configuration loading and management system with caching and fallbacks
 */

class ConfigLoader {
  constructor(options = {}) {
    this.options = {
      baseUrl: options.baseUrl || '/api/config',
      endpoints: {
        main: '/config.json',
        features: '/features.json',
        theme: '/theme.json',
        performance: '/performance.json',
        analytics: '/analytics.json',
        ...options.endpoints
      },
      cacheStrategy: 'aggressive', // 'aggressive', 'normal', 'minimal', 'none'
      cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
      retryAttempts: 3,
      retryDelay: 1000,
      enableFallback: true,
      enableVersioning: true,
      enableValidation: true,
      debugMode: false,
      ...options
    };

    this.configCache = new Map();
    this.loadedConfigs = new Map();
    this.configVersions = new Map();
    this.fallbackConfigs = new Map();
    this.loadingPromises = new Map();
    this.eventListeners = new Map();
    this.isInitialized = false;
    this.configSchema = new Map();
    
    this.init();
  }

  /**
   * Initialize config loader
   */
  async init() {
    try {
      await this.loadCachedConfigs();
      this.setupDefaultFallbacks();
      this.setupConfigSchema();
      this.setupEventListeners();
      
      this.isInitialized = true;
      this.log('Config Loader initialized successfully');
      
      // Load initial configs
      await this.loadEssentialConfigs();
      
    } catch (error) {
      this.log('Failed to initialize Config Loader:', error);
      this.fallbackToDefaults();
    }
  }

  /**
   * Load cached configurations from storage
   */
  async loadCachedConfigs() {
    try {
      const cachedData = localStorage.getItem('portfolio-config-cache');
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        
        // Check cache validity
        for (const [key, config] of Object.entries(cache)) {
          if (this.isCacheValid(config)) {
            this.configCache.set(key, config);
            this.loadedConfigs.set(key, config.data);
            this.configVersions.set(key, config.version);
          }
        }
      }
    } catch (error) {
      this.log('Failed to load cached configs:', error);
    }
  }

  /**
   * Check if cached config is still valid
   */
  isCacheValid(config) {
    if (!config.timestamp) return false;
    
    const now = Date.now();
    const age = now - config.timestamp;
    
    switch (this.options.cacheStrategy) {
      case 'aggressive':
        return age < this.options.cacheDuration * 2;
      case 'normal':
        return age < this.options.cacheDuration;
      case 'minimal':
        return age < this.options.cacheDuration / 2;
      case 'none':
        return false;
      default:
        return age < this.options.cacheDuration;
    }
  }

  /**
   * Setup default fallback configurations
   */
  setupDefaultFallbacks() {
    this.fallbackConfigs.set('main', {
      version: '1.0.0',
      name: 'Portfolio OS',
      description: 'Modern portfolio platform',
      author: 'Portfolio Developer',
      features: {
        darkMode: true,
        animations: true,
        analytics: false,
        ai: false
      },
      performance: {
        enableLazyLoading: true,
        enableServiceWorker: false,
        enableCompression: true
      }
    });

    this.fallbackConfigs.set('features', {
      ai: {
        enabled: false,
        provider: 'local',
        apiKey: null
      },
      analytics: {
        enabled: false,
        provider: 'none',
        trackingId: null
      },
      darkMode: {
        enabled: true,
        auto: true,
        default: 'system'
      },
      animations: {
        enabled: true,
        reducedMotion: true,
        duration: 'normal'
      }
    });

    this.fallbackConfigs.set('theme', {
      primaryColor: '#007AFF',
      secondaryColor: '#34C759',
      accentColor: '#FF9500',
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      borderRadius: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px'
      }
    });

    this.fallbackConfigs.set('performance', {
      lazy: {
        images: true,
        videos: true,
        iframes: true,
        threshold: 0.1
      },
      prefetch: {
        pages: true,
        images: false,
        videos: false
      },
      compression: {
        enabled: true,
        level: 6,
        types: ['text', 'javascript', 'css']
      },
      caching: {
        enabled: true,
        duration: 86400,
        strategy: 'cache-first'
      }
    });

    this.fallbackConfigs.set('analytics', {
      enabled: false,
      provider: 'none',
      settings: {
        trackPageViews: true,
        trackEvents: true,
        trackTiming: true,
        anonymizeIp: true,
        respectDnt: true
      }
    });
  }

  /**
   * Setup configuration schema for validation
   */
  setupConfigSchema() {
    this.configSchema.set('main', {
      version: { type: 'string', required: true },
      name: { type: 'string', required: true },
      description: { type: 'string', required: false },
      author: { type: 'string', required: false },
      features: { type: 'object', required: true }
    });

    this.configSchema.set('features', {
      ai: { type: 'object', required: false },
      analytics: { type: 'object', required: false },
      darkMode: { type: 'object', required: false },
      animations: { type: 'object', required: false }
    });

    this.configSchema.set('theme', {
      primaryColor: { type: 'string', required: true },
      secondaryColor: { type: 'string', required: false },
      backgroundColor: { type: 'string', required: true },
      textColor: { type: 'string', required: true }
    });
  }

  /**
   * Setup event listeners for config changes
   */
  setupEventListeners() {
    // Network status changes
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));

    // Storage changes (for multi-tab sync)
    window.addEventListener('storage', (e) => this.handleStorageChange(e));

    // Visibility changes
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
  }

  /**
   * Load essential configurations on startup
   */
  async loadEssentialConfigs() {
    const essentialConfigs = ['main', 'features', 'theme'];
    
    try {
      await Promise.all(
        essentialConfigs.map(config => this.loadConfig(config, { priority: 'high' }))
      );
      
      this.emit('configs:loaded', { configs: essentialConfigs });
      
    } catch (error) {
      this.log('Failed to load essential configs, using fallbacks:', error);
      essentialConfigs.forEach(config => {
        this.loadedConfigs.set(config, this.fallbackConfigs.get(config));
      });
    }
  }

  /**
   * Load configuration by name
   */
  async loadConfig(configName, options = {}) {
    const { 
      force = false, 
      priority = 'normal',
      timeout = 10000,
      fallback = true 
    } = options;

    // Return cached config if available and not forced
    if (!force && this.loadedConfigs.has(configName)) {
      return this.loadedConfigs.get(configName);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(configName)) {
      return this.loadingPromises.get(configName);
    }

    // Create loading promise
    const loadingPromise = this.fetchConfig(configName, { timeout, fallback });
    this.loadingPromises.set(configName, loadingPromise);

    try {
      const config = await loadingPromise;
      
      // Validate configuration
      if (this.options.enableValidation && !this.validateConfig(configName, config)) {
        throw new Error(`Invalid configuration schema for ${configName}`);
      }

      // Store in cache
      this.cacheConfig(configName, config);
      this.loadedConfigs.set(configName, config);
      
      // Emit loaded event
      this.emit('config:loaded', { name: configName, config });
      
      this.log(`Config loaded: ${configName}`);
      return config;
      
    } catch (error) {
      this.log(`Failed to load config ${configName}:`, error);
      
      // Use fallback if available and enabled
      if (fallback && this.fallbackConfigs.has(configName)) {
        const fallbackConfig = this.fallbackConfigs.get(configName);
        this.loadedConfigs.set(configName, fallbackConfig);
        this.emit('config:fallback', { name: configName, config: fallbackConfig });
        return fallbackConfig;
      }
      
      throw error;
      
    } finally {
      this.loadingPromises.delete(configName);
    }
  }

  /**
   * Fetch configuration from remote endpoint
   */
  async fetchConfig(configName, options = {}) {
    const { timeout = 10000, fallback = true } = options;
    const endpoint = this.getConfigEndpoint(configName);
    
    let lastError;
    
    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': this.getCacheControl(),
            'If-None-Match': this.getETag(configName)
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.status === 304) {
          // Not modified, use cached version
          const cached = this.configCache.get(configName);
          return cached ? cached.data : this.fallbackConfigs.get(configName);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const config = await response.json();
        
        // Store ETag for future requests
        const etag = response.headers.get('ETag');
        if (etag) {
          this.setETag(configName, etag);
        }

        return config;

      } catch (error) {
        lastError = error;
        this.log(`Config fetch attempt ${attempt} failed for ${configName}:`, error);
        
        if (attempt < this.options.retryAttempts) {
          await this.delay(this.options.retryDelay * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Get configuration endpoint URL
   */
  getConfigEndpoint(configName) {
    const endpoint = this.options.endpoints[configName] || `/${configName}.json`;
    return this.options.baseUrl + endpoint;
  }

  /**
   * Get cache control header value
   */
  getCacheControl() {
    switch (this.options.cacheStrategy) {
      case 'aggressive':
        return 'max-age=86400'; // 24 hours
      case 'normal':
        return 'max-age=3600'; // 1 hour
      case 'minimal':
        return 'max-age=300'; // 5 minutes
      case 'none':
        return 'no-cache';
      default:
        return 'max-age=3600';
    }
  }

  /**
   * Get ETag for configuration
   */
  getETag(configName) {
    const cached = this.configCache.get(configName);
    return cached ? cached.etag : null;
  }

  /**
   * Set ETag for configuration
   */
  setETag(configName, etag) {
    const cached = this.configCache.get(configName);
    if (cached) {
      cached.etag = etag;
    }
  }

  /**
   * Cache configuration data
   */
  cacheConfig(configName, config) {
    const now = Date.now();
    const version = this.extractVersion(config);
    
    const cacheEntry = {
      data: config,
      timestamp: now,
      version: version,
      etag: null
    };

    this.configCache.set(configName, cacheEntry);
    this.configVersions.set(configName, version);
    
    // Persist to localStorage
    this.persistCache();
  }

  /**
   * Persist cache to localStorage
   */
  persistCache() {
    try {
      const cacheData = {};
      for (const [key, value] of this.configCache.entries()) {
        cacheData[key] = value;
      }
      
      localStorage.setItem('portfolio-config-cache', JSON.stringify(cacheData));
    } catch (error) {
      this.log('Failed to persist cache:', error);
    }
  }

  /**
   * Extract version from configuration
   */
  extractVersion(config) {
    return config.version || config.v || '1.0.0';
  }

  /**
   * Validate configuration against schema
   */
  validateConfig(configName, config) {
    if (!this.options.enableValidation) return true;
    
    const schema = this.configSchema.get(configName);
    if (!schema) return true;
    
    for (const [key, rules] of Object.entries(schema)) {
      const value = config[key];
      
      // Check required fields
      if (rules.required && (value === undefined || value === null)) {
        this.log(`Validation failed: Missing required field ${key} in ${configName}`);
        return false;
      }
      
      // Check type
      if (value !== undefined && rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          this.log(`Validation failed: Expected ${rules.type}, got ${actualType} for ${key} in ${configName}`);
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Get configuration value
   */
  get(configName, path = null, defaultValue = null) {
    const config = this.loadedConfigs.get(configName);
    
    if (!config) {
      this.log(`Config not found: ${configName}`);
      return defaultValue;
    }
    
    if (!path) {
      return config;
    }
    
    // Navigate path
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }

  /**
   * Set configuration value (runtime only)
   */
  set(configName, path, value) {
    let config = this.loadedConfigs.get(configName);
    
    if (!config) {
      config = {};
      this.loadedConfigs.set(configName, config);
    }
    
    if (!path) {
      this.loadedConfigs.set(configName, value);
      this.emit('config:changed', { name: configName, config: value });
      return;
    }
    
    // Navigate and set path
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = config;
    
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
    
    this.emit('config:changed', { name: configName, path, value });
  }

  /**
   * Refresh configuration from remote
   */
  async refresh(configName = null) {
    if (configName) {
      return this.loadConfig(configName, { force: true });
    }
    
    // Refresh all loaded configs
    const refreshPromises = Array.from(this.loadedConfigs.keys())
      .map(name => this.loadConfig(name, { force: true }));
    
    try {
      await Promise.all(refreshPromises);
      this.emit('configs:refreshed');
    } catch (error) {
      this.log('Failed to refresh configs:', error);
      throw error;
    }
  }

  /**
   * Check for configuration updates
   */
  async checkForUpdates() {
    const updatePromises = Array.from(this.loadedConfigs.keys())
      .map(async (configName) => {
        try {
          const endpoint = this.getConfigEndpoint(configName);
          const response = await fetch(endpoint, {
            method: 'HEAD',
            headers: {
              'If-None-Match': this.getETag(configName)
            }
          });
          
          return {
            name: configName,
            hasUpdate: response.status !== 304
          };
        } catch (error) {
          return {
            name: configName,
            hasUpdate: false,
            error: error.message
          };
        }
      });
    
    const results = await Promise.all(updatePromises);
    const updatesAvailable = results.filter(r => r.hasUpdate);
    
    if (updatesAvailable.length > 0) {
      this.emit('configs:updates-available', { updates: updatesAvailable });
    }
    
    return updatesAvailable;
  }

  /**
   * Handle network status changes
   */
  handleNetworkChange(isOnline) {
    if (isOnline) {
      this.log('Network online - checking for config updates');
      this.checkForUpdates();
    } else {
      this.log('Network offline - using cached configs');
    }
  }

  /**
   * Handle storage changes for multi-tab sync
   */
  handleStorageChange(event) {
    if (event.key === 'portfolio-config-cache') {
      this.log('Config cache updated in another tab');
      this.loadCachedConfigs();
      this.emit('configs:synced');
    }
  }

  /**
   * Handle visibility changes
   */
  handleVisibilityChange() {
    if (!document.hidden) {
      // Page became visible - check for updates
      setTimeout(() => this.checkForUpdates(), 1000);
    }
  }

  /**
   * Fallback to default configurations
   */
  fallbackToDefaults() {
    for (const [name, config] of this.fallbackConfigs.entries()) {
      this.loadedConfigs.set(name, config);
    }
    
    this.emit('configs:fallback');
  }

  /**
   * Clear configuration cache
   */
  clearCache(configName = null) {
    if (configName) {
      this.configCache.delete(configName);
      this.configVersions.delete(configName);
    } else {
      this.configCache.clear();
      this.configVersions.clear();
      localStorage.removeItem('portfolio-config-cache');
    }
    
    this.emit('cache:cleared', { configName });
    this.log(`Cache cleared: ${configName || 'all'}`);
  }

  /**
   * Export all configurations
   */
  exportConfigs() {
    const configs = {};
    for (const [name, config] of this.loadedConfigs.entries()) {
      configs[name] = config;
    }
    
    return {
      configs,
      versions: Object.fromEntries(this.configVersions.entries()),
      timestamp: new Date().toISOString(),
      cacheStrategy: this.options.cacheStrategy
    };
  }

  /**
   * Import configurations
   */
  importConfigs(data) {
    if (!data || !data.configs) {
      throw new Error('Invalid configuration data');
    }
    
    for (const [name, config] of Object.entries(data.configs)) {
      if (this.options.enableValidation && !this.validateConfig(name, config)) {
        this.log(`Skipping invalid config: ${name}`);
        continue;
      }
      
      this.loadedConfigs.set(name, config);
      this.cacheConfig(name, config);
    }
    
    this.emit('configs:imported', { count: Object.keys(data.configs).length });
  }

  /**
   * Get configuration status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      loadedConfigs: Array.from(this.loadedConfigs.keys()),
      cachedConfigs: Array.from(this.configCache.keys()),
      cacheStrategy: this.options.cacheStrategy,
      lastUpdate: this.getLastUpdateTime(),
      isOnline: navigator.onLine
    };
  }

  /**
   * Get last update time
   */
  getLastUpdateTime() {
    let lastUpdate = 0;
    for (const cached of this.configCache.values()) {
      if (cached.timestamp > lastUpdate) {
        lastUpdate = cached.timestamp;
      }
    }
    return lastUpdate ? new Date(lastUpdate).toISOString() : null;
  }

  /**
   * Event system methods
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data = {}) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.log(`Event listener error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Utility method for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log messages with context
   */
  log(message, ...args) {
    if (this.options.debugMode) {
      console.log(`[Config Loader] ${message}`, ...args);
    }
  }

  /**
   * Destroy config loader
   */
  destroy() {
    // Clear timers and promises
    this.loadingPromises.clear();
    this.eventListeners.clear();
    
    // Remove event listeners
    window.removeEventListener('online', this.handleNetworkChange);
    window.removeEventListener('offline', this.handleNetworkChange);
    window.removeEventListener('storage', this.handleStorageChange);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    this.isInitialized = false;
    this.log('Config Loader destroyed');
  }
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.configLoader = new ConfigLoader();
  });
} else {
  window.configLoader = new ConfigLoader();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfigLoader;
}

export default ConfigLoader; 