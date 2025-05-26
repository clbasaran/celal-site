class AdminManager {
    constructor() {
        this.projectsData = null;
        this.skillsData = null;
        this.currentEditingData = null;
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupNavigation();
        this.setupModals();
        this.setupForms();
        this.setupDataEditor();
        this.updateDashboard();
        this.renderProjects();
        this.renderSkills();
    }

    async loadData() {
        try {
            // Gerçek zamanlı JSON verilerini yükle
            const [projectsResponse, skillsResponse] = await Promise.all([
                fetch('../data/projects.json'),
                fetch('../data/skills.json')
            ]);
            
            this.projectsData = await projectsResponse.json();
            this.skillsData = await skillsResponse.json();
            
            console.log('Veriler başarıyla yüklendi');
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            // Fallback veriler
            this.projectsData = { projects: [] };
            this.skillsData = { skills: { categories: [] } };
        }
    }

    setupNavigation() {
        const menuItems = document.querySelectorAll('.admin-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
            });
        });
    }

    showSection(section) {
        // Aktif menü öğesini güncelle
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Bölümleri gizle/göster
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');

        // Başlığı güncelle
        const titles = {
            dashboard: 'Dashboard',
            projects: 'Projeler',
            skills: 'Yetenekler',
            settings: 'Ayarlar'
        };
        document.getElementById('admin-title').textContent = titles[section];
        this.currentSection = section;
    }

    setupModals() {
        // Modal kapatma işlemleri
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });

        // Modal dışına tıklama ile kapatma
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }

    setupForms() {
        // Proje formu
        document.getElementById('add-project-btn').addEventListener('click', () => {
            this.openProjectModal();
        });

        document.getElementById('project-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProject();
        });

        // Yetenek formu
        document.getElementById('add-skill-btn').addEventListener('click', () => {
            this.openSkillModal();
        });

        document.getElementById('skill-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSkill();
        });

        // Ayarlar
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('import-data-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });
    }

    setupDataEditor() {
        // JSON editör alanını oluştur
        const settingsSection = document.getElementById('settings-section');
        const settingsGrid = settingsSection.querySelector('.settings-grid');
        
        const editorCard = document.createElement('div');
        editorCard.className = 'setting-card';
        editorCard.innerHTML = `
            <h3>JSON Veri Editörü</h3>
            <div class="form-group">
                <label for="data-type-select">Düzenlenecek Veri</label>
                <select id="data-type-select">
                    <option value="projects">Projeler</option>
                    <option value="skills">Yetenekler</option>
                </select>
            </div>
            <div class="form-group">
                <label for="json-editor">JSON Verisi</label>
                <textarea id="json-editor" rows="15" placeholder="JSON verisi burada görünecek..."></textarea>
            </div>
            <div class="form-group">
                <button class="btn-primary" id="save-json-btn">💾 JSON'u Kaydet</button>
                <button class="btn-secondary" id="refresh-json-btn">🔄 Yenile</button>
            </div>
            <div id="json-error" class="json-error" style="display: none;"></div>
        `;
        
        settingsGrid.appendChild(editorCard);

        // JSON editör event listeners
        document.getElementById('data-type-select').addEventListener('change', (e) => {
            this.loadJSONEditor(e.target.value);
        });

        document.getElementById('save-json-btn').addEventListener('click', () => {
            this.saveJSONData();
        });

        document.getElementById('refresh-json-btn').addEventListener('click', () => {
            const dataType = document.getElementById('data-type-select').value;
            this.loadJSONEditor(dataType);
        });

        // İlk yükleme
        this.loadJSONEditor('projects');
    }

    loadJSONEditor(dataType) {
        const editor = document.getElementById('json-editor');
        const data = dataType === 'projects' ? this.projectsData : this.skillsData;
        editor.value = JSON.stringify(data, null, 2);
        this.currentEditingData = dataType;
    }

    saveJSONData() {
        const editor = document.getElementById('json-editor');
        const errorDiv = document.getElementById('json-error');
        
        try {
            const jsonData = JSON.parse(editor.value);
            
            if (this.currentEditingData === 'projects') {
                this.projectsData = jsonData;
                this.renderProjects();
            } else {
                this.skillsData = jsonData;
                this.renderSkills();
            }
            
            this.updateDashboard();
            errorDiv.style.display = 'none';
            
            // Başarı mesajı
            this.showNotification('JSON verisi başarıyla güncellendi!', 'success');
            
        } catch (error) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = `JSON Hatası: ${error.message}`;
            errorDiv.style.color = 'var(--accent)';
            errorDiv.style.padding = '1rem';
            errorDiv.style.background = 'rgba(255, 59, 48, 0.1)';
            errorDiv.style.borderRadius = '8px';
            errorDiv.style.marginTop = '1rem';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateDashboard() {
        // İstatistikleri güncelle
        const projectsCount = this.projectsData.projects.length;
        const skillsCount = this.skillsData.skills.categories.reduce((total, cat) => total + cat.skills.length, 0);
        
        document.getElementById('projects-count').textContent = projectsCount;
        document.getElementById('skills-count').textContent = skillsCount;

        // Son projeleri göster
        const recentProjects = this.projectsData.projects.slice(0, 3);
        const recentContainer = document.getElementById('recent-projects');
        recentContainer.innerHTML = recentProjects.map(project => `
            <div class="recent-item">
                <h4>${project.icon} ${project.title}</h4>
                <p>${project.description.slice(0, 100)}...</p>
            </div>
        `).join('');
    }

    renderProjects() {
        const tbody = document.getElementById('projects-table');
        tbody.innerHTML = this.projectsData.projects.map(project => `
            <tr>
                <td>${project.icon} ${project.title}</td>
                <td><span class="status-badge status-${project.status}">${this.getStatusText(project.status)}</span></td>
                <td>${project.year}</td>
                <td>
                    <div class="tech-tags">
                        ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                    </div>
                </td>
                <td>
                    <button class="btn-edit" onclick="adminManager.editProject('${project.id}')">✏️ Düzenle</button>
                    <button class="btn-danger" onclick="adminManager.deleteProject('${project.id}')">🗑️ Sil</button>
                </td>
            </tr>
        `).join('');
    }

    renderSkills() {
        const container = document.getElementById('skills-categories');
        container.innerHTML = this.skillsData.skills.categories.map(category => `
            <div class="skill-category-admin">
                <h3>
                    ${category.title}
                    <button class="btn-primary" onclick="adminManager.addSkillToCategory('${category.id}')">➕ Yetenek Ekle</button>
                </h3>
                <div class="skills-list">
                    ${category.skills.map(skill => `
                        <div class="skill-item">
                            <div class="skill-info">
                                <h4>${skill.name}</h4>
                                <p>${this.skillsData.levelLabels[skill.level]} - ${skill.years} yıl</p>
                            </div>
                            <div class="skill-actions">
                                <button class="btn-edit" onclick="adminManager.editSkill('${category.id}', '${skill.name}')">✏️</button>
                                <button class="btn-danger" onclick="adminManager.deleteSkill('${category.id}', '${skill.name}')">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Skill modal category select'ini güncelle
        const categorySelect = document.getElementById('skill-category');
        categorySelect.innerHTML = '<option value="">Kategori Seçin</option>' +
            this.skillsData.skills.categories.map(cat => 
                `<option value="${cat.id}">${cat.title}</option>`
            ).join('');
    }

    getStatusText(status) {
        const statusMap = {
            'completed': 'Tamamlandı',
            'in-progress': 'Devam Ediyor',
            'planned': 'Planlandı'
        };
        return statusMap[status] || status;
    }

    openProjectModal(projectId = null) {
        const modal = document.getElementById('project-modal');
        const title = document.getElementById('project-modal-title');
        
        if (projectId) {
            title.textContent = 'Proje Düzenle';
            // Proje verilerini forma yükle
            const project = this.projectsData.projects.find(p => p.id === projectId);
            if (project) {
                document.getElementById('project-title').value = project.title;
                document.getElementById('project-description').value = project.description;
                document.getElementById('project-icon').value = project.icon;
                document.getElementById('project-technologies').value = project.technologies.join(', ');
                document.getElementById('project-year').value = project.year;
                document.getElementById('project-status').value = project.status;
            }
        } else {
            title.textContent = 'Yeni Proje Ekle';
            document.getElementById('project-form').reset();
        }
        
        modal.classList.add('active');
    }

    saveProject() {
        const formData = {
            id: Date.now().toString(),
            title: document.getElementById('project-title').value,
            description: document.getElementById('project-description').value,
            icon: document.getElementById('project-icon').value || '📱',
            technologies: document.getElementById('project-technologies').value.split(',').map(t => t.trim()),
            year: parseInt(document.getElementById('project-year').value),
            status: document.getElementById('project-status').value,
            featured: true,
            links: {
                details: "#",
                github: "#"
            }
        };

        this.projectsData.projects.push(formData);
        this.renderProjects();
        this.updateDashboard();
        document.getElementById('project-modal').classList.remove('active');
        this.showNotification('Proje başarıyla eklendi!', 'success');
    }

    editProject(projectId) {
        this.openProjectModal(projectId);
    }

    deleteProject(projectId) {
        if (confirm('Bu projeyi silmek istediğinizden emin misiniz?')) {
            this.projectsData.projects = this.projectsData.projects.filter(p => p.id !== projectId);
            this.renderProjects();
            this.updateDashboard();
            this.showNotification('Proje silindi!', 'success');
        }
    }

    exportData() {
        const data = {
            projects: this.projectsData,
            skills: this.skillsData,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async importData(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.projects) this.projectsData = data.projects;
            if (data.skills) this.skillsData = data.skills;
            
            this.renderProjects();
            this.renderSkills();
            this.updateDashboard();
            this.showNotification('Veriler başarıyla içe aktarıldı!', 'success');
        } catch (error) {
            alert('Dosya okuma hatası: ' + error.message);
        }
    }
}

// CSS animation ekle
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Global instance
let adminManager;

// DOM yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', async () => {
    // Global instances oluştur
    window.adminManager = new AdminManager();
    
    // Navigation ve Editor'ı modül olarak import et
    try {
        const { default: AdminNavigation } = await import('./admin-nav.js');
        const { default: JSONEditor } = await import('./admin-editor.js');
        
        // Global instances
        window.adminNav = new AdminNavigation();
        window.jsonEditor = new JSONEditor();
        
        console.log('Admin modülleri başarıyla yüklendi');
    } catch (error) {
        console.error('Admin modülleri yüklenirken hata:', error);
    }
}); 