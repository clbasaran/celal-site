/**
 * Portfolio OS - Session Manager Module
 * Apple Design Language V5
 * Advanced session tracking, visit analytics, and user behavior monitoring
 */

class SessionManager {
  constructor(options = {}) {
    this.options = {
      enableTracking: true,
      enableAnalytics: true,
      enableUserBehavior: true,
      enablePerformanceTracking: true,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      heartbeatInterval: 60 * 1000, // 1 minute
      maxSessions: 100,
      enableOfflineMode: true,
      enableCrossDomain: false,
      debugMode: false,
      ...options
    };

    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.sessionStartTime = Date.now();
    this.lastActivity = Date.now();
    this.pageViews = [];
    this.interactions = [];
    this.performanceMetrics = {};
    this.userAgent = this.parseUserAgent();
    this.deviceInfo = this.getDeviceInfo();
    this.isActive = true;
    this.heartbeatTimer = null;
    this.storageQuota = 0;
    
    this.init();
  }

  /**
   * Initialize session manager
   */
  async init() {
    try {
      await this.checkStorageQuota();
      this.loadExistingSessions();
      this.startSession();
      this.setupEventListeners();
      this.startHeartbeat();
      this.trackPageView();
      this.setupPerformanceTracking();
      this.setupUserBehaviorTracking();
      
      this.log('Session Manager initialized successfully');
      
    } catch (error) {
      this.log('Failed to initialize Session Manager:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    const counter = (this.getSessionCounter() + 1).toString(36);
    
    return `${timestamp}-${random}-${counter}`;
  }

  /**
   * Get or create user ID
   */
  getUserId() {
    let userId = localStorage.getItem('portfolio-user-id');
    
    if (!userId) {
      userId = 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2);
      localStorage.setItem('portfolio-user-id', userId);
    }
    
    return userId;
  }

  /**
   * Get session counter for unique session IDs
   */
  getSessionCounter() {
    const counter = parseInt(localStorage.getItem('session-counter') || '0');
    localStorage.setItem('session-counter', (counter + 1).toString());
    return counter;
  }

  /**
   * Check storage quota availability
   */
  async checkStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        this.storageQuota = estimate.quota || 0;
        this.storageUsage = estimate.usage || 0;
        
        this.log(`Storage quota: ${this.formatBytes(this.storageQuota)}, Used: ${this.formatBytes(this.storageUsage)}`);
      } catch (error) {
        this.log('Failed to check storage quota:', error);
      }
    }
  }

  /**
   * Load existing sessions from storage
   */
  loadExistingSessions() {
    try {
      const sessions = JSON.parse(localStorage.getItem('portfolio-sessions') || '[]');
      this.pastSessions = sessions.slice(-this.options.maxSessions);
      
      // Clean up old sessions
      this.cleanupOldSessions();
      
    } catch (error) {
      this.log('Failed to load existing sessions:', error);
      this.pastSessions = [];
    }
  }

  /**
   * Start new session
   */
  startSession() {
    this.currentSession = {
      id: this.sessionId,
      userId: this.userId,
      startTime: this.sessionStartTime,
      endTime: null,
      duration: 0,
      pageViews: [],
      interactions: [],
      referrer: document.referrer || 'direct',
      landingPage: window.location.href,
      exitPage: null,
      userAgent: this.userAgent,
      deviceInfo: this.deviceInfo,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      isActive: true,
      performanceMetrics: {},
      behaviorData: {
        clicks: 0,
        scrolls: 0,
        keystrokes: 0,
        focusChanges: 0,
        timeOnPage: 0,
        bounceRate: 0
      }
    };

    this.log('New session started:', this.sessionId);
  }

  /**
   * Parse user agent string
   */
  parseUserAgent() {
    const ua = navigator.userAgent;
    const parser = {
      browser: this.getBrowserInfo(ua),
      os: this.getOSInfo(ua),
      device: this.getDeviceType(ua),
      mobile: /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    };
    
    return parser;
  }

  /**
   * Get browser information
   */
  getBrowserInfo(ua) {
    const browsers = [
      { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
      { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
      { name: 'Safari', pattern: /Safari\/(\d+)/ },
      { name: 'Edge', pattern: /Edge\/(\d+)/ },
      { name: 'Opera', pattern: /Opera\/(\d+)/ }
    ];

    for (const browser of browsers) {
      const match = ua.match(browser.pattern);
      if (match) {
        return { name: browser.name, version: match[1] };
      }
    }

    return { name: 'Unknown', version: '0' };
  }

  /**
   * Get operating system information
   */
  getOSInfo(ua) {
    const systems = [
      { name: 'Windows', pattern: /Windows NT (\d+\.\d+)/ },
      { name: 'macOS', pattern: /Mac OS X (\d+[._]\d+)/ },
      { name: 'Linux', pattern: /Linux/ },
      { name: 'iOS', pattern: /OS (\d+_\d+)/ },
      { name: 'Android', pattern: /Android (\d+\.\d+)/ }
    ];

    for (const system of systems) {
      const match = ua.match(system.pattern);
      if (match) {
        return { name: system.name, version: match[1] || 'Unknown' };
      }
    }

    return { name: 'Unknown', version: '0' };
  }

  /**
   * Get device type
   */
  getDeviceType(ua) {
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  /**
   * Get device information
   */
  getDeviceInfo() {
    return {
      type: this.userAgent.device,
      mobile: this.userAgent.mobile,
      touchSupport: 'ontouchstart' in window,
      cookieEnabled: navigator.cookieEnabled,
      javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
      onlineStatus: navigator.onLine,
      connectionType: this.getConnectionType(),
      pixelRatio: window.devicePixelRatio || 1,
      colorDepth: screen.colorDepth,
      availableScreenSize: `${screen.availWidth}x${screen.availHeight}`
    };
  }

  /**
   * Get connection type information
   */
  getConnectionType() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      };
    }
    return null;
  }

  /**
   * Setup event listeners for tracking
   */
  setupEventListeners() {
    // Page visibility changes
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    
    // Before page unload
    window.addEventListener('beforeunload', () => this.endSession());
    
    // Page unload
    window.addEventListener('unload', () => this.endSession());
    
    // Online/offline status
    window.addEventListener('online', () => this.updateOnlineStatus(true));
    window.addEventListener('offline', () => this.updateOnlineStatus(false));
    
    // Page navigation
    window.addEventListener('popstate', () => this.trackPageView());
    
    // Focus and blur
    window.addEventListener('focus', () => this.handleWindowFocus());
    window.addEventListener('blur', () => this.handleWindowBlur());
    
    // User activity tracking
    if (this.options.enableUserBehavior) {
      this.setupActivityTracking();
    }
  }

  /**
   * Setup user activity tracking
   */
  setupActivityTracking() {
    const activityEvents = ['click', 'scroll', 'keypress', 'mousemove', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => this.updateLastActivity(), { passive: true });
    });

    // Specific behavior tracking
    document.addEventListener('click', (e) => this.trackClick(e));
    document.addEventListener('scroll', () => this.trackScroll(), { passive: true });
    document.addEventListener('keypress', () => this.trackKeystroke());
    document.addEventListener('focusin', () => this.trackFocusChange());
  }

  /**
   * Track page view
   */
  trackPageView() {
    const pageView = {
      id: this.generateId(),
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
      referrer: document.referrer,
      timeOnPage: 0,
      scrollDepth: 0,
      interactions: 0
    };

    this.pageViews.push(pageView);
    this.currentSession.pageViews.push(pageView);
    
    this.log('Page view tracked:', pageView.url);
    
    // Update previous page view's time on page
    if (this.currentPageView) {
      this.currentPageView.timeOnPage = Date.now() - this.currentPageView.timestamp;
    }
    
    this.currentPageView = pageView;
    
    // Track performance metrics for this page
    this.trackPagePerformance();
  }

  /**
   * Track page performance metrics
   */
  trackPagePerformance() {
    if (!this.options.enablePerformanceTracking) return;

    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const metrics = {
          pageLoadTime: navigation.loadEventEnd - navigation.navigationStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint(),
          largestContentfulPaint: this.getLargestContentfulPaint(),
          timeToInteractive: this.getTimeToInteractive()
        };

        this.performanceMetrics[window.location.href] = metrics;
        this.currentSession.performanceMetrics[window.location.href] = metrics;
        
        this.log('Performance metrics tracked:', metrics);
      }
    }, 1000);
  }

  /**
   * Get First Paint timing
   */
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  /**
   * Get First Contentful Paint timing
   */
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : 0;
  }

  /**
   * Get Largest Contentful Paint timing
   */
  getLargestContentfulPaint() {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry ? lastEntry.startTime : 0);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Fallback timeout
      setTimeout(() => resolve(0), 5000);
    });
  }

  /**
   * Get Time to Interactive (approximate)
   */
  getTimeToInteractive() {
    // Simplified TTI calculation
    const navigation = performance.getEntriesByType('navigation')[0];
    return navigation ? navigation.domInteractive - navigation.navigationStart : 0;
  }

  /**
   * Track user click
   */
  trackClick(event) {
    const click = {
      id: this.generateId(),
      timestamp: Date.now(),
      target: this.getElementInfo(event.target),
      coordinates: { x: event.clientX, y: event.clientY },
      pageX: event.pageX,
      pageY: event.pageY,
      button: event.button,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey
    };

    this.interactions.push(click);
    this.currentSession.interactions.push(click);
    this.currentSession.behaviorData.clicks++;
    
    if (this.currentPageView) {
      this.currentPageView.interactions++;
    }
  }

  /**
   * Track scroll behavior
   */
  trackScroll() {
    const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    
    this.currentSession.behaviorData.scrolls++;
    
    if (this.currentPageView && scrollDepth > this.currentPageView.scrollDepth) {
      this.currentPageView.scrollDepth = scrollDepth;
    }
  }

  /**
   * Track keystroke
   */
  trackKeystroke() {
    this.currentSession.behaviorData.keystrokes++;
  }

  /**
   * Track focus changes
   */
  trackFocusChange() {
    this.currentSession.behaviorData.focusChanges++;
  }

  /**
   * Get element information for tracking
   */
  getElementInfo(element) {
    return {
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      textContent: element.textContent?.slice(0, 100) || null,
      href: element.href || null,
      type: element.type || null
    };
  }

  /**
   * Start heartbeat to keep session alive
   */
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.options.heartbeatInterval);
  }

  /**
   * Send heartbeat to maintain session
   */
  sendHeartbeat() {
    if (!this.isActive) return;

    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    
    // End session if inactive for too long
    if (timeSinceLastActivity > this.options.sessionTimeout) {
      this.endSession();
      return;
    }

    // Update session duration
    this.currentSession.duration = now - this.sessionStartTime;
    
    // Update time on current page
    if (this.currentPageView) {
      this.currentPageView.timeOnPage = now - this.currentPageView.timestamp;
    }

    // Save session data periodically
    this.saveSessionData();
    
    this.log('Heartbeat sent');
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity() {
    this.lastActivity = Date.now();
  }

  /**
   * Handle page visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      this.pauseSession();
    } else {
      this.resumeSession();
    }
  }

  /**
   * Handle window focus
   */
  handleWindowFocus() {
    this.resumeSession();
  }

  /**
   * Handle window blur
   */
  handleWindowBlur() {
    this.pauseSession();
  }

  /**
   * Pause session tracking
   */
  pauseSession() {
    this.isActive = false;
    this.log('Session paused');
  }

  /**
   * Resume session tracking
   */
  resumeSession() {
    this.isActive = true;
    this.updateLastActivity();
    this.log('Session resumed');
  }

  /**
   * Update online status
   */
  updateOnlineStatus(isOnline) {
    this.currentSession.deviceInfo.onlineStatus = isOnline;
    this.log(`Connection status: ${isOnline ? 'online' : 'offline'}`);
  }

  /**
   * End current session
   */
  endSession() {
    if (!this.currentSession) return;

    const now = Date.now();
    this.currentSession.endTime = now;
    this.currentSession.duration = now - this.sessionStartTime;
    this.currentSession.exitPage = window.location.href;
    this.currentSession.isActive = false;

    // Calculate final metrics
    this.calculateFinalMetrics();
    
    // Save session data
    this.saveSessionData();
    
    // Clear heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.log('Session ended:', this.sessionId);
  }

  /**
   * Calculate final session metrics
   */
  calculateFinalMetrics() {
    const session = this.currentSession;
    
    // Calculate bounce rate (single page view with short duration)
    if (session.pageViews.length === 1 && session.duration < 30000) {
      session.behaviorData.bounceRate = 100;
    } else {
      session.behaviorData.bounceRate = 0;
    }

    // Calculate average time on page
    const totalTimeOnPages = session.pageViews.reduce((sum, pv) => sum + pv.timeOnPage, 0);
    session.behaviorData.timeOnPage = session.pageViews.length > 0 ? totalTimeOnPages / session.pageViews.length : 0;

    // Calculate engagement score
    session.engagementScore = this.calculateEngagementScore(session);
  }

  /**
   * Calculate engagement score based on user behavior
   */
  calculateEngagementScore(session) {
    let score = 0;
    
    // Duration points (max 40)
    score += Math.min(session.duration / 1000 / 60 * 10, 40);
    
    // Page views points (max 20)
    score += Math.min(session.pageViews.length * 5, 20);
    
    // Interactions points (max 20)
    score += Math.min(session.behaviorData.clicks * 2, 20);
    
    // Scroll depth points (max 20)
    const avgScrollDepth = session.pageViews.reduce((sum, pv) => sum + pv.scrollDepth, 0) / session.pageViews.length;
    score += Math.min(avgScrollDepth / 5, 20);
    
    return Math.round(score);
  }

  /**
   * Save session data to storage
   */
  saveSessionData() {
    try {
      // Add current session to past sessions
      const updatedSessions = [...this.pastSessions];
      
      // Find and update existing session or add new one
      const existingIndex = updatedSessions.findIndex(s => s.id === this.currentSession.id);
      if (existingIndex >= 0) {
        updatedSessions[existingIndex] = { ...this.currentSession };
      } else {
        updatedSessions.push({ ...this.currentSession });
      }

      // Keep only recent sessions
      const recentSessions = updatedSessions.slice(-this.options.maxSessions);
      
      localStorage.setItem('portfolio-sessions', JSON.stringify(recentSessions));
      this.pastSessions = recentSessions;
      
    } catch (error) {
      this.log('Failed to save session data:', error);
    }
  }

  /**
   * Clean up old sessions
   */
  cleanupOldSessions() {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    this.pastSessions = this.pastSessions.filter(session => session.startTime > cutoffTime);
  }

  /**
   * Get session analytics
   */
  getAnalytics() {
    const sessions = [...this.pastSessions];
    if (this.currentSession) {
      sessions.push(this.currentSession);
    }

    return {
      totalSessions: sessions.length,
      totalPageViews: sessions.reduce((sum, s) => sum + s.pageViews.length, 0),
      totalDuration: sessions.reduce((sum, s) => sum + s.duration, 0),
      averageSessionDuration: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length : 0,
      averagePageViews: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.pageViews.length, 0) / sessions.length : 0,
      bounceRate: this.calculateOverallBounceRate(sessions),
      topPages: this.getTopPages(sessions),
      deviceBreakdown: this.getDeviceBreakdown(sessions),
      browserBreakdown: this.getBrowserBreakdown(sessions),
      trafficSources: this.getTrafficSources(sessions),
      engagementMetrics: this.getEngagementMetrics(sessions)
    };
  }

  /**
   * Calculate overall bounce rate
   */
  calculateOverallBounceRate(sessions) {
    const bounced = sessions.filter(s => s.behaviorData.bounceRate === 100).length;
    return sessions.length > 0 ? (bounced / sessions.length) * 100 : 0;
  }

  /**
   * Get top pages by views
   */
  getTopPages(sessions) {
    const pageViews = {};
    sessions.forEach(session => {
      session.pageViews.forEach(pv => {
        pageViews[pv.url] = (pageViews[pv.url] || 0) + 1;
      });
    });

    return Object.entries(pageViews)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([url, views]) => ({ url, views }));
  }

  /**
   * Get device type breakdown
   */
  getDeviceBreakdown(sessions) {
    const devices = {};
    sessions.forEach(session => {
      const device = session.deviceInfo.type;
      devices[device] = (devices[device] || 0) + 1;
    });
    return devices;
  }

  /**
   * Get browser breakdown
   */
  getBrowserBreakdown(sessions) {
    const browsers = {};
    sessions.forEach(session => {
      const browser = session.userAgent.browser.name;
      browsers[browser] = (browsers[browser] || 0) + 1;
    });
    return browsers;
  }

  /**
   * Get traffic sources
   */
  getTrafficSources(sessions) {
    const sources = {};
    sessions.forEach(session => {
      const source = this.categorizeReferrer(session.referrer);
      sources[source] = (sources[source] || 0) + 1;
    });
    return sources;
  }

  /**
   * Categorize referrer into traffic source
   */
  categorizeReferrer(referrer) {
    if (!referrer || referrer === 'direct') return 'Direct';
    
    const url = new URL(referrer);
    const domain = url.hostname.toLowerCase();
    
    if (domain.includes('google')) return 'Google';
    if (domain.includes('bing')) return 'Bing';
    if (domain.includes('yahoo')) return 'Yahoo';
    if (domain.includes('facebook')) return 'Facebook';
    if (domain.includes('twitter')) return 'Twitter';
    if (domain.includes('linkedin')) return 'LinkedIn';
    if (domain.includes('github')) return 'GitHub';
    
    return 'Referral';
  }

  /**
   * Get engagement metrics
   */
  getEngagementMetrics(sessions) {
    const activeSessions = sessions.filter(s => s.duration > 10000); // More than 10 seconds
    
    return {
      totalClicks: sessions.reduce((sum, s) => sum + s.behaviorData.clicks, 0),
      totalScrolls: sessions.reduce((sum, s) => sum + s.behaviorData.scrolls, 0),
      averageEngagementScore: activeSessions.length > 0 ? 
        activeSessions.reduce((sum, s) => sum + (s.engagementScore || 0), 0) / activeSessions.length : 0,
      sessionsWithInteraction: sessions.filter(s => s.behaviorData.clicks > 0).length
    };
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Format bytes to human readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get session status
   */
  getStatus() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      isActive: this.isActive,
      duration: Date.now() - this.sessionStartTime,
      pageViews: this.pageViews.length,
      interactions: this.interactions.length,
      lastActivity: new Date(this.lastActivity).toISOString()
    };
  }

  /**
   * Log messages with context
   */
  log(message, ...args) {
    if (this.options.debugMode) {
      console.log(`[Session Manager] ${message}`, ...args);
    }
  }

  /**
   * Export session data
   */
  exportData() {
    return {
      currentSession: this.currentSession,
      pastSessions: this.pastSessions,
      analytics: this.getAnalytics(),
      exportTime: new Date().toISOString()
    };
  }

  /**
   * Clear all session data
   */
  clearAllData() {
    localStorage.removeItem('portfolio-sessions');
    localStorage.removeItem('portfolio-user-id');
    localStorage.removeItem('session-counter');
    
    this.pastSessions = [];
    this.pageViews = [];
    this.interactions = [];
    
    this.log('All session data cleared');
  }

  /**
   * Destroy session manager
   */
  destroy() {
    this.endSession();
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.endSession);
    window.removeEventListener('unload', this.endSession);
    
    this.log('Session Manager destroyed');
  }
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.sessionManager = new SessionManager();
  });
} else {
  window.sessionManager = new SessionManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionManager;
}

export default SessionManager; 