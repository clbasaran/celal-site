/*
 * ============================================================================
 * PERFORMANCE MONITOR MODULE
 * Real-time Performance Monitoring and Optimization System
 * ============================================================================
 * Features:
 * - Real-time FPS Monitoring
 * - Memory Usage Tracking
 * - CPU Performance Analysis
 * - Network Performance Monitoring
 * - Render Performance Optimization
 * - Performance Budget Alerts
 * ============================================================================
 */

class PerformanceMonitor {
    constructor() {
        this.isMonitoring = false;
        this.metrics = {
            fps: {
                current: 0,
                average: 0,
                min: 999,
                max: 0,
                history: []
            },
            memory: {
                used: 0,
                total: 0,
                percentage: 0,
                history: []
            },
            render: {
                paintTime: 0,
                layoutTime: 0,
                scriptTime: 0,
                history: []
            },
            network: {
                requests: 0,
                totalSize: 0,
                averageTime: 0,
                failed: 0
            }
        };
        
        // Performance budgets (milliseconds)
        this.budgets = {
            fps: { min: 30, target: 60 },
            memory: { max: 500 * 1024 * 1024 }, // 500MB
            paint: { max: 16 }, // 16ms for 60fps
            layout: { max: 10 },
            script: { max: 50 }
        };
        
        // Monitoring settings
        this.settings = {
            interval: 1000, // 1 second
            historyLength: 60, // Keep 60 data points
            enableAlerts: true,
            enableOptimizations: true,
            debugMode: false
        };
        
        // Performance observers
        this.observers = new Map();
        this.rafId = null;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        
        this.init();
    }
    
    init() {
        this.setupPerformanceObservers();
        this.setupMemoryMonitoring();
        this.setupNetworkMonitoring();
        this.createPerformanceOverlay();
        
        // Auto-start monitoring
        this.start();
        
        console.log('⚡ Performance Monitor initialized');
    }
    
