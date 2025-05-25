/**
 * Portfolio OS - Animation Orchestrator Module
 * Apple Design Language V5
 * Advanced staggered timing engine and animation choreography system
 */

class AnimationOrchestrator {
  constructor(options = {}) {
    this.options = {
      enableAnimations: true,
      respectReducedMotion: true,
      defaultDuration: 600,
      defaultEasing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      staggerDelay: 100,
      maxStaggerDelay: 1000,
      enableIntersectionObserver: true,
      intersectionThreshold: 0.1,
      enablePreloading: true,
      enablePerformanceOptimization: true,
      debugMode: false,
      ...options
    };

    this.animations = new Map();
    this.sequences = new Map();
    this.timelines = new Map();
    this.observers = new Map();
    this.animationQueue = [];
    this.isPlaying = false;
    this.totalAnimations = 0;
    this.completedAnimations = 0;
    this.activeAnimations = new Set();
    this.prefersReducedMotion = false;
    this.performanceMode = 'balanced'; // 'performance', 'balanced', 'quality'
    this.isInitialized = false;
    
    this.init();
  }

  /**
   * Initialize animation orchestrator
   */
  async init() {
    try {
      this.detectMotionPreferences();
      this.setupPerformanceMode();
      this.createDefaultEasings();
      this.setupIntersectionObserver();
      this.setupAnimationStyles();
      this.preloadAnimations();
      this.bindEvents();
      
      this.isInitialized = true;
      this.log('Animation Orchestrator initialized successfully');
      
      // Auto-discover and setup animations
      this.discoverAnimations();
      
    } catch (error) {
      this.log('Failed to initialize Animation Orchestrator:', error);
    }
  }

  /**
   * Detect user motion preferences
   */
  detectMotionPreferences() {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addListener((e) => {
      this.prefersReducedMotion = e.matches;
      this.handleMotionPreferenceChange();
    });
  }

  /**
   * Setup performance mode based on device capabilities
   */
  setupPerformanceMode() {
    const navigator = window.navigator;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    // Check device capabilities
    const hasGoodConnection = !connection || connection.effectiveType !== 'slow-2g';
    const hasGoodMemory = navigator.deviceMemory ? navigator.deviceMemory >= 4 : true;
    const hasGoodCPU = navigator.hardwareConcurrency ? navigator.hardwareConcurrency >= 4 : true;
    
    if (!hasGoodConnection || !hasGoodMemory || !hasGoodCPU) {
      this.performanceMode = 'performance';
    } else if (hasGoodConnection && hasGoodMemory && hasGoodCPU) {
      this.performanceMode = 'quality';
    } else {
      this.performanceMode = 'balanced';
    }
    
    this.log(`Performance mode: ${this.performanceMode}`);
  }

