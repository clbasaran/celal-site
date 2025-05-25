/**
 * Portfolio OS V6 - Performance Manager
 * Real-time performance monitoring and optimization
 */

export class PerformanceManager {
    constructor() {
        this.metrics = {
            // Core Web Vitals
            lcp: null,    // Largest Contentful Paint
            fid: null,    // First Input Delay
            cls: null,    // Cumulative Layout Shift
            
            // Additional metrics
            ttfb: null,   // Time to First Byte
            fcp: null,    // First Contentful Paint
            tti: null,    // Time to Interactive
            
            // Custom metrics
            loadTime: null,
            memoryUsage: null,
            resourceCount: null,
            
            // Session metrics
            pageViews: 0,
            sessionDuration: 0,
            interactions: 0
        };
        
        this.observers = new Map();
        this.startTime = performance.now();
        this.sessionStart = Date.now();
        this.isSupported = this.checkBrowserSupport();
        
        // Bind methods
        this.init = this.init.bind(this);
        this.startSession = this.startSession.bind(this);
        this.endSession = this.endSession.bind(this);
        this.trackPageLoad = this.trackPageLoad.bind(this);
    }
    
    // ===== INITIALIZATION =====
    async init() {
        try {
            if (!this.isSupported) {
                console.warn('⚠️ Performance API not fully supported');
                return;
            }
            
            // Setup performance observers
            this.setupPerformanceObservers();
            
            // Setup Core Web Vitals tracking
            this.setupWebVitalsTracking();
            
            // Setup resource monitoring
            this.setupResourceMonitoring();
            
            // Setup memory monitoring
            this.setupMemoryMonitoring();
            
            // Track initial page load
            this.trackPageLoad();
            
            console.log('📊 Performance Manager initialized');
            
        } catch (error) {
            console.warn('Performance Manager initialization failed:', error);
        }
    }
    
    checkBrowserSupport() {
        return !!(
            window.performance &&
            window.performance.getEntriesByType &&
            window.PerformanceObserver
        );
    }
    
    // ===== SESSION MANAGEMENT =====
    startSession() {
        this.sessionStart = Date.now();
        this.metrics.pageViews = 1;
        
        // Track session events
        this.trackSessionEvents();
        
        console.log('🚀 Performance session started');
    }
    
    endSession() {
        this.metrics.sessionDuration = Date.now() - this.sessionStart;
        
        // Send analytics data
        this.sendAnalytics();
        
        // Cleanup observers
        this.cleanup();
        
        console.log('🏁 Performance session ended');
    }
    
