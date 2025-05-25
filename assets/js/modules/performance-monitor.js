/**
 * Performance Monitor Module
 * Comprehensive performance monitoring with Web Vitals, resource timing,
 * user interactions, and detailed analytics
 * 
 * @version 2.0.0
 * @author Celal Başaran
 * @license MIT
 */

class PerformanceMonitor {
    constructor(options = {}) {
        this.options = {
            enableWebVitals: options.enableWebVitals !== false,
            enableResourceTiming: options.enableResourceTiming !== false,
            enableUserTiming: options.enableUserTiming !== false,
            enableNavigationTiming: options.enableNavigationTiming !== false,
            enableMemoryMonitoring: options.enableMemoryMonitoring !== false,
            enableNetworkMonitoring: options.enableNetworkMonitoring !== false,
            enableErrorTracking: options.enableErrorTracking !== false,
            reportingInterval: options.reportingInterval || 30000,
            endpoint: options.endpoint || '/api/performance',
            bufferSize: options.bufferSize || 100,
            enableDebug: options.enableDebug || false,
            ...options
        };

        this.metrics = {
            webVitals: new Map(),
            resources: [],
            userTimings: [],
            navigationTiming: null,
            memoryUsage: [],
            networkInfo: null,
            errors: [],
            customMetrics: new Map()
        };

        this.observers = new Map();
        this.startTime = performance.now();
        this.sessionId = this.generateSessionId();
        this.isSupported = this.checkSupport();
        
        this.init();
    }

    init() {
        if (!this.isSupported.basic) {
            console.warn('Performance monitoring not supported in this browser');
            return;
        }

        try {
            this.setupWebVitals();
            this.setupResourceTiming();
            this.setupUserTiming();
            this.setupNavigationTiming();
            this.setupMemoryMonitoring();
            this.setupNetworkMonitoring();
            this.setupErrorTracking();
            this.setupReporting();
            
            this.log('Performance Monitor initialized');
        } catch (error) {
            console.error('Performance Monitor initialization failed:', error);
        }
    }

    checkSupport() {
        return {
            basic: 'performance' in window,
            webVitals: 'PerformanceObserver' in window,
            resourceTiming: 'PerformanceResourceTiming' in window,
            navigationTiming: 'PerformanceNavigationTiming' in window,
            memory: 'memory' in performance,
            connection: 'connection' in navigator
        };
    }

    // ===== WEB VITALS MONITORING =====

