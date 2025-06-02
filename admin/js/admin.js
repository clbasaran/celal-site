/**
 * Admin Panel JavaScript
 * Professional admin panel system with complete functionality
 */

class AdminPanel {
    constructor() {
        this.config = {
            apiBaseUrl: '/api',
            currentSection: 'dashboard',
            theme: localStorage.getItem('admin-theme') || 'light',
            sidebarOpen: window.innerWidth > 768,
            autoSaveDelay: 2000,
            notifications: true
        };
        
        this.data = {
            siteSettings: {},
            skills: [],
            projects: [],
            blogPosts: [],
            messages: [],
            analytics: {}
        };
        
        this.editors = {};
        this.autosaveTimers = {};
        
        this.init();
    }

    init() {
        this.initElements();
        this.loadConfig();
        this.setupEventListeners();
        this.setupTheme();
        this.setupEditors();
        this.loadData();
        this.startAutoSave();
        
        // Hide loading screen
        setTimeout(() => {
            const loading = document.getElementById('adminLoading');
            if (loading) {
                loading.classList.add('hidden');
                setTimeout(() => loading.remove(), 300);
            }
        }, 1000);
    }

    initElements() {
        this.elements = {
            sidebar: document.getElementById('adminSidebar'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            mobileSidebarToggle: document.getElementById('mobileSidebarToggle'),
            themeToggle: document.getElementById('themeToggle'),
            navItems: document.querySelectorAll('.nav-item'),
            contentSections: document.querySelectorAll('.content-section'),
            pageTitle: document.getElementById('pageTitle'),
            searchInput: document.getElementById('headerSearch'),
            modals: document.querySelectorAll('.modal'),
            toastContainer: document.getElementById('toastContainer')
        };
    }

    setupEventListeners() {
        // Sidebar toggle
        if (this.elements.sidebarToggle) {
            this.elements.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (this.elements.mobileSidebarToggle) {
            this.elements.mobileSidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Theme toggle
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Navigation
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Search
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Modal handling
        this.setupModalHandlers();

        // Form handling
        this.setupFormHandlers();

        // Responsive handling
        window.addEventListener('resize', () => this.handleResize());

        // Auto-save on form changes
        this.setupAutoSave();

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    toggleSidebar() {
        this.config.sidebarOpen = !this.config.sidebarOpen;
        
        if (this.config.sidebarOpen) {
            this.elements.sidebar.classList.add('open');
        } else {
            this.elements.sidebar.classList.remove('open');
        }
        
        localStorage.setItem('admin-sidebar-open', this.config.sidebarOpen);
    }

    toggleTheme() {
        this.config.theme = this.config.theme === 'light' ? 'dark' : 'light';
        this.setupTheme();
        localStorage.setItem('admin-theme', this.config.theme);
        
        this.showToast('success', 'Tema değiştirildi', `${this.config.theme === 'dark' ? 'Karanlık' : 'Açık'} tema aktif edildi.`);
    }

    setupTheme() {
        document.documentElement.setAttribute('data-theme', this.config.theme);
        
        const themeIcon = this.elements.themeToggle?.querySelector('i');
        if (themeIcon) {
            themeIcon.className = this.config.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    showSection(sectionName) {
        // Update navigation
        this.elements.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === sectionName) {
                item.classList.add('active');
            }
        });

        // Update content
        this.elements.contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === `${sectionName}Section`) {
                section.classList.add('active');
            }
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            content: 'İçerik Yönetimi',
            design: 'Tasarım Ayarları',
            portfolio: 'Portfolio',
            skills: 'Yetenekler',
            blog: 'Blog',
            messages: 'Mesajlar',
            analytics: 'Analitik',
            settings: 'Site Ayarları',
            users: 'Kullanıcılar',
            backups: 'Yedekler'
        };

        if (this.elements.pageTitle) {
            this.elements.pageTitle.textContent = titles[sectionName] || 'Admin Panel';
        }

        this.config.currentSection = sectionName;
        
        // Load section specific data
        this.loadSectionData(sectionName);
        
        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 768) {
            this.config.sidebarOpen = false;
            this.elements.sidebar.classList.remove('open');
        }
    }

