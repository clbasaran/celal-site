/**
 * Blog Manager Module
 * Enterprise-grade blog management system with dynamic rendering,
 * filtering, search, and pagination capabilities
 * 
 * @version 2.0.0
 * @author Celal Başaran
 * @license MIT
 */

class BlogManager {
    constructor(options = {}) {
        this.options = {
            container: options.container || '#blog-container',
            postsPerPage: options.postsPerPage || 6,
            searchDelay: options.searchDelay || 300,
            animationDuration: options.animationDuration || 400,
            enableInfiniteScroll: options.enableInfiniteScroll || false,
            enableSearch: options.enableSearch || true,
            enableFilters: options.enableFilters || true,
            enableSorting: options.enableSorting || true,
            ...options
        };

        this.state = {
            posts: [],
            filteredPosts: [],
            currentPage: 1,
            totalPages: 0,
            currentCategory: 'all',
            currentTag: 'all',
            searchQuery: '',
            sortBy: 'date',
            sortOrder: 'desc',
            isLoading: false,
            hasMore: true
        };

        this.cache = new Map();
        this.searchTimeout = null;
        this.intersectionObserver = null;
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            searchTime: 0,
            totalViews: 0,
            popularPosts: new Map()
        };

        this.init();
    }

    async init() {
        try {
            const startTime = performance.now();
            
            await this.loadPosts();
            this.setupEventListeners();
            this.setupIntersectionObserver();
            this.render();
            
            this.metrics.loadTime = performance.now() - startTime;
            this.dispatchEvent('blog:initialized', { metrics: this.metrics });
            
            console.log(`Blog Manager initialized in ${this.metrics.loadTime.toFixed(2)}ms`);
        } catch (error) {
            console.error('Blog Manager initialization failed:', error);
            this.handleError(error);
        }
    }

    async loadPosts() {
        try {
            this.setState({ isLoading: true });
            
            // Check cache first
            const cacheKey = 'blog-posts';
            if (this.cache.has(cacheKey)) {
                this.state.posts = this.cache.get(cacheKey);
                this.filterAndSort();
                return;
            }

            const response = await fetch('/data/blog.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.state.posts = this.processPosts(data.posts || []);
            
            // Cache the posts
            this.cache.set(cacheKey, this.state.posts);
            
            this.filterAndSort();
            this.dispatchEvent('blog:postsLoaded', { count: this.state.posts.length });
            
        } catch (error) {
            console.error('Failed to load blog posts:', error);
            this.handleError(error);
        } finally {
            this.setState({ isLoading: false });
        }
    }

    processPosts(posts) {
        return posts.map(post => ({
            ...post,
            id: post.id || this.generateId(),
            date: new Date(post.date),
            slug: post.slug || this.generateSlug(post.title),
            excerpt: post.excerpt || this.generateExcerpt(post.content),
            readTime: post.readTime || this.calculateReadTime(post.content),
            tags: post.tags || [],
            category: post.category || 'uncategorized',
            featured: post.featured || false,
            views: post.views || 0,
            likes: post.likes || 0
        }));
    }

    filterAndSort() {
        let filtered = [...this.state.posts];

        // Apply category filter
        if (this.state.currentCategory !== 'all') {
            filtered = filtered.filter(post => 
                post.category === this.state.currentCategory
            );
        }

        // Apply tag filter
        if (this.state.currentTag !== 'all') {
            filtered = filtered.filter(post => 
                post.tags.includes(this.state.currentTag)
            );
        }

        // Apply search filter
        if (this.state.searchQuery) {
            const query = this.state.searchQuery.toLowerCase();
            filtered = filtered.filter(post => 
                post.title.toLowerCase().includes(query) ||
                post.excerpt.toLowerCase().includes(query) ||
                post.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let comparison = 0;
            
            switch (this.state.sortBy) {
                case 'date':
                    comparison = b.date - a.date;
                    break;
                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;
                case 'views':
                    comparison = b.views - a.views;
                    break;
                case 'likes':
                    comparison = b.likes - a.likes;
                    break;
                case 'readTime':
                    comparison = a.readTime - b.readTime;
                    break;
            }
            
            return this.state.sortOrder === 'desc' ? comparison : -comparison;
        });

        this.state.filteredPosts = filtered;
        this.state.totalPages = Math.ceil(filtered.length / this.options.postsPerPage);
        this.state.currentPage = 1;
    }

    render() {
        const startTime = performance.now();
        const container = document.querySelector(this.options.container);
        
        if (!container) {
            console.error('Blog container not found');
            return;
        }

        // Clear container
        container.innerHTML = '';

        if (this.state.isLoading) {
            container.appendChild(this.createLoadingState());
            return;
        }

        if (this.state.filteredPosts.length === 0) {
            container.appendChild(this.createEmptyState());
            return;
        }

        // Create blog layout
        const blogLayout = this.createBlogLayout();
        container.appendChild(blogLayout);

        // Render posts
        this.renderPosts();

        // Render pagination if not infinite scroll
        if (!this.options.enableInfiniteScroll) {
            this.renderPagination();
        }

        this.metrics.renderTime = performance.now() - startTime;
        this.dispatchEvent('blog:rendered', { 
            renderTime: this.metrics.renderTime,
            postsCount: this.getCurrentPagePosts().length 
        });
    }

    createBlogLayout() {
        const layout = document.createElement('div');
        layout.className = 'blog-layout';
        layout.innerHTML = `
            ${this.options.enableSearch ? this.createSearchHTML() : ''}
            ${this.options.enableFilters ? this.createFiltersHTML() : ''}
            ${this.options.enableSorting ? this.createSortingHTML() : ''}
            <div class="blog-stats">
                <span class="posts-count">${this.state.filteredPosts.length} yazı bulundu</span>
            </div>
            <div class="blog-grid" id="blog-grid"></div>
            <div class="blog-pagination" id="blog-pagination"></div>
        `;
        return layout;
    }

    createSearchHTML() {
        return `
            <div class="blog-search">
                <div class="search-input-wrapper">
                    <input 
                        type="text" 
                        id="blog-search" 
                        placeholder="Blog yazılarında ara..."
                        value="${this.state.searchQuery}"
                        aria-label="Blog yazılarında ara"
                    >
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </div>
            </div>
        `;
    }

    createFiltersHTML() {
        const categories = [...new Set(this.state.posts.map(post => post.category))];
        const tags = [...new Set(this.state.posts.flatMap(post => post.tags))];

        return `
            <div class="blog-filters">
                <div class="filter-group">
                    <label for="category-filter">Kategori:</label>
                    <select id="category-filter" aria-label="Kategori filtresi">
                        <option value="all">Tümü</option>
                        ${categories.map(cat => 
                            `<option value="${cat}" ${cat === this.state.currentCategory ? 'selected' : ''}>${cat}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="filter-group">
                    <label for="tag-filter">Etiket:</label>
                    <select id="tag-filter" aria-label="Etiket filtresi">
                        <option value="all">Tümü</option>
                        ${tags.map(tag => 
                            `<option value="${tag}" ${tag === this.state.currentTag ? 'selected' : ''}>${tag}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    createSortingHTML() {
        return `
            <div class="blog-sorting">
                <div class="sort-group">
                    <label for="sort-by">Sırala:</label>
                    <select id="sort-by" aria-label="Sıralama kriteri">
                        <option value="date" ${this.state.sortBy === 'date' ? 'selected' : ''}>Tarih</option>
                        <option value="title" ${this.state.sortBy === 'title' ? 'selected' : ''}>Başlık</option>
                        <option value="views" ${this.state.sortBy === 'views' ? 'selected' : ''}>Görüntülenme</option>
                        <option value="likes" ${this.state.sortBy === 'likes' ? 'selected' : ''}>Beğeni</option>
                        <option value="readTime" ${this.state.sortBy === 'readTime' ? 'selected' : ''}>Okuma Süresi</option>
                    </select>
                </div>
                <div class="sort-group">
                    <label for="sort-order">Düzen:</label>
                    <select id="sort-order" aria-label="Sıralama düzeni">
                        <option value="desc" ${this.state.sortOrder === 'desc' ? 'selected' : ''}>Azalan</option>
                        <option value="asc" ${this.state.sortOrder === 'asc' ? 'selected' : ''}>Artan</option>
                    </select>
                </div>
            </div>
        `;
    }

    renderPosts() {
        const grid = document.getElementById('blog-grid');
        if (!grid) return;

        const posts = this.getCurrentPagePosts();
        
        posts.forEach((post, index) => {
            const postElement = this.createPostCard(post, index);
            grid.appendChild(postElement);
        });

        // Animate posts
        this.animatePosts();
    }

    createPostCard(post, index) {
        const card = document.createElement('article');
        card.className = 'blog-post-card';
        card.setAttribute('data-post-id', post.id);
        card.style.setProperty('--animation-delay', `${index * 100}ms`);
        
        card.innerHTML = `
            <div class="post-image">
                ${post.image ? 
                    `<img src="${post.image}" alt="${post.title}" loading="lazy">` :
                    `<div class="post-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21,15 16,10 5,21"></polyline>
                        </svg>
                    </div>`
                }
                ${post.featured ? '<span class="featured-badge">Öne Çıkan</span>' : ''}
            </div>
            <div class="post-content">
                <div class="post-meta">
                    <span class="post-category">${post.category}</span>
                    <span class="post-date">${this.formatDate(post.date)}</span>
                    <span class="post-read-time">${post.readTime} dk okuma</span>
                </div>
                <h3 class="post-title">
                    <a href="/posts/${post.slug}" aria-label="${post.title} yazısını oku">${post.title}</a>
                </h3>
                <p class="post-excerpt">${post.excerpt}</p>
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="post-stats">
                    <span class="post-views">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        ${post.views}
                    </span>
                    <span class="post-likes">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        ${post.likes}
                    </span>
                </div>
            </div>
        `;

        // Add click tracking
        card.addEventListener('click', () => this.trackPostView(post));

        return card;
    }

    getCurrentPagePosts() {
        const startIndex = (this.state.currentPage - 1) * this.options.postsPerPage;
        const endIndex = startIndex + this.options.postsPerPage;
        return this.state.filteredPosts.slice(startIndex, endIndex);
    }

    renderPagination() {
        const pagination = document.getElementById('blog-pagination');
        if (!pagination || this.state.totalPages <= 1) return;

        pagination.innerHTML = this.createPaginationHTML();
        this.setupPaginationEvents();
    }

    createPaginationHTML() {
        const { currentPage, totalPages } = this.state;
        let html = '<div class="pagination-wrapper">';

        // Previous button
        html += `
            <button 
                class="pagination-btn prev ${currentPage === 1 ? 'disabled' : ''}"
                data-page="${currentPage - 1}"
                ${currentPage === 1 ? 'disabled' : ''}
                aria-label="Önceki sayfa"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
                Önceki
            </button>
        `;

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            html += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button 
                    class="pagination-btn ${i === currentPage ? 'active' : ''}"
                    data-page="${i}"
                    aria-label="Sayfa ${i}"
                    ${i === currentPage ? 'aria-current="page"' : ''}
                >${i}</button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
            html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }

        // Next button
        html += `
            <button 
                class="pagination-btn next ${currentPage === totalPages ? 'disabled' : ''}"
                data-page="${currentPage + 1}"
                ${currentPage === totalPages ? 'disabled' : ''}
                aria-label="Sonraki sayfa"
            >
                Sonraki
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
            </button>
        `;

        html += '</div>';
        return html;
    }

    setupEventListeners() {
        // Search functionality
        if (this.options.enableSearch) {
            const searchInput = document.getElementById('blog-search');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(this.searchTimeout);
                    this.searchTimeout = setTimeout(() => {
                        this.handleSearch(e.target.value);
                    }, this.options.searchDelay);
                });
            }
        }

        // Filter functionality
        if (this.options.enableFilters) {
            const categoryFilter = document.getElementById('category-filter');
            const tagFilter = document.getElementById('tag-filter');
            
            if (categoryFilter) {
                categoryFilter.addEventListener('change', (e) => {
                    this.handleCategoryFilter(e.target.value);
                });
            }
            
            if (tagFilter) {
                tagFilter.addEventListener('change', (e) => {
                    this.handleTagFilter(e.target.value);
                });
            }
        }

        // Sorting functionality
        if (this.options.enableSorting) {
            const sortBy = document.getElementById('sort-by');
            const sortOrder = document.getElementById('sort-order');
            
            if (sortBy) {
                sortBy.addEventListener('change', (e) => {
                    this.handleSortChange(e.target.value, this.state.sortOrder);
                });
            }
            
            if (sortOrder) {
                sortOrder.addEventListener('change', (e) => {
                    this.handleSortChange(this.state.sortBy, e.target.value);
                });
            }
        }
    }

    setupPaginationEvents() {
        const paginationBtns = document.querySelectorAll('.pagination-btn:not(.disabled)');
        paginationBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.currentTarget.dataset.page);
                if (page && page !== this.state.currentPage) {
                    this.goToPage(page);
                }
            });
        });
    }

    setupIntersectionObserver() {
        if (!this.options.enableInfiniteScroll) return;

        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && this.state.hasMore && !this.state.isLoading) {
                        this.loadMorePosts();
                    }
                });
            },
            { threshold: 0.1 }
        );
    }

    handleSearch(query) {
        const startTime = performance.now();
        this.setState({ searchQuery: query });
        this.filterAndSort();
        this.render();
        this.metrics.searchTime = performance.now() - startTime;
        
        this.dispatchEvent('blog:searched', { 
            query, 
            results: this.state.filteredPosts.length,
            searchTime: this.metrics.searchTime 
        });
    }

    handleCategoryFilter(category) {
        this.setState({ currentCategory: category });
        this.filterAndSort();
        this.render();
        
        this.dispatchEvent('blog:categoryFiltered', { 
            category, 
            results: this.state.filteredPosts.length 
        });
    }

    handleTagFilter(tag) {
        this.setState({ currentTag: tag });
        this.filterAndSort();
        this.render();
        
        this.dispatchEvent('blog:tagFiltered', { 
            tag, 
            results: this.state.filteredPosts.length 
        });
    }

    handleSortChange(sortBy, sortOrder) {
        this.setState({ sortBy, sortOrder });
        this.filterAndSort();
        this.render();
        
        this.dispatchEvent('blog:sorted', { sortBy, sortOrder });
    }

    goToPage(page) {
        if (page < 1 || page > this.state.totalPages) return;
        
        this.setState({ currentPage: page });
        this.render();
        
        // Scroll to top of blog container
        const container = document.querySelector(this.options.container);
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        this.dispatchEvent('blog:pageChanged', { page });
    }

    async loadMorePosts() {
        if (!this.state.hasMore || this.state.isLoading) return;
        
        this.setState({ isLoading: true });
        
        // Simulate loading more posts (in real app, this would be an API call)
        setTimeout(() => {
            const nextPage = this.state.currentPage + 1;
            if (nextPage <= this.state.totalPages) {
                this.setState({ 
                    currentPage: nextPage,
                    isLoading: false 
                });
                this.renderPosts();
            } else {
                this.setState({ 
                    hasMore: false,
                    isLoading: false 
                });
            }
        }, 1000);
    }

    animatePosts() {
        const posts = document.querySelectorAll('.blog-post-card');
        posts.forEach((post, index) => {
            post.style.opacity = '0';
            post.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                post.style.transition = `opacity ${this.options.animationDuration}ms ease, transform ${this.options.animationDuration}ms ease`;
                post.style.opacity = '1';
                post.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    trackPostView(post) {
        this.metrics.totalViews++;
        
        const currentViews = this.metrics.popularPosts.get(post.id) || 0;
        this.metrics.popularPosts.set(post.id, currentViews + 1);
        
        this.dispatchEvent('blog:postViewed', { post, totalViews: this.metrics.totalViews });
    }

    createLoadingState() {
        const loading = document.createElement('div');
        loading.className = 'blog-loading';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <p>Blog yazıları yükleniyor...</p>
        `;
        return loading;
    }

    createEmptyState() {
        const empty = document.createElement('div');
        empty.className = 'blog-empty';
        empty.innerHTML = `
            <div class="empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
            </div>
            <h3>Yazı bulunamadı</h3>
            <p>Arama kriterlerinize uygun blog yazısı bulunamadı. Lütfen farklı anahtar kelimeler deneyin.</p>
            <button class="btn-primary" onclick="blogManager.clearFilters()">Filtreleri Temizle</button>
        `;
        return empty;
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-');
    }

    generateExcerpt(content, length = 150) {
        if (!content) return '';
        return content.length > length ? 
            content.substring(0, length) + '...' : 
            content;
    }

    calculateReadTime(content) {
        if (!content) return 0;
        const wordsPerMinute = 200;
        const words = content.split(/\s+/).length;
        return Math.ceil(words / wordsPerMinute);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
    }

    clearFilters() {
        this.setState({
            currentCategory: 'all',
            currentTag: 'all',
            searchQuery: '',
            sortBy: 'date',
            sortOrder: 'desc'
        });
        
        // Update UI
        const searchInput = document.getElementById('blog-search');
        const categoryFilter = document.getElementById('category-filter');
        const tagFilter = document.getElementById('tag-filter');
        const sortBy = document.getElementById('sort-by');
        const sortOrder = document.getElementById('sort-order');
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = 'all';
        if (tagFilter) tagFilter.value = 'all';
        if (sortBy) sortBy.value = 'date';
        if (sortOrder) sortOrder.value = 'desc';
        
        this.filterAndSort();
        this.render();
        
        this.dispatchEvent('blog:filtersCleared');
    }

    handleError(error) {
        const container = document.querySelector(this.options.container);
        if (container) {
            container.innerHTML = `
                <div class="blog-error">
                    <div class="error-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    </div>
                    <h3>Bir hata oluştu</h3>
                    <p>${error.message}</p>
                    <button class="btn-primary" onclick="location.reload()">Sayfayı Yenile</button>
                </div>
            `;
        }
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { 
            detail: { ...detail, timestamp: Date.now() } 
        });
        document.dispatchEvent(event);
    }

    // Public API
    refresh() {
        this.cache.clear();
        this.loadPosts();
    }

    getMetrics() {
        return { ...this.metrics };
    }

    getState() {
        return { ...this.state };
    }

    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        this.cache.clear();
        
        this.dispatchEvent('blog:destroyed');
    }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const blogContainer = document.querySelector('#blog-container');
    if (blogContainer) {
        window.blogManager = new BlogManager();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlogManager;
}

// Global access
window.BlogManager = BlogManager; 