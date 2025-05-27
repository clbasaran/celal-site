# Cloudflare Pages API Functions

Bu dizin, Celal Başaran'ın portföy sitesi için Cloudflare Pages API fonksiyonlarını içerir.

## 🔧 API Endpoints

### 🔐 Authentication Endpoints

#### `POST /api/login`
- **Açıklama:** JWT tabanlı kullanıcı girişi
- **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "admin",
      "role": "admin"
    },
    "expiresIn": 3600
  }
  ```
- **Error Response (401):**
  ```json
  {
    "error": "Authentication Failed",
    "message": "Invalid username or password"
  }
  ```

### 📋 Projects Endpoints

#### `GET /api/projects`
- **Açıklama:** Tüm projeleri listeler (public endpoint)
- **Auth:** Gerekli değil
- **Response:**
  ```json
  [
    {
      "id": "project-1",
      "title": "Proje Başlığı",
      "description": "Proje açıklaması",
      "status": "active",
      "tech": "React, TypeScript",
      "featured": true,
      "github": "https://github.com/user/repo",
      "live": "https://project.com"
    }
  ]
  ```

#### `POST /api/projects`
- **Açıklama:** Yeni proje ekler
- **Auth:** JWT token gerekli (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "id": "unique-project-id",
    "title": "Yeni Proje",
    "description": "Proje açıklaması",
    "status": "active",
    "tech": "Technology stack",
    "featured": false,
    "github": "https://github.com/user/repo",
    "live": "https://project.com"
  }
  ```

#### `PUT /api/projects`
- **Açıklama:** Tüm projeleri değiştirir (bulk replacement)
- **Auth:** JWT token gerekli (`Authorization: Bearer <token>`)
- **Request Body:** Proje array'i

#### `GET /api/projects/:id`
- **Açıklama:** Belirli bir projeyi getirir
- **Auth:** Gerekli değil
- **URL Params:** `id` - Project ID

#### `PUT /api/projects/:id`
- **Açıklama:** Belirli bir projeyi günceller
- **Auth:** JWT token gerekli (`Authorization: Bearer <token>`)
- **URL Params:** `id` - Project ID
- **Request Body:** Updated project object

#### `DELETE /api/projects/:id`
- **Açıklama:** Belirli bir projeyi siler
- **Auth:** JWT token gerekli (`Authorization: Bearer <token>`)
- **URL Params:** `id` - Project ID

## 🔑 Authentication

### JWT Token System
- **Login:** `/api/login` endpoint'i ile kullanıcı adı/şifre ile token alın
- **Usage:** `Authorization: Bearer <your-jwt-token>` header'ı ile korumalı endpoint'lere erişin
- **Expiration:** Token'lar 1 saat süreyle geçerlidir
- **Refresh:** Token süresi dolduğunda yeniden giriş yapmanız gerekir

### Legacy API Key (Deprecated)
- **Note:** API key authentication sistem JWT sistemine dönüştürülmüştür
- **Migration:** Yeni uygulamalar JWT authentication kullanmalıdır

## 🚀 Deployment

### Environment Variables

Cloudflare Pages dashboard'da aşağıdaki environment variable'ları ayarlayın:

```bash
# JWT Authentication
JWT_SECRET=your-strong-random-jwt-secret-here

# Legacy (Backward Compatibility)
API_KEY=your-legacy-api-key-here
```

### KV Storage

Cloudflare KV namespace oluşturun ve `wrangler.toml`'da yapılandırın:

```toml
[[kv_namespaces]]
binding = "PORTFOLIO_KV"
id = "your-kv-namespace-id"
```

## 📱 iOS App Integration

iOS uygulaması JWT authentication kullanır:

1. **Login:** `/api/login` ile JWT token alır
2. **Storage:** Token'ı UserDefaults'ta saklar
3. **Requests:** Tüm API isteklerinde `Authorization: Bearer <token>` header'ı kullanır
4. **Auto-refresh:** Uygulama açılışında stored token'ı kontrol eder

### iOS Admin Features
- ✅ JWT tabanlı giriş sistemi
- ✅ Proje ekleme (`AddProjectView`)
- ✅ Proje düzenleme (`EditProjectView`)
- ✅ Proje silme (`DeleteProjectButton`)
- ✅ Proje listesi yönetimi (`AdminProjectListView`)
- ✅ Admin dashboard (`AdminDashboardView`)

## 🔧 Technical Details

### File Structure
```
functions/
├── api/
│   ├── login.ts                 # JWT authentication
│   ├── verify-jwt.ts           # JWT verification middleware
│   ├── projects.ts             # Bulk project operations
│   └── projects/
│       └── [id].ts             # Individual project operations
├── wrangler.toml               # Cloudflare configuration
└── README.md                   # This file
```

### JWT Implementation
- **Algorithm:** HMAC-SHA256 (HS256)
- **Claims:** username, role, iat, exp, iss
- **Verification:** Web Crypto API for Cloudflare Workers compatibility
- **Security:** Strong random JWT_SECRET required

### CORS Configuration
Tüm endpoint'ler cross-origin requests'i destekler:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## 📋 Testing

### Using cURL

#### Login
```bash
curl -X POST https://celal-site.pages.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### Get Projects (Public)
```bash
curl https://celal-site.pages.dev/api/projects
```

#### Add Project (Authenticated)
```bash
curl -X POST https://celal-site.pages.dev/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"id":"test","title":"Test Project","description":"Test","status":"active","tech":"Test","featured":false,"github":"","live":""}'
```

#### Delete Project (Authenticated)
```bash
curl -X DELETE https://celal-site.pages.dev/api/projects/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Notes

1. **JWT Secret:** Strong, random secret kullanın (minimum 32 karakter)
2. **HTTPS:** Production'da sadece HTTPS kullanın
3. **Token Storage:** Client-side'da güvenli storage kullanın
4. **Token Expiration:** Short-lived token'lar ve refresh mechanism
5. **Input Validation:** API endpoint'lerinde input validation var
6. **Rate Limiting:** Cloudflare'in built-in rate limiting kullanın

## 📈 Future Enhancements

- [ ] JWT token refresh endpoint
- [ ] User management endpoints
- [ ] Role-based access control (RBAC)
- [ ] Password hashing with bcrypt
- [ ] Account lockout after failed attempts
- [ ] Audit logging
- [ ] API rate limiting per user

---

**Last Updated:** 27 Aralık 2024  
**Version:** 2.0 (JWT Authentication) 