  /**
   * Create default easing functions
   */
  createDefaultEasings() {
    this.easings = {
      // Apple Design System Easings
      linear: 'linear',
      easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
      easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
      
      // Apple-specific easings
      appleSpring: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      appleBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      appleSharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      
      // Modern easings
      backIn: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
      backOut: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      backInOut: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      
      // Elastic easings
      elasticIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
      elasticOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      elasticInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)'
    };
  }

  /**
   * Setup intersection observer for scroll-triggered animations
   */
  setupIntersectionObserver() {
    if (!this.options.enableIntersectionObserver) return;

    const observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        root: null,
        rootMargin: '50px',
        threshold: [0, this.options.intersectionThreshold, 0.5, 1]
      }
    );

    this.observers.set('main', observer);
  }

  /**
   * Setup animation CSS styles
   */
  setupAnimationStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .anim-hidden { 
        opacity: 0; 
        visibility: hidden; 
      }
      
      .anim-fade-in { 
        animation: fadeIn var(--anim-duration, 600ms) var(--anim-easing, ease-out) var(--anim-delay, 0ms) forwards; 
      }
      
      .anim-slide-up { 
        animation: slideUp var(--anim-duration, 600ms) var(--anim-easing, ease-out) var(--anim-delay, 0ms) forwards; 
      }
      
      .anim-slide-down { 
        animation: slideDown var(--anim-duration, 600ms) var(--anim-easing, ease-out) var(--anim-delay, 0ms) forwards; 
      }
      
      .anim-slide-left { 
        animation: slideLeft var(--anim-duration, 600ms) var(--anim-easing, ease-out) var(--anim-delay, 0ms) forwards; 
      }
      
      .anim-slide-right { 
        animation: slideRight var(--anim-duration, 600ms) var(--anim-easing, ease-out) var(--anim-delay, 0ms) forwards; 
      }
      
      .anim-scale-in { 
        animation: scaleIn var(--anim-duration, 600ms) var(--anim-easing, ease-out) var(--anim-delay, 0ms) forwards; 
      }
      
      .anim-rotate-in { 
        animation: rotateIn var(--anim-duration, 600ms) var(--anim-easing, ease-out) var(--anim-delay, 0ms) forwards; 
      }

      @keyframes fadeIn {
        from { opacity: 0; visibility: hidden; }
        to { opacity: 1; visibility: visible; }
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); visibility: hidden; }
        to { opacity: 1; transform: translateY(0); visibility: visible; }
      }

      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-20px); visibility: hidden; }
        to { opacity: 1; transform: translateY(0); visibility: visible; }
      }

      @keyframes slideLeft {
        from { opacity: 0; transform: translateX(20px); visibility: hidden; }
        to { opacity: 1; transform: translateX(0); visibility: visible; }
      }

      @keyframes slideRight {
        from { opacity: 0; transform: translateX(-20px); visibility: hidden; }
        to { opacity: 1; transform: translateX(0); visibility: visible; }
      }

      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.8); visibility: hidden; }
        to { opacity: 1; transform: scale(1); visibility: visible; }
      }

      @keyframes rotateIn {
        from { opacity: 0; transform: rotate(-10deg) scale(0.8); visibility: hidden; }
        to { opacity: 1; transform: rotate(0deg) scale(1); visibility: visible; }
      }

      @media (prefers-reduced-motion: reduce) {
        .anim-fade-in,
        .anim-slide-up,
        .anim-slide-down,
        .anim-slide-left,
        .anim-slide-right,
        .anim-scale-in,
        .anim-rotate-in {
          animation: reduceMotion 0.01ms !important;
        }

        @keyframes reduceMotion {
          to { opacity: 1; visibility: visible; transform: none; }
        }
      }
    `;

    document.head.appendChild(styleSheet);
  }

  /**
   * Preload animations for better performance
   */
  preloadAnimations() {
    if (!this.options.enablePreloading) return;

    // Trigger a minimal animation to warm up the GPU
    const testElement = document.createElement('div');
    testElement.style.cssText = 'position: absolute; top: -9999px; opacity: 0;';
    document.body.appendChild(testElement);
    
    testElement.style.transition = 'transform 0.01ms';
    testElement.style.transform = 'translateX(1px)';
    
    setTimeout(() => {
      document.body.removeChild(testElement);
    }, 100);
  }

  /**
   * Bind global events
   */
  bindEvents() {
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAllAnimations();
      } else {
        this.resumeAllAnimations();
      }
    });

    // Performance optimization
    if (this.options.enablePerformanceOptimization) {
      window.addEventListener('beforeunload', () => {
        this.cancelAllAnimations();
      });
    }
  }

  /**
   * Discover animations in the DOM
   */
  discoverAnimations() {
    const animElements = document.querySelectorAll('[data-anim], .anim-trigger');
    
    animElements.forEach((element, index) => {
      this.registerElement(element, {
        autoTrigger: true,
        staggerIndex: index
      });
    });
  }

  /**
   * Register an element for animation
   */
  registerElement(element, options = {}) {
    const {
      animation = element.dataset.anim || 'fadeIn',
      trigger = element.dataset.animTrigger || 'scroll',
      duration = element.dataset.animDuration || this.options.defaultDuration,
      delay = element.dataset.animDelay || 0,
      easing = element.dataset.animEasing || this.options.defaultEasing,
      staggerIndex = 0,
      autoTrigger = false
    } = options;

    const animationId = this.generateId();
    
    const animationConfig = {
      id: animationId,
      element,
      animation,
      trigger,
      duration: parseInt(duration),
      delay: parseInt(delay),
      easing: this.easings[easing] || easing,
      staggerIndex,
      autoTrigger,
      hasPlayed: false,
      isVisible: false
    };

    this.animations.set(animationId, animationConfig);

    // Apply initial state
    this.applyInitialState(element, animation);

    // Setup trigger
    this.setupTrigger(animationConfig);

    return animationId;
  }

  /**
   * Apply initial animation state
   */
  applyInitialState(element, animation) {
    element.classList.add('anim-hidden');
    
    // Set initial transform based on animation type
    switch (animation) {
      case 'slideUp':
        element.style.transform = 'translateY(20px)';
        break;
      case 'slideDown':
        element.style.transform = 'translateY(-20px)';
        break;
      case 'slideLeft':
        element.style.transform = 'translateX(20px)';
        break;
      case 'slideRight':
        element.style.transform = 'translateX(-20px)';
        break;
      case 'scaleIn':
        element.style.transform = 'scale(0.8)';
        break;
      case 'rotateIn':
        element.style.transform = 'rotate(-10deg) scale(0.8)';
        break;
    }
  }

  /**
   * Setup animation trigger
   */
  setupTrigger(config) {
    switch (config.trigger) {
      case 'scroll':
        this.setupScrollTrigger(config);
        break;
      case 'hover':
        this.setupHoverTrigger(config);
        break;
      case 'click':
        this.setupClickTrigger(config);
        break;
      case 'immediate':
        this.playAnimation(config.id);
        break;
      case 'manual':
        // Manual trigger - do nothing
        break;
    }
  }

  /**
   * Setup scroll trigger using intersection observer
   */
  setupScrollTrigger(config) {
    const observer = this.observers.get('main');
    if (observer) {
      observer.observe(config.element);
    }
  }

  /**
   * Setup hover trigger
   */
  setupHoverTrigger(config) {
    config.element.addEventListener('mouseenter', () => {
      if (!config.hasPlayed) {
        this.playAnimation(config.id);
      }
    });
  }

  /**
   * Setup click trigger
   */
  setupClickTrigger(config) {
    config.element.addEventListener('click', () => {
      if (!config.hasPlayed) {
        this.playAnimation(config.id);
      }
    });
  }

  /**
   * Handle intersection observer entries
   */
  handleIntersection(entries) {
    entries.forEach((entry) => {
      const element = entry.target;
      const animationConfig = this.findAnimationByElement(element);
      
      if (animationConfig) {
        animationConfig.isVisible = entry.isIntersecting;
        
        if (entry.isIntersecting && !animationConfig.hasPlayed) {
          this.playAnimation(animationConfig.id);
        }
      }
    });
  }

  /**
   * Find animation config by element
   */
  findAnimationByElement(element) {
    for (const config of this.animations.values()) {
      if (config.element === element) {
        return config;
      }
    }
    return null;
  }

  /**
   * Play single animation
   */
  playAnimation(animationId) {
    const config = this.animations.get(animationId);
    if (!config || config.hasPlayed) return;

    // Check motion preferences
    if (this.prefersReducedMotion && this.options.respectReducedMotion) {
      this.playReducedMotionAnimation(config);
      return;
    }

    const { element, animation, duration, delay, easing } = config;

    // Set CSS custom properties
    element.style.setProperty('--anim-duration', duration + 'ms');
    element.style.setProperty('--anim-delay', delay + 'ms');
    element.style.setProperty('--anim-easing', easing);

    // Apply animation class
    setTimeout(() => {
      element.classList.remove('anim-hidden');
      element.classList.add(`anim-${animation}`);
      
      this.activeAnimations.add(animationId);
      config.hasPlayed = true;
      
      // Listen for animation end
      this.setupAnimationEndListener(config);
      
    }, delay);

    this.log(`Playing animation: ${animation} on`, element);
  }

  /**
   * Play reduced motion version of animation
   */
  playReducedMotionAnimation(config) {
    const { element } = config;
    
    element.style.transition = 'opacity 0.15s ease-out';
    element.style.opacity = '1';
    element.style.visibility = 'visible';
    element.style.transform = 'none';
    
    config.hasPlayed = true;
  }

  /**
   * Setup animation end listener
   */
  setupAnimationEndListener(config) {
    const handleAnimationEnd = (event) => {
      if (event.target === config.element) {
        this.handleAnimationComplete(config.id);
        config.element.removeEventListener('animationend', handleAnimationEnd);
      }
    };

    config.element.addEventListener('animationend', handleAnimationEnd);
  }

  /**
   * Handle animation completion
   */
  handleAnimationComplete(animationId) {
    this.activeAnimations.delete(animationId);
    this.completedAnimations++;
    
    const config = this.animations.get(animationId);
    if (config) {
      // Clean up animation classes
      config.element.classList.remove(`anim-${config.animation}`);
      
      // Emit completion event
      this.emit('animation:complete', { id: animationId, config });
    }
  }

  /**
   * Create staggered animation sequence
   */
  createStaggeredSequence(elements, options = {}) {
    const {
      animation = 'fadeIn',
      staggerDelay = this.options.staggerDelay,
      baseDuration = this.options.defaultDuration,
      easing = this.options.defaultEasing,
      trigger = 'scroll'
    } = options;

    const sequenceId = this.generateId();
    const animations = [];

    elements.forEach((element, index) => {
      const delay = Math.min(index * staggerDelay, this.options.maxStaggerDelay);
      
      const animationId = this.registerElement(element, {
        animation,
        duration: baseDuration,
        delay,
        easing,
        trigger: 'manual', // We'll trigger manually
        staggerIndex: index
      });

      animations.push(animationId);
    });

    this.sequences.set(sequenceId, {
      id: sequenceId,
      animations,
      trigger,
      hasPlayed: false
    });

    // Setup sequence trigger
    this.setupSequenceTrigger(sequenceId, trigger, elements[0]);

    return sequenceId;
  }

  /**
   * Setup sequence trigger
   */
  setupSequenceTrigger(sequenceId, trigger, firstElement) {
    const sequence = this.sequences.get(sequenceId);
    
    switch (trigger) {
      case 'scroll':
        const observer = this.observers.get('main');
        if (observer && firstElement) {
          const handleIntersection = (entries) => {
            entries.forEach((entry) => {
              if (entry.target === firstElement && entry.isIntersecting && !sequence.hasPlayed) {
                this.playSequence(sequenceId);
                observer.unobserve(firstElement);
              }
            });
          };
          
          const tempObserver = new IntersectionObserver(handleIntersection, {
            threshold: this.options.intersectionThreshold
          });
          
          tempObserver.observe(firstElement);
        }
        break;
        
      case 'immediate':
        this.playSequence(sequenceId);
        break;
    }
  }

  /**
   * Play animation sequence
   */
  playSequence(sequenceId) {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence || sequence.hasPlayed) return;

    sequence.hasPlayed = true;

    // Play animations in sequence
    sequence.animations.forEach((animationId) => {
      this.playAnimation(animationId);
    });

    this.log(`Playing sequence: ${sequenceId}`);
  }

  /**
   * Create timeline for complex animations
   */
  createTimeline(timelineId, keyframes = []) {
    const timeline = {
      id: timelineId,
      keyframes,
      currentFrame: 0,
      isPlaying: false,
      duration: 0
    };

    // Calculate total duration
    timeline.duration = keyframes.reduce((total, frame) => total + frame.duration, 0);

    this.timelines.set(timelineId, timeline);
    return timeline;
  }

  /**
   * Play timeline
   */
  playTimeline(timelineId) {
    const timeline = this.timelines.get(timelineId);
    if (!timeline || timeline.isPlaying) return;

    timeline.isPlaying = true;
    timeline.currentFrame = 0;

    this.executeTimelineFrame(timeline);
  }

  /**
   * Execute timeline frame
   */
  executeTimelineFrame(timeline) {
    if (timeline.currentFrame >= timeline.keyframes.length) {
      timeline.isPlaying = false;
      this.emit('timeline:complete', { id: timeline.id });
      return;
    }

    const frame = timeline.keyframes[timeline.currentFrame];
    
    // Execute frame action
    if (frame.action) {
      frame.action();
    }

    // Schedule next frame
    setTimeout(() => {
      timeline.currentFrame++;
      this.executeTimelineFrame(timeline);
    }, frame.duration);
  }

  /**
   * Pause all animations
   */
  pauseAllAnimations() {
    document.querySelectorAll('[style*="animation"]').forEach((element) => {
      element.style.animationPlayState = 'paused';
    });
  }

  /**
   * Resume all animations
   */
  resumeAllAnimations() {
    document.querySelectorAll('[style*="animation"]').forEach((element) => {
      element.style.animationPlayState = 'running';
    });
  }

  /**
   * Cancel all animations
   */
  cancelAllAnimations() {
    this.activeAnimations.forEach((animationId) => {
      const config = this.animations.get(animationId);
      if (config) {
        config.element.style.animation = 'none';
      }
    });
    
    this.activeAnimations.clear();
  }

  /**
   * Handle motion preference changes
   */
  handleMotionPreferenceChange() {
    if (this.prefersReducedMotion) {
      this.log('Reduced motion enabled - simplifying animations');
      
      // Convert active animations to reduced motion
      this.activeAnimations.forEach((animationId) => {
        const config = this.animations.get(animationId);
        if (config) {
          this.playReducedMotionAnimation(config);
        }
      });
    }
  }

  /**
   * Get animation statistics
   */
  getStats() {
    return {
      totalAnimations: this.animations.size,
      completedAnimations: this.completedAnimations,
      activeAnimations: this.activeAnimations.size,
      sequences: this.sequences.size,
      timelines: this.timelines.size,
      prefersReducedMotion: this.prefersReducedMotion,
      performanceMode: this.performanceMode
    };
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.eventListeners) {
      this.eventListeners = new Map();
    }
    
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.eventListeners && this.eventListeners.has(event)) {
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
   * Generate unique ID
   */
  generateId() {
    return 'anim_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2);
  }

  /**
   * Log messages
   */
  log(message, ...args) {
    if (this.options.debugMode) {
      console.log(`[Animation Orchestrator] ${message}`, ...args);
    }
  }

  /**
   * Destroy orchestrator
   */
  destroy() {
    // Cancel all animations
    this.cancelAllAnimations();
    
    // Disconnect observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear data
    this.animations.clear();
    this.sequences.clear();
    this.timelines.clear();
    
    this.isInitialized = false;
    this.log('Animation Orchestrator destroyed');
  }
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.animationOrchestrator = new AnimationOrchestrator();
  });
} else {
  window.animationOrchestrator = new AnimationOrchestrator();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnimationOrchestrator;
}

export default AnimationOrchestrator; 