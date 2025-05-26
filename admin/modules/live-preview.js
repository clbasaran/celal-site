/**
 * Live Preview Module
 * Gerçek zamanlı önizleme sistemi
 */
class LivePreview {
    constructor() {
        this.container = null;
        this.currentMode = 'desktop'; // desktop, tablet, mobile
        this.currentView = 'projects'; // projects, skills, about
        this.projectsData = [];
        this.skillsData = null;
        this.isVisible = false;
        this.init();
    }

    async init() {
        this.createContainer();
        await this.loadInitialData();
        this.render();
        this.setupEventListeners();
        console.log('✅ Live Preview modülü başlatıldı');
    }

    async loadInitialData() {
        try {
            // Projeler yükle
            if (window.projectEditor) {
                this.projectsData = window.projectEditor.getProjects();
            }

            // Yetenekler yükle
            if (window.skillTags) {
                this.skillsData = window.skillTags.getSkillsData();
            }

        } catch (error) {
            console.warn('Live preview veri yükleme hatası:', error);
        }
    }

    createContainer() {
        this.container = document.getElementById('preview-panel');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'preview-panel';
            this.container.className = 'live-preview-panel';
            
            // Admin content'e ekle
            const adminContent = document.querySelector('.admin-content');
            if (adminContent) {
                adminContent.appendChild(this.container);
            }
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="preview-header">
                <h3>👁️ Canlı Önizleme</h3>
                <div class="preview-controls">
                    <div class="view-selector">
                        <button class="view-btn ${this.currentView === 'projects' ? 'active' : ''}" 
                                data-view="projects">📱 Projeler</button>
                        <button class="view-btn ${this.currentView === 'skills' ? 'active' : ''}" 
                                data-view="skills">🛠️ Yetenekler</button>
                        <button class="view-btn ${this.currentView === 'about' ? 'active' : ''}" 
                                data-view="about">👤 Hakkında</button>
                    </div>
                    
                    <div class="device-selector">
                        <button class="device-btn ${this.currentMode === 'mobile' ? 'active' : ''}" 
                                data-mode="mobile" title="Mobil Görünüm">📱</button>
                        <button class="device-btn ${this.currentMode === 'tablet' ? 'active' : ''}" 
                                data-mode="tablet" title="Tablet Görünüm">💻</button>
                        <button class="device-btn ${this.currentMode === 'desktop' ? 'active' : ''}" 
                                data-mode="desktop" title="Masaüstü Görünüm">🖥️</button>
                    </div>
                    
                    <div class="preview-actions">
                        <button class="btn-toggle-preview" id="toggle-preview">
                            ${this.isVisible ? '👁️ Gizle' : '👁️ Göster'}
                        </button>
                        <button class="btn-refresh-preview" id="refresh-preview">
                            🔄 Yenile
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="preview-viewport ${this.currentMode} ${this.isVisible ? 'visible' : 'hidden'}" 
                 id="preview-viewport">
                <div class="preview-container">
                    <div class="preview-content" id="preview-content">
                        ${this.renderPreviewContent()}
                    </div>
                </div>
                
                <div class="preview-info">
                    <div class="preview-stats">
                        <span class="stat-item">📐 ${this.getViewportSize()}</span>
                        <span class="stat-item">🎯 ${this.getCurrentViewName()}</span>
                        <span class="stat-item">📊 ${this.getContentStats()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderPreviewContent() {
        switch (this.currentView) {
            case 'projects':
                return this.renderProjectsPreview();
            case 'skills':
                return this.renderSkillsPreview();
            case 'about':
                return this.renderAboutPreview();
            default:
                return this.renderProjectsPreview();
        }
    }

    renderProjectsPreview() {
        if (!this.projectsData || this.projectsData.length === 0) {
            return `
                <div class="preview-empty">
                    <div class="empty-icon">📱</div>
                    <h4>Henüz proje yok</h4>
                    <p>Projeler eklendiğinde burada görüntülenecek</p>
                </div>
            `;
        }

        const featuredProjects = this.projectsData.filter(p => p.featured);
        const regularProjects = this.projectsData.filter(p => !p.featured);

        return `
            <div class="projects-preview">
                ${featuredProjects.length > 0 ? `
                    <section class="featured-projects">
                        <h3>⭐ Öne Çıkan Projeler</h3>
                        <div class="projects-grid featured-grid">
                            ${featuredProjects.map(project => this.renderProjectCard(project, true)).join('')}
                        </div>
                    </section>
                ` : ''}
                
                ${regularProjects.length > 0 ? `
                    <section class="all-projects">
                        <h3>📱 Tüm Projeler</h3>
                        <div class="projects-grid">
                            ${regularProjects.map(project => this.renderProjectCard(project, false)).join('')}
                        </div>
                    </section>
                ` : ''}
            </div>
        `;
    }

    renderProjectCard(project, isFeatured = false) {
        return `
            <div class="project-card ${isFeatured ? 'featured' : ''}" data-project-id="${project.id}">
                <div class="project-header">
                    <div class="project-icon">${project.icon || '📱'}</div>
                    <div class="project-status status-${project.status || 'in-progress'}">
                        ${this.getStatusBadge(project.status)}
                    </div>
                </div>
                
                <div class="project-info">
                    <h4 class="project-title">${project.title}</h4>
                    <p class="project-description">${this.truncateText(project.description, 120)}</p>
                </div>
                
                <div class="project-tech">
                    ${(project.technologies || []).slice(0, 3).map(tech => 
                        `<span class="tech-badge">${tech}</span>`
                    ).join('')}
                    ${project.technologies && project.technologies.length > 3 ? 
                        `<span class="tech-more">+${project.technologies.length - 3}</span>` : ''
                    }
                </div>
                
                <div class="project-meta">
                    <span class="project-year">📅 ${project.year || 'TBD'}</span>
                    ${isFeatured ? '<span class="featured-badge">⭐ Öne Çıkan</span>' : ''}
                </div>
                
                <div class="project-actions">
                    ${project.links?.github ? '<button class="btn-link">GitHub</button>' : ''}
                    ${project.links?.demo ? '<button class="btn-link">Demo</button>' : ''}
                </div>
            </div>
        `;
    }

    renderSkillsPreview() {
        if (!this.skillsData || !this.skillsData.skills?.categories?.length) {
            return `
                <div class="preview-empty">
                    <div class="empty-icon">🛠️</div>
                    <h4>Henüz yetenek yok</h4>
                    <p>Yetenekler eklendiğinde burada görüntülenecek</p>
                </div>
            `;
        }

        return `
            <div class="skills-preview">
                <div class="skills-overview">
                    <h3>🛠️ Teknik Yetenekler</h3>
                    <p>Profesyonel gelişim alanlarındaki deneyimlerim</p>
                </div>
                
                <div class="skills-categories">
                    ${this.skillsData.skills.categories.map(category => this.renderSkillCategory(category)).join('')}
                </div>
                
                <div class="skills-summary">
                    <div class="summary-stats">
                        <div class="stat-box">
                            <h4>${this.getTotalSkillsCount()}</h4>
                            <p>Toplam Yetenek</p>
                        </div>
                        <div class="stat-box">
                            <h4>${this.getAverageExperience()}</h4>
                            <p>Ortalama Deneyim</p>
                        </div>
                        <div class="stat-box">
                            <h4>${this.skillsData.skills.categories.length}</h4>
                            <p>Kategori</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSkillCategory(category) {
        return `
            <div class="skill-category">
                <h4 class="category-title">${category.title}</h4>
                <div class="skills-grid">
                    ${category.skills.map(skill => this.renderSkillItem(skill)).join('')}
                </div>
            </div>
        `;
    }

    renderSkillItem(skill) {
        return `
            <div class="skill-item">
                <div class="skill-header">
                    <span class="skill-name">${skill.name}</span>
                    <span class="skill-level-badge level-${skill.level}">
                        ${this.getLevelEmoji(skill.level)}
                    </span>
                </div>
                <div class="skill-progress">
                    <div class="progress-bar">
                        <div class="progress-fill level-${skill.level}" 
                             style="width: ${this.getLevelPercentage(skill.level)}%"></div>
                    </div>
                    <span class="skill-experience">${skill.years || 0} yıl</span>
                </div>
            </div>
        `;
    }

    renderAboutPreview() {
        return `
            <div class="about-preview">
                <div class="about-hero">
                    <div class="profile-section">
                        <div class="profile-avatar">CB</div>
                        <div class="profile-info">
                            <h2>Celal Başaran</h2>
                            <p class="profile-title">Bilgisayar Mühendisliği Öğrencisi</p>
                            <p class="profile-subtitle">iOS Geliştirici & Swift Enthusiast</p>
                        </div>
                    </div>
                </div>
                
                <div class="about-content">
                    <section class="about-description">
                        <h3>Hakkımda</h3>
                        <p>Merhaba! Ben Celal, bilgisayar mühendisliği öğrencisiyim ve iOS geliştirme konusunda tutkulu bir geliştiriciyim. 
                        Swift ve SwiftUI teknolojileri ile mobile uygulamalar geliştirmeyi seviyorum.</p>
                        
                        <div class="highlights">
                            <div class="highlight-item">
                                <span class="highlight-icon">🎓</span>
                                <span>Bilgisayar Mühendisliği Öğrencisi</span>
                            </div>
                            <div class="highlight-item">
                                <span class="highlight-icon">📱</span>
                                <span>iOS Uygulama Geliştirici</span>
                            </div>
                            <div class="highlight-item">
                                <span class="highlight-icon">💻</span>
                                <span>2+ Yıl Swift Deneyimi</span>
                            </div>
                            <div class="highlight-item">
                                <span class="highlight-icon">🚀</span>
                                <span>12+ Kişisel Proje</span>
                            </div>
                        </div>
                    </section>
                    
                    <section class="about-stats">
                        <h3>İstatistikler</h3>
                        <div class="stats-grid">
                            <div class="stat-card">
                                <h4>${this.getTotalSkillsCount()}</h4>
                                <p>Teknik Yetenek</p>
                            </div>
                            <div class="stat-card">
                                <h4>${this.projectsData.length}</h4>
                                <p>Toplam Proje</p>
                            </div>
                            <div class="stat-card">
                                <h4>${this.getCompletedProjectsCount()}</h4>
                                <p>Tamamlanan</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // View selector
        document.addEventListener('click', (e) => {
            if (e.target.matches('.view-btn')) {
                this.currentView = e.target.dataset.view;
                this.render();
            }
        });

        // Device selector
        document.addEventListener('click', (e) => {
            if (e.target.matches('.device-btn')) {
                this.currentMode = e.target.dataset.mode;
                this.render();
            }
        });

        // Toggle preview
        document.addEventListener('click', (e) => {
            if (e.target.matches('#toggle-preview')) {
                this.togglePreview();
            }
        });

        // Refresh preview
        document.addEventListener('click', (e) => {
            if (e.target.matches('#refresh-preview')) {
                this.refreshPreview();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                this.togglePreview();
            }
        });
    }

    togglePreview() {
        this.isVisible = !this.isVisible;
        const viewport = document.getElementById('preview-viewport');
        const toggleBtn = document.getElementById('toggle-preview');
        
        if (viewport) {
            viewport.className = viewport.className.replace(/visible|hidden/g, '');
            viewport.classList.add(this.isVisible ? 'visible' : 'hidden');
        }
        
        if (toggleBtn) {
            toggleBtn.textContent = this.isVisible ? '👁️ Gizle' : '👁️ Göster';
        }
        
        if (window.toast) {
            window.toast.info(`Önizleme ${this.isVisible ? 'açıldı' : 'gizlendi'}`);
        }
    }

    async refreshPreview() {
        await this.loadInitialData();
        this.render();
        
        if (window.toast) {
            window.toast.success('Önizleme yenilendi');
        }
    }

    // Public API - Diğer modüllerden çağrılır
    updateProjects(projects) {
        this.projectsData = projects;
        if (this.currentView === 'projects') {
            this.render();
        }
    }

    updateSkills(skillsData) {
        this.skillsData = skillsData;
        if (this.currentView === 'skills') {
            this.render();
        }
    }

    previewProject(project) {
        this.currentView = 'projects';
        this.isVisible = true;
        this.render();
        
        // Proje kartını highlight et
        setTimeout(() => {
            const projectCard = document.querySelector(`[data-project-id="${project.id}"]`);
            if (projectCard) {
                projectCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                projectCard.classList.add('highlighted');
                setTimeout(() => {
                    projectCard.classList.remove('highlighted');
                }, 2000);
            }
        }, 100);
    }

    // Helper methods
    getViewportSize() {
        const sizes = {
            'mobile': '375px',
            'tablet': '768px',
            'desktop': '1200px'
        };
        return sizes[this.currentMode] || '1200px';
    }

    getCurrentViewName() {
        const names = {
            'projects': 'Projeler',
            'skills': 'Yetenekler',
            'about': 'Hakkında'
        };
        return names[this.currentView] || 'Projeler';
    }

    getContentStats() {
        switch (this.currentView) {
            case 'projects':
                return `${this.projectsData.length} proje`;
            case 'skills':
                return `${this.getTotalSkillsCount()} yetenek`;
            case 'about':
                return 'Profil sayfası';
            default:
                return '';
        }
    }

    getTotalSkillsCount() {
        if (!this.skillsData?.skills?.categories) return 0;
        return this.skillsData.skills.categories.reduce((total, cat) => total + cat.skills.length, 0);
    }

    getCompletedProjectsCount() {
        return this.projectsData.filter(p => p.status === 'completed').length;
    }

    getAverageExperience() {
        if (!this.skillsData?.skills?.categories) return '0 yıl';
        
        let totalYears = 0;
        let skillCount = 0;
        
        this.skillsData.skills.categories.forEach(cat => {
            cat.skills.forEach(skill => {
                totalYears += skill.years || 0;
                skillCount++;
            });
        });
        
        const average = skillCount > 0 ? totalYears / skillCount : 0;
        return `${average.toFixed(1)} yıl`;
    }

    getStatusBadge(status) {
        const badges = {
            'completed': '✅',
            'in-progress': '🚧',
            'planned': '📋',
            'on-hold': '⏸️'
        };
        return badges[status] || '🚧';
    }

    getLevelEmoji(level) {
        const emojis = {
            'beginner': '🌱',
            'intermediate': '📈',
            'advanced': '🚀',
            'expert': '⭐'
        };
        return emojis[level] || '🌱';
    }

    getLevelPercentage(level) {
        const percentages = {
            'beginner': 25,
            'intermediate': 50,
            'advanced': 75,
            'expert': 100
        };
        return percentages[level] || 25;
    }

    truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }
}

// Global instance oluştur
window.livePreview = new LivePreview();

export default LivePreview;
