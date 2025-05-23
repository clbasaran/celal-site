/**
 * ============================================================================
 * CELAL BAŞARAN - BLOG PAGE JAVASCRIPT
 * Modern ES6+ | Blog Filtering | Newsletter | Interactive UX
 * ============================================================================
 */

// ===== CONSTANTS & CONFIGURATION =====
const BLOG_CONFIG = {
  animationDuration: 600,
  filterDelay: 300,
  postsPerPage: 6,
  autoScrollThreshold: 100
};

// ===== UTILITY FUNCTIONS =====
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fadeIn = (element, duration = BLOG_CONFIG.animationDuration) => {
  element.style.opacity = '0';
  element.style.display = 'block';
  
  let start = null;
  const animate = (timestamp) => {
    if (!start) start = timestamp;
    const progress = (timestamp - start) / duration;
    
    element.style.opacity = Math.min(progress, 1);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
};

const fadeOut = (element, duration = BLOG_CONFIG.animationDuration) => {
  return new Promise(resolve => {
    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      
      element.style.opacity = Math.max(1 - progress, 0);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
        resolve();
      }
    };
    
    requestAnimationFrame(animate);
  });
};

// ===== BLOG FILTER MANAGER =====
class BlogFilterManager {
  constructor() {
    this.filterButtons = $$('.filter-btn');
    this.blogPosts = $$('.blog-post-card');
    this.currentFilter = 'all';
    this.isFiltering = false;
    
    this.init();
  }
  
  init() {
    this.setupFilterButtons();
    this.setupInitialState();
  }
  
