/**
 * Portfolio OS - Projects Manager Module
 * Apple Design Language V5
 * Enterprise-grade project management with dynamic rendering
 */

class ProjectsManager {
    constructor(options = {}) {
        this.options = {
            dataSource: '/data/projects.json',
            containerId: 'projectsContainer',
            loadingId: 'projectsLoading',
            emptyId: 'projectsEmpty',
            itemsPerPage: 6,
            enableInfiniteScroll: true,
            enableSearch: true,
            enableFiltering: true,
            enableSorting: true,
            animationDelay: 100,
            ...options
        };
        
        // State management
        this.state = {
            projects: [],
            filteredProjects: [],
            displayedProjects: [],
            currentPage: 1,
            currentFilter: 'all',
            currentSort: 'newest',
            searchQuery: '',
            viewMode: 'grid',
            isLoading: false,
            hasMoreItems: false
        };
        
        // DOM elements
        this.container = null;
        this.loadingElement = null;
        this.emptyElement = null;
        
        // Performance tracking
        this.metrics = {
            projectsLoaded: 0,
            renderTime: 0,
            searchQueries: 0,
            filterChanges: 0,
            lastUpdateTime: null
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.findElements();
            this.setupEventListeners();
            await this.loadProjects();
            this.renderProjects();
            
            console.log('📦 Projects Manager initialized with', this.state.projects.length, 'projects');
            
        } catch (error) {
            console.error('❌ Projects Manager initialization failed:', error);
            this.showError('Projeler yüklenirken bir hata oluştu.');
        }
    }
    
    findElements() {
        this.container = document.getElementById(this.options.containerId);
        this.loadingElement = document.getElementById(this.options.loadingId);
        this.emptyElement = document.getElementById(this.options.emptyId);
        
        if (!this.container) {
            throw new Error(`Projects container not found: ${this.options.containerId}`);
        }
    }
    
