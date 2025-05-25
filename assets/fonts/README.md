# 🔤 Portfolio OS V6 - Fonts

## Font System

Portfolio OS V6, Apple'ın system font stack'ini kullanır:

```css
font-family: -apple-system, BlinkMacSystemFont, 
  "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
```

## System Fonts

### SF Pro Display (Başlıklar)
- **Large Title:** 34px (2.125rem)
- **Title 1:** 28px (1.75rem)  
- **Title 2:** 22px (1.375rem)
- **Title 3:** 20px (1.25rem)

### SF Pro Text (İçerik)
- **Headline:** 17px (1.0625rem)
- **Body:** 17px (1.0625rem)
- **Callout:** 16px (1rem)
- **Subheadline:** 15px (0.9375rem)
- **Footnote:** 13px (0.8125rem)
- **Caption:** 12px (0.75rem)

## Font Weights

- **Ultralight:** 100
- **Thin:** 200
- **Light:** 300
- **Regular:** 400
- **Medium:** 500
- **Semibold:** 600
- **Bold:** 700
- **Heavy:** 800
- **Black:** 900

## Implementation

Fontlar sistem fontları olarak CSS'de tanımlanmıştır. Ayrı font dosyalarına gerek yoktur, tüm modern tarayıcılarda desteklenir.

## Fallback Strategy

1. **macOS/iOS:** SF Pro Display/Text
2. **Windows:** Segoe UI
3. **Android:** Roboto
4. **Generic:** Helvetica Neue, Arial, sans-serif

---

**Not:** Production ortamında gerçek SF Pro font dosyaları kullanılabilir, ancak sistem fontları optimize edilmiş performans sağlar. 