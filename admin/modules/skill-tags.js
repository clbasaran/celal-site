/**
 * Skill Tags Module
 * Yetenek yönetimi ve tag sistemi
 */
class SkillTags {
    constructor() {
        this.skillsData = null;
        this.categories = [];
        this.currentSkill = null;
        this.isEditing = false;
        this.container = null;
        this.init();
    }

    async init() {
        await this.loadSkills();
        this.createContainer();
        this.render();
        this.setupEventListeners();
        console.log('✅ Skill Tags modülü başlatıldı');
    }

    async loadSkills() {
        try {
            const response = await fetch('../data/skills.json');
            if (!response.ok) throw new Error('Skills veri yüklenemedi');
            
            this.skillsData = await response.json();
            this.categories = this.skillsData.skills?.categories || [];
            
            // LocalStorage backup
            localStorage.setItem('skills-backup', JSON.stringify(this.skillsData));
            
        } catch (error) {
            console.warn('Skills yüklenemedi, localStorage backup kullanılıyor:', error);
            const backup = localStorage.getItem('skills-backup');
            this.skillsData = backup ? JSON.parse(backup) : { skills: { categories: [] }, levelLabels: {} };
            this.categories = this.skillsData.skills?.categories || [];
            
            if (window.toast) {
                window.toast.warning('Yetenekler yüklenemedi, yerel veriler kullanılıyor');
            }
        }
    }

    createContainer() {
        this.container = document.getElementById('skill-tags');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'skill-tags';
            
            const skillsSection = document.getElementById('skills-section');
            if (skillsSection) {
                skillsSection.appendChild(this.container);
            }
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="editor-header">
                <h3>🛠️ Yetenek Editörü</h3>
                <div class="editor-actions">
                    <button class="btn-primary" id="add-new-skill">
                        ➕ Yeni Yetenek
                    </button>
                    <button class="btn-secondary" id="add-category">
                        📂 Kategori Ekle
                    </button>
                    <button class="btn-secondary" id="save-skills">
                        💾 Kaydet
                    </button>
                </div>
            </div>
            
            <div class="skills-categories" id="skills-categories">
                ${this.renderCategories()}
            </div>
            
            <div class="skill-form-modal" id="skill-form-modal" style="display: none;">
                <div class="modal-overlay" id="skill-modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h4 id="skill-modal-title">Yeni Yetenek</h4>
                        <button class="modal-close" id="skill-modal-close">&times;</button>
                    </div>
                    <form class="skill-form" id="skill-form">
                        ${this.renderSkillForm()}
                    </form>
                </div>
            </div>
            
            <div class="category-form-modal" id="category-form-modal" style="display: none;">
                <div class="modal-overlay" id="category-modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h4>Yeni Kategori</h4>
                        <button class="modal-close" id="category-modal-close">&times;</button>
                    </div>
                    <form class="category-form" id="category-form">
                        ${this.renderCategoryForm()}
                    </form>
                </div>
            </div>
        `;
    }

    renderCategories() {
        if (this.categories.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🛠️</div>
                    <h4>Henüz kategori yok</h4>
                    <p>İlk kategoriyi ekleyerek başlayın</p>
                </div>
            `;
        }

