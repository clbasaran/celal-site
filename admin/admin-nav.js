class AdminNavigation {
    constructor() {
        this.currentSection = 'dashboard';
        this.sections = new Map();
        this.init();
    }

    init() {
        this.setupSections();
        this.setupNavigation();
        this.setupKeyboardNavigation();
        this.showSection(this.currentSection);
    }

    setupSections() {
        // Mevcut bölümleri kaydet
        const sectionElements = document.querySelectorAll('.admin-section');
        sectionElements.forEach(section => {
            const id = section.id.replace('-section', '');
            this.sections.set(id, {
                element: section,
                title: this.getSectionTitle(id),
                icon: this.getSectionIcon(id)
            });
        });
    }

    getSectionTitle(id) {
        const titles = {
            dashboard: 'Dashboard',
            projects: 'Projeler',
            skills: 'Yetenekler',
            settings: 'Ayarlar'
        };
        return titles[id] || id;
    }

    getSectionIcon(id) {
        const icons = {
            dashboard: '📊',
            projects: '📱',
            skills: '🛠️',
            settings: '⚙️'
        };
        return icons[id] || '📄';
    }

    setupNavigation() {
        const menuItems = document.querySelectorAll('.admin-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) {
                    this.showSection(section);
                }
            });

            // Hover efektleri
            item.addEventListener('mouseenter', () => {
                if (!item.classList.contains('active')) {
                    item.style.transform = 'translateX(4px)';
                }
            });

            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('active')) {
                    item.style.transform = 'translateX(0)';
                }
            });
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + rakam tuşları ile sekme değiştirme
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const sectionIndex = parseInt(e.key) - 1;
                const sections = Array.from(this.sections.keys());
                if (sections[sectionIndex]) {
                    this.showSection(sections[sectionIndex]);
                }
            }

            // Tab navigation
            if (e.key === 'Tab' && e.target.classList.contains('admin-menu-item')) {
                const menuItems = Array.from(document.querySelectorAll('.admin-menu-item'));
                const currentIndex = menuItems.indexOf(e.target);
                
                if (e.shiftKey && currentIndex > 0) {
                    e.preventDefault();
                    menuItems[currentIndex - 1].focus();
                } else if (!e.shiftKey && currentIndex < menuItems.length - 1) {
                    e.preventDefault();
                    menuItems[currentIndex + 1].focus();
                }
            }
        });
    }

    showSection(sectionId) {
        if (!this.sections.has(sectionId)) {
            console.warn(`Section ${sectionId} not found`);
            return;
        }

        // Önceki bölümü gizle (animasyonlu)
        if (this.currentSection !== sectionId) {
            const currentSectionElement = document.getElementById(`${this.currentSection}-section`);
            if (currentSectionElement) {
                currentSectionElement.style.opacity = '0';
                currentSectionElement.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    currentSectionElement.classList.remove('active');
                    this.activateSection(sectionId);
                }, 150);
            } else {
                this.activateSection(sectionId);
            }
        }
    }

    activateSection(sectionId) {
        // Menü öğelerini güncelle
        document.querySelectorAll('.admin-menu-item').forEach(item => {
            item.classList.remove('active');
            item.style.transform = 'translateX(0)';
        });

        const activeMenuItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeMenuItem) {
            activeMenuItem.classList.add('active');
            activeMenuItem.style.transform = 'translateX(4px)';
        }

        // Bölümleri güncelle
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
            section.style.opacity = '0';
            section.style.transform = 'translateY(-10px)';
        });

        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Animasyonlu gösterim
            setTimeout(() => {
                targetSection.style.opacity = '1';
                targetSection.style.transform = 'translateY(0)';
            }, 50);
        }

        // Başlığı güncelle
        const titleElement = document.getElementById('admin-title');
        if (titleElement) {
            const sectionData = this.sections.get(sectionId);
            titleElement.textContent = `${sectionData.icon} ${sectionData.title}`;
        }

        // Geçmiş durumunu güncelle
        this.currentSection = sectionId;
        
        // URL'yi güncelle (hash kullanarak)
        window.history.replaceState({}, '', `#${sectionId}`);

        // Custom event dispatch
        document.dispatchEvent(new CustomEvent('adminSectionChanged', {
            detail: { section: sectionId, data: this.sections.get(sectionId) }
        }));

        // Toast bildirim
        if (sectionId !== 'dashboard') {
            const sectionData = this.sections.get(sectionId);
            toast.info(`${sectionData.title} bölümüne geçildi`, { duration: 1500 });
        }
    }

    getCurrentSection() {
        return this.currentSection;
    }

    addSection(id, title, icon, element) {
        this.sections.set(id, {
            element: element,
            title: title,
            icon: icon
        });
    }

    removeSection(id) {
        this.sections.delete(id);
    }

    // URL hash'den section okuma
    loadFromHash() {
        const hash = window.location.hash.substring(1);
        if (hash && this.sections.has(hash)) {
            this.showSection(hash);
        }
    }

    // Breadcrumb oluşturma
    createBreadcrumb() {
        const breadcrumbContainer = document.querySelector('.admin-breadcrumb');
        if (!breadcrumbContainer) return;

        const sectionData = this.sections.get(this.currentSection);
        breadcrumbContainer.innerHTML = `
            <span class="breadcrumb-item">
                <a href="#dashboard">🏠 Ana Sayfa</a>
            </span>
            ${this.currentSection !== 'dashboard' ? `
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item active">
                    ${sectionData.icon} ${sectionData.title}
                </span>
            ` : ''}
        `;
    }
}

// Hash değişikliklerini dinle
window.addEventListener('hashchange', () => {
    if (window.adminNav) {
        window.adminNav.loadFromHash();
    }
});

// Admin section değişiklik event listener örneği
document.addEventListener('adminSectionChanged', (e) => {
    console.log('Admin section changed:', e.detail);
    
    // Her section değişiminde breadcrumb güncelle
    if (window.adminNav) {
        window.adminNav.createBreadcrumb();
    }
});

export default AdminNavigation; 