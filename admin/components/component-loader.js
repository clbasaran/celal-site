class ComponentLoader {
    constructor() {
        this.loadedComponents = new Set();
        this.init();
    }

    async init() {
        await this.loadComponents();
        this.setupEventListeners();
    }

    async loadComponents() {
        try {
            // Navbar yükle
            await this.loadComponent('navbar', '.admin-layout', 'beforebegin');
            
            // Footer yükle
            await this.loadComponent('footer', '.admin-main', 'afterend');
            
            console.log('✅ Tüm admin bileşenleri yüklendi');
        } catch (error) {
            console.error('❌ Bileşen yükleme hatası:', error);
        }
    }

    async loadComponent(componentName, targetSelector, position = 'beforeend') {
        if (this.loadedComponents.has(componentName)) {
            console.log(`⚠️ ${componentName} zaten yüklü`);
            return;
        }

        try {
            const response = await fetch(`components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${componentName}.html bulunamadı`);
            }

            const html = await response.text();
            const targetElement = document.querySelector(targetSelector);
            
            if (!targetElement) {
                throw new Error(`Target element bulunamadı: ${targetSelector}`);
            }

            // Component'i ekle
            targetElement.insertAdjacentHTML(position, html);
            this.loadedComponents.add(componentName);

            // Component'e özel setup çağır
            this.setupComponent(componentName);

            console.log(`✅ ${componentName} bileşeni yüklendi`);
        } catch (error) {
            console.error(`❌ ${componentName} yüklenemedi:`, error);
            // Fallback: boş element ekle
            this.createFallbackComponent(componentName, targetSelector, position);
        }
    }

    setupComponent(componentName) {
        switch (componentName) {
            case 'navbar':
                this.setupNavbar();
                break;
            case 'footer':
                this.setupFooter();
                break;
        }
    }

    setupNavbar() {
        // Navbar'daki theme toggle'ı aktifleştir
        const themeToggle = document.querySelector('.admin-theme-btn');
        if (themeToggle && window.themeManager) {
            themeToggle.addEventListener('click', () => {
                window.themeManager.toggleTheme();
            });
        }

        // Menu item'ları setup et
        const menuItems = document.querySelectorAll('.admin-menu-item');
        menuItems.forEach(item => {
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

            // Focus efektleri
            item.addEventListener('focus', () => {
                item.style.outline = '2px solid var(--primary)';
                item.style.outlineOffset = '2px';
            });

            item.addEventListener('blur', () => {
                item.style.outline = 'none';
            });
        });

        // User info hover
        const userInfo = document.querySelector('.admin-user-info');
        if (userInfo) {
            userInfo.addEventListener('mouseenter', () => {
                userInfo.style.background = 'var(--surface-elevated)';
                userInfo.style.borderRadius = '8px';
                userInfo.style.transition = 'all 0.3s ease';
            });

            userInfo.addEventListener('mouseleave', () => {
                userInfo.style.background = 'transparent';
            });
        }
    }

    setupFooter() {
        // Son güncelleme zamanını göster
        const lastUpdateElement = document.getElementById('last-update');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleString('tr-TR');
        }

        // Mevcut temayı göster
        const currentThemeElement = document.getElementById('current-theme');
        if (currentThemeElement && window.themeManager) {
            const updateThemeDisplay = () => {
                const theme = window.themeManager.getCurrentTheme();
                const themeNames = {
                    'dark': 'Koyu',
                    'light': 'Açık',
                    'auto': 'Otomatik'
                };
                currentThemeElement.textContent = themeNames[theme] || theme;
            };

            updateThemeDisplay();
            
            // Theme değişimini dinle
            document.addEventListener('themeChanged', updateThemeDisplay);
        }

        // Footer link'lerine hover efekti
        const footerLinks = document.querySelectorAll('.footer-link');
        footerLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                link.style.color = 'var(--primary)';
                link.style.transform = 'translateY(-2px)';
                link.style.transition = 'all 0.3s ease';
            });

            link.addEventListener('mouseleave', () => {
                link.style.color = 'var(--text-secondary)';
                link.style.transform = 'translateY(0)';
            });
        });

        // Shortcut tooltips
        const shortcutItems = document.querySelectorAll('.shortcut-item');
        shortcutItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--surface-elevated)';
                item.style.borderRadius = '6px';
                item.style.padding = '0.5rem';
                item.style.transition = 'all 0.2s ease';
            });

            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
                item.style.padding = '0';
            });
        });
    }

    createFallbackComponent(componentName, targetSelector, position) {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) return;

        let fallbackHTML = '';
        
        switch (componentName) {
            case 'navbar':
                fallbackHTML = `
                    <nav class="admin-sidebar admin-sidebar-fallback">
                        <div class="admin-logo">
                            <h2>🎓 Admin Panel</h2>
                        </div>
                        <p style="padding: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                            ⚠️ Navbar yüklenemedi
                        </p>
                    </nav>
                `;
                break;
            case 'footer':
                fallbackHTML = `
                    <footer class="admin-footer admin-footer-fallback">
                        <p style="padding: 1rem; text-align: center; color: var(--text-secondary);">
                            ⚠️ Footer yüklenemedi
                        </p>
                    </footer>
                `;
                break;
        }

        if (fallbackHTML) {
            targetElement.insertAdjacentHTML(position, fallbackHTML);
            console.log(`⚡ ${componentName} fallback oluşturuldu`);
        }
    }

    setupEventListeners() {
        // Component reload
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                this.reloadComponents();
            }
        });
    }

    async reloadComponents() {
        console.log('🔄 Bileşenler yeniden yükleniyor...');
        
        // Mevcut bileşenleri temizle
        const existingNavbar = document.querySelector('.admin-sidebar');
        const existingFooter = document.querySelector('.admin-footer');
        
        if (existingNavbar) existingNavbar.remove();
        if (existingFooter) existingFooter.remove();
        
        // Yüklü bileşen listesini temizle
        this.loadedComponents.clear();
        
        // Yeniden yükle
        await this.loadComponents();
        
        if (window.toast) {
            window.toast.success('Bileşenler yeniden yüklendi');
        }
    }

    // Public API
    isLoaded(componentName) {
        return this.loadedComponents.has(componentName);
    }

    async loadCustomComponent(componentName, targetSelector, position = 'beforeend') {
        return await this.loadComponent(componentName, targetSelector, position);
    }
}

// Global instance oluştur
window.componentLoader = new ComponentLoader();

export default ComponentLoader; 