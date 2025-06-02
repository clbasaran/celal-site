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
}

// Global API instance
window.API = new API(); 