  setupFilterButtons() {
    this.filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const filter = button.dataset.filter;
        this.applyFilter(filter, button);
      });
    });
  }
  
  setupInitialState() {
    // Show all posts initially
    this.blogPosts.forEach(post => {
      post.style.display = 'block';
      post.style.opacity = '1';
    });
  }
  
  async applyFilter(filter, activeButton) {
    if (this.isFiltering || filter === this.currentFilter) return;
    
    this.isFiltering = true;
    this.currentFilter = filter;
    
    // Update active button
    this.filterButtons.forEach(btn => btn.classList.remove('active'));
    activeButton.classList.add('active');
    
    // Add loading state
    activeButton.style.pointerEvents = 'none';
    
    try {
      // Fade out posts that don't match
      const hidePromises = [];
      this.blogPosts.forEach(post => {
        const shouldShow = this.shouldShowPost(post, filter);
        if (!shouldShow && post.style.display !== 'none') {
          hidePromises.push(this.hidePost(post));
        }
      });
      
      await Promise.all(hidePromises);
      
      // Small delay for better UX
      await sleep(100);
      
      // Fade in posts that match
      const showPromises = [];
      this.blogPosts.forEach(post => {
        const shouldShow = this.shouldShowPost(post, filter);
        if (shouldShow && post.style.display === 'none') {
          showPromises.push(this.showPost(post));
        }
      });
      
      await Promise.all(showPromises);
      
      // Update URL without page reload
      this.updateURL(filter);
      
      // Scroll to posts if needed
      this.smoothScrollToPosts();
      
    } finally {
      activeButton.style.pointerEvents = 'auto';
      this.isFiltering = false;
    }
  }
  
  shouldShowPost(post, filter) {
    if (filter === 'all') return true;
    
    const categories = post.dataset.category?.split(' ') || [];
    return categories.includes(filter);
  }
  
  async hidePost(post) {
    post.style.transform = 'scale(0.8)';
    await fadeOut(post, BLOG_CONFIG.filterDelay);
    post.style.transform = 'scale(1)';
  }
  
  async showPost(post) {
    post.style.transform = 'scale(0.8)';
    post.style.display = 'block';
    
    // Small delay for stagger effect
    await sleep(Math.random() * 100);
    
    return new Promise(resolve => {
      fadeIn(post, BLOG_CONFIG.filterDelay);
      
      // Animate scale back to normal
      let start = null;
      const animate = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / BLOG_CONFIG.filterDelay, 1);
        
        const scale = 0.8 + (0.2 * progress);
        post.style.transform = `scale(${scale})`;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          post.style.transform = 'scale(1)';
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }
  
  updateURL(filter) {
    const url = new URL(window.location);
    if (filter === 'all') {
      url.searchParams.delete('filter');
    } else {
      url.searchParams.set('filter', filter);
    }
    history.replaceState(null, '', url);
  }
  
  smoothScrollToPosts() {
    if (window.scrollY > BLOG_CONFIG.autoScrollThreshold) {
      const postsSection = $('#blog-posts');
      if (postsSection) {
        postsSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  }
  
  // Initialize filter from URL
  initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter') || 'all';
    
    const button = $(`.filter-btn[data-filter="${filter}"]`);
    if (button) {
      this.applyFilter(filter, button);
    }
  }
}

// ===== NEWSLETTER MANAGER =====
class NewsletterManager {
  constructor() {
    this.form = $('#newsletter-form');
    this.emailInput = $('#newsletter-email');
    this.submitButton = this.form?.querySelector('button[type="submit"]');
    
    this.init();
  }
  
  init() {
    if (!this.form) return;
    
    this.setupFormSubmission();
    this.setupInputValidation();
    this.setupInputEnhancements();
  }
  
  setupFormSubmission() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = this.emailInput.value.trim();
      
      if (!this.validateEmail(email)) {
        this.showError('Lütfen geçerli bir email adresi giriniz');
        this.emailInput.focus();
        return;
      }
      
      try {
        this.setLoadingState(true);
        
        // Simulate API call
        await this.subscribeToNewsletter(email);
        
        this.showSuccess();
        this.form.reset();
        
      } catch (error) {
        this.showError('Bir hata oluştu. Lütfen tekrar deneyiniz.');
      } finally {
        this.setLoadingState(false);
      }
    });
  }
  
  setupInputValidation() {
    this.emailInput.addEventListener('blur', () => {
      const email = this.emailInput.value.trim();
      if (email && !this.validateEmail(email)) {
        this.showInputError('Geçerli bir email adresi giriniz');
      }
    });
    
    this.emailInput.addEventListener('input', () => {
      this.clearInputError();
    });
  }
  
  setupInputEnhancements() {
    // Add floating placeholder effect
    this.emailInput.addEventListener('focus', () => {
      this.emailInput.parentElement.classList.add('focused');
    });
    
    this.emailInput.addEventListener('blur', () => {
      if (!this.emailInput.value) {
        this.emailInput.parentElement.classList.remove('focused');
      }
    });
    
    // Auto-format email
    this.emailInput.addEventListener('input', (e) => {
      let value = e.target.value;
      // Remove spaces
      value = value.replace(/\s+/g, '');
      // Convert to lowercase
      value = value.toLowerCase();
      e.target.value = value;
    });
  }
  
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  async subscribeToNewsletter(email) {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve({ success: true });
        } else {
          reject(new Error('Network error'));
        }
      }, 1500);
    });
  }
  
  setLoadingState(isLoading) {
    if (!this.submitButton) return;
    
    this.submitButton.disabled = isLoading;
    this.emailInput.disabled = isLoading;
    
    this.submitButton.innerHTML = isLoading
      ? '<span class="loading-spinner"></span> Abone Ol'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Abone Ol';
  }
  
  showSuccess() {
    this.showNotification('🎉 Başarıyla abone oldunuz! Hoş geldin email\'inizi kontrol edin.', 'success');
    
    // Add success animation to form
    this.form.classList.add('success');
    setTimeout(() => {
      this.form.classList.remove('success');
    }, 3000);
  }
  
  showError(message) {
    this.showNotification(message, 'error');
    this.emailInput.classList.add('error');
    
    setTimeout(() => {
      this.emailInput.classList.remove('error');
    }, 3000);
  }
  
  showInputError(message) {
    this.emailInput.classList.add('error');
    this.emailInput.setAttribute('title', message);
  }
  
  clearInputError() {
    this.emailInput.classList.remove('error');
    this.emailInput.removeAttribute('title');
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `blog-notification blog-notification-${type}`;
    notification.innerHTML = `
      <div class="blog-notification-content">
        <span class="blog-notification-message">${message}</span>
        <button class="blog-notification-close" aria-label="Close notification">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
      notification.remove();
    }, 5000);
    
    // Remove on click
    notification.querySelector('.blog-notification-close').addEventListener('click', () => {
      notification.remove();
    });
    
    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
  }
}

// ===== BLOG SEARCH MANAGER =====
class BlogSearchManager {
  constructor() {
    this.searchInput = $('#blog-search');
    this.blogPosts = $$('.blog-post-card');
    this.searchResults = [];
    
    this.init();
  }
  
  init() {
    if (!this.searchInput) return;
    
    this.setupSearchInput();
  }
  
  setupSearchInput() {
    let searchTimeout;
    
    this.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      
      searchTimeout = setTimeout(() => {
        const query = e.target.value.trim().toLowerCase();
        this.performSearch(query);
      }, 300);
    });
    
    // Clear search on escape
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.target.value = '';
        this.clearSearch();
      }
    });
  }
  
  performSearch(query) {
    if (!query) {
      this.clearSearch();
      return;
    }
    
    this.blogPosts.forEach(post => {
      const title = post.querySelector('.blog-post-title')?.textContent.toLowerCase() || '';
      const excerpt = post.querySelector('.blog-post-excerpt')?.textContent.toLowerCase() || '';
      const tags = Array.from(post.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase()).join(' ');
      
      const content = `${title} ${excerpt} ${tags}`;
      const matches = content.includes(query);
      
      post.style.display = matches ? 'block' : 'none';
      
      // Highlight search terms
      if (matches) {
        this.highlightSearchTerms(post, query);
      }
    });
  }
  
  highlightSearchTerms(post, query) {
    const titleElement = post.querySelector('.blog-post-title a');
    const excerptElement = post.querySelector('.blog-post-excerpt');
    
    if (titleElement) {
      titleElement.innerHTML = this.highlightText(titleElement.textContent, query);
    }
    
    if (excerptElement) {
      excerptElement.innerHTML = this.highlightText(excerptElement.textContent, query);
    }
  }
  
  highlightText(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }
  
  clearSearch() {
    this.blogPosts.forEach(post => {
      post.style.display = 'block';
      
      // Remove highlights
      const highlighted = post.querySelectorAll('.search-highlight');
      highlighted.forEach(mark => {
        mark.outerHTML = mark.textContent;
      });
    });
  }
}

// ===== READING PROGRESS INDICATOR =====
class ReadingProgressManager {
  constructor() {
    this.progressBar = null;
    this.init();
  }
  
  init() {
    this.createProgressBar();
    this.setupScrollTracking();
  }
  
  createProgressBar() {
    this.progressBar = document.createElement('div');
    this.progressBar.className = 'reading-progress';
    this.progressBar.innerHTML = '<div class="reading-progress-fill"></div>';
    
    document.body.appendChild(this.progressBar);
  }
  
  setupScrollTracking() {
    const fill = this.progressBar.querySelector('.reading-progress-fill');
    
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      fill.style.width = Math.min(scrollPercent, 100) + '%';
    });
  }
}

// ===== BLOG INTERACTIONS MANAGER =====
class BlogInteractionsManager {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupHoverEffects();
    this.setupClickEffects();
    this.setupKeyboardNavigation();
  }
  
  setupHoverEffects() {
    const postCards = $$('.blog-post-card, .featured-post-card');
    
    postCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px) scale(1.02)';
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
      });
    });
  }
  
  setupClickEffects() {
    const clickableElements = $$('.blog-post-card, .filter-btn, .newsletter-submit');
    
    clickableElements.forEach(element => {
      element.addEventListener('click', (e) => {
        this.createRippleEffect(e, element);
      });
    });
  }
  
  setupKeyboardNavigation() {
    const filterButtons = $$('.filter-btn');
    
    filterButtons.forEach((button, index) => {
      button.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && index > 0) {
          filterButtons[index - 1].focus();
        } else if (e.key === 'ArrowRight' && index < filterButtons.length - 1) {
          filterButtons[index + 1].focus();
        }
      });
    });
  }
  
  createRippleEffect(event, element) {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.className = 'blog-ripple';
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(56, 139, 253, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: blogRipple 0.6s ease-out;
      pointer-events: none;
      z-index: 1000;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
}

// ===== MAIN BLOG APPLICATION =====
class BlogApp {
  constructor() {
    this.init();
  }
  
  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
    } else {
      this.initializeComponents();
    }
  }
  
  initializeComponents() {
    try {
      // Initialize all managers
      this.filterManager = new BlogFilterManager();
      this.newsletterManager = new NewsletterManager();
      this.searchManager = new BlogSearchManager();
      this.progressManager = new ReadingProgressManager();
      this.interactionsManager = new BlogInteractionsManager();
      
      // Initialize filter from URL after a short delay
      setTimeout(() => {
        this.filterManager.initializeFromURL();
      }, 100);
      
      console.log('📝 Blog app initialized successfully!');
    } catch (error) {
      console.error('❌ Error initializing blog app:', error);
    }
  }
}

// ===== INITIALIZE BLOG APPLICATION =====
const blogApp = new BlogApp();

// ===== ADD REQUIRED CSS ANIMATIONS =====
const blogStyle = document.createElement('style');
blogStyle.textContent = `
  @keyframes blogRipple {
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
  
  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .blog-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
    background: var(--surface-glass);
    backdrop-filter: var(--glass-backdrop);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-xl);
    padding: var(--space-4);
    box-shadow: var(--shadow-xl);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  
  .blog-notification.show {
    transform: translateX(0);
  }
  
  .blog-notification-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }
  
  .blog-notification-message {
    color: var(--text-primary);
    font-size: 0.875rem;
  }
  
  .blog-notification-close {
    background: none;
    border: none;
    color: var(--text-tertiary);
    cursor: pointer;
    font-size: 1.2rem;
    padding: var(--space-1);
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
  }
  
  .blog-notification-close:hover {
    color: var(--text-primary);
    background: var(--surface-secondary);
  }
  
  .blog-notification-success {
    border-left: 4px solid var(--apple-green-light);
  }
  
  .blog-notification-error {
    border-left: 4px solid var(--apple-red-light);
  }
  
  .newsletter-input.error {
    border-color: var(--apple-red-light);
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2);
  }
  
  .newsletter-form.success {
    animation: successPulse 0.6s ease;
  }
  
  @keyframes successPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .search-highlight {
    background: var(--apple-blue-500);
    color: var(--apple-white);
    padding: 0 2px;
    border-radius: 2px;
  }
  
  .reading-progress {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: transparent;
    z-index: 9999;
  }
  
  .reading-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--apple-blue-500), var(--apple-purple-light));
    width: 0%;
    transition: width 0.1s ease;
  }
  
  .blog-ripple {
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    animation: blogRipple 0.6s ease-out;
    pointer-events: none;
  }
`;

document.head.appendChild(blogStyle); 