    setupModalHandlers() {
        // Modal open buttons
        document.addEventListener('click', (e) => {
            const modalTrigger = e.target.closest('[data-modal]');
            if (modalTrigger) {
                const modalId = modalTrigger.getAttribute('data-modal');
                this.openModal(modalId);
            }

            // Modal close
            if (e.target.classList.contains('modal') || e.target.classList.contains('modal-close')) {
                this.closeAllModals();
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeAllModals() {
        this.elements.modals.forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    setupFormHandlers() {
        // Form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.classList.contains('admin-form')) {
                e.preventDefault();
                this.handleFormSubmit(form);
            }
        });

        // Color picker changes
        document.addEventListener('change', (e) => {
            if (e.target.type === 'color') {
                this.handleColorChange(e.target);
            }
        });

        // Range slider changes
        document.addEventListener('input', (e) => {
            if (e.target.type === 'range') {
                this.handleRangeChange(e.target);
            }
        });
    }

    handleFormSubmit(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const formType = form.getAttribute('data-form-type');

        this.showLoadingSpinner(form);

        // Simulate API call
        setTimeout(() => {
            this.hideLoadingSpinner(form);
            
            switch (formType) {
                case 'site-settings':
                    this.updateSiteSettings(data);
                    break;
                case 'skill':
                    this.saveSkill(data);
                    break;
                case 'project':
                    this.saveProject(data);
                    break;
                case 'blog-post':
                    this.saveBlogPost(data);
                    break;
                default:
                    console.log('Form data:', data);
            }

            this.showToast('success', 'Başarılı', 'Veriler kaydedildi.');
            this.closeAllModals();
        }, 1000);
    }

    handleColorChange(input) {
        const property = input.getAttribute('data-css-property');
        if (property) {
            document.documentElement.style.setProperty(property, input.value);
            this.scheduleAutoSave('design');
        }
    }

    handleRangeChange(input) {
        const valueDisplay = input.parentElement.querySelector('.range-value');
        if (valueDisplay) {
            valueDisplay.textContent = input.value + (input.getAttribute('data-unit') || '');
        }
        this.scheduleAutoSave('design');
    }

    setupEditors() {
        // Initialize Quill editors for rich text editing
        const editorElements = document.querySelectorAll('.rich-editor');
        editorElements.forEach(element => {
            const editor = new Quill(element, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'align': [] }],
                        ['link', 'image', 'video'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['clean']
                    ]
                }
            });
            
            this.editors[element.id] = editor;
            
            // Auto-save on content change
            editor.on('text-change', () => {
                this.scheduleAutoSave('content');
            });
        });
    }

    setupAutoSave() {
        // Auto-save on input changes
        document.addEventListener('input', (e) => {
            if (e.target.matches('.form-control, .color-picker, .form-range')) {
                this.scheduleAutoSave(this.config.currentSection);
            }
        });
    }

    scheduleAutoSave(type) {
        if (this.autosaveTimers[type]) {
            clearTimeout(this.autosaveTimers[type]);
        }

        this.autosaveTimers[type] = setTimeout(() => {
            this.autoSave(type);
        }, this.config.autoSaveDelay);
    }

    autoSave(type) {
        console.log(`Auto-saving ${type} data...`);
        
        // Show subtle indicator
        this.showAutoSaveIndicator();
        
        // Save to localStorage as backup
        this.saveToLocalStorage(type);
    }

    showAutoSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.innerHTML = '<i class="fas fa-save"></i> Otomatik kaydedildi';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => indicator.style.opacity = '1', 100);
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
        }, 2000);
    }

    saveToLocalStorage(type) {
        const data = this.gatherFormData(type);
        localStorage.setItem(`admin-${type}-backup`, JSON.stringify(data));
    }

    gatherFormData(type) {
        const forms = document.querySelectorAll(`[data-form-type="${type}"]`);
        const data = {};
        
        forms.forEach(form => {
            const formData = new FormData(form);
            Object.assign(data, Object.fromEntries(formData.entries()));
        });
        
        return data;
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveCurrentSection();
                this.showToast('success', 'Kaydedildi', 'Mevcut bölüm kaydedildi.');
            }
            
            // Ctrl/Cmd + Shift + D for dashboard
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.showSection('dashboard');
            }
            
            // Ctrl/Cmd + Shift + T for theme toggle
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    saveCurrentSection() {
        this.autoSave(this.config.currentSection);
    }

    handleResize() {
        if (window.innerWidth <= 768) {
            this.config.sidebarOpen = false;
            this.elements.sidebar.classList.remove('open');
        } else {
            this.config.sidebarOpen = true;
            this.elements.sidebar.classList.add('open');
        }
    }

    handleSearch(query) {
        console.log('Searching for:', query);
        // Implement search functionality
    }

    loadConfig() {
        // Load saved configuration
        const savedSidebarState = localStorage.getItem('admin-sidebar-open');
        if (savedSidebarState !== null) {
            this.config.sidebarOpen = savedSidebarState === 'true';
        }
        
        if (this.config.sidebarOpen && window.innerWidth > 768) {
            this.elements.sidebar.classList.add('open');
        }
    }

    loadData() {
        this.loadSiteSettings();
        this.loadSkills();
        this.loadProjects();
        this.loadBlogPosts();
        this.loadMessages();
        this.loadAnalytics();
    }

    loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'skills':
                this.renderSkills();
                break;
            case 'portfolio':
                this.renderProjects();
                break;
            case 'blog':
                this.renderBlogPosts();
                break;
            case 'messages':
                this.renderMessages();
                break;
        }
    }

    loadSiteSettings() {
        // Load from localStorage or default values
        const defaultSettings = {
            siteName: 'Celal Başaran',
            tagline: 'Premium AI Expert',
            description: 'AI uzmanı ve modern web geliştirici. Premium dijital çözümler ve akıllı uygulamalar.',
            primaryColor: '#3b82f6',
            secondaryColor: '#8b5cf6',
            accentColor: '#06d6a0',
            backgroundColor: '#ffffff',
            textColor: '#0f172a',
            logoUrl: '',
            faviconUrl: '',
            socialLinks: {
                github: 'https://github.com/celalbasaran',
                linkedin: 'https://linkedin.com/in/celalbasaran',
                twitter: 'https://twitter.com/celalbasaran',
                email: 'celal@celalbasaran.com'
            }
        };

        this.data.siteSettings = JSON.parse(localStorage.getItem('admin-site-settings')) || defaultSettings;
        this.applySettings();
    }

    applySettings() {
        const settings = this.data.siteSettings;
        
        // Update page title
        if (settings.siteName) {
            document.querySelector('#page-title').textContent = settings.siteName;
        }
        
        // Update meta description
        if (settings.description) {
            document.querySelector('#page-description').setAttribute('content', settings.description);
        }
        
        // Apply color scheme
        if (settings.primaryColor) {
            document.documentElement.style.setProperty('--primary', settings.primaryColor);
        }
        
        // Update form fields with current values
        this.populateSettingsForm();
    }

    populateSettingsForm() {
        const settings = this.data.siteSettings;
        
        Object.keys(settings).forEach(key => {
            const input = document.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'color') {
                    input.value = settings[key];
                } else {
                    input.value = settings[key];
                }
            }
        });
    }

    updateSiteSettings(data) {
        this.data.siteSettings = { ...this.data.siteSettings, ...data };
        localStorage.setItem('admin-site-settings', JSON.stringify(this.data.siteSettings));
        this.applySettings();
    }

    loadSkills() {
        const defaultSkills = [
            { id: 1, name: 'JavaScript', category: 'Frontend', level: 95, icon: 'fab fa-js' },
            { id: 2, name: 'React', category: 'Frontend', level: 90, icon: 'fab fa-react' },
            { id: 3, name: 'Node.js', category: 'Backend', level: 85, icon: 'fab fa-node-js' },
            { id: 4, name: 'Python', category: 'AI/ML', level: 88, icon: 'fab fa-python' },
            { id: 5, name: 'Machine Learning', category: 'AI/ML', level: 82, icon: 'fas fa-brain' }
        ];

        this.data.skills = JSON.parse(localStorage.getItem('admin-skills')) || defaultSkills;
    }

    renderSkills() {
        const container = document.getElementById('skillsList');
        if (!container) return;

        container.innerHTML = this.data.skills.map(skill => `
            <div class="skill-item" data-skill-id="${skill.id}">
                <div class="skill-icon">
                    <i class="${skill.icon}"></i>
                </div>
                <div class="skill-info">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-category">${skill.category}</div>
                    <div class="skill-level-bar">
                        <div class="skill-level-fill" style="width: ${skill.level}%"></div>
                    </div>
                    <div class="skill-level-text">${skill.level}%</div>
                </div>
                <div class="skill-actions">
                    <button class="skill-edit" onclick="adminPanel.editSkill(${skill.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="skill-delete" onclick="adminPanel.deleteSkill(${skill.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    saveSkill(data) {
        if (data.id) {
            // Update existing
            const index = this.data.skills.findIndex(s => s.id === parseInt(data.id));
            if (index !== -1) {
                this.data.skills[index] = { ...this.data.skills[index], ...data };
            }
        } else {
            // Add new
            data.id = Date.now();
            this.data.skills.push(data);
        }
        
        localStorage.setItem('admin-skills', JSON.stringify(this.data.skills));
        this.renderSkills();
    }

    editSkill(id) {
        const skill = this.data.skills.find(s => s.id === id);
        if (skill) {
            // Populate modal form
            Object.keys(skill).forEach(key => {
                const input = document.querySelector(`#skillModal [name="${key}"]`);
                if (input) {
                    input.value = skill[key];
                }
            });
            this.openModal('skillModal');
        }
    }

    deleteSkill(id) {
        if (confirm('Bu yeteneği silmek istediğinizden emin misiniz?')) {
            this.data.skills = this.data.skills.filter(s => s.id !== id);
            localStorage.setItem('admin-skills', JSON.stringify(this.data.skills));
            this.renderSkills();
            this.showToast('success', 'Silindi', 'Yetenek başarıyla silindi.');
        }
    }

    loadProjects() {
        const defaultProjects = [
            {
                id: 1,
                title: 'AI Chat Bot',
                category: 'AI/ML',
                description: 'Modern sohbet botu uygulaması',
                technologies: ['Python', 'TensorFlow', 'React'],
                image: '',
                featured: true,
                status: 'completed'
            }
        ];

        this.data.projects = JSON.parse(localStorage.getItem('admin-projects')) || defaultProjects;
    }

    renderProjects() {
        const container = document.getElementById('projectsList');
        if (!container) return;

        container.innerHTML = this.data.projects.map(project => `
            <div class="project-item" data-project-id="${project.id}">
                <div class="project-header">
                    <div class="project-image">
                        ${project.image ? `<img src="${project.image}" alt="${project.title}">` : '<i class="fas fa-image"></i>'}
                    </div>
                    <div class="project-info">
                        <div class="project-title">${project.title}</div>
                        <div class="project-category">
                            <i class="fas fa-tag"></i>
                            ${project.category}
                        </div>
                        <div class="project-description">${project.description}</div>
                        <div class="project-technologies">
                            ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                        <div class="project-meta">
                            ${project.featured ? '<div class="project-featured"><i class="fas fa-star"></i> Öne Çıkan</div>' : ''}
                            <div class="project-actions">
                                <button class="project-view" onclick="adminPanel.viewProject(${project.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="project-edit" onclick="adminPanel.editProject(${project.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="project-delete" onclick="adminPanel.deleteProject(${project.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    saveProject(data) {
        if (data.technologies && typeof data.technologies === 'string') {
            data.technologies = data.technologies.split(',').map(t => t.trim());
        }
        
        if (data.id) {
            const index = this.data.projects.findIndex(p => p.id === parseInt(data.id));
            if (index !== -1) {
                this.data.projects[index] = { ...this.data.projects[index], ...data };
            }
        } else {
            data.id = Date.now();
            this.data.projects.push(data);
        }
        
        localStorage.setItem('admin-projects', JSON.stringify(this.data.projects));
        this.renderProjects();
    }

    editProject(id) {
        const project = this.data.projects.find(p => p.id === id);
        if (project) {
            Object.keys(project).forEach(key => {
                const input = document.querySelector(`#projectModal [name="${key}"]`);
                if (input) {
                    if (key === 'technologies' && Array.isArray(project[key])) {
                        input.value = project[key].join(', ');
                    } else {
                        input.value = project[key];
                    }
                }
            });
            this.openModal('projectModal');
        }
    }

    deleteProject(id) {
        if (confirm('Bu projeyi silmek istediğinizden emin misiniz?')) {
            this.data.projects = this.data.projects.filter(p => p.id !== id);
            localStorage.setItem('admin-projects', JSON.stringify(this.data.projects));
            this.renderProjects();
            this.showToast('success', 'Silindi', 'Proje başarıyla silindi.');
        }
    }

    loadBlogPosts() {
        this.data.blogPosts = JSON.parse(localStorage.getItem('admin-blog-posts')) || [];
    }

    loadMessages() {
        this.data.messages = JSON.parse(localStorage.getItem('admin-messages')) || [];
    }

    loadAnalytics() {
        this.data.analytics = JSON.parse(localStorage.getItem('admin-analytics')) || {
            visitors: 1250,
            pageViews: 3840,
            projects: this.data.projects.length,
            messages: this.data.messages.length
        };
        this.renderAnalytics();
    }

    loadDashboardData() {
        this.renderAnalytics();
        this.renderRecentActivity();
    }

    renderAnalytics() {
        const stats = [
            { label: 'Toplam Ziyaretçi', value: this.data.analytics.visitors, icon: 'fas fa-users', change: '+12%' },
            { label: 'Sayfa Görüntüleme', value: this.data.analytics.pageViews, icon: 'fas fa-eye', change: '+8%' },
            { label: 'Projeler', value: this.data.analytics.projects, icon: 'fas fa-project-diagram', change: '+2' },
            { label: 'Mesajlar', value: this.data.analytics.messages, icon: 'fas fa-envelope', change: '+5' }
        ];

        const container = document.getElementById('statsRow');
        if (container) {
            container.innerHTML = stats.map(stat => `
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="${stat.icon}"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number">${stat.value.toLocaleString()}</div>
                        <div class="stat-label">${stat.label}</div>
                        <div class="stat-change positive">${stat.change}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    renderRecentActivity() {
        const activities = [
            'Yeni proje eklendi: AI Chat Bot',
            'Site ayarları güncellendi',
            'Yeni mesaj alındı',
            'Blog yazısı yayınlandı',
            'Tema değiştirildi'
        ];

        const container = document.getElementById('recentActivityList');
        if (container) {
            container.innerHTML = activities.map(activity => `
                <div class="activity-item">${activity}</div>
            `).join('');
        }
    }

    showLoadingSpinner(form) {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="loading-spinner-small"></div>';
        form.style.position = 'relative';
        form.appendChild(overlay);
    }

    hideLoadingSpinner(form) {
        const overlay = form.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    showToast(type, title, message) {
        if (!this.elements.toastContainer) {
            // Create toast container if it doesn't exist
            this.elements.toastContainer = document.createElement('div');
            this.elements.toastContainer.id = 'toastContainer';
            this.elements.toastContainer.className = 'toast-container';
            document.body.appendChild(this.elements.toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${this.getToastIcon(type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.elements.toastContainer.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
    }

    getToastIcon(type) {
        const icons = {
            success: 'check',
            error: 'exclamation-triangle',
            warning: 'exclamation',
            info: 'info'
        };
        return icons[type] || 'info';
    }

    // Export/Import functionality
    exportData() {
        const exportData = {
            siteSettings: this.data.siteSettings,
            skills: this.data.skills,
            projects: this.data.projects,
            blogPosts: this.data.blogPosts,
            timestamp: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `admin-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    importData(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    if (confirm('Bu işlem mevcut verilerin üzerine yazacak. Devam etmek istiyor musunuz?')) {
                        this.data = { ...this.data, ...importedData };
                        this.saveAllData();
                        this.loadData();
                        this.showToast('success', 'İçe Aktarıldı', 'Veriler başarıyla içe aktarıldı.');
                    }
                } catch (error) {
                    this.showToast('error', 'Hata', 'Dosya formatı geçersiz.');
                }
            };
            reader.readAsText(file);
        }
    }

    saveAllData() {
        localStorage.setItem('admin-site-settings', JSON.stringify(this.data.siteSettings));
        localStorage.setItem('admin-skills', JSON.stringify(this.data.skills));
        localStorage.setItem('admin-projects', JSON.stringify(this.data.projects));
        localStorage.setItem('admin-blog-posts', JSON.stringify(this.data.blogPosts));
        localStorage.setItem('admin-messages', JSON.stringify(this.data.messages));
        localStorage.setItem('admin-analytics', JSON.stringify(this.data.analytics));
    }

    resetData() {
        if (confirm('Tüm veriler silinecek ve varsayılan ayarlara dönülecek. Bu işlem geri alınamaz!')) {
            localStorage.clear();
            location.reload();
        }
    }

    startAutoSave() {
        // Auto-save every 5 minutes
        setInterval(() => {
            this.saveAllData();
            console.log('Auto-save completed');
        }, 5 * 60 * 1000);
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('tr-TR');
}

function formatNumber(num) {
    return num.toLocaleString('tr-TR');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 