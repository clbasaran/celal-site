/**
 * Skills Component - Portfolio OS V6
 * Dynamic Skills Display with Animations
 */

class SkillsComponent {
  constructor() {
    this.isActive = false;
    this.skillsData = null;
    this.animationRunning = false;
    this.currentFilter = 'all';
    this.skillsContainer = null;
    
    this.init();
  }

  async init() {
    try {
      this.skillsContainer = document.querySelector('.skills-section');
      if (!this.skillsContainer) {
        console.warn('Skills container not found');
        return;
      }

      // Load skills data
      await this.loadSkillsData();
      
      // Create enhanced skills interface
      this.createSkillsInterface();
      
      // Setup interactions
      this.setupInteractions();
      
      // Setup intersection observer for animations
      this.setupIntersectionObserver();
      
      this.isActive = true;
      console.log('🎯 Skills Component initialized');
      
    } catch (error) {
      console.error('Skills Component initialization failed:', error);
    }
  }

  async loadSkillsData() {
    try {
      // Use global data manager if available
      if (window.portfolioData && window.portfolioData.skills) {
        this.skillsData = window.portfolioData.skills;
        return;
      }

      // Fallback to direct fetch
      const response = await fetch('./data/skills.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      this.skillsData = await response.json();
      console.log('📊 Skills data loaded');
      
    } catch (error) {
      console.error('Failed to load skills data:', error);
      this.skillsData = this.getFallbackSkillsData();
    }
  }

  createSkillsInterface() {
    if (!this.skillsData) return;

    const skillsGrid = this.skillsContainer.querySelector('.skills-grid');
    if (!skillsGrid) return;

    // Clear existing content
    skillsGrid.innerHTML = '';

    // Create filter buttons
    const filterContainer = this.createFilterButtons();
    skillsGrid.parentNode.insertBefore(filterContainer, skillsGrid);

    // Create skills categories
    this.skillsData.categories.forEach((category, index) => {
      const categoryElement = this.createSkillCategory(category, index);
      skillsGrid.appendChild(categoryElement);
    });

    // Create highlights section
    if (this.skillsData.highlights) {
      const highlightsSection = this.createHighlightsSection();
      skillsGrid.appendChild(highlightsSection);
    }

    // Create stats section
    if (this.skillsData.stats) {
      const statsSection = this.createStatsSection();
      skillsGrid.appendChild(statsSection);
    }
  }

  createFilterButtons() {
    const filterContainer = document.createElement('div');
    filterContainer.className = 'skills-filter';
    filterContainer.setAttribute('role', 'tablist');
    filterContainer.setAttribute('aria-label', 'Yetenek kategorileri');

    const filters = [
      { id: 'all', label: 'Tümü', icon: '🎯' },
      { id: 'frontend', label: 'Frontend', icon: '🎨' },
      { id: 'backend', label: 'Backend', icon: '⚙️' },
      { id: 'design', label: 'Tasarım', icon: '✨' },
      { id: 'tools', label: 'Araçlar', icon: '🛠️' }
    ];

    filters.forEach(filter => {
      const button = document.createElement('button');
      button.className = `filter-btn ${filter.id === 'all' ? 'active' : ''}`;
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', filter.id === 'all' ? 'true' : 'false');
      button.setAttribute('data-filter', filter.id);
      button.innerHTML = `
        <span class="filter-icon" aria-hidden="true">${filter.icon}</span>
        <span class="filter-label">${filter.label}</span>
      `;
      
      button.addEventListener('click', () => this.filterSkills(filter.id));
      filterContainer.appendChild(button);
    });

    return filterContainer;
  }

  createSkillCategory(category, index) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = `skill-category ${category.id}`;
    categoryDiv.setAttribute('data-category', category.id);
    categoryDiv.style.setProperty('--animation-delay', `${index * 100}ms`);

    categoryDiv.innerHTML = `
      <div class="category-header">
        <div class="category-icon" aria-hidden="true">${category.icon}</div>
        <div class="category-info">
          <h3 class="category-title">${category.title}</h3>
          <p class="category-description">${category.description}</p>
        </div>
      </div>
      
      <div class="skills-list" role="list" aria-label="${category.title} yetenekleri">
        ${category.skills.map(skill => this.createSkillItem(skill)).join('')}
      </div>
    `;

    return categoryDiv;
  }

  createSkillItem(skill) {
    return `
      <div class="skill-item" role="listitem">
        <div class="skill-header">
          <h4 class="skill-name">${skill.name}</h4>
          <span class="skill-level" aria-label="${skill.level}% seviye">
            ${skill.level}%
          </span>
        </div>
        
        <div class="skill-progress" role="progressbar" 
             aria-valuemin="0" aria-valuemax="100" aria-valuenow="${skill.level}">
          <div class="progress-bar" style="--skill-level: ${skill.level}%"></div>
        </div>
        
        <div class="skill-details">
          <span class="skill-experience">${skill.experience}</span>
          <p class="skill-description">${skill.description}</p>
        </div>
      </div>
    `;
  }

  createHighlightsSection() {
    const highlightsDiv = document.createElement('div');
    highlightsDiv.className = 'skills-highlights';
    highlightsDiv.innerHTML = `
      <h3 class="highlights-title">Öne Çıkan Özellikler</h3>
      <div class="highlights-grid" role="list">
        ${this.skillsData.highlights.map(highlight => `
          <div class="highlight-item" role="listitem">
            <div class="highlight-icon" aria-hidden="true">${highlight.icon}</div>
            <h4 class="highlight-title">${highlight.title}</h4>
            <p class="highlight-description">${highlight.description}</p>
          </div>
        `).join('')}
      </div>
    `;
    
    return highlightsDiv;
  }

