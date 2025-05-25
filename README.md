# 🍎 Portfolio OS V6
🍎 **Apple Design Language V6** ile geliştirilmiş, **WCAG 2.1 AA uyumlu** modern portfolio sistemi.

![Portfolio OS V6](./assets/images/screenshots/portfolio-os-v6-hero.png)

## 🚀 Özellikler

### 🎨 **Apple Design Language V6**
- Modern Apple tasarım prensipleri
- Glassmorphism efektleri ve backdrop blur
- SF Pro font ailesi
- Semantic renk sistemi (açık/koyu mod)

### ♿ **WCAG 2.1 AA Uyumluluğu**
- 4.5:1+ kontrast oranları
- Tam klavye navigasyonu
- Screen reader desteği
- Skip links ve landmark navigation
- Alt+H, L, K, B kısayolları

### 📱 **Progressive Web App (PWA)**
- Offline çalışma desteği
- Service Worker ile cache yönetimi
- App install prompt
- Push notification desteği
- Background sync

### ⚡ **Performans Optimizasyonu**
- Core Web Vitals optimize edilmiş
- Lazy loading ve code splitting
- Cache-first stratejileri
- Resource preloading

### 🌗 **Tema Yönetimi**
- Otomatik sistem tema algılama
- Açık/Koyu/Otomatik modlar
- Smooth geçişler
- PWA theme color sync

## 🚀 Kurulum

### Gereksinimler
- Modern web tarayıcı (Chrome 90+, Firefox 88+, Safari 14+)
- HTTPS (PWA özellikleri için)

### Hızlı Başlangıç

1. **Repoyu klonlayın:**
```bash
git clone https://github.com/yourusername/portfolio-os-v6.git
cd portfolio-os-v6
```

2. **Local server başlatın:**
```bash
# Python ile
python -m http.server 8000

# Node.js ile  
npx serve .

# Live Server extension ile VSCode'da
```

3. **Tarayıcıda açın:**
```
http://localhost:8000
```

## 📁 Proje Yapısı

```
portfolio-os-v6/
├── 📁 assets/
│   ├── 📁 css/
│   │   ├── main.css              # Ana stil dosyası
│   │   ├── utilities.css         # Utility sınıfları
│   │   └── 📁 components/
│   │       ├── navigation.css    # Navigation bileşeni
│   │       ├── hero.css          # Hero bölümü
│   │       ├── sections.css      # İçerik bölümleri
│   │       └── accessibility.css # Erişilebilirlik
│   ├── 📁 js/
│   │   ├── 📁 components/
│   │   │   ├── app.js            # Ana uygulama
│   │   │   ├── navigation.js     # Navigation kontrolü
│   │   │   ├── hero.js           # Hero animasyonları
│   │   │   └── theme-manager.js  # Tema yönetimi
│   │   ├── 📁 utils/
│   │   │   └── data-manager.js   # Veri yönetimi
│   │   └── 📁 modules/
│   │       └── accessibility.js  # Erişilebilirlik modülü
│   ├── 📁 images/
│   │   ├── 📁 icons/            # PWA ikonları
│   │   └── 📁 screenshots/      # App screenshots
│   └── 📁 data/
├── 📁 data/
│   ├── profile.json             # Kişisel bilgiler
│   ├── projects.json            # Proje verileri
│   └── skills.json              # Yetenekler
├── 📁 pwa/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # Service Worker
│   └── sw-register.js           # SW kayıt dosyası
├── index.html                   # Ana sayfa
└── README.md
```

## 🛠️ Konfigürasyon

### Kişisel Bilgileri Güncelleme

**`data/profile.json`** dosyasını düzenleyin:
```json
{
  "name": "Your Name",
  "title": "Your Title",
  "email": "your@email.com",
  "location": "Your Location",
  // ... diğer bilgiler
}
```

### Projeleri Ekleme

**`data/projects.json`** dosyasına yeni projeler ekleyin:
```json
{
  "featured": [...],
  "projects": [
    {
      "id": "new-project",
      "title": "Project Title",
      "description": "Project description",
      "technologies": ["Tech1", "Tech2"],
      "year": "2024"
    }
  ]
}
```

### PWA Ayarları

**`pwa/manifest.json`** dosyasını güncelleyin:
```json
{
  "name": "Your Portfolio",
  "short_name": "Portfolio",
  "theme_color": "#YOUR_COLOR",
  "background_color": "#YOUR_BG"
}
```

## 🎨 Customization

### Renk Paleti

`assets/css/main.css` dosyasında CSS custom properties:
```css
:root {
  --color-primary: #007AFF;
  --color-secondary: #5856D6;
  --color-success: #34C759;
  /* Kendi renklerinizi ekleyin */
}
```