    trackSessionEvents() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.metrics.sessionDuration = Date.now() - this.sessionStart;
            } else {
                this.sessionStart = Date.now();
            }
        });
        
        // Track user interactions
        ['click', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                this.metrics.interactions++;
            }, { passive: true });
        });
        
        // Track page unload
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });
    }
    
    // ===== PERFORMANCE OBSERVERS =====
    setupPerformanceObservers() {
        // Paint timing observer
        if ('PerformanceObserver' in window) {
            try {
                const paintObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    
                    entries.forEach(entry => {
                        switch (entry.name) {
                            case 'first-contentful-paint':
                                this.metrics.fcp = entry.startTime;
                                break;
                            case 'largest-contentful-paint':
                                this.metrics.lcp = entry.startTime;
                                break;
                        }
                    });
                });
                
                paintObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
                this.observers.set('paint', paintObserver);
                
            } catch (error) {
                console.warn('Paint observer setup failed:', error);
            }
        }
        
        // Navigation timing observer
        try {
            const navigationObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                
                entries.forEach(entry => {
                    this.metrics.ttfb = entry.responseStart - entry.requestStart;
                    this.metrics.loadTime = entry.loadEventEnd - entry.fetchStart;
                });
            });
            
            navigationObserver.observe({ entryTypes: ['navigation'] });
            this.observers.set('navigation', navigationObserver);
            
        } catch (error) {
            console.warn('Navigation observer setup failed:', error);
        }
        
        // Layout shift observer
        try {
            const layoutShiftObserver = new PerformanceObserver((entryList) => {
                let clsValue = 0;
                
                entryList.getEntries().forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                
                this.metrics.cls = clsValue;
            });
            
            layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.set('layoutShift', layoutShiftObserver);
            
        } catch (error) {
            console.warn('Layout shift observer setup failed:', error);
        }
    }
    
    // ===== CORE WEB VITALS =====
    setupWebVitalsTracking() {
        // First Input Delay (FID)
        try {
            const fidObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                
                entries.forEach(entry => {
                    this.metrics.fid = entry.processingStart - entry.startTime;
                });
            });
            
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.set('firstInput', fidObserver);
            
        } catch (error) {
            console.warn('FID observer setup failed:', error);
        }
        
        // Time to Interactive (TTI)
        this.calculateTTI();
    }
    
    calculateTTI() {
        // Simplified TTI calculation
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.metrics.tti = performance.now();
            }, 0);
        });
    }
    
    // ===== RESOURCE MONITORING =====
    setupResourceMonitoring() {
        try {
            const resourceObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                
                entries.forEach(entry => {
                    this.analyzeResource(entry);
                });
            });
            
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.set('resource', resourceObserver);
            
        } catch (error) {
            console.warn('Resource observer setup failed:', error);
        }
    }
    
    analyzeResource(entry) {
        // Analyze resource performance
        const duration = entry.responseEnd - entry.startTime;
        const size = entry.transferSize || 0;
        
        // Flag slow resources
        if (duration > 1000) {
            console.warn(`🐌 Slow resource detected: ${entry.name} (${duration.toFixed(2)}ms)`);
        }
        
        // Flag large resources
        if (size > 500000) { // 500KB
            console.warn(`📦 Large resource detected: ${entry.name} (${(size / 1024).toFixed(2)}KB)`);
        }
        
        // Update resource count
        this.metrics.resourceCount = (this.metrics.resourceCount || 0) + 1;
    }
    
    // ===== MEMORY MONITORING =====
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            // Initial memory reading
            this.updateMemoryMetrics();
            
            // Periodic memory monitoring
            setInterval(() => {
                this.updateMemoryMetrics();
            }, 30000); // Every 30 seconds
        }
    }
    
    updateMemoryMetrics() {
        if ('memory' in performance) {
            const memory = performance.memory;
            
            this.metrics.memoryUsage = {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
                percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
            };
            
            // Warn if memory usage is high
            if (this.metrics.memoryUsage.percentage > 80) {
                console.warn(`🧠 High memory usage: ${this.metrics.memoryUsage.percentage}%`);
            }
        }
    }
    
    // ===== PAGE LOAD TRACKING =====
    trackPageLoad() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.collectLoadMetrics();
                this.analyzePerformance();
            }, 0);
        });
    }
    
    collectLoadMetrics() {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        if (navigation) {
            this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
            this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        }
        
        // Collect paint metrics
        const paintEntries = performance.getEntriesByType('paint');
        
        paintEntries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
                this.metrics.fcp = entry.startTime;
            }
        });
        
        // Collect resource count
        const resources = performance.getEntriesByType('resource');
        this.metrics.resourceCount = resources.length;
    }
    
    // ===== PERFORMANCE ANALYSIS =====
    analyzePerformance() {
        const issues = [];
        const recommendations = [];
        
        // Analyze LCP
        if (this.metrics.lcp > 2500) {
            issues.push('Largest Contentful Paint is slow');
            recommendations.push('Optimize images and reduce server response time');
        }
        
        // Analyze FID
        if (this.metrics.fid > 100) {
            issues.push('First Input Delay is high');
            recommendations.push('Reduce JavaScript execution time');
        }
        
        // Analyze CLS
        if (this.metrics.cls > 0.1) {
            issues.push('Cumulative Layout Shift is high');
            recommendations.push('Set dimensions for images and ads');
        }
        
        // Analyze load time
        if (this.metrics.loadTime > 3000) {
            issues.push('Page load time is slow');
            recommendations.push('Enable compression and optimize resources');
        }
        
        // Analyze resource count
        if (this.metrics.resourceCount > 100) {
            issues.push('Too many HTTP requests');
            recommendations.push('Bundle resources and use resource hints');
        }
        
        // Log findings
        if (issues.length > 0) {
            console.warn('⚠️ Performance issues detected:', issues);
            console.info('💡 Recommendations:', recommendations);
        } else {
            console.log('✅ Performance looks good!');
        }
        
        return { issues, recommendations };
    }
    
    // ===== REAL-TIME MONITORING =====
    getRealtimeMetrics() {
        this.updateMemoryMetrics();
        
        return {
            ...this.metrics,
            currentTime: performance.now(),
            sessionDuration: Date.now() - this.sessionStart,
            timestamp: new Date().toISOString()
        };
    }
    
    getPerformanceScore() {
        let score = 100;
        
        // Deduct points for poor metrics
        if (this.metrics.lcp > 2500) score -= 20;
        if (this.metrics.fid > 100) score -= 20;
        if (this.metrics.cls > 0.1) score -= 20;
        if (this.metrics.loadTime > 3000) score -= 20;
        if (this.metrics.resourceCount > 100) score -= 10;
        
        return Math.max(0, score);
    }
    
    getWebVitalsGrade() {
        const grades = {
            lcp: this.metrics.lcp <= 2500 ? 'good' : this.metrics.lcp <= 4000 ? 'needs-improvement' : 'poor',
            fid: this.metrics.fid <= 100 ? 'good' : this.metrics.fid <= 300 ? 'needs-improvement' : 'poor',
            cls: this.metrics.cls <= 0.1 ? 'good' : this.metrics.cls <= 0.25 ? 'needs-improvement' : 'poor'
        };
        
        return grades;
    }
    
    // ===== ANALYTICS =====
    sendAnalytics() {
        const analyticsData = {
            metrics: this.getRealtimeMetrics(),
            score: this.getPerformanceScore(),
            grades: this.getWebVitalsGrade(),
            userAgent: navigator.userAgent,
            connectionType: this.getConnectionType(),
            deviceType: this.getDeviceType()
        };
        
        // In a real implementation, send to analytics service
        console.log('📈 Analytics data:', analyticsData);
        
        // Store locally for debugging
        localStorage.setItem('portfolioOS_performance', JSON.stringify(analyticsData));
    }
    
    getConnectionType() {
        if ('connection' in navigator) {
            return navigator.connection.effectiveType || 'unknown';
        }
        return 'unknown';
    }
    
    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }
    
    // ===== OPTIMIZATION SUGGESTIONS =====
    getOptimizationSuggestions() {
        const suggestions = [];
        
        // Based on current metrics
        if (this.metrics.loadTime > 3000) {
            suggestions.push({
                type: 'critical',
                message: 'Page load time is slow',
                action: 'Enable compression, optimize images, reduce JavaScript bundle size'
            });
        }
        
        if (this.metrics.resourceCount > 50) {
            suggestions.push({
                type: 'medium',
                message: 'Many HTTP requests detected',
                action: 'Bundle CSS/JS files, use image sprites, implement resource hints'
            });
        }
        
        if (this.metrics.memoryUsage?.percentage > 70) {
            suggestions.push({
                type: 'high',
                message: 'High memory usage detected',
                action: 'Check for memory leaks, optimize heavy components'
            });
        }
        
        return suggestions;
    }
    
    // ===== UTILITY METHODS =====
    markCustomMetric(name, value) {
        performance.mark(name);
        this.metrics[name] = value;
        
        console.log(`📊 Custom metric: ${name} = ${value}`);
    }
    
    measureCustomTiming(name, startMark, endMark) {
        try {
            performance.measure(name, startMark, endMark);
            const measure = performance.getEntriesByName(name)[0];
            
            if (measure) {
                this.metrics[name] = measure.duration;
                console.log(`⏱️ Custom timing: ${name} = ${measure.duration.toFixed(2)}ms`);
            }
        } catch (error) {
            console.warn(`Failed to measure ${name}:`, error);
        }
    }
    
    // ===== CLEANUP =====
    cleanup() {
        // Disconnect all observers
        this.observers.forEach(observer => {
            try {
                observer.disconnect();
            } catch (error) {
                console.warn('Failed to disconnect observer:', error);
            }
        });
        
        this.observers.clear();
        
        console.log('📊 Performance Manager cleaned up');
    }
    
    // ===== DEBUG METHODS =====
    getDebugInfo() {
        return {
            metrics: this.metrics,
            isSupported: this.isSupported,
            observerCount: this.observers.size,
            sessionDuration: Date.now() - this.sessionStart,
            connectionType: this.getConnectionType(),
            deviceType: this.getDeviceType(),
            performanceScore: this.getPerformanceScore(),
            webVitalsGrade: this.getWebVitalsGrade()
        };
    }
    
    logPerformanceReport() {
        console.group('📊 Portfolio OS V6 Performance Report');
        console.log('Core Web Vitals:', this.getWebVitalsGrade());
        console.log('Performance Score:', this.getPerformanceScore());
        console.log('Load Time:', this.metrics.loadTime?.toFixed(2) + 'ms');
        console.log('Resource Count:', this.metrics.resourceCount);
        console.log('Memory Usage:', this.metrics.memoryUsage?.percentage + '%');
        console.log('Session Duration:', Math.round((Date.now() - this.sessionStart) / 1000) + 's');
        console.groupEnd();
    }
} 