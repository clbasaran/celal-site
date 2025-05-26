class FooterLoader {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadFooter();
    }

    async loadFooter() {
        try {
            const response = await fetch('./components/footer.html');
            if (!response.ok) {
                // Eğer components klasöründe bulamazsa, ana dizinden deneyelim
                const fallbackResponse = await fetch('../components/footer.html');
                if (!fallbackResponse.ok) {
                    throw new Error('Footer dosyası bulunamadı');
                }
                const footerHTML = await fallbackResponse.text();
                this.insertFooter(footerHTML);
                return;
            }
            
            const footerHTML = await response.text();
            this.insertFooter(footerHTML);
        } catch (error) {
            console.warn('Footer yüklenemedi, varsayılan footer kullanılıyor:', error);
            this.insertDefaultFooter();
        }
    }

    insertFooter(footerHTML) {
        // Mevcut footer'ı kaldır
        const existingFooter = document.querySelector('.footer');
        if (existingFooter) {
            existingFooter.remove();
        }

        // Yeni footer'ı main'den sonra ekle
        const main = document.querySelector('main');
        if (main) {
            main.insertAdjacentHTML('afterend', footerHTML);
        } else {
            // Eğer main yoksa body'nin sonuna ekle
            document.body.insertAdjacentHTML('beforeend', footerHTML);
        }

        // Footer linklerini smooth scroll için ayarla
        this.setupFooterLinks();
    }

    insertDefaultFooter() {
        const defaultFooterHTML = `
            <footer class="footer" role="contentinfo">
                <div class="container">
                    <div class="footer-content">
                        <div class="footer-info">
                            <h3>Celal Başaran</h3>
                            <p>iOS & macOS Swift Geliştiricisi</p>
                            <p>Modern Apple ekosisteminde yenilikçi çözümler üretiyorum</p>
                        </div>
                        
                        <div class="footer-links">
                            <div class="footer-section">
                                <h4>Projeler</h4>
                                <ul>
                                    <li><a href="#projects">Öne Çıkan Projeler</a></li>
                                    <li><a href="https://github.com/celalbasaran" target="_blank">GitHub</a></li>
                                    <li><a href="#" target="_blank">App Store</a></li>
                                </ul>
                            </div>
                            
                            <div class="footer-section">
                                <h4>İletişim</h4>
                                <ul>
                                    <li><a href="mailto:celal@celalbasaran.com">Email</a></li>
                                    <li><a href="https://linkedin.com/in/celalbasaran" target="_blank">LinkedIn</a></li>
                                    <li><a href="https://twitter.com/celalbasaran" target="_blank">Twitter</a></li>
                                </ul>
                            </div>
                            
                            <div class="footer-section">
                                <h4>Teknolojiler</h4>
                                <ul>
                                    <li><a href="#skills">Swift & SwiftUI</a></li>
                                    <li><a href="#skills">iOS Development</a></li>
                                    <li><a href="#skills">macOS Development</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer-bottom">
                        <p>&copy; 2024 Celal Başaran. Tüm hakları saklıdır.</p>
                        <p class="footer-made-with">Swift ile <span class="heart">❤️</span> geliştirildi</p>
                    </div>
                </div>
            </footer>
        `;
        
        this.insertFooter(defaultFooterHTML);
    }

    setupFooterLinks() {
        // Footer içindeki hash linkler için smooth scroll
        const footerLinks = document.querySelectorAll('.footer a[href^="#"]');
        footerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 70; // Navbar offset
                    
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// Footer'ı DOM yüklendiğinde yükle
document.addEventListener('DOMContentLoaded', () => {
    new FooterLoader();
});

export default FooterLoader; 