/**
 * Hero Component - Portfolio OS V6
 * Apple Design Language V6 with Modern Animations
 */

class HeroComponent {
  constructor() {
    this.heroSection = document.querySelector('.hero-section');
    this.heroTitle = document.querySelector('.hero-title');
    this.heroName = document.querySelector('.hero-name');
    this.heroSubtitle = document.querySelector('.hero-subtitle');
    this.heroBadge = document.querySelector('.hero-badge');
    this.scrollIndicator = document.querySelector('.scroll-indicator');
    this.heroActions = document.querySelector('.hero-actions');
    
    this.typewriterText = 'Celal Başaran';
    this.typewriterIndex = 0;
    this.typewriterSpeed = 100;
    this.isTypewriterComplete = false;
    
    this.init();
  }

  init() {
    if (!this.heroSection) {
      console.warn('Hero section not found');
      return;
    }

    this.setupTypewriterEffect();
    this.setupScrollIndicator();
    this.setupActionButtons();
    this.setupAnimationObserver();
    this.setupBackgroundEffects();
    
    console.log('🦸 Hero component initialized');
  }

  setupTypewriterEffect() {
    if (!this.heroName) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Skip animation, show final text
      this.heroName.textContent = this.typewriterText;
      this.isTypewriterComplete = true;
      return;
    }

    // Clear initial text
    this.heroName.textContent = '';
    this.heroName.style.borderRight = '2px solid var(--color-primary)';
    