    setupWebVitals() {
        if (!this.options.enableWebVitals || !this.isSupported.webVitals) return;

        // Largest Contentful Paint (LCP)
        this.observeMetric('largest-contentful-paint', (entries) => {
            const lastEntry = entries[entries.length - 1];
            this.recordWebVital('LCP', lastEntry.startTime, {
                element: lastEntry.element?.tagName,
                url: lastEntry.url,
                size: lastEntry.size
            });
        });

        // First Input Delay (FID)
        this.observeMetric('first-input', (entries) => {
            const firstEntry = entries[0];
            this.recordWebVital('FID', firstEntry.processingStart - firstEntry.startTime, {
                eventType: firstEntry.name,
                target: firstEntry.target?.tagName
            });
        });

        // Cumulative Layout Shift (CLS)
        this.observeMetric('layout-shift', (entries) => {
            let clsValue = 0;
            entries.forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            });
            
            if (clsValue > 0) {
                this.recordWebVital('CLS', clsValue, {
                    entryCount: entries.length
                });
            }
        });

        // Time to First Byte (TTFB)
        this.observeMetric('navigation', (entries) => {
            const navigationEntry = entries[0];
            const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
            this.recordWebVital('TTFB', ttfb, {
                type: navigationEntry.type,
                redirectCount: navigationEntry.redirectCount
            });
        });

        // First Contentful Paint (FCP)
        this.observeMetric('paint', (entries) => {
            entries.forEach(entry => {
                if (entry.name === 'first-contentful-paint') {
                    this.recordWebVital('FCP', entry.startTime);
                }
            });
        });
    }

    observeMetric(type, callback) {
        try {
            const observer = new PerformanceObserver((list) => {
                callback(list.getEntries());
            });
            
            observer.observe({ type, buffered: true });
            this.observers.set(type, observer);
        } catch (error) {
            this.log(`Failed to observe ${type}:`, error);
        }
    }

    recordWebVital(name, value, details = {}) {
        const vital = {
            name,
            value: Math.round(value),
            timestamp: Date.now(),
            sessionId: this.sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...details
        };

        this.metrics.webVitals.set(name, vital);
        this.log(`Web Vital recorded: ${name} = ${value}ms`, vital);
        
        // Dispatch custom event
        this.dispatchEvent('webVital', vital);
    }

    // ===== RESOURCE TIMING =====

    setupResourceTiming() {
        if (!this.options.enableResourceTiming || !this.isSupported.resourceTiming) return;

        this.observeMetric('resource', (entries) => {
            entries.forEach(entry => this.processResourceEntry(entry));
        });

        // Monitor existing resources
        const existingResources = performance.getEntriesByType('resource');
        existingResources.forEach(entry => this.processResourceEntry(entry));
    }

    processResourceEntry(entry) {
        const resource = {
            name: entry.name,
            type: this.getResourceType(entry),
            duration: Math.round(entry.duration),
            size: entry.transferSize || 0,
            timing: {
                dns: Math.round(entry.domainLookupEnd - entry.domainLookupStart),
                tcp: Math.round(entry.connectEnd - entry.connectStart),
                ssl: entry.secureConnectionStart > 0 ? 
                     Math.round(entry.connectEnd - entry.secureConnectionStart) : 0,
                ttfb: Math.round(entry.responseStart - entry.requestStart),
                download: Math.round(entry.responseEnd - entry.responseStart)
            },
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
            timestamp: Date.now(),
            sessionId: this.sessionId
        };

        this.metrics.resources.push(resource);
        
        // Keep buffer size manageable
        if (this.metrics.resources.length > this.options.bufferSize) {
            this.metrics.resources.shift();
        }

        this.log(`Resource loaded: ${resource.name} (${resource.duration}ms)`, resource);
        this.dispatchEvent('resourceLoaded', resource);
    }

    getResourceType(entry) {
        if (entry.initiatorType) return entry.initiatorType;
        
        const url = new URL(entry.name);
        const extension = url.pathname.split('.').pop().toLowerCase();
        
        const typeMap = {
            'js': 'script',
            'css': 'link',
            'jpg': 'img', 'jpeg': 'img', 'png': 'img', 'gif': 'img', 'webp': 'img', 'svg': 'img',
            'woff': 'font', 'woff2': 'font', 'ttf': 'font', 'otf': 'font',
            'mp4': 'video', 'webm': 'video', 'ogg': 'video',
            'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio'
        };
        
        return typeMap[extension] || 'other';
    }

    // ===== USER TIMING =====

    setupUserTiming() {
        if (!this.options.enableUserTiming) return;

        this.observeMetric('measure', (entries) => {
            entries.forEach(entry => {
                const timing = {
                    name: entry.name,
                    duration: Math.round(entry.duration),
                    startTime: Math.round(entry.startTime),
                    timestamp: Date.now(),
                    sessionId: this.sessionId
                };

                this.metrics.userTimings.push(timing);
                this.log(`User timing: ${timing.name} (${timing.duration}ms)`, timing);
                this.dispatchEvent('userTiming', timing);
            });
        });
    }

    // ===== NAVIGATION TIMING =====

    setupNavigationTiming() {
        if (!this.options.enableNavigationTiming) return;

        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigationEntry = performance.getEntriesByType('navigation')[0];
                if (navigationEntry) {
                    this.processNavigationTiming(navigationEntry);
                }
            }, 0);
        });
    }

    processNavigationTiming(entry) {
        this.metrics.navigationTiming = {
            type: entry.type,
            redirectCount: entry.redirectCount,
            timing: {
                redirect: Math.round(entry.redirectEnd - entry.redirectStart),
                dns: Math.round(entry.domainLookupEnd - entry.domainLookupStart),
                tcp: Math.round(entry.connectEnd - entry.connectStart),
                ssl: entry.secureConnectionStart > 0 ? 
                     Math.round(entry.connectEnd - entry.secureConnectionStart) : 0,
                request: Math.round(entry.responseStart - entry.requestStart),
                response: Math.round(entry.responseEnd - entry.responseStart),
                domProcessing: Math.round(entry.domContentLoadedEventStart - entry.responseEnd),
                domContentLoaded: Math.round(entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart),
                loadEvent: Math.round(entry.loadEventEnd - entry.loadEventStart),
                total: Math.round(entry.loadEventEnd - entry.fetchStart)
            },
            timestamp: Date.now(),
            sessionId: this.sessionId
        };

        this.log('Navigation timing recorded', this.metrics.navigationTiming);
        this.dispatchEvent('navigationTiming', this.metrics.navigationTiming);
    }

    // ===== MEMORY MONITORING =====

    setupMemoryMonitoring() {
        if (!this.options.enableMemoryMonitoring || !this.isSupported.memory) return;

        const recordMemory = () => {
            const memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                timestamp: Date.now(),
                sessionId: this.sessionId
            };

            this.metrics.memoryUsage.push(memory);
            
            // Keep only recent memory samples
            if (this.metrics.memoryUsage.length > 100) {
                this.metrics.memoryUsage.shift();
            }

            this.dispatchEvent('memoryUsage', memory);
        };

        // Record memory usage periodically
        setInterval(recordMemory, 10000);
        recordMemory(); // Initial recording
    }

    // ===== NETWORK MONITORING =====

    setupNetworkMonitoring() {
        if (!this.options.enableNetworkMonitoring || !this.isSupported.connection) return;

        const recordNetworkInfo = () => {
            const connection = navigator.connection;
            this.metrics.networkInfo = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData,
                timestamp: Date.now(),
                sessionId: this.sessionId
            };

            this.dispatchEvent('networkInfo', this.metrics.networkInfo);
        };

        connection.addEventListener('change', recordNetworkInfo);
        recordNetworkInfo(); // Initial recording
    }

    // ===== ERROR TRACKING =====

    setupErrorTracking() {
        if (!this.options.enableErrorTracking) return;

        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now(),
                sessionId: this.sessionId
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'promise',
                message: event.reason?.message || event.reason,
                stack: event.reason?.stack,
                timestamp: Date.now(),
                sessionId: this.sessionId
            });
        });
    }

    recordError(error) {
        this.metrics.errors.push(error);
        
        // Keep only recent errors
        if (this.metrics.errors.length > 50) {
            this.metrics.errors.shift();
        }

        this.log('Error recorded:', error);
        this.dispatchEvent('error', error);
    }

    // ===== CUSTOM METRICS =====

    startTiming(name) {
        performance.mark(`${name}-start`);
        return {
            end: () => this.endTiming(name)
        };
    }

    endTiming(name) {
        const endMark = `${name}-end`;
        performance.mark(endMark);
        performance.measure(name, `${name}-start`, endMark);
        
        const measure = performance.getEntriesByName(name, 'measure')[0];
        return measure ? measure.duration : 0;
    }

    recordCustomMetric(name, value, details = {}) {
        const metric = {
            name,
            value,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            ...details
        };

        this.metrics.customMetrics.set(name, metric);
        this.log(`Custom metric recorded: ${name} = ${value}`, metric);
        this.dispatchEvent('customMetric', metric);
    }

    // ===== REPORTING =====

    setupReporting() {
        if (!this.options.endpoint) return;

        setInterval(() => {
            this.sendReport();
        }, this.options.reportingInterval);

        // Send report on page unload
        window.addEventListener('beforeunload', () => {
            this.sendReport(true);
        });
    }

    async sendReport(isBeacon = false) {
        const report = this.generateReport();
        
        if (isBeacon && 'sendBeacon' in navigator) {
            navigator.sendBeacon(this.options.endpoint, JSON.stringify(report));
        } else {
            try {
                await fetch(this.options.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(report)
                });
            } catch (error) {
                this.log('Failed to send performance report:', error);
            }
        }
    }

    generateReport() {
        return {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            webVitals: Object.fromEntries(this.metrics.webVitals),
            navigationTiming: this.metrics.navigationTiming,
            networkInfo: this.metrics.networkInfo,
            resourceSummary: this.getResourceSummary(),
            memorySummary: this.getMemorySummary(),
            errorCount: this.metrics.errors.length,
            customMetrics: Object.fromEntries(this.metrics.customMetrics)
        };
    }

    getResourceSummary() {
        const resources = this.metrics.resources;
        const summary = {
            total: resources.length,
            totalSize: resources.reduce((sum, r) => sum + r.size, 0),
            averageDuration: resources.length > 0 ? 
                resources.reduce((sum, r) => sum + r.duration, 0) / resources.length : 0,
            byType: {}
        };

        resources.forEach(resource => {
            if (!summary.byType[resource.type]) {
                summary.byType[resource.type] = { count: 0, size: 0, duration: 0 };
            }
            summary.byType[resource.type].count++;
            summary.byType[resource.type].size += resource.size;
            summary.byType[resource.type].duration += resource.duration;
        });

        return summary;
    }

    getMemorySummary() {
        const memory = this.metrics.memoryUsage;
        if (memory.length === 0) return null;

        const latest = memory[memory.length - 1];
        const peak = memory.reduce((max, m) => Math.max(max, m.used), 0);
        
        return {
            current: latest.used,
            peak,
            limit: latest.limit,
            utilization: (latest.used / latest.limit) * 100
        };
    }

    // ===== PUBLIC API =====

    getMetrics() {
        return {
            webVitals: Object.fromEntries(this.metrics.webVitals),
            resources: [...this.metrics.resources],
            userTimings: [...this.metrics.userTimings],
            navigationTiming: this.metrics.navigationTiming,
            memoryUsage: [...this.metrics.memoryUsage],
            networkInfo: this.metrics.networkInfo,
            errors: [...this.metrics.errors],
            customMetrics: Object.fromEntries(this.metrics.customMetrics)
        };
    }

    getWebVitalsScore() {
        const vitals = this.metrics.webVitals;
        const scores = {};

        // LCP scoring (Good: <2.5s, Needs Improvement: 2.5s-4s, Poor: >4s)
        if (vitals.has('LCP')) {
            const lcp = vitals.get('LCP').value;
            scores.LCP = lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor';
        }

        // FID scoring (Good: <100ms, Needs Improvement: 100ms-300ms, Poor: >300ms)
        if (vitals.has('FID')) {
            const fid = vitals.get('FID').value;
            scores.FID = fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor';
        }

        // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
        if (vitals.has('CLS')) {
            const cls = vitals.get('CLS').value;
            scores.CLS = cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor';
        }

        return scores;
    }

    clearMetrics() {
        this.metrics.webVitals.clear();
        this.metrics.resources.length = 0;
        this.metrics.userTimings.length = 0;
        this.metrics.memoryUsage.length = 0;
        this.metrics.errors.length = 0;
        this.metrics.customMetrics.clear();
        this.metrics.navigationTiming = null;
        this.metrics.networkInfo = null;
    }

    // ===== UTILITIES =====

    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    dispatchEvent(type, detail) {
        const event = new CustomEvent(`performance:${type}`, {
            detail: { ...detail, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    log(...args) {
        if (this.options.enableDebug) {
            console.log('[PerformanceMonitor]', ...args);
        }
    }

    destroy() {
        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // Clear metrics
        this.clearMetrics();
        
        // Send final report
        if (this.options.endpoint) {
            this.sendReport(true);
        }
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.performanceMonitor = new PerformanceMonitor();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}

// Global access
window.PerformanceMonitor = PerformanceMonitor; 