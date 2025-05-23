# 🚀 Celal Başaran - Portfolio Website

[![Website](https://img.shields.io/website?url=https%3A%2F%2Fcelalbasaran.github.io)](https://celalbasaran.github.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Performance](https://img.shields.io/badge/Performance-95%2B-brightgreen)](https://developers.google.com/speed/pagespeed/insights/)
[![Accessibility](https://img.shields.io/badge/Accessibility-AA-blue)](https://www.w3.org/WAI/WCAG21/quickref/)

> **Senior iOS Developer & Software Architect** portfolio website built with modern web technologies, Apple Design Language V2, and performance optimization.

## 🌟 Features

### 🎨 **Design & UX**
- **Apple Design Language V2** implementation
- **Dark mode** optimized interface
- **Glassmorphism** effects with backdrop-filter
- **Responsive design** for all devices
- **Smooth animations** and micro-interactions
- **Progressive Web App** (PWA) support

### ⚡ **Performance**
- **95+ Lighthouse Score** across all metrics
- **Service Worker** for offline functionality
- **Lazy loading** for images and components
- **Critical CSS** inlining
- **Resource preloading** and prefetching
- **Optimized bundle size** < 500KB

### 🔧 **Technical Features**
- **Modern ES6+** JavaScript with classes
- **Intersection Observer** for scroll animations
- **CSS Grid & Flexbox** layouts
- **Custom CSS properties** for theming
- **Error handling** and performance monitoring
- **SEO optimized** with structured data

### ♿ **Accessibility**
- **WCAG 2.1 AA** compliance
- **Screen reader** optimized
- **Keyboard navigation** support
- **Focus management** and indicators
- **High contrast** mode support
- **Reduced motion** preferences

## 🛠️ Tech Stack

### **Frontend**
- **HTML5** - Semantic markup with accessibility
- **CSS3** - Modern features (Grid, Flexbox, Custom Properties)
- **JavaScript ES6+** - Modular architecture with classes
- **Progressive Web App** - Service Worker, Manifest

### **Performance & SEO**
- **Structured Data** (JSON-LD)
- **Open Graph** & Twitter Cards
- **Canonical URLs** & Sitemaps
- **Performance API** monitoring
- **Critical Resource Hints**

### **Development Tools**
- **Git** version control
- **GitHub Pages** hosting
- **Lighthouse** performance testing
- **WAVE** accessibility testing

## 📁 Project Structure

```
celal-site/
├── 📄 index.html              # Main homepage
├── 📄 blog.html               # Blog listing page
├── 🎨 style.css               # Main stylesheet (3000+ lines)
├── ⚡ script.js               # Main JavaScript (800+ lines)
├── 📝 blog-script.js          # Blog-specific functionality
├── 🔧 sw.js                   # Service Worker
├── 📱 manifest.json           # PWA manifest
├── 🖼️ favicon.ico             # Favicon
├── 📖 README.md               # This file
└── 📁 assets/                 # Images and resources
    ├── 🖼️ images/
    ├── 🎯 icons/
    └── 📄 documents/
```

## 🚀 Getting Started

### **Prerequisites**
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+)
- Local web server (for development)

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/celalbasaran/celalbasaran.github.io.git
   cd celalbasaran.github.io
   ```

2. **Start local server**
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📊 Performance Metrics

| Metric | Score | Target |
|--------|-------|--------|
| **Performance** | 95+ | 90+ |
| **Accessibility** | 100 | 95+ |
| **Best Practices** | 100 | 95+ |
| **SEO** | 100 | 95+ |
| **PWA** | ✅ | ✅ |

### **Core Web Vitals**
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

## 🎯 Key Components

### **1. Navigation System**
```javascript
class NavbarManager {
  // Auto-hiding navigation
  // Smooth scrolling
  // Active link tracking
}
```

### **2. Animation Engine**
```javascript
class AnimationManager {
  // Intersection Observer animations
  // Staggered reveals
  // Performance optimized
}
```

### **3. Performance Monitor**
```javascript
class PerformanceTracker {
  // Real-time metrics
  // Core Web Vitals
  // User interaction tracking
}
```

### **4. Error Handling**
```javascript
class ErrorHandler {
  // Global error catching
  // Analytics integration
  // Graceful degradation
}
```

## 🔧 Configuration

### **CSS Custom Properties**
```css
:root {
  /* Apple Design System Colors */
  --apple-blue-400: #388bfd;
  --apple-purple: #8b5cf6;
  
  /* Spacing System */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  /* ... */
  
  /* Typography Scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  /* ... */
}
```

### **JavaScript Configuration**
```javascript
const CONFIG = {
  animationDuration: 1000,
  scrollOffset: 100,
  throttleDelay: 16,
  intersectionThreshold: 0.1,
  navbarHeight: 80
};
```

## 📱 Progressive Web App

### **Features**
- **Offline functionality** with Service Worker
- **App-like experience** on mobile devices
- **Install prompt** for supported browsers
- **Background sync** for form submissions
- **Push notifications** ready

### **Manifest Configuration**
```json
{
  "name": "Celal Başaran Portfolio",
  "short_name": "Celal Portfolio",
  "theme_color": "#0d1117",
  "background_color": "#0d1117",
  "display": "standalone",
  "start_url": "/",
  "scope": "/"
}
```

## 🔍 SEO Optimization

### **Structured Data**
- **Person Schema** for personal branding
- **Website Schema** for site information
- **Blog Schema** for content pages
- **BreadcrumbList** for navigation

### **Meta Tags**
- **Open Graph** for social sharing
- **Twitter Cards** for Twitter integration
- **Apple Meta Tags** for iOS devices
- **Microsoft Meta Tags** for Windows

## ♿ Accessibility Features

### **WCAG 2.1 AA Compliance**
- **Semantic HTML** structure
- **ARIA labels** and roles
- **Focus management** and indicators
- **Color contrast** ratios > 4.5:1
- **Screen reader** optimization

### **Keyboard Navigation**
- **Tab order** optimization
- **Skip links** for main content
- **Focus trapping** in modals
- **Escape key** handling

## 🌐 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| **Chrome** | 80+ | ✅ Full |
| **Firefox** | 75+ | ✅ Full |
| **Safari** | 13+ | ✅ Full |
| **Edge** | 80+ | ✅ Full |
| **iOS Safari** | 13+ | ✅ Full |
| **Android Chrome** | 80+ | ✅ Full |

### **Polyfills Included**
- **Intersection Observer** for older browsers
- **Smooth Scroll** for Safari
- **CSS Custom Properties** fallbacks

## 🚀 Deployment

### **GitHub Pages**
Automatically deployed from `main` branch:
```bash
git push origin main
# Site updates at: https://celalbasaran.github.io
```

### **Custom Domain Setup**
1. Add `CNAME` file with domain
2. Configure DNS records
3. Enable HTTPS in GitHub settings

## 📈 Analytics & Monitoring

### **Performance Monitoring**
- **Core Web Vitals** tracking
- **User interaction** metrics
- **Error logging** and reporting
- **Page load** performance

### **SEO Tracking**
- **Google Search Console** integration
- **Structured data** validation
- **Mobile usability** monitoring

## 🤝 Contributing

### **Development Workflow**
1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### **Code Standards**
- **ES6+** JavaScript with classes
- **BEM** CSS methodology
- **Semantic** HTML structure
- **Accessibility** first approach

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Celal Başaran**
- 🌐 Website: [celalbasaran.github.io](https://celalbasaran.github.io)
- 💼 LinkedIn: [linkedin.com/in/celalbasaran](https://linkedin.com/in/celalbasaran)
- 🐙 GitHub: [github.com/celalbasaran](https://github.com/celalbasaran)
- 🐦 Twitter: [@celalbasaran](https://twitter.com/celalbasaran)

## 🙏 Acknowledgments

- **Apple Design Guidelines** for design inspiration
- **Web.dev** for performance best practices
- **MDN Web Docs** for technical reference
- **WCAG Guidelines** for accessibility standards

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

Made with ❤️ by [Celal Başaran](https://celalbasaran.github.io)

</div> 