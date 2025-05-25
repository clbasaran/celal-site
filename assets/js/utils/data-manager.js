/**
 * Data Manager - Portfolio OS V6
 * Generic async JSON fetch with fallback and state management
 */

class DataManager {
  constructor(options = {}) {
    this.options = {
      baseUrl: './data/',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      cache: true,
      fallbackData: true,
      loadingStates: true,
      ...options
    };
    
    this.cache = new Map();
    this.loadingStates = new Map();
    this.errorStates = new Map();
    this.subscriptions = new Map();
    
    this.init();
  }

  init() {
    this.setupErrorHandling();
    this.preloadCriticalData();
    
    console.log('📊 Data Manager initialized');
  }

  setupErrorHandling() {
    // Global error handler for data loading
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.source === 'data-manager') {
        this.handleGlobalError(event.reason);
        event.preventDefault();
      }
    });
  }

  async preloadCriticalData() {
    // Preload essential data files
    const criticalFiles = ['profile.json', 'navigation.json'];
    
    try {
      await Promise.allSettled(
        criticalFiles.map(file => this.loadData(file, { priority: 'high' }))
      );
    } catch (error) {
      console.warn('⚠️ Critical data preload failed:', error);
    }
  }

  // Main data loading method
  async loadData(filename, options = {}) {
    const config = { ...this.options, ...options };
    const cacheKey = this.getCacheKey(filename, config);
    
    // Return cached data if available
    if (config.cache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    // Check if already loading
    if (this.loadingStates.has(cacheKey)) {
      return this.loadingStates.get(cacheKey);
    }
    
    // Start loading
    const loadingPromise = this.fetchWithRetry(filename, config);
    this.loadingStates.set(cacheKey, loadingPromise);
    
    // Notify subscribers of loading state
    this.notifySubscribers(filename, { status: 'loading', data: null, error: null });
    
    try {
      const data = await loadingPromise;
      
      // Cache successful result
      if (config.cache) {
        this.cache.set(cacheKey, data);
      }
      
      // Clear loading state
      this.loadingStates.delete(cacheKey);
      this.errorStates.delete(cacheKey);
      
      // Notify subscribers of success
      this.notifySubscribers(filename, { status: 'success', data, error: null });
      
      return data;
      
    } catch (error) {
      // Clear loading state
      this.loadingStates.delete(cacheKey);
      this.errorStates.set(cacheKey, error);
      
      // Try fallback data
      const fallbackData = await this.tryFallbackData(filename, config);
      
      if (fallbackData) {
        this.notifySubscribers(filename, { 
          status: 'fallback', 
          data: fallbackData, 
          error 
        });
        return fallbackData;
      }
      
      // Notify subscribers of error
      this.notifySubscribers(filename, { status: 'error', data: null, error });
      
      throw this.createDataError(error, filename);
    }
  }

  async fetchWithRetry(filename, config, attempt = 1) {
    const url = this.buildUrl(filename, config);
    
    try {
      const response = await this.fetchWithTimeout(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return this.validateAndTransformData(data, filename, config);
      
    } catch (error) {
      if (attempt < config.retryAttempts) {
        console.warn(`⚠️ Data fetch attempt ${attempt} failed for ${filename}:`, error.message);
        
        // Wait before retry
        await this.delay(config.retryDelay * attempt);
        
        return this.fetchWithRetry(filename, config, attempt + 1);
      }
      
      throw error;
    }
  }

  async fetchWithTimeout(url, config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': config.cache ? 'max-age=300' : 'no-cache'
        }
      });
      
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async tryFallbackData(filename, config) {
    if (!config.fallbackData) return null;
    
    try {
      // Try fallback data from different sources
      const fallbackSources = [
        () => this.getLocalFallbackData(filename),
        () => this.getDefaultData(filename),
        () => this.getCachedData(filename)
      ];
      
      for (const source of fallbackSources) {
        const fallbackData = await source();
        if (fallbackData) {
          console.warn(`📋 Using fallback data for ${filename}`);
          return fallbackData;
        }
      }
    } catch (error) {
      console.warn('⚠️ Fallback data failed:', error);
    }
    
    return null;
  }

  getLocalFallbackData(filename) {
    // Try to get fallback data from embedded defaults
    const fallbackMap = {
      'profile.json': this.getDefaultProfileData(),
      'projects.json': this.getDefaultProjectsData(),
      'skills.json': this.getDefaultSkillsData(),
      'navigation.json': this.getDefaultNavigationData()
    };
    
    return fallbackMap[filename] || null;
  }

  getDefaultData(filename) {
    // Basic default data structures
    const defaults = {
      'profile.json': {
        name: 'Celal Başaran',
        title: 'Full Stack Developer & UI/UX Designer',
        description: 'Apple Design Language V6 ile modern, erişilebilir web deneyimleri oluşturuyor.',
        status: 'available'
      },
      'projects.json': {
        projects: []
      },
      'skills.json': {
        categories: []
      },
      'navigation.json': {
        items: [
          { id: 'home', label: 'Ana Sayfa', href: '#home' },
          { id: 'about', label: 'Hakkımda', href: '#about' },
          { id: 'projects', label: 'Projeler', href: '#projects' },
          { id: 'skills', label: 'Yetenekler', href: '#skills' },
          { id: 'contact', label: 'İletişim', href: '#contact' }
        ]
      }
    };
    
    return defaults[filename] || null;
  }

  getDefaultProfileData() {
    return {
      name: 'Celal Başaran',
      title: 'Full Stack Developer & UI/UX Designer',
      description: 'Apple Design Language V6 ile modern, erişilebilir web deneyimleri oluşturuyor.',
      status: 'available',
      email: 'hello@celal.dev',
      location: 'Turkey',
      experience: '5+',
      projectsCompleted: '50+',
      clientSatisfaction: '100%',
      specialties: [
        'Frontend Development',
        'UI/UX Design',
        'Accessibility',
        'Performance Optimization'
      ],
      technologies: [
        'HTML5', 'CSS3', 'JavaScript', 'React', 'Vue.js',
        'Node.js', 'Python', 'PostgreSQL', 'Figma'
      ]
    };
  }

  getDefaultProjectsData() {
    return {
      featured: [
        {
          id: 'portfolio-os-v6',
          title: 'Portfolio OS V6',
          description: 'Apple Design Language V6 ile geliştirilmiş, WCAG 2.1 AA uyumlu modern portfolio sistemi',
          category: 'Web Development',
          status: 'active',
          technologies: ['HTML5', 'CSS3', 'JavaScript', 'PWA'],
          year: '2024',
          featured: true
        }
      ],
      projects: []
    };
  }

  getDefaultSkillsData() {
    return {
      categories: [
        {
          id: 'frontend',
          title: 'Frontend Development',
          skills: [
            { name: 'HTML5', level: 95 },
            { name: 'CSS3', level: 95 },
            { name: 'JavaScript', level: 90 },
            { name: 'React', level: 85 },
            { name: 'Vue.js', level: 80 }
          ]
        },
        {
          id: 'design',
          title: 'UI/UX Design',
          skills: [
            { name: 'Figma', level: 90 },
            { name: 'Adobe XD', level: 85 },
            { name: 'Sketch', level: 80 },
            { name: 'Accessibility Design', level: 95 }
          ]
        },
        {
          id: 'backend',
          title: 'Backend Development',
          skills: [
            { name: 'Node.js', level: 80 },
            { name: 'Python', level: 75 },
            { name: 'PostgreSQL', level: 80 },
            { name: 'MongoDB', level: 70 }
          ]
        }
      ]
    };
  }

  getDefaultNavigationData() {
    return {
      brand: {
        text: 'Portfolio OS',
        version: 'V6',
        icon: '🍎'
      },
      items: [
        { id: 'home', label: 'Ana Sayfa', href: '#home', active: true },
        { id: 'about', label: 'Hakkımda', href: '#about' },
        { id: 'projects', label: 'Projeler', href: '#projects' },
        { id: 'skills', label: 'Yetenekler', href: '#skills' },
        { id: 'contact', label: 'İletişim', href: '#contact' }
      ],
      actions: [
        { id: 'theme', type: 'theme-toggle', label: 'Tema değiştir' },
        { id: 'menu', type: 'menu-toggle', label: 'Menü aç/kapat' }
      ]
    };
  }

  validateAndTransformData(data, filename, config) {
    // Basic data validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format');
    }
    
    // File-specific validation
    const validators = {
      'profile.json': this.validateProfileData,
      'projects.json': this.validateProjectsData,
      'skills.json': this.validateSkillsData,
      'navigation.json': this.validateNavigationData
    };
    
    const validator = validators[filename];
    if (validator) {
      return validator.call(this, data);
    }
    
    return data;
  }

  validateProfileData(data) {
    const required = ['name', 'title'];
    for (const field of required) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return data;
  }

  validateProjectsData(data) {
    if (!Array.isArray(data.projects)) {
      data.projects = [];
    }
    return data;
  }

  validateSkillsData(data) {
    if (!Array.isArray(data.categories)) {
      data.categories = [];
    }
    return data;
  }

  validateNavigationData(data) {
    if (!Array.isArray(data.items)) {
      data.items = [];
    }
    return data;
  }

  // Subscription system for reactive data
  subscribe(filename, callback) {
    if (!this.subscriptions.has(filename)) {
      this.subscriptions.set(filename, new Set());
    }
    
    this.subscriptions.get(filename).add(callback);
    
    // Return unsubscribe function
    return () => {
      const subscribers = this.subscriptions.get(filename);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscriptions.delete(filename);
        }
      }
    };
  }

  notifySubscribers(filename, state) {
    const subscribers = this.subscriptions.get(filename);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  // Utility methods
  buildUrl(filename, config) {
    const baseUrl = config.baseUrl || this.options.baseUrl;
    return new URL(filename, baseUrl).toString();
  }

  getCacheKey(filename, config) {
    return `${filename}:${JSON.stringify(config)}`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  createDataError(originalError, filename) {
    const error = new Error(`Data loading failed for ${filename}: ${originalError.message}`);
    error.source = 'data-manager';
    error.filename = filename;
    error.originalError = originalError;
    return error;
  }

  handleGlobalError(error) {
    console.error('🚨 Data Manager Global Error:', error);
    
    // Emit global error event
    document.dispatchEvent(new CustomEvent('data:error', {
      detail: { error, filename: error.filename }
    }));
  }

  // Public API methods
  async getProfile() {
    return this.loadData('profile.json');
  }

  async getProjects() {
    return this.loadData('projects.json');
  }

  async getSkills() {
    return this.loadData('skills.json');
  }

  async getNavigation() {
    return this.loadData('navigation.json');
  }

  // Batch loading
  async loadMultiple(filenames, options = {}) {
    const promises = filenames.map(filename => 
      this.loadData(filename, options).catch(error => ({ error, filename }))
    );
    
    const results = await Promise.all(promises);
    
    return results.reduce((acc, result, index) => {
      const filename = filenames[index];
      const key = filename.replace('.json', '');
      
      if (result.error) {
        acc.errors = acc.errors || {};
        acc.errors[key] = result.error;
      } else {
        acc.data = acc.data || {};
        acc.data[key] = result;
      }
      
      return acc;
    }, {});
  }

  // Cache management
  clearCache(filename = null) {
    if (filename) {
      const keys = Array.from(this.cache.keys()).filter(key => key.startsWith(filename));
      keys.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  getCacheSize() {
    return this.cache.size;
  }

  getLoadingStates() {
    return Array.from(this.loadingStates.keys());
  }

  getErrorStates() {
    return Array.from(this.errorStates.entries());
  }

  // Health check
  async healthCheck() {
    const testFiles = ['profile.json'];
    const startTime = performance.now();
    
    try {
      await Promise.all(testFiles.map(file => this.loadData(file, { cache: false })));
      const loadTime = performance.now() - startTime;
      
      return {
        status: 'healthy',
        loadTime: Math.round(loadTime),
        cacheSize: this.getCacheSize(),
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        loadTime: performance.now() - startTime,
        timestamp: Date.now()
      };
    }
  }

  // Cleanup
  destroy() {
    this.cache.clear();
    this.loadingStates.clear();
    this.errorStates.clear();
    this.subscriptions.clear();
    
    console.log('📊 Data Manager destroyed');
  }
}

// Create singleton instance
const dataManager = new DataManager();

// Export both class and instance
window.dataManager = dataManager;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DataManager, dataManager };
} 