        return this.categories.map(category => `
            <div class="skill-category-card" data-category-id="${category.id}">
                <div class="category-header">
                    <h4 class="category-title">${category.title}</h4>
                    <div class="category-actions">
                        <button class="btn-add-skill" onclick="skillTags.addSkillToCategory('${category.id}')">
                            ➕ Yetenek Ekle
                        </button>
                        <button class="btn-edit-category" onclick="skillTags.editCategory('${category.id}')">
                            ✏️
                        </button>
                        <button class="btn-delete-category" onclick="skillTags.deleteCategory('${category.id}')">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="skills-grid">
                    ${this.renderSkillsInCategory(category)}
                </div>
                
                <div class="category-stats">
                    <span class="stat-item">
                        📊 ${category.skills.length} yetenek
                    </span>
                    <span class="stat-item">
                        ⚡ Ortalama: ${this.calculateAverageLevel(category.skills)}
                    </span>
                </div>
            </div>
        `).join('');
    }

    renderSkillsInCategory(category) {
        if (!category.skills || category.skills.length === 0) {
            return `
                <div class="no-skills">
                    <p>Bu kategoride henüz yetenek yok</p>
                </div>
            `;
        }

        return category.skills.map(skill => `
            <div class="skill-tag-card" data-skill-name="${skill.name}" data-category-id="${category.id}">
                <div class="skill-tag-header">
                    <span class="skill-name">${skill.name}</span>
                    <div class="skill-actions">
                        <button class="btn-edit-skill" onclick="skillTags.editSkill('${category.id}', '${skill.name}')">
                            ✏️
                        </button>
                        <button class="btn-delete-skill" onclick="skillTags.deleteSkill('${category.id}', '${skill.name}')">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="skill-level">
                    <div class="level-bar">
                        <div class="level-fill level-${skill.level}" style="width: ${this.getLevelPercentage(skill.level)}%"></div>
                    </div>
                    <span class="level-text">
                        ${this.getLevelLabel(skill.level)} (${skill.years || 0} yıl)
                    </span>
                </div>
                
                <div class="skill-meta">
                    <span class="skill-badge level-${skill.level}">
                        ${this.getLevelEmoji(skill.level)} ${this.getLevelLabel(skill.level)}
                    </span>
                </div>
            </div>
        `).join('');
    }

    renderSkillForm() {
        return `
            <div class="form-group">
                <label for="skill-category-select">Kategori</label>
                <select id="skill-category-select" name="category" required>
                    <option value="">Kategori Seçin</option>
                    ${this.categories.map(cat => 
                        `<option value="${cat.id}">${cat.title}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label for="skill-name">Yetenek Adı</label>
                <input type="text" id="skill-name" name="name" required
                       placeholder="Örn: SwiftUI, JavaScript">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="skill-level">Seviye</label>
                    <select id="skill-level" name="level" required>
                        <option value="">Seviye Seçin</option>
                        <option value="beginner">🌱 Başlangıç</option>
                        <option value="intermediate">📈 Orta</option>
                        <option value="advanced">🚀 İleri</option>
                        <option value="expert">⭐ Uzman</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="skill-years">Deneyim (Yıl)</label>
                    <input type="number" id="skill-years" name="years" 
                           min="0" max="20" step="0.5" value="1">
                </div>
            </div>
            
            <div class="form-group">
                <label for="skill-description">Açıklama (İsteğe bağlı)</label>
                <textarea id="skill-description" name="description" rows="2"
                         placeholder="Bu yetenek hakkında kısa bilgi..."></textarea>
            </div>
            
            <div class="skill-preview" id="skill-preview">
                <h5>Önizleme:</h5>
                <div class="preview-skill-card">
                    <span class="preview-name">Yetenek Adı</span>
                    <div class="preview-level">
                        <div class="level-bar">
                            <div class="level-fill" style="width: 0%"></div>
                        </div>
                        <span class="level-text">Seviye</span>
                    </div>
                </div>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" id="cancel-skill">
                    ❌ İptal
                </button>
                <button type="submit" class="btn-primary">
                    💾 Kaydet
                </button>
            </div>
        `;
    }

    renderCategoryForm() {
        return `
            <div class="form-group">
                <label for="category-title">Kategori Adı</label>
                <input type="text" id="category-title" name="title" required
                       placeholder="Örn: Programlama Dilleri">
            </div>
            
            <div class="form-group">
                <label for="category-description">Açıklama (İsteğe bağlı)</label>
                <textarea id="category-description" name="description" rows="2"
                         placeholder="Bu kategori hakkında kısa bilgi..."></textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn-secondary" id="cancel-category">
                    ❌ İptal
                </button>
                <button type="submit" class="btn-primary">
                    💾 Kategori Ekle
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        // Ana butonlar
        document.getElementById('add-new-skill')?.addEventListener('click', () => {
            this.openSkillModal();
        });

        document.getElementById('add-category')?.addEventListener('click', () => {
            this.openCategoryModal();
        });

        document.getElementById('save-skills')?.addEventListener('click', () => {
            this.saveToJSON();
        });

        // Skill modal kontrolleri
        document.getElementById('skill-modal-close')?.addEventListener('click', () => {
            this.closeSkillModal();
        });

        document.getElementById('skill-modal-overlay')?.addEventListener('click', () => {
            this.closeSkillModal();
        });

        document.getElementById('cancel-skill')?.addEventListener('click', () => {
            this.closeSkillModal();
        });

        // Category modal kontrolleri
        document.getElementById('category-modal-close')?.addEventListener('click', () => {
            this.closeCategoryModal();
        });

        document.getElementById('category-modal-overlay')?.addEventListener('click', () => {
            this.closeCategoryModal();
        });

        document.getElementById('cancel-category')?.addEventListener('click', () => {
            this.closeCategoryModal();
        });

        // Form submits
        document.getElementById('skill-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSkill();
        });

        document.getElementById('category-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });

        // Real-time preview
        this.setupSkillPreview();
    }

    setupSkillPreview() {
        const inputs = ['skill-name', 'skill-level', 'skill-years'];
        inputs.forEach(inputId => {
            document.getElementById(inputId)?.addEventListener('input', () => {
                this.updateSkillPreview();
            });
        });
    }

    updateSkillPreview() {
        const name = document.getElementById('skill-name')?.value || 'Yetenek Adı';
        const level = document.getElementById('skill-level')?.value || 'beginner';
        const years = document.getElementById('skill-years')?.value || '0';

        const previewName = document.querySelector('.preview-name');
        const previewFill = document.querySelector('.preview-level .level-fill');
        const previewText = document.querySelector('.preview-level .level-text');

        if (previewName) previewName.textContent = name;
        if (previewFill) {
            previewFill.style.width = this.getLevelPercentage(level) + '%';
            previewFill.className = `level-fill level-${level}`;
        }
        if (previewText) {
            previewText.textContent = `${this.getLevelLabel(level)} (${years} yıl)`;
        }
    }

    openSkillModal(categoryId = null, skill = null) {
        this.currentSkill = skill;
        this.isEditing = !!skill;
        
        const modal = document.getElementById('skill-form-modal');
        const title = document.getElementById('skill-modal-title');
        
        if (modal) {
            modal.style.display = 'flex';
            title.textContent = this.isEditing ? 'Yetenek Düzenle' : 'Yeni Yetenek';
            
            if (categoryId) {
                document.getElementById('skill-category-select').value = categoryId;
            }
            
            if (this.isEditing && skill) {
                this.populateSkillForm(skill, categoryId);
            } else {
                this.resetSkillForm();
            }
            
            this.updateSkillPreview();
            
            // Form'a fokus
            setTimeout(() => {
                document.getElementById('skill-name')?.focus();
            }, 100);
        }
    }

    closeSkillModal() {
        const modal = document.getElementById('skill-form-modal');
        if (modal) {
            modal.style.display = 'none';
            this.currentSkill = null;
            this.isEditing = false;
            this.resetSkillForm();
        }
    }

    openCategoryModal() {
        const modal = document.getElementById('category-form-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.resetCategoryForm();
            
            setTimeout(() => {
                document.getElementById('category-title')?.focus();
            }, 100);
        }
    }

    closeCategoryModal() {
        const modal = document.getElementById('category-form-modal');
        if (modal) {
            modal.style.display = 'none';
            this.resetCategoryForm();
        }
    }

    populateSkillForm(skill, categoryId) {
        document.getElementById('skill-category-select').value = categoryId || '';
        document.getElementById('skill-name').value = skill.name || '';
        document.getElementById('skill-level').value = skill.level || 'beginner';
        document.getElementById('skill-years').value = skill.years || 1;
        document.getElementById('skill-description').value = skill.description || '';
    }

    resetSkillForm() {
        document.getElementById('skill-form')?.reset();
        document.getElementById('skill-years').value = 1;
    }

    resetCategoryForm() {
        document.getElementById('category-form')?.reset();
    }

    addSkillToCategory(categoryId) {
        this.openSkillModal(categoryId);
    }

    editSkill(categoryId, skillName) {
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            const skill = category.skills.find(s => s.name === skillName);
            if (skill) {
                this.openSkillModal(categoryId, skill);
            }
        }
    }

    deleteSkill(categoryId, skillName) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        const skill = category.skills.find(s => s.name === skillName);
        if (!skill) return;

        if (confirm(`"${skill.name}" yeteneğini silmek istediğinizden emin misiniz?`)) {
            category.skills = category.skills.filter(s => s.name !== skillName);
            this.render();
            this.updateLocalStorage();
            
            if (window.toast) {
                window.toast.success('Yetenek silindi');
            }

            // Live preview güncelle
            if (window.livePreview) {
                window.livePreview.updateSkills(this.skillsData);
            }
        }
    }

    editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            this.openCategoryModal();
            document.getElementById('category-title').value = category.title || '';
            document.getElementById('category-description').value = category.description || '';
        }
    }

    deleteCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        if (confirm(`"${category.title}" kategorisini ve içindeki tüm yetenekleri silmek istediğinizden emin misiniz?`)) {
            this.categories = this.categories.filter(c => c.id !== categoryId);
            this.skillsData.skills.categories = this.categories;
            this.render();
            this.updateLocalStorage();
            
            if (window.toast) {
                window.toast.success('Kategori silindi');
            }

            // Live preview güncelle
            if (window.livePreview) {
                window.livePreview.updateSkills(this.skillsData);
            }
        }
    }

    saveSkill() {
        try {
            const formData = this.getSkillFormData();
            
            if (!this.validateSkill(formData)) {
                return;
            }

            const category = this.categories.find(c => c.id === formData.categoryId);
            if (!category) {
                if (window.toast) {
                    window.toast.error('Kategori bulunamadı');
                }
                return;
            }

            if (this.isEditing && this.currentSkill) {
                // Güncelleme
                const skillIndex = category.skills.findIndex(s => s.name === this.currentSkill.name);
                if (skillIndex !== -1) {
                    category.skills[skillIndex] = {
                        name: formData.name,
                        level: formData.level,
                        years: formData.years,
                        description: formData.description
                    };
                    if (window.toast) {
                        window.toast.success('Yetenek güncellendi');
                    }
                }
            } else {
                // Yeni ekleme - Aynı isimde skill var mı kontrol et
                const existingSkill = category.skills.find(s => s.name === formData.name);
                if (existingSkill) {
                    if (window.toast) {
                        window.toast.error('Bu isimde bir yetenek zaten var');
                    }
                    return;
                }

                category.skills.push({
                    name: formData.name,
                    level: formData.level,
                    years: formData.years,
                    description: formData.description
                });
                
                if (window.toast) {
                    window.toast.success('Yeni yetenek eklendi');
                }
            }

            this.render();
            this.closeSkillModal();
            this.updateLocalStorage();
            
            // Live preview güncelle
            if (window.livePreview) {
                window.livePreview.updateSkills(this.skillsData);
            }

        } catch (error) {
            console.error('Yetenek kaydetme hatası:', error);
            if (window.toast) {
                window.toast.error('Yetenek kaydedilemedi: ' + error.message);
            }
        }
    }

    saveCategory() {
        try {
            const title = document.getElementById('category-title').value.trim();
            const description = document.getElementById('category-description').value.trim();

            if (!title) {
                if (window.toast) {
                    window.toast.error('Kategori adı gerekli');
                }
                return;
            }

            // Aynı isimde kategori var mı kontrol et
            const existingCategory = this.categories.find(c => c.title === title);
            if (existingCategory) {
                if (window.toast) {
                    window.toast.error('Bu isimde bir kategori zaten var');
                }
                return;
            }

            const newCategory = {
                id: this.generateId(),
                title,
                description,
                skills: []
            };

            this.categories.push(newCategory);
            this.skillsData.skills.categories = this.categories;
            
            this.render();
            this.closeCategoryModal();
            this.updateLocalStorage();
            
            if (window.toast) {
                window.toast.success('Yeni kategori eklendi');
            }

        } catch (error) {
            console.error('Kategori kaydetme hatası:', error);
            if (window.toast) {
                window.toast.error('Kategori kaydedilemedi: ' + error.message);
            }
        }
    }

    getSkillFormData() {
        return {
            categoryId: document.getElementById('skill-category-select').value,
            name: document.getElementById('skill-name').value.trim(),
            level: document.getElementById('skill-level').value,
            years: parseFloat(document.getElementById('skill-years').value) || 1,
            description: document.getElementById('skill-description').value.trim()
        };
    }

    validateSkill(skill) {
        if (!skill.categoryId) {
            if (window.toast) {
                window.toast.error('Kategori seçimi gerekli');
            }
            return false;
        }

        if (!skill.name) {
            if (window.toast) {
                window.toast.error('Yetenek adı gerekli');
            }
            return false;
        }

        if (!skill.level) {
            if (window.toast) {
                window.toast.error('Seviye seçimi gerekli');
            }
            return false;
        }

        return true;
    }

    async saveToJSON() {
        try {
            console.log('Skills JSON güncelleniyor:', this.skillsData);
            
            this.updateLocalStorage();
            
            if (window.toast) {
                window.toast.success('Yetenekler JSON dosyasına kaydedildi');
            }

        } catch (error) {
            console.error('JSON kaydetme hatası:', error);
            if (window.toast) {
                window.toast.error('JSON kaydetme hatası: ' + error.message);
            }
        }
    }

    updateLocalStorage() {
        localStorage.setItem('skills-backup', JSON.stringify(this.skillsData));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

    getLevelLabel(level) {
        const labels = this.skillsData.levelLabels || {
            'beginner': 'Başlangıç',
            'intermediate': 'Orta',
            'advanced': 'İleri',
            'expert': 'Uzman'
        };
        return labels[level] || 'Başlangıç';
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

    calculateAverageLevel(skills) {
        if (!skills || skills.length === 0) return 'N/A';
        
        const levelValues = {
            'beginner': 1,
            'intermediate': 2,
            'advanced': 3,
            'expert': 4
        };
        
        const total = skills.reduce((sum, skill) => sum + (levelValues[skill.level] || 1), 0);
        const average = total / skills.length;
        
        if (average <= 1.5) return '🌱 Başlangıç';
        if (average <= 2.5) return '📈 Orta';
        if (average <= 3.5) return '🚀 İleri';
        return '⭐ Uzman';
    }

    // Public API
    getSkillsData() {
        return this.skillsData;
    }

    addSkill(categoryId, skill) {
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            category.skills.push(skill);
            this.render();
            this.updateLocalStorage();
            return skill;
        }
        return null;
    }

    updateSkill(categoryId, skillName, updates) {
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            const skillIndex = category.skills.findIndex(s => s.name === skillName);
            if (skillIndex !== -1) {
                category.skills[skillIndex] = { ...category.skills[skillIndex], ...updates };
                this.render();
                this.updateLocalStorage();
                return category.skills[skillIndex];
            }
        }
        return null;
    }
}

// Global instance oluştur
window.skillTags = new SkillTags();

export default SkillTags;