    // Start typewriter effect after a short delay
    setTimeout(() => {
      this.startTypewriter();
    }, 800);
  }

  startTypewriter() {
    if (this.typewriterIndex < this.typewriterText.length) {
      this.heroName.textContent += this.typewriterText.charAt(this.typewriterIndex);
      this.typewriterIndex++;
      
      // Variable speed for more natural typing
      const randomSpeed = this.typewriterSpeed + Math.random() * 50;
      setTimeout(() => this.startTypewriter(), randomSpeed);
    } else {
      // Typewriter complete
      this.isTypewriterComplete = true;
      
      // Remove cursor after a pause
      setTimeout(() => {
        this.heroName.style.borderRight = 'none';
        this.startGlowEffect();
      }, 1000);
    }
  }

  startGlowEffect() {
    if (!this.heroName) return;
    
    // Add glow animation class
    this.heroName.classList.add('name-glow-effect');
    
    // Create CSS animation for glow
    const style = document.createElement('style');
    style.textContent = `
      @keyframes name-glow-pulse {
        0%, 100% {
          filter: drop-shadow(0 0 5px var(--color-primary));
        }
        50% {
          filter: drop-shadow(0 0 20px var(--color-primary));
        }
      }
      
      .name-glow-effect {
        animation: name-glow-pulse 3s ease-in-out infinite;
      }
    `;
    
    if (!document.head.querySelector('#hero-glow-styles')) {
      style.id = 'hero-glow-styles';
      document.head.appendChild(style);
    }
  }

  setupScrollIndicator() {
    if (!this.scrollIndicator) {
      this.createScrollIndicator();
    }

    this.scrollIndicator?.addEventListener('click', this.handleScrollToNext.bind(this));
    this.scrollIndicator?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleScrollToNext();
      }
    });

    // Hide scroll indicator when scrolling starts
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (this.scrollIndicator) {
            this.scrollIndicator.style.opacity = Math.max(0, 1 - scrollY / 300);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  createScrollIndicator() {
    const indicator = document.createElement('button');
    indicator.className = 'scroll-indicator';
    indicator.setAttribute('aria-label', 'Sonraki bölüme geç');
    indicator.setAttribute('type', 'button');
    
    indicator.innerHTML = `
      <span class="scroll-text">Keşfet</span>
      <div class="scroll-arrow"></div>
    `;
    
    this.heroSection.appendChild(indicator);
    this.scrollIndicator = indicator;
  }

  handleScrollToNext() {
    // Find the next section after hero
    const nextSection = this.heroSection.nextElementSibling;
    
    if (nextSection) {
      const headerHeight = document.querySelector('.navigation')?.offsetHeight || 0;
      const targetPosition = nextSection.offsetTop - headerHeight;
      
      // Check for reduced motion preference
      const shouldUseReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      window.scrollTo({
        top: targetPosition,
        behavior: shouldUseReducedMotion ? 'auto' : 'smooth'
      });
      
      // Announce to screen readers
      this.announceToScreenReader('Bir sonraki bölüme geçiliyor');
    }
  }

  setupActionButtons() {
    if (!this.heroActions) return;

    const buttons = this.heroActions.querySelectorAll('.btn');
    
    buttons.forEach((button, index) => {
      // Add staggered animation
      button.style.animationDelay = `${0.7 + (index * 0.2)}s`;
      
      // Setup button interactions
      button.addEventListener('click', this.handleActionClick.bind(this));
      
      // Add hover effects
      button.addEventListener('mouseenter', this.handleButtonHover.bind(this));
      button.addEventListener('mouseleave', this.handleButtonLeave.bind(this));
    });
  }

  handleActionClick(e) {
    const button = e.currentTarget;
    const buttonText = button.querySelector('.btn-text')?.textContent;
    
    // Add click animation
    button.classList.add('btn-clicked');
    setTimeout(() => button.classList.remove('btn-clicked'), 200);
    
    // Handle different button actions
    if (buttonText?.includes('Projeler')) {
      this.navigateToProjects();
    } else if (buttonText?.includes('CV')) {
      this.downloadCV();
    }
    
    console.log(`🎯 Hero action clicked: ${buttonText}`);
  }

  handleButtonHover(e) {
    const button = e.currentTarget;
    const icon = button.querySelector('.btn-icon');
    
    if (icon) {
      icon.style.transform = 'translateX(4px)';
    }
  }

  handleButtonLeave(e) {
    const button = e.currentTarget;
    const icon = button.querySelector('.btn-icon');
    
    if (icon) {
      icon.style.transform = 'translateX(0)';
    }
  }

  navigateToProjects() {
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
      // Use navigation component if available
      if (window.navigationComponent) {
        window.navigationComponent.navigateToSection('projects');
      } else {
        // Fallback scroll
        projectsSection.scrollIntoView({ behavior: 'smooth' });
      }
      
      this.announceToScreenReader('Projeler bölümüne geçiliyor');
    }
  }

  downloadCV() {
    // Create download link
    const cvUrl = './assets/documents/celal-basaran-cv.pdf';
    const link = document.createElement('a');
    link.href = cvUrl;
    link.download = 'Celal-Basaran-CV.pdf';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.announceToScreenReader('CV dosyası indiriliyor');
    
    // Track download (if analytics available)
    if (window.gtag) {
      gtag('event', 'download', {
        event_category: 'file',
        event_label: 'cv-pdf'
      });
    }
  }

  setupAnimationObserver() {
    // Intersection Observer for triggering animations
    const observerOptions = {
      threshold: 0.2,
      rootMargin: '0px'
    };

    this.animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.triggerHeroAnimations();
        }
      });
    }, observerOptions);

    if (this.heroSection) {
      this.animationObserver.observe(this.heroSection);
    }
  }

  triggerHeroAnimations() {
    // Check if reduced motion is preferred
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) return;

    // Trigger various hero animations
    this.animateStats();
    this.animateAvatar();
    this.animateBadge();
  }

  animateStats() {
    const stats = this.heroSection.querySelectorAll('.stat-number');
    
    stats.forEach((stat, index) => {
      const finalValue = stat.textContent;
      const numericValue = parseInt(finalValue);
      
      if (isNaN(numericValue)) return;
      
      // Animate counting up
      let currentValue = 0;
      const increment = numericValue / 60; // 60 frames for 1 second at 60fps
      
      const animate = () => {
        currentValue += increment;
        if (currentValue < numericValue) {
          stat.textContent = Math.floor(currentValue) + (finalValue.includes('+') ? '+' : '') + (finalValue.includes('%') ? '%' : '');
          requestAnimationFrame(animate);
        } else {
          stat.textContent = finalValue;
        }
      };
      
      // Start animation with delay
      setTimeout(() => animate(), index * 200);
    });
  }

  animateAvatar() {
    const avatar = this.heroSection.querySelector('.avatar-placeholder');
    if (avatar) {
      avatar.classList.add('avatar-float');
    }
  }

  animateBadge() {
    const badge = this.heroBadge;
    if (badge) {
      badge.classList.add('badge-pulse');
    }
  }

  setupBackgroundEffects() {
    // Parallax effect for background elements
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.updateParallaxEffect();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  updateParallaxEffect() {
    const scrollY = window.scrollY;
    const heroHeight = this.heroSection.offsetHeight;
    const scrollPercent = Math.min(scrollY / heroHeight, 1);
    
    // Update background position
    const heroBackground = this.heroSection.querySelector('::before');
    if (this.heroSection) {
      this.heroSection.style.transform = `translateY(${scrollPercent * 50}px)`;
    }
    
    // Update floating elements
    const floatingElements = this.heroSection.querySelectorAll('.hero-visual::before, .hero-visual::after');
    floatingElements.forEach((element, index) => {
      if (element) {
        const speed = (index + 1) * 0.5;
        element.style.transform = `translateY(${scrollPercent * speed * 20}px)`;
      }
    });
  }

  announceToScreenReader(message) {
    // Create temporary element for screen reader announcement
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Public API methods
  triggerTypewriter() {
    if (!this.isTypewriterComplete) {
      this.typewriterIndex = 0;
      this.heroName.textContent = '';
      this.startTypewriter();
    }
  }

  scrollToNextSection() {
    this.handleScrollToNext();
  }

  getTypewriterStatus() {
    return {
      isComplete: this.isTypewriterComplete,
      currentIndex: this.typewriterIndex,
      totalLength: this.typewriterText.length
    };
  }

  // Cleanup method
  destroy() {
    if (this.animationObserver) {
      this.animationObserver.disconnect();
    }
    
    // Remove event listeners
    window.removeEventListener('scroll', this.handleScroll);
    
    // Remove injected styles
    const styles = document.getElementById('hero-glow-styles');
    if (styles) {
      styles.remove();
    }
    
    console.log('🦸 Hero component destroyed');
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.heroComponent = new HeroComponent();
  });
} else {
  window.heroComponent = new HeroComponent();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeroComponent;
} 