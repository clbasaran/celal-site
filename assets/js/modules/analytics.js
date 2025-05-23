/*
 * ============================================================================
 * ANALYTICS MODULE
 * Advanced Analytics and Performance Tracking System
 * ============================================================================
 * Features:
 * - Real-time User Analytics
 * - Performance Monitoring
 * - Custom Event Tracking
 * - User Behavior Analysis
 * - A/B Testing Support
 * - Privacy-compliant Tracking
 * ============================================================================
 */

class Analytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.startTime = Date.now();
        this.events = [];
        this.pageViews = [];
        this.performanceMetrics = {};
        this.userBehavior = {
            scrollDepth: 0,
            timeOnPage: 0,
            interactions: 0,
            clicks: 0,
            hovers: 0
        };
        
        // Privacy settings
        this.privacySettings = {
            cookieConsent: false,
            analyticsEnabled: true,
            personalDataCollection: false
        };
        
        // Configuration
        this.config = {
            autoTrack: true,
            trackPageViews: true,
            trackClicks: true,
            trackScroll: true,
            trackPerformance: true,
            trackErrors: true,
            batchSize: 10,
            flushInterval: 30000, // 30 seconds
            apiEndpoint: null, // Would be your analytics endpoint
            debug: false
        };
        
        // Buffer for batching events
        this.eventBuffer = [];
        this.lastFlush = Date.now();
        
        this.init();
    }
    
    init() {
        this.loadPrivacySettings();
        
        if (!this.privacySettings.analyticsEnabled) {
            console.log('📊 Analytics disabled by user preference');
            return;
        }
        
        this.setupEventListeners();
        this.startPerformanceMonitoring();
        this.trackPageView();
        this.startSessionTracking();
        
        // Start periodic flush
        setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
        
        console.log('📊 Analytics initialized');
    }
    
    setupEventListeners() {
        // Page visibility
        document.addEventListener('visibilitychange', () => {
            this.trackEvent('page_visibility', {
                state: document.hidden ? 'hidden' : 'visible',
                timestamp: Date.now()
            });
        });
        
        // Scroll tracking
        if (this.config.trackScroll) {
            this.setupScrollTracking();
        }
        
        // Click tracking
        if (this.config.trackClicks) {
            this.setupClickTracking();
        }
        
        // Error tracking
        if (this.config.trackErrors) {
            this.setupErrorTracking();
        }
        
        // Form tracking
        this.setupFormTracking();
        
        // Before unload
        window.addEventListener('beforeunload', () => {
            this.trackSessionEnd();
            this.flush(true); // Force flush
        });
        
        // Interaction tracking
        document.addEventListener('mousemove', this.throttle(() => {
            this.userBehavior.interactions++;
        }, 1000));
        
        document.addEventListener('keydown', () => {
            this.userBehavior.interactions++;
        });
        
        // Hover tracking
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest('button, a, .interactive')) {
                this.userBehavior.hovers++;
            }
        });
    }
    
    setupScrollTracking() {
        let maxScrollDepth = 0;
        
        const trackScroll = this.throttle(() => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScrollDepth) {
                maxScrollDepth = scrollPercent;
                this.userBehavior.scrollDepth = scrollPercent;
                
                // Track milestone scroll depths
                if (scrollPercent >= 25 && scrollPercent < 50) {
                    this.trackEvent('scroll_depth', { depth: '25%' });
                } else if (scrollPercent >= 50 && scrollPercent < 75) {
                    this.trackEvent('scroll_depth', { depth: '50%' });
                } else if (scrollPercent >= 75 && scrollPercent < 100) {
                    this.trackEvent('scroll_depth', { depth: '75%' });
                } else if (scrollPercent >= 100) {
                    this.trackEvent('scroll_depth', { depth: '100%' });
                }
            }
        }, 100);
        
        window.addEventListener('scroll', trackScroll);
    }
    
    setupClickTracking() {
        document.addEventListener('click', (e) => {
            this.userBehavior.clicks++;
            
            const element = e.target;
            const elementData = this.getElementData(element);
            
            this.trackEvent('click', {
                ...elementData,
                timestamp: Date.now(),
                coordinates: {
                    x: e.clientX,
                    y: e.clientY
                }
            });
            
            // Special tracking for important elements
            if (element.matches('button, a, .btn')) {
                this.trackEvent('interaction', {
                    type: 'button_click',
                    element: elementData.tagName,
                    text: elementData.text,
                    url: elementData.href
                });
            }
        });
    }
    
    setupErrorTracking() {
        window.addEventListener('error', (e) => {
            this.trackEvent('javascript_error', {
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                column: e.colno,
                stack: e.error?.stack,
                timestamp: Date.now()
            });
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.trackEvent('promise_rejection', {
                reason: e.reason?.toString(),
                stack: e.reason?.stack,
                timestamp: Date.now()
            });
        });
    }
    
    setupFormTracking() {
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.tagName === 'FORM') {
                const formData = {
                    id: form.id,
                    action: form.action,
                    method: form.method,
                    fields: form.elements.length
                };
                
                this.trackEvent('form_submit', formData);
            }
        });
        
        // Track form field interactions
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('input, textarea, select')) {
                this.trackEvent('form_field_focus', {
                    type: e.target.type,
                    name: e.target.name,
                    id: e.target.id
                });
            }
        });
    }
    
    startPerformanceMonitoring() {
        // Web Vitals tracking
        this.trackWebVitals();
        
        // Custom performance metrics
        this.trackCustomMetrics();
        
        // Resource timing
        setTimeout(() => {
            this.trackResourceTiming();
        }, 1000);
    }
    
    trackWebVitals() {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            this.performanceMetrics.lcp = lastEntry.startTime;
            this.trackEvent('web_vital', {
                metric: 'LCP',
                value: lastEntry.startTime,
                rating: this.getRating(lastEntry.startTime, [2500, 4000])
            });
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // First Input Delay (FID)
        new PerformanceObserver((list) => {
            const firstInput = list.getEntries()[0];
            
            this.performanceMetrics.fid = firstInput.processingStart - firstInput.startTime;
            this.trackEvent('web_vital', {
                metric: 'FID',
                value: firstInput.processingStart - firstInput.startTime,
                rating: this.getRating(firstInput.processingStart - firstInput.startTime, [100, 300])
            });
        }).observe({ entryTypes: ['first-input'] });
        
        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            
            this.performanceMetrics.cls = clsValue;
            this.trackEvent('web_vital', {
                metric: 'CLS',
                value: clsValue,
                rating: this.getRating(clsValue, [0.1, 0.25])
            });
        }).observe({ entryTypes: ['layout-shift'] });
    }
    
    trackCustomMetrics() {
        // DOM Content Loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.performanceMetrics.domContentLoaded = performance.now();
        });
        
        // Window Load
        window.addEventListener('load', () => {
            this.performanceMetrics.windowLoad = performance.now();
            
            // Navigation timing
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.performanceMetrics.navigation = {
                    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                    connection: navigation.connectEnd - navigation.connectStart,
                    request: navigation.responseStart - navigation.requestStart,
                    response: navigation.responseEnd - navigation.responseStart,
                    dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    load: navigation.loadEventEnd - navigation.loadEventStart
                };
                
                this.trackEvent('navigation_timing', this.performanceMetrics.navigation);
            }
        });
    }
    
    trackResourceTiming() {
        const resources = performance.getEntriesByType('resource');
        const resourceMetrics = {
            total: resources.length,
            sizes: {},
            timing: {}
        };
        
        resources.forEach(resource => {
            const type = this.getResourceType(resource.name);
            
            if (!resourceMetrics.sizes[type]) {
                resourceMetrics.sizes[type] = { count: 0, totalSize: 0 };
            }
            
            resourceMetrics.sizes[type].count++;
            resourceMetrics.sizes[type].totalSize += resource.transferSize || 0;
            
            if (resource.duration > 1000) { // Track slow resources
                this.trackEvent('slow_resource', {
                    name: resource.name,
                    type: type,
                    duration: resource.duration,
                    size: resource.transferSize
                });
            }
        });
        
        this.trackEvent('resource_timing', resourceMetrics);
    }
    
    startSessionTracking() {
        // Update time on page every minute
        setInterval(() => {
            this.userBehavior.timeOnPage = Math.floor((Date.now() - this.startTime) / 1000);
        }, 60000);
        
        // Track engagement score
        setInterval(() => {
            const engagementScore = this.calculateEngagementScore();
            this.trackEvent('engagement', {
                score: engagementScore,
                scrollDepth: this.userBehavior.scrollDepth,
                timeOnPage: this.userBehavior.timeOnPage,
                interactions: this.userBehavior.interactions
            });
        }, 120000); // Every 2 minutes
    }
    
    calculateEngagementScore() {
        const timeWeight = Math.min(this.userBehavior.timeOnPage / 300, 1); // Max at 5 minutes
        const scrollWeight = this.userBehavior.scrollDepth / 100;
        const interactionWeight = Math.min(this.userBehavior.interactions / 100, 1);
        
        return Math.round((timeWeight + scrollWeight + interactionWeight) / 3 * 100);
    }
    
    // Public tracking methods
    trackEvent(eventName, properties = {}) {
        if (!this.privacySettings.analyticsEnabled) return;
        
        const event = {
            id: this.generateEventId(),
            sessionId: this.sessionId,
            userId: this.userId,
            event: eventName,
            properties: {
                ...properties,
                url: window.location.href,
                referrer: document.referrer,
                userAgent: navigator.userAgent,
                timestamp: Date.now(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
        
        this.events.push(event);
        this.eventBuffer.push(event);
        
        if (this.config.debug) {
            console.log('📊 Event tracked:', event);
        }
        
        // Auto flush if buffer is full
        if (this.eventBuffer.length >= this.config.batchSize) {
            this.flush();
        }
    }
    
    trackPageView(page = null) {
        const pageData = {
            page: page || window.location.pathname,
            title: document.title,
            url: window.location.href,
            referrer: document.referrer,
            timestamp: Date.now()
        };
        
        this.pageViews.push(pageData);
        this.trackEvent('page_view', pageData);
    }
    
    trackTiming(name, startTime, endTime = null) {
        const duration = (endTime || Date.now()) - startTime;
        
        this.trackEvent('timing', {
            name: name,
            duration: duration,
            startTime: startTime,
            endTime: endTime || Date.now()
        });
    }
    
    trackConversion(goalName, value = null) {
        this.trackEvent('conversion', {
            goal: goalName,
            value: value,
            timestamp: Date.now()
        });
    }
    
    trackUserProperty(key, value) {
        this.trackEvent('user_property', {
            property: key,
            value: value
        });
    }
    
    trackSessionEnd() {
        const sessionData = {
            duration: Date.now() - this.startTime,
            pageViews: this.pageViews.length,
            events: this.events.length,
            scrollDepth: this.userBehavior.scrollDepth,
            interactions: this.userBehavior.interactions,
            engagementScore: this.calculateEngagementScore()
        };
        
        this.trackEvent('session_end', sessionData);
    }
    
    // A/B Testing
    getExperimentVariant(experimentName, variants = ['A', 'B']) {
        const storageKey = `experiment_${experimentName}`;
        let variant = localStorage.getItem(storageKey);
        
        if (!variant) {
            variant = variants[Math.floor(Math.random() * variants.length)];
            localStorage.setItem(storageKey, variant);
            
            this.trackEvent('experiment_assignment', {
                experiment: experimentName,
                variant: variant
            });
        }
        
        return variant;
    }
    
    // Privacy controls
    setPrivacySettings(settings) {
        this.privacySettings = { ...this.privacySettings, ...settings };
        localStorage.setItem('analytics_privacy', JSON.stringify(this.privacySettings));
        
        if (!settings.analyticsEnabled) {
            this.events = [];
            this.eventBuffer = [];
        }
    }
    
    loadPrivacySettings() {
        try {
            const saved = localStorage.getItem('analytics_privacy');
            if (saved) {
                this.privacySettings = { ...this.privacySettings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load privacy settings:', error);
        }
    }
    
    // Data management
    flush(force = false) {
        if (this.eventBuffer.length === 0) return;
        
        const shouldFlush = force || 
                           this.eventBuffer.length >= this.config.batchSize ||
                           (Date.now() - this.lastFlush) >= this.config.flushInterval;
        
        if (shouldFlush) {
            const eventsToSend = [...this.eventBuffer];
            this.eventBuffer = [];
            this.lastFlush = Date.now();
            
            if (this.config.apiEndpoint) {
                this.sendEvents(eventsToSend);
            } else if (this.config.debug) {
                console.log('📊 Events to send:', eventsToSend);
            }
        }
    }
    
    async sendEvents(events) {
        try {
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events: events,
                    sessionId: this.sessionId,
                    userId: this.userId
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            if (this.config.debug) {
                console.log('📊 Events sent successfully');
            }
        } catch (error) {
            console.error('Failed to send analytics events:', error);
            
            // Re-add events to buffer for retry
            this.eventBuffer.unshift(...events);
        }
    }
    
    // Utility methods
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateEventId() {
        return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getUserId() {
        let userId = localStorage.getItem('analytics_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('analytics_user_id', userId);
        }
        return userId;
    }
    
    getElementData(element) {
        return {
            tagName: element.tagName?.toLowerCase(),
            id: element.id,
            className: element.className,
            text: element.textContent?.trim().substring(0, 100),
            href: element.href,
            type: element.type,
            name: element.name
        };
    }
    
    getResourceType(url) {
        if (url.match(/\.(js)$/)) return 'script';
        if (url.match(/\.(css)$/)) return 'stylesheet';
        if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
        return 'other';
    }
    
    getRating(value, thresholds) {
        if (value <= thresholds[0]) return 'good';
        if (value <= thresholds[1]) return 'needs-improvement';
        return 'poor';
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Public API
    getSessionData() {
        return {
            sessionId: this.sessionId,
            userId: this.userId,
            startTime: this.startTime,
            duration: Date.now() - this.startTime,
            pageViews: this.pageViews.length,
            events: this.events.length,
            userBehavior: this.userBehavior,
            performanceMetrics: this.performanceMetrics
        };
    }
    
    exportData() {
        return {
            session: this.getSessionData(),
            events: this.events,
            pageViews: this.pageViews,
            privacySettings: this.privacySettings
        };
    }
    
    clearData() {
        this.events = [];
        this.pageViews = [];
        this.eventBuffer = [];
        localStorage.removeItem('analytics_user_id');
        localStorage.removeItem('analytics_privacy');
        
        // Clear experiment data
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('experiment_')) {
                localStorage.removeItem(key);
            }
        });
    }
    
    // Debug methods
    debug(enable = true) {
        this.config.debug = enable;
        
        if (enable) {
            console.log('📊 Analytics Debug Mode Enabled');
            console.log('Current session:', this.getSessionData());
        }
    }
    
    getStats() {
        return {
            eventsTracked: this.events.length,
            pageViews: this.pageViews.length,
            sessionDuration: Date.now() - this.startTime,
            userBehavior: this.userBehavior,
            performanceMetrics: this.performanceMetrics,
            bufferSize: this.eventBuffer.length
        };
    }
}

// Initialize and export
const analytics = new Analytics();

export default analytics; 