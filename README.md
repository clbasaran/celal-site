# 🍎 Portfolio OS V6
**Apple Design Language V6 - WCAG 2.1 AA Compliant**

> Erişilebilir, performant ve modern kişisel portfolio sistemi

[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-green)](https://www.w3.org/WAI/WCAG21/quickref/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-blue)](https://web.dev/progressive-web-apps/)
[![Apple Design](https://img.shields.io/badge/Apple%20Design-V6-000000)](https://developer.apple.com/design/)

## 🚀 Özellikler

### ✨ Apple Design Language V6
- **Human Interface Guidelines** uyumlu tasarım
- **SF Pro Typography** ve semantic spacing system
- **Dynamic Type** desteği ve responsive typography
- **Color System** - Light/Dark mode otomatik geçiş
- **Materials & Blur** efektleri

### ♿ Accessibility (WCAG 2.1 AA)
- **Screen Reader** tam desteği
- **Keyboard Navigation** tüm bileşenlerde
- **Color Contrast** 4.5:1 minimum ratio
- **Focus Management** ve visible focus indicators
- **Alternative Text** tüm görseller için
- **Semantic HTML** yapısı

### 📱 Progressive Web App (PWA)
- **Offline Support** - Service Worker
- **Install Prompt** - Add to homescreen
- **App Shortcuts** - Quick actions
- **Background Sync** - Data synchronization
- **Push Notifications** - Real-time updates

### ⚡ Performance & Technical
- **Core Web Vitals** optimized
- **Lazy Loading** tüm media için
- **Code Splitting** modular JavaScript
- **CSS Custom Properties** theme system
- **Modern ES6+** syntax

## 📁 Modular Architecture

```
Portfolio OS V6/
├── index.html                 # Ana entry point
├── public/                    # Statik sayfalar
├── assets/
│   ├── css/
│   │   ├── main.css          # Ana stil dosyası
│   │   ├── components/       # UI bileşenleri
│   │   ├── themes/           # Tema dosyaları
│   │   └── utilities/        # Utility classes
│   ├── js/
│   │   ├── components/       # React-like bileşenler
│   │   ├── modules/          # İş mantığı modülleri
│   │   └── utils/            # Yardımcı fonksiyonlar
│   ├── images/
│   │   ├── icons/            # SVG ikonlar
│   │   └── screenshots/      # PWA screenshot'ları
│   ├── fonts/                # Web fontları
│   └── data/                 # JSON veri dosyaları
├── admin/                     # CMS dashboard
├── data/                      # Dinamik veri
├── posts/                     # Blog yazıları
├── pwa/                       # PWA konfigürasyon
└── docs/                      # Dokümantasyon
```

## 🛠 Kurulum & Geliştirme

### Hızlı Başlangıç
```bash
# Projeyi klonla
git clone https://github.com/clbasaran/celal-site.git
cd celal-site

# Geliştirme sunucusunu başlat
python -m http.server 8000
# veya
npx serve .
```

### Geliştirme Komutları
```bash
# Accessibility testi
npm run a11y-test

# Performance analizi
npm run lighthouse

# PWA validation
npm run pwa-check

# Code quality
npm run lint
```

## 🎨 Design System

### Typography Scale
- **Large Title**: 34px (2.125rem)
- **Title 1**: 28px (1.75rem)
- **Title 2**: 22px (1.375rem)
- **Title 3**: 20px (1.25rem)
- **Headline**: 17px (1.0625rem)
- **Body**: 17px (1.0625rem)
- **Callout**: 16px (1rem)
- **Subheadline**: 15px (0.9375rem)
- **Footnote**: 13px (0.8125rem)
- **Caption**: 12px (0.75rem)

### Color Palette
```css
/* Semantic Colors */
--color-primary: #007AFF;          /* System Blue */
--color-secondary: #5856D6;        /* System Purple */
--color-success: #34C759;          /* System Green */
--color-warning: #FF9500;          /* System Orange */
--color-error: #FF3B30;            /* System Red */

/* Neutral Colors */
--color-label: #000000;            /* Primary text */
--color-secondary-label: #3C3C43;  /* Secondary text */
--color-tertiary-label: #3C3C43;   /* Tertiary text */
```

### Spacing System (8pt Grid)
```css
--spacing-xs: 4px;    /* 0.25rem */
--spacing-sm: 8px;    /* 0.5rem */
--spacing-md: 16px;   /* 1rem */
--spacing-lg: 24px;   /* 1.5rem */
--spacing-xl: 32px;   /* 2rem */
--spacing-2xl: 48px;  /* 3rem */
--spacing-3xl: 64px;  /* 4rem */
```

## ♿ Accessibility Features

### Keyboard Navigation
- **Tab**: İleri navigasyon
- **Shift + Tab**: Geri navigasyon  
- **Enter/Space**: Aktivasyon
- **Escape**: Modal/menu kapatma
- **Arrow Keys**: Liste/grid navigasyon

### Screen Reader Support
- **ARIA Labels**: Tüm interaktif elementler
- **Live Regions**: Dinamik içerik güncellemeleri
- **Landmark Roles**: Sayfa yapısı tanımları
- **Alt Text**: Tüm görseller için açıklayıcı metin

### Focus Management
- **Visible Focus**: Tüm interaktif elementlerde
- **Focus Trap**: Modal'larda focus hapsi
- **Skip Links**: Ana içeriğe atlama linkleri

## 📱 PWA Capabilities

### Offline Support
- **Service Worker**: Kritik kaynaklar cache
- **Background Sync**: Offline data sync
- **Offline Fallbacks**: Network hatası handling

### Native Features
- **Install Prompt**: Homescreen'e ekleme
- **App Shortcuts**: Hızlı erişim menüsü
- **Theme Color**: Native UI entegrasyonu
- **Orientation Lock**: Portre/landscape kontrolü

## 🔧 Browser Support

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

## 📊 Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Lighthouse Score**: 95+

## 🤝 Katkıda Bulunma

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

**🌟 Portfolio OS V6** - Apple Design Language V6 ile erişilebilir ve modern portfolio deneyimi!
