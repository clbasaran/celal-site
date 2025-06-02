class API {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('admin_token');
    }

    // Authorization header'ı ekle
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // Generic API call fonksiyonu
    async apiCall(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}/api${endpoint}`;
            const config = {
                headers: this.getHeaders(),
                ...options
            };

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API hatası');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication
    async login(username, password) {
        try {
            const data = await this.apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            if (data.success) {
                this.token = data.token;
                localStorage.setItem('admin_token', data.token);
                localStorage.setItem('admin_user', JSON.stringify(data.user));
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    logout() {
        this.token = null;
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login.html';
    }

    // Posts API
    async getPosts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.apiCall(`/posts${query ? `?${query}` : ''}`);
    }

    async getPost(id) {
        return await this.apiCall(`/posts/${id}`);
    }

    async createPost(postData) {
        return await this.apiCall('/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
    }

    async updatePost(id, postData) {
        return await this.apiCall(`/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
    }

    async deletePost(id) {
        return await this.apiCall(`/posts/${id}`, {
            method: 'DELETE'
        });
    }

    // Projects API
    async getProjects(params = {}) {
        const query = new URLSearchParams(params).toString();
        return await this.apiCall(`/projects${query ? `?${query}` : ''}`);
    }

    async getProject(id) {
        return await this.apiCall(`/projects/${id}`);
    }

    async createProject(projectData) {
        return await this.apiCall('/projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    }

    async updateProject(id, projectData) {
        return await this.apiCall(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(projectData)
        });
    }

    async deleteProject(id) {
        return await this.apiCall(`/projects/${id}`, {
            method: 'DELETE'
        });
    }

    // Dashboard Statistics
    async getDashboardStats() {
        // Simüle edilmiş istatistikler
        return {
            success: true,
            data: {
                totalPosts: await this.getPosts().then(r => r.total || 0),
                totalProjects: await this.getProjects().then(r => r.total || 0),
                publishedPosts: await this.getPosts({ status: 'published' }).then(r => r.total || 0),
                draftPosts: await this.getPosts({ status: 'draft' }).then(r => r.total || 0)
            }
        };
    }

    // File Upload (gelecekte implement edilecek)
    async uploadFile(file) {
        // TODO: Cloudflare R2 entegrasyonu
        return {
            success: true,
            url: '/assets/images/placeholder.jpg'
        };
    }

    // Media API
    async uploadMedia(file, metadata = {}) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('metadata', JSON.stringify(metadata));

            const response = await fetch(`${this.baseURL}/api/media/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    async getMediaFiles(category = null, limit = 20) {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        params.append('limit', limit.toString());

        return await this.apiCall(`/media/upload?${params.toString()}`);
    }

    async deleteMediaFile(filename) {
        return await this.apiCall(`/media/upload/${filename}`, {
            method: 'DELETE'
        });
    }

    // Database API
    async getDatabaseStatus() {
        return await this.apiCall('/database/status');
    }

    async initializeDatabase() {
        return await this.apiCall('/database/init', {
            method: 'POST'
        });
    }

    async executeQuery(query, params = []) {
        return await this.apiCall('/database/query', {
            method: 'POST',
            body: JSON.stringify({ query, params })
        });
    }

    async createBackup() {
        return await this.apiCall('/database/backup', {
            method: 'POST'
        });
    }

    async restoreBackup(backupId) {
        return await this.apiCall('/database/restore', {
            method: 'POST',
            body: JSON.stringify({ backupId })
        });
    }

    // SEO API
    async getPageSEO(page) {
        return await this.apiCall(`/seo/page/${page}`);
    }

    async updatePageSEO(page, seoData) {
        return await this.apiCall(`/seo/page/${page}`, {
            method: 'PUT',
            body: JSON.stringify(seoData)
        });
    }

    async generateSitemap() {
        const response = await fetch(`${this.baseURL}/api/seo/sitemap`);
        return await response.text();
    }

    async generateRobotsTxt() {
        const response = await fetch(`${this.baseURL}/api/seo/robots`);
        return await response.text();
    }

    async analyzeSEO(url, content) {
        return await this.apiCall('/seo/analyze', {
            method: 'POST',
            body: JSON.stringify({ url, content })
        });
    }

    async generateSchema(type, data) {
        return await this.apiCall('/seo/schema', {
            method: 'POST',
            body: JSON.stringify({ type, data })
        });
    }

    // Performance Monitoring
    async getPerformanceMetrics() {
        // Simulated performance data
        return {
            success: true,
            data: {
                pageLoadTime: Math.random() * 2 + 1, // 1-3 seconds
                firstContentfulPaint: Math.random() * 1.5 + 0.5, // 0.5-2 seconds
                largestContentfulPaint: Math.random() * 2 + 1, // 1-3 seconds
                cumulativeLayoutShift: Math.random() * 0.1, // 0-0.1
                firstInputDelay: Math.random() * 100, // 0-100ms
                score: Math.floor(Math.random() * 30) + 70, // 70-100
                timestamp: new Date().toISOString()
            }
        };
    }

    // Analytics API (simulated)
    async getAnalytics(period = '7d') {
        return {
            success: true,
            data: {
                pageViews: Math.floor(Math.random() * 1000) + 500,
                uniqueVisitors: Math.floor(Math.random() * 300) + 200,
                bounceRate: Math.random() * 0.4 + 0.3, // 30-70%
                avgSessionDuration: Math.random() * 300 + 120, // 2-7 minutes
                topPages: [
                    { page: '/', views: Math.floor(Math.random() * 500) + 100 },
                    { page: '/projects', views: Math.floor(Math.random() * 300) + 50 },
                    { page: '/about', views: Math.floor(Math.random() * 200) + 30 },
                ],
                period
            }
        };
    }
}

// Global API instance
window.API = new API(); 