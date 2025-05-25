/**
 * Portfolio OS V6 - Data Manager
 * JSON-based content management system
 */

export class DataManager {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.retryAttempts = 3;
        this.retryDelay = 1000; // 1 second
        
        // Data endpoints
        this.endpoints = {
            projects: '/data/projects.json',
            blog: '/data/blog.json',
            skills: '/data/skills.json',
            experience: '/data/experience.json',
            testimonials: '/data/testimonials.json',
            profile: '/data/profile.json'
        };
        
        // State
        this.loading = new Set();
        this.errors = new Map();
        
        // Bind methods
        this.init = this.init.bind(this);
        this.loadProjects = this.loadProjects.bind(this);
        this.loadBlog = this.loadBlog.bind(this);
        this.fetchWithRetry = this.fetchWithRetry.bind(this);
    }
    
    // ===== INITIALIZATION =====
    async init() {
        try {
            console.log('📊 Data Manager initialized');
            
            // Preload critical data
            await this.preloadCriticalData();
            
        } catch (error) {
            console.warn('Data Manager initialization failed:', error);
        }
    }
    
    async preloadCriticalData() {
        // Load most important data first
        const criticalData = ['projects'];
        
        const promises = criticalData.map(async (dataType) => {
            try {
                await this.loadData(dataType);
            } catch (error) {
                console.warn(`Failed to preload ${dataType}:`, error);
            }
        });
        
        await Promise.allSettled(promises);
    }
    
    // ===== MAIN DATA LOADING METHODS =====
    async loadProjects() {
        return this.loadData('projects');
    }
    
    async loadBlog() {
        return this.loadData('blog');
    }
    
    async loadSkills() {
        return this.loadData('skills');
    }
    
    async loadExperience() {
        return this.loadData('experience');
    }
    
    async loadTestimonials() {
        return this.loadData('testimonials');
    }
    
    async loadProfile() {
        return this.loadData('profile');
    }
    
    // ===== GENERIC DATA LOADING =====
    async loadData(dataType) {
        try {
            // Check if already loading
            if (this.loading.has(dataType)) {
                console.log(`⏳ ${dataType} already loading, waiting...`);
                return this.waitForLoad(dataType);
            }
            
            // Check cache first
            const cached = this.getFromCache(dataType);
            if (cached) {
                console.log(`📦 Loading ${dataType} from cache`);
                return cached;
            }
            
            // Mark as loading
            this.loading.add(dataType);
            
            console.log(`🔄 Loading ${dataType} from server`);
            
            // Fetch data
            const endpoint = this.endpoints[dataType];
            if (!endpoint) {
                throw new Error(`Unknown data type: ${dataType}`);
            }
            
            const data = await this.fetchWithRetry(endpoint);
            
            // Validate data
            this.validateData(dataType, data);
            
            // Cache the data
            this.setCache(dataType, data);
            
            // Clear loading state
            this.loading.delete(dataType);
            this.errors.delete(dataType);
            
            console.log(`✅ ${dataType} loaded successfully`);
            
            // Dispatch data loaded event
            this.dispatchDataEvent(dataType, data);
            
            return data;
            
        } catch (error) {
            this.loading.delete(dataType);
            this.errors.set(dataType, error);
            
            console.error(`❌ Failed to load ${dataType}:`, error);
            
            // Try to return cached data even if expired
            const staleCache = this.getFromCache(dataType, true);
            if (staleCache) {
                console.warn(`⚠️ Returning stale cache for ${dataType}`);
                return staleCache;
            }
            
            // Return fallback data
            return this.getFallbackData(dataType);
        }
    }
    
    // ===== HTTP METHODS =====
    async fetchWithRetry(url, options = {}, attempt = 1) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            if (attempt < this.retryAttempts) {
                console.warn(`🔄 Retry attempt ${attempt} for ${url}`);
                await this.delay(this.retryDelay * attempt);
                return this.fetchWithRetry(url, options, attempt + 1);
            }
            
            throw error;
        }
    }
    
    // ===== CACHE MANAGEMENT =====
    getFromCache(key, allowStale = false) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
        
        if (isExpired && !allowStale) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
            console.log(`🗑️ Cache cleared for ${key}`);
        } else {
            this.cache.clear();
            console.log('🗑️ All cache cleared');
        }
    }
    
    getCacheInfo() {
        const info = {};
        
        for (const [key, value] of this.cache.entries()) {
            const age = Date.now() - value.timestamp;
            const isExpired = age > this.cacheTimeout;
            
            info[key] = {
                age: age,
                expired: isExpired,
                size: JSON.stringify(value.data).length
            };
        }
        
        return info;
    }
    
    // ===== DATA VALIDATION =====
    validateData(dataType, data) {
        if (!data || typeof data !== 'object') {
            throw new Error(`Invalid data format for ${dataType}`);
        }
        
        // Specific validation for different data types
        switch (dataType) {
            case 'projects':
                if (!data.projects || !Array.isArray(data.projects)) {
                    throw new Error('Projects data must contain a projects array');
                }
                break;
                
            case 'blog':
                if (!data.posts || !Array.isArray(data.posts)) {
                    throw new Error('Blog data must contain a posts array');
                }
                break;
                
            default:
                // Generic validation passed
                break;
        }
    }
    
    // ===== FALLBACK DATA =====
    getFallbackData(dataType) {
        const fallbacks = {
            projects: {
                projects: [],
                categories: [],
                technologies: [],
                meta: {
                    total_projects: 0,
                    version: '6.0',
                    last_updated: new Date().toISOString()
                }
            },
            blog: {
                posts: [],
                categories: [],
                tags: [],
                metadata: {
                    totalPosts: 0,
                    version: '1.0',
                    lastUpdated: new Date().toISOString()
                }
            }
        };
        
        return fallbacks[dataType] || {};
    }
    
    // ===== DATA FILTERING & SEARCHING =====
    filterProjects(filters = {}) {
        const projects = this.getFromCache('projects');
        if (!projects?.projects) return [];
        
        let filtered = projects.projects;
        
        // Filter by status
        if (filters.status) {
            filtered = filtered.filter(p => p.status === filters.status);
        }
        
        // Filter by category
        if (filters.category) {
            filtered = filtered.filter(p => p.category === filters.category);
        }
        
        // Filter by technology
        if (filters.technology) {
            filtered = filtered.filter(p => 
                p.technologies?.includes(filters.technology)
            );
        }
        
        // Filter featured only
        if (filters.featured) {
            filtered = filtered.filter(p => p.featured === true);
        }
        
        // Search by text
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.title.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.technologies?.some(tech => tech.toLowerCase().includes(searchTerm))
            );
        }
        
        return filtered;
    }
    
    filterBlogPosts(filters = {}) {
        const blog = this.getFromCache('blog');
        if (!blog?.posts) return [];
        
        let filtered = blog.posts;
        
        // Filter by category
        if (filters.category) {
            filtered = filtered.filter(p => p.category === filters.category);
        }
        
        // Filter by tag
        if (filters.tag) {
            filtered = filtered.filter(p => 
                p.tags?.includes(filters.tag)
            );
        }
        
        // Filter by status
        if (filters.status) {
            filtered = filtered.filter(p => p.status === filters.status);
        }
        
        // Filter featured only
        if (filters.featured) {
            filtered = filtered.filter(p => p.featured === true);
        }
        
        // Search by text
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.title.toLowerCase().includes(searchTerm) ||
                p.excerpt.toLowerCase().includes(searchTerm) ||
                p.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        // Sort by date (newest first)
        filtered.sort((a, b) => 
            new Date(b.meta.published_date) - new Date(a.meta.published_date)
        );
        
        return filtered;
    }
    
    // ===== SEARCH FUNCTIONALITY =====
    searchAll(query) {
        const results = {
            projects: this.filterProjects({ search: query }),
            posts: this.filterBlogPosts({ search: query }),
            total: 0
        };
        
        results.total = results.projects.length + results.posts.length;
        
        return results;
    }
    
    // ===== EVENTS =====
    dispatchDataEvent(dataType, data) {
        const event = new CustomEvent('dataload', {
            detail: {
                type: dataType,
                data: data,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }
    
    // ===== UTILITY METHODS =====
    async waitForLoad(dataType) {
        return new Promise((resolve, reject) => {
            const checkInterval = 100; // 100ms
            const maxWait = 30000; // 30 seconds
            let waited = 0;
            
            const check = () => {
                if (!this.loading.has(dataType)) {
                    const data = this.getFromCache(dataType);
                    if (data) {
                        resolve(data);
                    } else {
                        const error = this.errors.get(dataType);
                        reject(error || new Error(`Failed to load ${dataType}`));
                    }
                    return;
                }
                
                waited += checkInterval;
                if (waited >= maxWait) {
                    reject(new Error(`Timeout waiting for ${dataType}`));
                    return;
                }
                
                setTimeout(check, checkInterval);
            };
            
            check();
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getLoadingState() {
        return {
            loading: Array.from(this.loading),
            cached: Array.from(this.cache.keys()),
            errors: Object.fromEntries(this.errors)
        };
    }
    
    // ===== REFRESH METHODS =====
    async refreshData(dataType) {
        console.log(`🔄 Refreshing ${dataType}`);
        this.clearCache(dataType);
        return this.loadData(dataType);
    }
    
    async refreshAll() {
        console.log('🔄 Refreshing all data');
        this.clearCache();
        
        const promises = Object.keys(this.endpoints).map(async (dataType) => {
            try {
                await this.loadData(dataType);
            } catch (error) {
                console.warn(`Failed to refresh ${dataType}:`, error);
            }
        });
        
        await Promise.allSettled(promises);
    }
} 