  createStatsSection() {
    const statsDiv = document.createElement('div');
    statsDiv.className = 'skills-stats';
    statsDiv.innerHTML = `
      <h3 class="stats-title">İstatistikler</h3>
      <div class="stats-grid" role="list">
        <div class="stat-item" role="listitem">
          <div class="stat-number" data-count="${this.skillsData.stats.totalSkills}">0</div>
          <div class="stat-label">Toplam Yetenek</div>
        </div>
        <div class="stat-item" role="listitem">
          <div class="stat-number" data-count="${this.skillsData.stats.averageLevel}">0</div>
          <div class="stat-label">Ortalama Seviye</div>
        </div>
        <div class="stat-item" role="listitem">
          <div class="stat-number" data-count="${this.skillsData.stats.yearsOfExperience}">0</div>
          <div class="stat-label">Yıl Deneyim</div>
        </div>
        <div class="stat-item" role="listitem">
          <div class="stat-number" data-count="${this.skillsData.stats.projectsCompleted}">0</div>
          <div class="stat-label">Proje Tamamlandı</div>
        </div>
      </div>
    `;
    
    return statsDiv;
  }

  setupInteractions() {
    // Filter functionality already set up in createFilterButtons
    
    // Skill item hover effects
    this.skillsContainer.addEventListener('mouseenter', (e) => {
      if (e.target.classList.contains('skill-item')) {
        this.highlightSkill(e.target);
      }
    }, true);

    this.skillsContainer.addEventListener('mouseleave', (e) => {
      if (e.target.classList.contains('skill-item')) {
        this.unhighlightSkill(e.target);
      }
    }, true);
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateSection(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    // Observe skill categories
    const categories = this.skillsContainer.querySelectorAll('.skill-category');
    categories.forEach(category => observer.observe(category));

    // Observe stats section
    const statsSection = this.skillsContainer.querySelector('.skills-stats');
    if (statsSection) {
      observer.observe(statsSection);
    }
  }

  filterSkills(filterId) {
    const filterButtons = this.skillsContainer.querySelectorAll('.filter-btn');
    const categories = this.skillsContainer.querySelectorAll('.skill-category');

    // Update button states
    filterButtons.forEach(btn => {
      const isActive = btn.dataset.filter === filterId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive);
    });

    // Filter categories
    categories.forEach(category => {
      const shouldShow = filterId === 'all' || category.dataset.category === filterId;
      category.style.display = shouldShow ? 'block' : 'none';
      
      if (shouldShow) {
        setTimeout(() => {
          category.classList.add('animate-in');
        }, 50);
      } else {
        category.classList.remove('animate-in');
      }
    });

    this.currentFilter = filterId;
    
    // Announce filter change
    if (window.accessibilityModule) {
      const filterLabel = filterId === 'all' ? 'Tüm yetenekler' : filterId;
      window.accessibilityModule.announceAction(`Filtre değiştirildi: ${filterLabel}`);
    }
  }

  animateSection(section) {
    if (section.classList.contains('animated')) return;

    section.classList.add('animated');

    // Animate skill progress bars
    const progressBars = section.querySelectorAll('.progress-bar');
    progressBars.forEach((bar, index) => {
      setTimeout(() => {
        bar.style.width = bar.style.getPropertyValue('--skill-level');
      }, index * 100);
    });

    // Animate counter numbers in stats
    if (section.classList.contains('skills-stats')) {
      this.animateCounters(section);
    }
  }

  animateCounters(statsSection) {
    const counters = statsSection.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.count);
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;

      const animate = () => {
        current += step;
        if (current >= target) {
          counter.textContent = target;
          return;
        }
        
        counter.textContent = Math.floor(current);
        requestAnimationFrame(animate);
      };

      setTimeout(() => animate(), 200);
    });
  }

  highlightSkill(skillElement) {
    skillElement.classList.add('highlighted');
    
    // Announce skill details
    const skillName = skillElement.querySelector('.skill-name')?.textContent;
    const skillLevel = skillElement.querySelector('.skill-level')?.textContent;
    
    if (window.accessibilityModule && skillName && skillLevel) {
      window.accessibilityModule.announceAction(`${skillName}: ${skillLevel}`);
    }
  }

  unhighlightSkill(skillElement) {
    skillElement.classList.remove('highlighted');
  }

  getFallbackSkillsData() {
    return {
      categories: [
        {
          id: 'frontend',
          title: 'Frontend Development',
          description: 'Modern web arayüzleri',
          icon: '🎨',
          skills: [
            {
              name: 'HTML5',
              level: 95,
              experience: '5+ years',
              description: 'Semantik HTML ve modern web standartları'
            },
            {
              name: 'CSS3',
              level: 95,
              experience: '5+ years',
              description: 'Advanced CSS ve responsive design'
            },
            {
              name: 'JavaScript',
              level: 90,
              experience: '4+ years',
              description: 'ES6+ ve modern frameworks'
            }
          ]
        }
      ],
      highlights: [
        {
          icon: '♿',
          title: 'WCAG 2.1 AA Expert',
          description: 'Web erişilebilirlik uzmanı'
        }
      ],
      stats: {
        totalSkills: 25,
        averageLevel: 85,
        yearsOfExperience: 5,
        projectsCompleted: 50
      }
    };
  }

  // Public API
  getSkillsData() {
    return this.skillsData;
  }

  refreshSkills() {
    this.loadSkillsData().then(() => {
      this.createSkillsInterface();
    });
  }

  destroy() {
    this.isActive = false;
    console.log('🎯 Skills Component destroyed');
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.skillsComponent = new SkillsComponent();
  });
} else {
  window.skillsComponent = new SkillsComponent();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SkillsComponent;
} 