    setupPerformanceObservers() {
        // Paint timing observer
        if ('PerformanceObserver' in window) {
            try {
                const paintObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.entryType === 'paint') {
                            this.metrics.render.paintTime = entry.startTime;
                            this.trackRenderMetric('paint', entry.startTime);
                        }
                    });
                });
                paintObserver.observe({ entryTypes: ['paint'] });
                this.observers.set('paint', paintObserver);
            } catch (e) {
                console.warn('Paint observer not supported');
            }
            
            // Layout shift observer
            try {
                const layoutObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                            this.metrics.render.layoutTime += entry.value;
                            this.trackRenderMetric('layout', entry.value);
                        }
                    });
                });
                layoutObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.set('layout', layoutObserver);
            } catch (e) {
                console.warn('Layout shift observer not supported');
            }
            
            // Long task observer
            try {
                const longTaskObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.entryType === 'longtask') {
                            this.metrics.render.scriptTime = entry.duration;
                            this.trackRenderMetric('script', entry.duration);
                            
                            if (this.settings.enableAlerts && entry.duration > this.budgets.script.max) {
                                this.alertPerformanceIssue('Long Task Detected', {
                                    duration: entry.duration,
                                    budget: this.budgets.script.max
                                });
                            }
                        }
                    });
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });
                this.observers.set('longtask', longTaskObserver);
            } catch (e) {
                console.warn('Long task observer not supported');
            }
        }
    }
    
    setupMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                this.metrics.memory = {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
                    history: this.addToHistory(this.metrics.memory.history, {
                        used: memory.usedJSHeapSize,
                        percentage: Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100),
                        timestamp: Date.now()
                    })
                };
                
                // Check memory budget
                if (this.settings.enableAlerts && memory.usedJSHeapSize > this.budgets.memory.max) {
                    this.alertPerformanceIssue('Memory Usage High', {
                        used: this.formatBytes(memory.usedJSHeapSize),
                        budget: this.formatBytes(this.budgets.memory.max)
                    });
                }
                
                // Auto garbage collection suggestion
                if (this.settings.enableOptimizations && this.metrics.memory.percentage > 90) {
                    this.suggestOptimization('memory', 'Consider reducing memory usage or triggering garbage collection');
                }
                
            }, this.settings.interval);
        }
    }
    
    setupNetworkMonitoring() {
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            this.metrics.network.requests++;
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // Update network metrics
                this.updateNetworkMetrics(duration, response.headers.get('content-length') || 0);
                
                return response;
            } catch (error) {
                this.metrics.network.failed++;
                throw error;
            }
        };
        
        // Monitor XMLHttpRequest
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
            this._startTime = performance.now();
            return originalXHROpen.apply(this, args);
        };
        
        const originalXHRSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('loadend', function() {
                const duration = performance.now() - this._startTime;
                window.performanceMonitor.updateNetworkMetrics(duration, this.responseText?.length || 0);
            });
            
            return originalXHRSend.apply(this, args);
        };
    }
    
    updateNetworkMetrics(duration, size) {
        this.metrics.network.totalSize += parseInt(size) || 0;
        
        // Calculate average response time
        const currentAvg = this.metrics.network.averageTime || 0;
        const requestCount = this.metrics.network.requests;
        this.metrics.network.averageTime = (currentAvg * (requestCount - 1) + duration) / requestCount;
        
        // Alert for slow requests
        if (this.settings.enableAlerts && duration > 2000) { // 2 seconds
            this.alertPerformanceIssue('Slow Network Request', {
                duration: Math.round(duration),
                url: 'Request'
            });
        }
    }
    
    setupFPSMonitoring() {
        const measureFPS = (currentTime) => {
            if (this.lastFrameTime === 0) {
                this.lastFrameTime = currentTime;
                this.frameCount = 0;
            }
            
            this.frameCount++;
            const delta = currentTime - this.lastFrameTime;
            
            if (delta >= 1000) { // Calculate FPS every second
                const fps = Math.round((this.frameCount * 1000) / delta);
                
                this.metrics.fps.current = fps;
                this.metrics.fps.min = Math.min(this.metrics.fps.min, fps);
                this.metrics.fps.max = Math.max(this.metrics.fps.max, fps);
                
                // Calculate average FPS
                this.metrics.fps.history = this.addToHistory(this.metrics.fps.history, {
                    fps: fps,
                    timestamp: Date.now()
                });
                
                const avgFPS = this.metrics.fps.history.reduce((sum, entry) => sum + entry.fps, 0) / this.metrics.fps.history.length;
                this.metrics.fps.average = Math.round(avgFPS);
                
                // Check FPS budget
                if (this.settings.enableAlerts && fps < this.budgets.fps.min) {
                    this.alertPerformanceIssue('Low FPS Detected', {
                        current: fps,
                        target: this.budgets.fps.target
                    });
                }
                
                this.lastFrameTime = currentTime;
                this.frameCount = 0;
            }
            
            if (this.isMonitoring) {
                this.rafId = requestAnimationFrame(measureFPS);
            }
        };
        
        this.rafId = requestAnimationFrame(measureFPS);
    }
    
    trackRenderMetric(type, value) {
        this.metrics.render.history = this.addToHistory(this.metrics.render.history, {
            type: type,
            value: value,
            timestamp: Date.now()
        });
    }
    
    addToHistory(history, entry) {
        history.push(entry);
        if (history.length > this.settings.historyLength) {
            history.shift();
        }
        return history;
    }
    
    createPerformanceOverlay() {
        if (this.settings.debugMode) {
            const overlay = document.createElement('div');
            overlay.id = 'performance-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                font-size: 12px;
                z-index: 10000;
                min-width: 200px;
            `;
            
            document.body.appendChild(overlay);
            
            // Update overlay every second
            setInterval(() => {
                this.updateOverlay(overlay);
            }, 1000);
        }
    }
    
    updateOverlay(overlay) {
        const memory = this.metrics.memory;
        const fps = this.metrics.fps;
        const network = this.metrics.network;
        
        overlay.innerHTML = `
            <div><strong>Performance Monitor</strong></div>
            <div>FPS: ${fps.current} (avg: ${fps.average})</div>
            <div>Memory: ${this.formatBytes(memory.used)} (${memory.percentage}%)</div>
            <div>Network: ${network.requests} requests</div>
            <div>Avg Response: ${Math.round(network.averageTime)}ms</div>
            <div>Failed Requests: ${network.failed}</div>
        `;
    }
    
    alertPerformanceIssue(title, details) {
        if (!this.settings.enableAlerts) return;
        
        const message = `${title}\n${Object.entries(details).map(([key, value]) => `${key}: ${value}`).join('\n')}`;
        
        console.warn('🚨 Performance Alert:', title, details);
        
        // Could integrate with notification system
        this.dispatchEvent('performance-alert', { title, details, message });
    }
    
    suggestOptimization(type, suggestion) {
        console.info('💡 Performance Optimization:', suggestion);
        this.dispatchEvent('performance-suggestion', { type, suggestion });
    }
    
    dispatchEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }
    
    // Performance analysis methods
    analyzePerformance() {
        const analysis = {
            overall: 'good',
            issues: [],
            suggestions: [],
            score: 100
        };
        
        // FPS Analysis
        if (this.metrics.fps.average < this.budgets.fps.min) {
            analysis.issues.push('Low FPS detected');
            analysis.suggestions.push('Optimize animations and reduce DOM manipulations');
            analysis.score -= 20;
        }
        
        // Memory Analysis
        if (this.metrics.memory.percentage > 80) {
            analysis.issues.push('High memory usage');
            analysis.suggestions.push('Check for memory leaks and optimize data structures');
            analysis.score -= 15;
        }
        
        // Network Analysis
        if (this.metrics.network.averageTime > 1000) {
            analysis.issues.push('Slow network requests');
            analysis.suggestions.push('Optimize API calls and implement caching');
            analysis.score -= 10;
        }
        
        // Render Analysis
        const longTasks = this.metrics.render.history.filter(entry => 
            entry.type === 'script' && entry.value > this.budgets.script.max
        );
        
        if (longTasks.length > 0) {
            analysis.issues.push('Long JavaScript tasks detected');
            analysis.suggestions.push('Break up long-running scripts and use web workers');
            analysis.score -= 15;
        }
        
        // Determine overall rating
        if (analysis.score >= 90) analysis.overall = 'excellent';
        else if (analysis.score >= 70) analysis.overall = 'good';
        else if (analysis.score >= 50) analysis.overall = 'fair';
        else analysis.overall = 'poor';
        
        return analysis;
    }
    
    generateReport() {
        const analysis = this.analyzePerformance();
        
        return {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            analysis: analysis,
            budgets: this.budgets,
            recommendations: this.generateRecommendations(analysis)
        };
    }
    
    generateRecommendations(analysis) {
        const recommendations = [];
        
        if (this.metrics.fps.average < 50) {
            recommendations.push({
                type: 'fps',
                priority: 'high',
                title: 'Optimize Frame Rate',
                description: 'Reduce complex animations and DOM updates',
                impact: 'User experience'
            });
        }
        
        if (this.metrics.memory.percentage > 75) {
            recommendations.push({
                type: 'memory',
                priority: 'medium',
                title: 'Optimize Memory Usage',
                description: 'Review memory allocation and garbage collection',
                impact: 'Application stability'
            });
        }
        
        return recommendations;
    }
    
    // Optimization methods
    optimizePerformance() {
        const optimizations = [];
        
        // Image lazy loading
        this.enableImageLazyLoading();
        optimizations.push('Image lazy loading enabled');
        
        // Passive event listeners
        this.optimizeEventListeners();
        optimizations.push('Event listeners optimized');
        
        // CSS containment
        this.applyCSSContainment();
        optimizations.push('CSS containment applied');
        
        return optimizations;
    }
    
    enableImageLazyLoading() {
        const images = document.querySelectorAll('img[src]:not([loading])');
        images.forEach(img => {
            if ('loading' in HTMLImageElement.prototype) {
                img.loading = 'lazy';
            }
        });
    }
    
    optimizeEventListeners() {
        // Add passive listeners where appropriate
        const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'scroll'];
        
        passiveEvents.forEach(eventType => {
            document.addEventListener(eventType, () => {}, { passive: true });
        });
    }
    
    applyCSSContainment() {
        // Apply CSS containment to improve rendering performance
        const style = document.createElement('style');
        style.textContent = `
            .performance-container {
                contain: layout style paint;
            }
            .performance-strict {
                contain: strict;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Control methods
    start() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.setupFPSMonitoring();
        console.log('⚡ Performance monitoring started');
    }
    
    stop() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        console.log('⚡ Performance monitoring stopped');
    }
    
    reset() {
        this.metrics = {
            fps: { current: 0, average: 0, min: 999, max: 0, history: [] },
            memory: { used: 0, total: 0, percentage: 0, history: [] },
            render: { paintTime: 0, layoutTime: 0, scriptTime: 0, history: [] },
            network: { requests: 0, totalSize: 0, averageTime: 0, failed: 0 }
        };
        
        console.log('⚡ Performance metrics reset');
    }
    
    // Utility methods
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    formatDuration(ms) {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    }
    
    // Public API
    getMetrics() {
        return { ...this.metrics };
    }
    
    getReport() {
        return this.generateReport();
    }
    
    setSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        
        if (newSettings.debugMode !== undefined) {
            if (newSettings.debugMode && !document.getElementById('performance-overlay')) {
                this.createPerformanceOverlay();
            } else if (!newSettings.debugMode) {
                const overlay = document.getElementById('performance-overlay');
                if (overlay) overlay.remove();
            }
        }
    }
    
    setBudgets(newBudgets) {
        this.budgets = { ...this.budgets, ...newBudgets };
    }
    
    // Debug methods
    debug() {
        console.group('🔍 Performance Monitor Debug');
        console.log('Current Metrics:', this.getMetrics());
        console.log('Performance Analysis:', this.analyzePerformance());
        console.log('Settings:', this.settings);
        console.log('Budgets:', this.budgets);
        console.groupEnd();
    }
    
    enableDebugMode() {
        this.setSettings({ debugMode: true });
        console.log('🔍 Performance Monitor debug mode enabled');
    }
    
    disableDebugMode() {
        this.setSettings({ debugMode: false });
        console.log('🔍 Performance Monitor debug mode disabled');
    }
}

// Initialize and export
const performanceMonitor = new PerformanceMonitor();

// Make it globally available for debugging
window.performanceMonitor = performanceMonitor;

export default performanceMonitor; 