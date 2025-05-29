# Emanet Takip Backend Deployment

## 🚀 Railway Deployment

### 1. Environment Variables (Railway Dashboard'da ayarlayın):

```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://celalbasaran.com
DB_PATH=./db/database.sqlite
JWT_SECRET=your-production-jwt-secret-key-very-secure-2024
SESSION_SECRET=your-production-session-secret-key-very-secure-2024
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
COMPANY_NAME=Emanet Takip Sistemi
COMPANY_ADDRESS=Türkiye
COMPANY_PHONE=+90 XXX XXX XXXX
COMPANY_EMAIL=celal@celalbasaran.com
ALLOWED_ORIGINS=https://celalbasaran.com,https://www.celalbasaran.com
```

### 2. Deployment Steps:

1. Railway.app'te yeni proje oluşturun
2. GitHub repository'yi bağlayın: `Emanettakip/backend` klasörü
3. Environment variables'ları yukarıdaki gibi ayarlayın
4. Deploy edin

### 3. Post-Deploy:

- Health check: `https://your-app.railway.app/api/health`
- Database otomatik initialize olacak
- Cron jobs otomatik başlayacak

### 4. Frontend API URL Update:

Frontend'te API_BASE_URL'yi güncellemeyi unutmayın:
```
https://your-app.railway.app/api
```

## 🔧 Alternative Platforms:

### Render.com:
- Ücretsiz tier mevcut
- PostgreSQL önerilir (SQLite sınırlı)
- Environment variables kolay

### Vercel:
- Serverless functions
- SQLite desteklenmez, external DB gerekir

### Fly.io:
- Docker-based deployment
- Persistent volumes destekler 