### Typography

Apple SF Pro font ailesi kullanılır, fallback'ler:
```css
--font-family-system: -apple-system, BlinkMacSystemFont, 
  "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
```

### Spacing System

8pt grid sistemi:
```css
--spacing-xs: 4px;   /* 0.25rem */
--spacing-sm: 8px;   /* 0.5rem */
--spacing-md: 16px;  /* 1rem */
--spacing-lg: 24px;  /* 1.5rem */
```

## 🔧 Geliştirme

### Debug Modu

URL'ye `?debug=true` ekleyerek debug modunu aktifleştirin:
```
http://localhost:8000?debug=true
```

Bu mod şunları sağlar:
- Detaylı console logları
- Performance metrics
- Global `portfolioApp` objesi

### Component Yapısı

Her component şu yapıyı takip eder:
```javascript
class ComponentName {
  constructor() {
    this.init();
  }
  
  init() {
    // Başlatma kodları
  }
  
  // Public API methods
  
  destroy() {
    // Cleanup kodları
  }
}
```

### Event System

Bileşenler arası iletişim:
```javascript
// Event gönderme
app.emit('component:action', { data: 'value' });

// Event dinleme  
app.on('component:action', (event) => {
  console.log(event.detail);
});
```

## ♿ Erişilebilirlik Özellikleri

### Klavye Kısayolları

| Kısayol | Açıklama |
|---------|----------|
| `Alt + H` | Başlıklar arasında dolaş |
| `Alt + L` | Landmark bölgeler |
| `Alt + K` | Linkler arasında |
| `Alt + B` | Butonlar arasında |
| `Alt + 1,2,3` | Başlık seviyelerine git |
| `Ctrl + T` | Tema değiştir |
| `Alt + 0` | Yardım menüsü |

### Screen Reader Desteği

- ARIA labels ve descriptions
- Live regions for dynamic content
- Semantic HTML structure
- Skip links for navigation

### Focus Management

- Visible focus indicators
- Focus trap for modals
- Logical tab order
- Focus restoration

## 📱 PWA Özellikleri

### Offline Çalışma

Service Worker ile critical resources cache edilir:
- HTML, CSS, JS files
- Data files (profile, projects)
- Images and icons

### Install Prompt

Desteklenen tarayıcılarda otomatik install prompt görünür.

### Background Sync

Offline değişiklikler tekrar online olunduğunda sync edilir.

## 🚀 Deployment

### GitHub Pages

1. Repository settings > Pages
2. Source: Deploy from branch
3. Branch: main / (root)

### Netlify

```bash
# Build command (if needed)
# Build output directory: ./
```

### Vercel

```bash
npx vercel --prod
```

### Custom Domain

HTTPS gereklidir PWA özellikleri için:
- SSL sertifikası
- Service Worker registration
- Secure context requirement

## 📊 Performance

### Core Web Vitals

- **LCP**: < 2.5s (First meaningful paint)
- **FID**: < 100ms (User interaction)
- **CLS**: < 0.1 (Layout stability)

### Optimization Techniques

- Resource preloading
- Code splitting
- Image optimization
- Cache strategies

## 🔍 Testing

### Accessibility Testing

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# axe-core testing
npm install -g @axe-core/cli
axe http://localhost:8000
```

### Performance Testing

```bash
# PageSpeed Insights API
curl "https://www.googleapis.com/pagespeed/v5/runPagespeed?url=YOUR_URL"
```

### PWA Testing

Chrome DevTools > Application:
- Manifest validation
- Service Worker status
- Cache inspection

## 🐛 Troubleshooting

### Common Issues

**Service Worker not registering:**
- HTTPS gereklidir
- Path kontrolü (`/pwa/sw.js`)
- Browser cache temizle

**Theme switching not working:**
- LocalStorage izinleri
- JavaScript errors console'da
- CSS custom properties desteği

**Accessibility issues:**
- NVDA/JAWS ile test edin
- Keyboard-only navigation
- Color contrast validation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- WCAG 2.1 AA compliance required
- Apple Design Language adherence
- Performance budget: < 3s LCP
- Component-based architecture
- Progressive enhancement

## 📄 License

Bu proje [MIT License](LICENSE) altında lisanslanmıştır.

## 🏆 Credits

- **Apple Design Language V6** - Design inspiration
- **WCAG 2.1 Guidelines** - Accessibility standards
- **PWA Best Practices** - Progressive Web App features

---

**Portfolio OS V6** - Modern, erişilebilir ve performant portfolio deneyimi.

Made with ❤️ and Apple Design Language V6