    setupEventListeners() {
        // Filter tabs
        document.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.applyFilter(filter);
            });
        });
        
        // Search input
        const searchInput = document.getElementById('projectSearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.applySearch(e.target.value);
                }, 300);
            });
        }
        
        // Sort select
        const sortSelect = document.getElementById('projectSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.applySort(e.target.value);
            });
        }
        
        // View toggle
        document.querySelectorAll('[data-view]').forEach(button => {
            button.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.changeView(view);
            });
        });
        
        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreProjects();
            });
        }
        
        // Infinite scroll
        if (this.options.enableInfiniteScroll) {
            this.setupInfiniteScroll();
        }
    }
    
    async loadProjects() {
        this.showLoading(true);
        
        try {
            const response = await fetch(this.options.dataSource);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Combine all project categories
            this.state.projects = [
                ...(data.featured || []),
                ...(data.mobile || []),
                ...(data.ai || []),
                ...(data.web || [])
            ];
            
            // Add metadata
            this.state.projects = this.state.projects.map(project => ({
                ...project,
                category: this.determineCategory(project),
                searchText: this.createSearchText(project),
                sortDate: this.parseSortDate(project.year)
            }));
            
            this.state.filteredProjects = [...this.state.projects];
            this.metrics.projectsLoaded = this.state.projects.length;
            this.metrics.lastUpdateTime = Date.now();
            
            this.updateFilterCounts();
            
        } catch (error) {
            console.error('Failed to load projects:', error);
            throw error;
        } finally {
            this.showLoading(false);
        }
    }
    
    determineCategory(project) {
        // Determine category based on technologies or existing category
        const technologies = project.technologies || [];
        const techString = technologies.join(' ').toLowerCase();
        
        if (project.featured) return 'featured';
        if (techString.includes('swiftui') || techString.includes('swift')) return 'mobile';
        if (techString.includes('core ml') || techString.includes('ai')) return 'ai';
        if (techString.includes('html') || techString.includes('web')) return 'web';
        
        return 'other';
    }
    
    createSearchText(project) {
        return [
            project.title,
            project.subtitle,
            project.description,
            ...(project.technologies || [])
        ].join(' ').toLowerCase();
    }
    
    parseSortDate(year) {
        return new Date(year, 0, 1).getTime();
    }
    
    applyFilter(filter) {
        this.state.currentFilter = filter;
        this.state.currentPage = 1;
        
        // Update active filter tab
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
            btn.setAttribute('aria-selected', btn.dataset.filter === filter);
        });
        
        this.filterAndSort();
        this.renderProjects();
        this.metrics.filterChanges++;
        
        // Dispatch filter change event
        this.dispatchEvent('filterChanged', { filter });
    }
    
    applySearch(query) {
        this.state.searchQuery = query.toLowerCase().trim();
        this.state.currentPage = 1;
        
        this.filterAndSort();
        this.renderProjects();
        this.metrics.searchQueries++;
        
        // Dispatch search event
        this.dispatchEvent('searchChanged', { query: this.state.searchQuery });
    }
    
    applySort(sortType) {
        this.state.currentSort = sortType;
        this.state.currentPage = 1;
        
        this.filterAndSort();
        this.renderProjects();
        
        // Dispatch sort event
        this.dispatchEvent('sortChanged', { sortType });
    }
    
    filterAndSort() {
        let filtered = [...this.state.projects];
        
        // Apply category filter
        if (this.state.currentFilter !== 'all') {
            filtered = filtered.filter(project => {
                if (this.state.currentFilter === 'featured') {
                    return project.featured === true;
                }
                return project.category === this.state.currentFilter;
            });
        }
        
        // Apply search filter
        if (this.state.searchQuery) {
            filtered = filtered.filter(project =>
                project.searchText.includes(this.state.searchQuery)
            );
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
            switch (this.state.currentSort) {
                case 'newest':
                    return b.sortDate - a.sortDate;
                case 'oldest':
                    return a.sortDate - b.sortDate;
                case 'name':
                    return a.title.localeCompare(b.title, 'tr');
                case 'popularity':
                    return (b.stars || 0) - (a.stars || 0);
                default:
                    return 0;
            }
        });
        
        this.state.filteredProjects = filtered;
        this.state.hasMoreItems = filtered.length > this.options.itemsPerPage;
    }
    
    renderProjects() {
        const startTime = performance.now();
        
        // Clear container
        this.container.innerHTML = '';
        
        // Calculate items to display
        const itemsToShow = this.state.currentPage * this.options.itemsPerPage;
        this.state.displayedProjects = this.state.filteredProjects.slice(0, itemsToShow);
        
        // Show empty state if no projects
        if (this.state.displayedProjects.length === 0) {
            this.showEmpty(true);
            return;
        }
        
        this.showEmpty(false);
        
        // Update view mode class
        this.container.className = `projects-grid view-${this.state.viewMode}`;
        
        // Render each project
        this.state.displayedProjects.forEach((project, index) => {
            const projectElement = this.createProjectElement(project, index);
            this.container.appendChild(projectElement);
        });
        
        // Update load more button
        this.updateLoadMoreButton();
        
        // Track performance
        this.metrics.renderTime = performance.now() - startTime;
        
        // Trigger animations
        this.triggerEntryAnimations();
        
        console.log(`📦 Rendered ${this.state.displayedProjects.length} projects in ${this.metrics.renderTime.toFixed(2)}ms`);
    }
    
    createProjectElement(project, index) {
        const article = document.createElement('article');
        article.className = 'project-card';
        article.dataset.projectId = project.id;
        article.dataset.category = project.category;
        article.style.setProperty('--animation-delay', `${index * this.options.animationDelay}ms`);
        
        // Determine status badge
        const statusBadge = this.createStatusBadge(project.status);
        
        // Create technology tags
        const techTags = (project.technologies || []).slice(0, 3).map(tech =>
            `<span class="tech-tag">${tech}</span>`
        ).join('');
        
        // Create action buttons
        const actionButtons = this.createActionButtons(project);
        
        article.innerHTML = `
            <div class="project-image">
                <img 
                    src="${project.image || '/assets/images/project-placeholder.jpg'}" 
                    alt="${project.title}"
                    loading="lazy"
                    onerror="this.src='/assets/images/project-placeholder.jpg'"
                >
                <div class="project-overlay">
                    <div class="overlay-content">
                        ${actionButtons}
                    </div>
                </div>
                ${statusBadge}
            </div>
            
            <div class="project-content">
                <header class="project-header">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-subtitle">${project.subtitle}</p>
                </header>
                
                <p class="project-description">${project.description}</p>
                
                <div class="project-tech">
                    ${techTags}
                    ${project.technologies?.length > 3 ? `<span class="tech-more">+${project.technologies.length - 3}</span>` : ''}
                </div>
                
                <footer class="project-footer">
                    <div class="project-meta">
                        <span class="project-year">${project.year}</span>
                        ${project.stars ? `<span class="project-stars">⭐ ${project.stars}</span>` : ''}
                    </div>
                </footer>
            </div>
        `;
        
        // Add click handler
        article.addEventListener('click', (e) => {
            if (!e.target.closest('.action-btn')) {
                this.openProjectDetail(project);
            }
        });
        
        return article;
    }
    
    createStatusBadge(status) {
        const statusConfig = {
            'completed': { text: 'Tamamlandı', class: 'status-completed', icon: '✅' },
            'active': { text: 'Aktif', class: 'status-active', icon: '🔄' },
            'development': { text: 'Geliştiriliyor', class: 'status-development', icon: '🚧' },
            'archived': { text: 'Arşiv', class: 'status-archived', icon: '📦' }
        };
        
        const config = statusConfig[status] || statusConfig.completed;
        
        return `
            <div class="project-status ${config.class}">
                <span class="status-icon">${config.icon}</span>
                <span class="status-text">${config.text}</span>
            </div>
        `;
    }
    
    createActionButtons(project) {
        const buttons = [];
        
        if (project.link) {
            buttons.push(`
                <button class="action-btn primary" onclick="window.open('${project.link}', '_blank')">
                    <span class="btn-icon">👁️</span>
                    <span class="btn-text">Detay</span>
                </button>
            `);
        }
        
        if (project.github) {
            buttons.push(`
                <button class="action-btn secondary" onclick="window.open('${project.github}', '_blank')">
                    <span class="btn-icon">📦</span>
                    <span class="btn-text">GitHub</span>
                </button>
            `);
        }
        
        if (project.appstore) {
            buttons.push(`
                <button class="action-btn primary" onclick="window.open('${project.appstore}', '_blank')">
                    <span class="btn-icon">📱</span>
                    <span class="btn-text">App Store</span>
                </button>
            `);
        }
        
        return `<div class="action-buttons">${buttons.join('')}</div>`;
    }
    
    openProjectDetail(project) {
        // Create modal or navigate to detail page
        this.dispatchEvent('projectSelected', { project });
        
        // For now, navigate to link if available
        if (project.link) {
            window.open(project.link, '_blank');
        }
    }
    
    changeView(viewMode) {
        this.state.viewMode = viewMode;
        
        // Update active view button
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewMode);
        });
        
        // Re-render with new view
        this.renderProjects();
        
        // Dispatch view change event
        this.dispatchEvent('viewChanged', { viewMode });
    }
    
    loadMoreProjects() {
        if (!this.state.hasMoreItems) return;
        
        this.state.currentPage++;
        this.renderProjects();
        
        // Dispatch load more event
        this.dispatchEvent('loadMore', { 
            page: this.state.currentPage,
            totalShowing: this.state.displayedProjects.length,
            totalAvailable: this.state.filteredProjects.length
        });
    }
    
    updateLoadMoreButton() {
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (loadMoreContainer && loadMoreBtn) {
            const hasMore = this.state.displayedProjects.length < this.state.filteredProjects.length;
            
            loadMoreContainer.style.display = hasMore ? 'block' : 'none';
            
            if (hasMore) {
                const remaining = this.state.filteredProjects.length - this.state.displayedProjects.length;
                loadMoreBtn.querySelector('.btn-text').textContent = `${remaining} Proje Daha Göster`;
            }
        }
    }
    
    updateFilterCounts() {
        const counts = {
            all: this.state.projects.length,
            featured: this.state.projects.filter(p => p.featured).length,
            mobile: this.state.projects.filter(p => p.category === 'mobile').length,
            ai: this.state.projects.filter(p => p.category === 'ai').length,
            web: this.state.projects.filter(p => p.category === 'web').length
        };
        
        Object.entries(counts).forEach(([filter, count]) => {
            const countElement = document.getElementById(`count${filter.charAt(0).toUpperCase() + filter.slice(1)}`);
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }
    
    setupInfiniteScroll() {
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollPosition = window.innerHeight + window.scrollY;
                    const documentHeight = document.documentElement.offsetHeight;
                    
                    if (scrollPosition >= documentHeight - 1000 && this.state.hasMoreItems) {
                        this.loadMoreProjects();
                    }
                    
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
    }
    
    triggerEntryAnimations() {
        // Trigger staggered animations for new items
        const projectCards = this.container.querySelectorAll('.project-card');
        
        projectCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * this.options.animationDelay);
        });
    }
    
    showLoading(show) {
        this.state.isLoading = show;
        
        if (this.loadingElement) {
            this.loadingElement.style.display = show ? 'flex' : 'none';
        }
    }
    
    showEmpty(show) {
        if (this.emptyElement) {
            this.emptyElement.style.display = show ? 'flex' : 'none';
        }
    }
    
    showError(message) {
        this.container.innerHTML = `
            <div class="projects-error">
                <div class="error-icon">⚠️</div>
                <h3>Bir hata oluştu</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="location.reload()">Tekrar Dene</button>
            </div>
        `;
    }
    
    // Public API methods
    getState() {
        return { ...this.state };
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            currentlyDisplayed: this.state.displayedProjects.length,
            totalProjects: this.state.projects.length,
            filteredProjects: this.state.filteredProjects.length
        };
    }
    
    refresh() {
        return this.loadProjects().then(() => {
            this.renderProjects();
        });
    }
    
    clearFilters() {
        this.state.currentFilter = 'all';
        this.state.searchQuery = '';
        this.state.currentSort = 'newest';
        this.state.currentPage = 1;
        
        // Reset UI
        document.getElementById('projectSearch').value = '';
        document.getElementById('projectSort').value = 'newest';
        
        this.filterAndSort();
        this.renderProjects();
    }
    
    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(`projects${eventName.charAt(0).toUpperCase() + eventName.slice(1)}`, {
            detail: {
                ...data,
                timestamp: Date.now(),
                module: 'ProjectsManager'
            }
        });
        
        window.dispatchEvent(event);
    }
    
    destroy() {
        // Remove event listeners and clean up
        this.container = null;
        this.loadingElement = null;
        this.emptyElement = null;
        
        console.log('📦 Projects Manager destroyed');
    }
}

// Auto-initialize
function initializeProjectsManager() {
    if (typeof window !== 'undefined' && document.getElementById('projectsContainer')) {
        window.ProjectsManager = ProjectsManager;
        window.projectsManager = new ProjectsManager();
        
        // Global function for clear filters
        window.clearFilters = () => window.projectsManager?.clearFilters();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProjectsManager);
} else {
    initializeProjectsManager();
}

export default ProjectsManager; 