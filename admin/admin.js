/**
 * Admin Panel Main Controller
 * Modül entegrasyonu ve global yönetim
 */

// Import modülleri
import ProjectEditor from './modules/project-editor.js';
import SkillTags from './modules/skill-tags.js';
import LivePreview from './modules/live-preview.js';
import DataSyncManager from './modules/data-sync.js';
import DataUndoManager from './modules/data-undo.js';
import EditorPanel from './modules/editor-panel.js';
import PreviewPanel from './modules/preview-panel.js';
import AddItemModal from './modules/add-item-modal.js';

/**
 * Admin Panel Ana Sınıfı
 */
class AdminPanel {
    constructor() {
        this.modules = {};
        this.currentSection = 'dashboard';
        this.isInitialized = false;
        this.toast = null;
        this.init();
    }

    async init() {
        console.log('🚀 Admin Panel başlatılıyor...');
        
        try {
            // Toast sistemini başlat
            this.initToastSystem();
            
            // Ana container'ı hazırla
            this.setupMainContainer();
            
            // Navigasyon sistemini kur
            this.setupNavigation();
            
            // Modülleri başlat
            await this.initializeModules();
            
            // Event listener'ları kur
            this.setupEventListeners();
            
            // Başlangıç section'ını göster
            this.showSection('dashboard');
            
            this.isInitialized = true;
            console.log('✅ Admin Panel başarıyla başlatıldı');
            
            this.toast.success('Admin Panel hazır! 🎉');
            
        } catch (error) {
            console.error('❌ Admin Panel başlatma hatası:', error);
            this.toast?.error('Admin Panel başlatılamadı: ' + error.message);
        }
    }

    initToastSystem() {
        // Basit toast sistemi
        this.toast = {
            show: (message, type = 'info', duration = 3000) => {
                const toast = document.createElement('div');
                toast.className = `toast toast-${type}`;
                toast.innerHTML = `
                    <span class="toast-message">${message}</span>
                    <button class="toast-close">&times;</button>
                `;
                
                document.body.appendChild(toast);
                
                // Otomatik kaldırma
                setTimeout(() => {
                    toast.remove();
                }, duration);
                
                // Manuel kaldırma
                toast.querySelector('.toast-close').addEventListener('click', () => {
                    toast.remove();
                });
            },
            success: (message) => this.toast.show(message, 'success'),
            error: (message) => this.toast.show(message, 'error'),
            warning: (message) => this.toast.show(message, 'warning'),
            info: (message) => this.toast.show(message, 'info')
        };
        
        // Global window objesine ekle
        window.toast = this.toast;
    }

