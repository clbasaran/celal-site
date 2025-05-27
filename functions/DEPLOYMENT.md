# Cloudflare Pages API Deployment Guide

Bu rehber, portfolio API'sini Cloudflare Pages üzerinde KV storage ve authentication ile nasıl deploy edeceğinizi gösterir.

## 🚀 Önkoşullar

- Cloudflare hesabı
- GitHub repository
- Wrangler CLI (opsiyonel, local development için)

## 📦 1. KV Namespace Oluşturma

Cloudflare Dashboard'dan:

```bash
# Wrangler CLI ile
wrangler kv:namespace create "PORTFOLIO_KV"
wrangler kv:namespace create "PORTFOLIO_KV" --preview

# Veya Cloudflare Dashboard'dan:
# Workers & Pages > KV > Create Namespace
# Name: "portfolio-data"
```

Çıktıdaki namespace ID'leri not alın.

## 🔧 2. Cloudflare Pages Projesi Oluşturma

1. **Cloudflare Dashboard** > **Pages** > **Create a project**
2. **Connect to Git** > GitHub repository seçin
3. **Build Settings**:
   - Framework preset: `None`
   - Build command: (boş bırakın)
   - Build output directory: (boş bırakın)
   - Root directory: (boş bırakın)

## ⚙️ 3. Environment Variables & Bindings

Pages projesinin **Settings** > **Functions** kısmından:

### Environment Variables
```
API_KEY = your-super-secret-api-key-here
```

### KV Namespace Bindings
```
Variable name: PORTFOLIO_KV
KV namespace: [your-kv-namespace-id]
```

## 🔐 4. API Key Güvenliği

API key'inizi güvenli oluşturun:

```javascript
// Node.js ile güvenli API key
const crypto = require('crypto');
const apiKey = crypto.randomBytes(32).toString('hex');
console.log('API Key:', apiKey);
```

## 📱 5. iOS App Integration

iOS uygulamanızda API key'i güvenli saklayın:

```swift
// iOS Keychain veya secure storage kullanın
struct APIConfig {
    static let baseURL = "https://celalbasaran.dev/api"
    static let apiKey = "your-api-key" // Keychain'den alın
}
```

## 🧪 6. Test Etme

### GET Request (No Auth)
```bash
curl https://your-site.pages.dev/api/projects
curl https://your-site.pages.dev/api/skills
```

### POST Request (With Auth)
```bash
curl -X POST https://your-site.pages.dev/api/projects \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "id": "test-project",
    "title": "Test Project",
    "description": "Test description",
    "status": "Devam Ediyor",
    "tech": ["React"],
    "featured": false,
    "github": "https://github.com/test",
    "live": ""
  }'
```

### PUT Request (With Auth)
```bash
curl -X PUT https://your-site.pages.dev/api/skills \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d @skills.json
```

## 🔄 7. Data Migration

İlk deployment'dan sonra, mevcut JSON verilerini KV'ye migrate edin:

```bash
# projects.json verilerini KV'ye yükle
wrangler kv:key put --binding=PORTFOLIO_KV "projects" --path="data/projects.json"

# skills.json verilerini KV'ye yükle  
wrangler kv:key put --binding=PORTFOLIO_KV "skills" --path="data/skills.json"
```

## 📊 8. Monitoring & Logs

- **Dashboard**: Cloudflare Pages > your-project > Functions > Logs
- **Real-time**: `wrangler pages tail your-project`
- **Analytics**: Pages Analytics dashboard

## 🚨 9. Error Handling

Common issues ve çözümleri:

### "KV binding not found"
- Environment variables doğru set edilmiş mi kontrol edin
- Namespace ID doğru mu?
- Deployment tamamlandı mı?

### "Unauthorized" errors
- API key doğru mu?
- Header name `X-API-Key` mi?
- Environment variable `API_KEY` set edilmiş mi?

### "CORS errors"
- Preflight OPTIONS request destekleniyor
- All origins (*) allowed
- Check browser developer console

## 🔧 10. Local Development

```bash
# Wrangler ile local development
npm install -g wrangler
wrangler pages dev . --kv PORTFOLIO_KV

# Test local endpoints
curl http://localhost:8788/api/projects
```

## 📝 11. Backup Strategy

KV verilerini düzenli yedekleyin:

```bash
# Export all KV data
wrangler kv:key list --binding=PORTFOLIO_KV
wrangler kv:key get --binding=PORTFOLIO_KV "projects" > backup-projects.json
wrangler kv:key get --binding=PORTFOLIO_KV "skills" > backup-skills.json
```

## 🎯 12. Production Checklist

- [ ] KV namespace created & bound
- [ ] Environment variables set
- [ ] API key generated & secured
- [ ] iOS app configured with API key
- [ ] Test endpoints working
- [ ] CORS headers configured
- [ ] Monitoring enabled
- [ ] Backup strategy in place
- [ ] Custom domain configured (optional)

Bu rehberi takip ederek portfolio API'nizi production'a deploy edebilirsiniz! 