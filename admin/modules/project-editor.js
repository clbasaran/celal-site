/**
 * Project Editor Module
 * Görsel proje yönetimi ve JSON kontrollü editör
 */
class ProjectEditor {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.isEditing = false;
        this.container = null;
        this.init();
    }

    async init() {
        await this.loadProjects();
        this.createContainer();
        this.render();
        this.setupEventListeners();
        console.log('✅ Project Editor modülü başlatıldı');
    }

    async loadProjects() {
        try {
            const response = await fetch('../data/projects.json');
            if (!response.ok) throw new Error('Projects veri yüklenemedi');
            
            const data = await response.json();
            this.projects = data.projects || [];
            
            // LocalStorage backup
            localStorage.setItem('projects-backup', JSON.stringify(this.projects));
            
        } catch (error) {
            console.warn('Projects yüklenemedi, localStorage backup kullanılıyor:', error);
            const backup = localStorage.getItem('projects-backup');
            this.projects = backup ? JSON.parse(backup) : [];
            
            if (window.toast) {
                window.toast.warning('Projeler yüklenemedi, yerel veriler kullanılıyor');
            }
        }
    }

    createContainer() {
        this.container = document.getElementById('project-editor');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'project-editor';
            
            const projectSection = document.getElementById('projects-section');
            if (projectSection) {
                projectSection.appendChild(this.container);
            }
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="editor-header">
                <h3>📱 Proje Editörü</h3>
                <div class="editor-actions">
                    <button class="btn-primary" id="add-new-project">
                        ➕ Yeni Proje
                    </button>
                    <button class="btn-secondary" id="save-projects">
                        💾 Kaydet
                    </button>
                    <button class="btn-secondary" id="export-projects">
                        📤 Dışa Aktar
                    </button>
                </div>
            </div>
            
            <div class="project-grid" id="project-grid">
                ${this.renderProjectCards()}
            </div>
            
            <div class="project-form-modal" id="project-form-modal" style="display: none;">
                <div class="modal-overlay" id="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 id="modal-title">Yeni Proje</h4>
                        <button class="modal-close" id="modal-close">&times;</button>
                    </div>
                    <form class="project-form" id="project-form">
                        ${this.renderProjectForm()}
                    </form>
                </div>
            </div>
        `;
    }

    renderProjectCards() {
        if (this.projects.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📱</div>
                    <h4>Henüz proje yok</h4>
                    <p>İlk projenizi ekleyerek başlayın</p>
                </div>
            `;
        }

        return this.projects.map(project => `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-card-header">
                    <div class="project-icon">${project.icon || '📱'}</div>
                    <div class="project-status status-${project.status || 'in-progress'}">
                        ${this.getStatusText(project.status)}
                    </div>
                </div>
                
                <div class="project-card-body">
                    <h4 class="project-title">${project.title}</h4>
                    <p class="project-description">${this.truncateText(project.description, 100)}</p>
                    
                    <div class="project-technologies">
                        ${(project.technologies || []).map(tech => 
                            `<span class="tech-tag">${tech}</span>`
                        ).join('')}
                    </div>
                    
                    <div class="project-metadata">
                        <span class="project-year">📅 ${project.year || 'TBD'}</span>
                        <span class="project-featured ${project.featured ? 'featured' : ''}">
                            ${project.featured ? '⭐ Öne Çıkan' : ''}
                        </span>
                    </div>
                </div>
                
                <div class="project-card-actions">
                    <button class="btn-edit" onclick="projectEditor.editProject('${project.id}')">
                        ✏️ Düzenle
                    </button>
                    <button class="btn-preview" onclick="projectEditor.previewProject('${project.id}')">
                        👁️ Önizle
                    </button>
                    <button class="btn-danger" onclick="projectEditor.deleteProject('${project.id}')">
                        🗑️ Sil
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderProjectForm() {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label for="project-title">Proje Başlığı</label>
                    <input type="text" id="project-title" name="title" required 
                           placeholder="Örn: iOS Uygulama">
                </div>
                <div class="form-group">
                    <label for="project-icon">İkon (Emoji)</label>
                    <input type="text" id="project-icon" name="icon" 
                           placeholder="📱" maxlength="2">
                </div>
            </div>
            
            <div class="form-group">
                <label for="project-description">Açıklama</label>
                <textarea id="project-description" name="description" rows="4" required
                         placeholder="Proje hakkında detaylı açıklama..."></textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="project-status">Durum</label>
                    <select id="project-status" name="status">
                        <option value="planned">📋 Planlandı</option>
                        <option value="in-progress">🚧 Devam Ediyor</option>
                        <option value="completed">✅ Tamamlandı</option>
                        <option value="on-hold">⏸️ Beklemede</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="project-year">Yıl</label>
                    <input type="number" id="project-year" name="year" 
                           min="2020" max="2030" value="${new Date().getFullYear()}">
                </div>
            </div>
            
            <div class="form-group">
                <label for="project-technologies">Teknolojiler (virgülle ayırın)</label>
                <input type="text" id="project-technologies" name="technologies"
                       placeholder="SwiftUI, Core Data, Firebase">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="project-github">GitHub URL</label>
                    <input type="url" id="project-github" name="github"
                           placeholder="https://github.com/user/repo">
                </div>
                <div class="form-group">
                    <label for="project-demo">Demo URL</label>
                    <input type="url" id="project-demo" name="demo"
                           placeholder="https://demo.example.com">
                </div>
            </div>
            
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="project-featured" name="featured">
                    <span class="checkbox-custom"></span>
                    Öne çıkan proje olarak işaretle
                </label>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" id="cancel-project">
                    ❌ İptal
                </button>
                <button type="submit" class="btn-primary">
                    💾 Kaydet
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        // Ana butonlar
        document.getElementById('add-new-project')?.addEventListener('click', () => {
            this.openModal();
        });

        document.getElementById('save-projects')?.addEventListener('click', () => {
            this.saveToJSON();
        });

        document.getElementById('export-projects')?.addEventListener('click', () => {
            this.exportProjects();
        });

        // Modal kontrolleri
        document.getElementById('modal-close')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('modal-overlay')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancel-project')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Form submit
        document.getElementById('project-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProject();
        });

        // ESC tuşu ile modal kapatma
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen()) {
                this.closeModal();
            }
        });
    }

    openModal(project = null) {
        this.currentProject = project;
        this.isEditing = !!project;
        
        const modal = document.getElementById('project-form-modal');
        const title = document.getElementById('modal-title');
        
        if (modal) {
            modal.style.display = 'flex';
            title.textContent = this.isEditing ? 'Proje Düzenle' : 'Yeni Proje';
            
            if (this.isEditing && project) {
                this.populateForm(project);
            } else {
                this.resetForm();
            }
            
            // Form'a fokus
            setTimeout(() => {
                document.getElementById('project-title')?.focus();
            }, 100);
        }
    }

    closeModal() {
        const modal = document.getElementById('project-form-modal');
        if (modal) {
            modal.style.display = 'none';
            this.currentProject = null;
            this.isEditing = false;
            this.resetForm();
        }
    }

    isModalOpen() {
        const modal = document.getElementById('project-form-modal');
        return modal && modal.style.display !== 'none';
    }

    populateForm(project) {
        document.getElementById('project-title').value = project.title || '';
        document.getElementById('project-icon').value = project.icon || '';
        document.getElementById('project-description').value = project.description || '';
        document.getElementById('project-status').value = project.status || 'planned';
        document.getElementById('project-year').value = project.year || new Date().getFullYear();
        document.getElementById('project-technologies').value = (project.technologies || []).join(', ');
        document.getElementById('project-github').value = project.links?.github || '';
        document.getElementById('project-demo').value = project.links?.demo || '';
        document.getElementById('project-featured').checked = project.featured || false;
    }

    resetForm() {
        document.getElementById('project-form')?.reset();
        document.getElementById('project-year').value = new Date().getFullYear();
    }

    saveProject() {
        try {
            const formData = this.getFormData();
            
            if (!this.validateProject(formData)) {
                return;
            }

            if (this.isEditing && this.currentProject) {
                // Güncelleme
                const index = this.projects.findIndex(p => p.id === this.currentProject.id);
                if (index !== -1) {
                    this.projects[index] = { ...this.currentProject, ...formData };
                    if (window.toast) {
                        window.toast.success('Proje güncellendi');
                    }
                }
            } else {
                // Yeni ekleme
                const newProject = {
                    id: this.generateId(),
                    ...formData
                };
                this.projects.push(newProject);
                if (window.toast) {
                    window.toast.success('Yeni proje eklendi');
                }
            }

            this.render();
            this.closeModal();
            this.updateLocalStorage();
            
            // Live preview güncelle
            if (window.livePreview) {
                window.livePreview.updateProjects(this.projects);
            }

        } catch (error) {
            console.error('Proje kaydetme hatası:', error);
            if (window.toast) {
                window.toast.error('Proje kaydedilemedi: ' + error.message);
            }
        }
    }

    getFormData() {
        const technologies = document.getElementById('project-technologies').value
            .split(',')
            .map(tech => tech.trim())
            .filter(tech => tech.length > 0);

        return {
            title: document.getElementById('project-title').value.trim(),
            icon: document.getElementById('project-icon').value.trim() || '📱',
            description: document.getElementById('project-description').value.trim(),
            status: document.getElementById('project-status').value,
            year: parseInt(document.getElementById('project-year').value),
            technologies,
            links: {
                github: document.getElementById('project-github').value.trim(),
                demo: document.getElementById('project-demo').value.trim(),
                details: "#"
            },
            featured: document.getElementById('project-featured').checked
        };
    }

    validateProject(project) {
        if (!project.title) {
            if (window.toast) {
                window.toast.error('Proje başlığı gerekli');
            }
            return false;
        }

        if (!project.description) {
            if (window.toast) {
                window.toast.error('Proje açıklaması gerekli');
            }
            return false;
        }

        if (project.technologies.length === 0) {
            if (window.toast) {
                window.toast.warning('En az bir teknoloji belirtmelisiniz');
            }
            return false;
        }

        return true;
    }

    editProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            this.openModal(project);
        }
    }

    previewProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (project && window.livePreview) {
            window.livePreview.previewProject(project);
            if (window.toast) {
                window.toast.info('Proje önizlemesi açıldı');
            }
        }
    }

    deleteProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;

        if (confirm(`"${project.title}" projesini silmek istediğinizden emin misiniz?`)) {
            this.projects = this.projects.filter(p => p.id !== projectId);
            this.render();
            this.updateLocalStorage();
            
            if (window.toast) {
                window.toast.success('Proje silindi');
            }

            // Live preview güncelle
            if (window.livePreview) {
                window.livePreview.updateProjects(this.projects);
            }
        }
    }

    async saveToJSON() {
        try {
            const data = {
                projects: this.projects
            };

            // Mock save (gerçek uygulamada backend'e gönderilir)
            console.log('Projects JSON güncelleniyor:', data);
            
            this.updateLocalStorage();
            
            if (window.toast) {
                window.toast.success('Projeler JSON dosyasına kaydedildi');
            }

        } catch (error) {
            console.error('JSON kaydetme hatası:', error);
            if (window.toast) {
                window.toast.error('JSON kaydetme hatası: ' + error.message);
            }
        }
    }

    exportProjects() {
        try {
            const data = {
                projects: this.projects,
                exportDate: new Date().toISOString(),
                version: "1.0"
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `projects-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);

            if (window.toast) {
                window.toast.success('Projeler dışa aktarıldı');
            }

        } catch (error) {
            console.error('Export hatası:', error);
            if (window.toast) {
                window.toast.error('Export hatası: ' + error.message);
            }
        }
    }

    updateLocalStorage() {
        localStorage.setItem('projects-backup', JSON.stringify(this.projects));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getStatusText(status) {
        const statusMap = {
            'planned': '📋 Planlandı',
            'in-progress': '🚧 Devam Ediyor', 
            'completed': '✅ Tamamlandı',
            'on-hold': '⏸️ Beklemede'
        };
        return statusMap[status] || '🚧 Devam Ediyor';
    }

    truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    // Public API
    getProjects() {
        return this.projects;
    }

    addProject(project) {
        const newProject = {
            id: this.generateId(),
            ...project
        };
        this.projects.push(newProject);
        this.render();
        this.updateLocalStorage();
        return newProject;
    }

    updateProject(projectId, updates) {
        const index = this.projects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            this.projects[index] = { ...this.projects[index], ...updates };
            this.render();
            this.updateLocalStorage();
            return this.projects[index];
        }
        return null;
    }
}

// Global instance oluştur
window.projectEditor = new ProjectEditor();

export default ProjectEditor;