    setupMainContainer() {
        const adminContainer = document.getElementById('admin-container');
        if (!adminContainer) {
            console.error('Admin container bulunamadı!');
            return;
        }

        adminContainer.innerHTML = `
            <div class="admin-layout">
                <nav class="admin-sidebar" id="admin-sidebar">
                    <div class="sidebar-header">
                        <h2>🛠️ Admin Panel</h2>
                        <p>Portfolio Yönetimi</p>
                    </div>
                    
                    <ul class="sidebar-nav" id="sidebar-nav">
                        <li class="nav-item">
                            <a href="#dashboard" class="nav-link active" data-section="dashboard">
                                📊 Dashboard
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="#projects" class="nav-link" data-section="projects">
                                📱 Proje Yönetimi
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="#skills" class="nav-link" data-section="skills">
                                🛠️ Yetenek Yönetimi
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="#editor" class="nav-link" data-section="editor">
                                📝 JSON Editor
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="#preview" class="nav-link" data-section="preview">
                                👁️ Canlı Önizleme
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="#settings" class="nav-link" data-section="settings">
                                ⚙️ Ayarlar
                            </a>
                        </li>
                    </ul>
                    
                    <div class="sidebar-footer">
                        <div class="admin-info">
                            <p><strong>Celal Başaran</strong></p>
                            <p>Admin</p>
                        </div>
                    </div>
                </nav>
                
                <main class="admin-content" id="admin-content">
                    <div class="content-sections">
                        <section id="dashboard-section" class="content-section active">
                            <div class="section-header">
                                <h1>📊 Dashboard</h1>
                                <p>Portfolio istatistikleri ve hızlı erişim</p>
                            </div>
                            <div id="dashboard-content">
                                <!-- Dashboard içeriği dinamik olarak yüklenecek -->
                            </div>
                        </section>
                        
                        <section id="projects-section" class="content-section">
                            <div class="section-header">
                                <h1>📱 Proje Yönetimi</h1>
                                <p>Projelerinizi ekleyin, düzenleyin ve yönetin</p>
                            </div>
                            <div id="project-editor">
                                <!-- Project Editor buraya yüklenecek -->
                            </div>
                        </section>
                        
                        <section id="skills-section" class="content-section">
                            <div class="section-header">
                                <h1>🛠️ Yetenek Yönetimi</h1>
                                <p>Teknik yeteneklerinizi kategorize edin</p>
                            </div>
                            <div id="skill-tags">
                                <!-- Skill Tags buraya yüklenecek -->
                            </div>
                        </section>
                        
                        <section id="editor-section" class="content-section">
                            <div class="section-header">
                                <h1>📝 JSON Editor</h1>
                                <p>Verileri doğrudan JSON formatında düzenleyin</p>
                            </div>
                            <div id="editor-panel">
                                <!-- Editor Panel buraya yüklenecek -->
                            </div>
                        </section>
                        
                        <section id="preview-section" class="content-section">
                            <div class="section-header">
                                <h1>👁️ Canlı Önizleme</h1>
                                <p>Değişikliklerinizi gerçek zamanlı görün</p>
                            </div>
                            <div id="preview-panel">
                                <!-- Live Preview buraya yüklenecek -->
                            </div>
                        </section>
                        
                        <section id="settings-section" class="content-section">
                            <div class="section-header">
                                <h1>⚙️ Ayarlar</h1>
                                <p>Panel ayarları ve konfigürasyon</p>
                            </div>
                            <div id="settings-content">
                                <!-- Settings içeriği buraya gelecek -->
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        `;
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });
    }

    async initializeModules() {
        console.log('📦 Modüller yükleniyor...');
        
        // Modüllerin global instance'larının hazır olmasını bekle
        const maxAttempts = 20;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            if (window.projectEditor && window.skillTags && window.livePreview && window.previewPanel && window.addItemModal && window.dataUndoManager) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (attempts >= maxAttempts) {
            throw new Error('Modüller yüklenemedi - timeout');
        }
        
        // Modül referanslarını kaydet
        this.modules = {
            projectEditor: window.projectEditor,
            skillTags: window.skillTags,
            livePreview: window.livePreview,
            dataSyncManager: window.dataSyncManager,
            dataUndoManager: window.dataUndoManager,
            editorPanel: window.editorPanel,
            previewPanel: window.previewPanel,
            addItemModal: window.addItemModal
        };
        
        // Dashboard içeriğini oluştur
        this.initializeDashboard();
        
        // Settings içeriğini oluştur
        this.initializeSettings();
        
        console.log('✅ Tüm modüller yüklendi');
    }

    initializeDashboard() {
        const dashboardContent = document.getElementById('dashboard-content');
        if (!dashboardContent) return;

        dashboardContent.innerHTML = `
            <div class="dashboard-grid">
                <div class="stats-cards">
                    <div class="stat-card">
                        <div class="stat-icon">📱</div>
                        <div class="stat-content">
                            <h3 id="total-projects">-</h3>
                            <p>Toplam Proje</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-content">
                            <h3 id="completed-projects">-</h3>
                            <p>Tamamlanan</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">🛠️</div>
                        <div class="stat-content">
                            <h3 id="total-skills">-</h3>
                            <p>Toplam Yetenek</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon">📈</div>
                        <div class="stat-content">
                            <h3 id="skill-categories">-</h3>
                            <p>Kategori</p>
                        </div>
                    </div>
                </div>
                
                <div class="quick-actions">
                    <h3>🚀 Hızlı İşlemler</h3>
                    <div class="action-buttons">
                        <button class="action-btn" onclick="window.addItemModal.open('projects')">
                            ➕ Yeni Proje
                        </button>
                        <button class="action-btn" onclick="window.addItemModal.open('skills')">
                            🛠️ Yeni Yetenek
                        </button>
                        <button class="action-btn" onclick="adminPanel.openPreview()">
                            👁️ Önizleme Aç
                        </button>
                        <button class="action-btn" onclick="adminPanel.exportData()">
                            📤 Verileri Dışa Aktar
                        </button>
                    </div>
                </div>
                
                <div class="recent-activity">
                    <h3>📋 Son Aktiviteler</h3>
                    <div id="activity-log">
                        <p class="activity-item">✅ Admin Panel başlatıldı</p>
                    </div>
                </div>
            </div>
        `;
        
        // İstatistikleri güncelle
        this.updateDashboardStats();
    }

    initializeSettings() {
        const settingsContent = document.getElementById('settings-content');
        if (!settingsContent) return;

        settingsContent.innerHTML = `
            <div class="settings-sections">
                <div class="setting-group">
                    <h3>🎨 Görünüm Ayarları</h3>
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Dark Mode</span>
                            <input type="checkbox" id="dark-mode-toggle">
                        </label>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">
                            <span>Animasyonları Azalt</span>
                            <input type="checkbox" id="reduce-motion-toggle">
                        </label>
                    </div>
                </div>
                
                <div class="setting-group">
                    <h3>💾 Veri Yönetimi</h3>
                    <div class="setting-actions">
                        <button class="setting-btn" onclick="adminPanel.clearLocalStorage()">
                            🗑️ Local Storage Temizle
                        </button>
                        <button class="setting-btn" onclick="adminPanel.exportAllData()">
                            📤 Tüm Verileri Dışa Aktar
                        </button>
                        <button class="setting-btn" onclick="adminPanel.importData()">
                            📥 Veri İçe Aktar
                        </button>
                    </div>
                </div>
                
                <div class="setting-group">
                    <h3>ℹ️ Sistem Bilgisi</h3>
                    <div class="system-info">
                        <p><strong>Versiyon:</strong> 1.0.0</p>
                        <p><strong>Son Güncelleme:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
                        <p><strong>Tarayıcı:</strong> ${navigator.userAgent.split(' ').slice(-1)[0]}</p>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.showSection('dashboard');
                        break;
                    case '2':
                        e.preventDefault();
                        this.showSection('projects');
                        break;
                    case '3':
                        e.preventDefault();
                        this.showSection('skills');
                        break;
                    case '4':
                        e.preventDefault();
                        this.showSection('preview');
                        break;
                }
            }
        });
    }

    showSection(sectionName) {
        // Tüm section'ları gizle
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Tüm nav link'leri pasif yap
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Seçili section'ı göster
        const targetSection = document.getElementById(`${sectionName}-section`);
        const targetNav = document.querySelector(`[data-section="${sectionName}"]`);
        
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        if (targetNav) {
            targetNav.classList.add('active');
        }
        
        this.currentSection = sectionName;
        
        // Section'a göre özel işlemler
        if (sectionName === 'dashboard') {
            this.updateDashboardStats();
        }
        
        console.log(`📍 Section değişti: ${sectionName}`);
    }

    updateDashboardStats() {
        try {
            const projects = this.modules.projectEditor?.getProjects() || [];
            const skillsData = this.modules.skillTags?.getSkillsData();
            
            document.getElementById('total-projects').textContent = projects.length;
            document.getElementById('completed-projects').textContent = 
                projects.filter(p => p.status === 'completed').length;
                
            if (skillsData?.skills?.categories) {
                const totalSkills = skillsData.skills.categories.reduce(
                    (total, cat) => total + cat.skills.length, 0
                );
                document.getElementById('total-skills').textContent = totalSkills;
                document.getElementById('skill-categories').textContent = skillsData.skills.categories.length;
            } else {
                document.getElementById('total-skills').textContent = '0';
                document.getElementById('skill-categories').textContent = '0';
            }
        } catch (error) {
            console.warn('Dashboard stats güncellenirken hata:', error);
        }
    }

    // Hızlı işlem metotları
    quickAddProject() {
        this.showSection('projects');
        setTimeout(() => {
            if (this.modules.projectEditor?.openModal) {
                this.modules.projectEditor.openModal();
            }
        }, 100);
    }

    quickAddSkill() {
        this.showSection('skills');
        setTimeout(() => {
            if (this.modules.skillTags?.openSkillModal) {
                this.modules.skillTags.openSkillModal();
            }
        }, 100);
    }

    openPreview() {
        this.showSection('preview');
        setTimeout(() => {
            if (this.modules.livePreview?.togglePreview) {
                this.modules.livePreview.isVisible = true;
                this.modules.livePreview.render();
            }
        }, 100);
    }

    exportData() {
        try {
            const data = {
                projects: this.modules.projectEditor?.getProjects() || [],
                skills: this.modules.skillTags?.getSkillsData() || {},
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `portfolio-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.toast.success('Veriler dışa aktarıldı');
            
        } catch (error) {
            console.error('Export hatası:', error);
            this.toast.error('Export hatası: ' + error.message);
        }
    }

    // Settings metotları
    clearLocalStorage() {
        if (confirm('Tüm yerel veriler silinecek. Emin misiniz?')) {
            localStorage.clear();
            this.toast.success('Local Storage temizlendi');
            location.reload();
        }
    }

    exportAllData() {
        this.exportData();
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (data.projects) {
                        localStorage.setItem('projects-backup', JSON.stringify(data.projects));
                    }
                    
                    if (data.skills) {
                        localStorage.setItem('skills-backup', JSON.stringify(data.skills));
                    }
                    
                    this.toast.success('Veriler içe aktarıldı. Sayfa yenileniyor...');
                    
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                    
                } catch (error) {
                    this.toast.error('Dosya formatı hatalı: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
}

// Global instance oluştur
window.adminPanel = new AdminPanel();

export default AdminPanel; 