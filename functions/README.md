# Cloudflare Pages API Functions

Bu dizin, Celal Başaran'ın portföy sitesi için Cloudflare Pages API fonksiyonlarını içerir.

## 🔧 API Endpoints

### 🔐 Authentication Endpoints

#### `POST /api/register`
- **Açıklama:** Yeni kullanıcı hesabı oluşturma
- **Request Body:**
  ```json
  {
    "username": "example_user",
    "password": "example123",
    "role": "editor"
  }
  ```
- **Success Response (201):**
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "username": "example_user",
      "role": "editor"
    }
  }
  ```
- **Error Response (409 - Username Taken):**
  ```json
  {
    "error": "Conflict",
    "message": "Username is already taken"
  }
  ```
- **Error Response (400 - Validation Error):**
  ```json
  {
    "error": "Validation Error", 
    "message": "Username must be between 3 and 20 characters"
  }
  ```

#### `POST /api/login`
- **Açıklama:** JWT tabanlı kullanıcı girişi (KV storage + legacy admin support)
- **Request Body:**
  ```json
  {
    "username": "example_user",
    "password": "example123"
  }
  ```
- **Success Response (200):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "username": "example_user",
      "role": "editor"
    },
    "expires_in": 3600,
    "token_type": "Bearer"
  }
  ```
- **Error Response (401):**
  ```json
  {
    "error": "Authentication Failed",
    "message": "Invalid username or password"
  }
  ```

#### `GET /api/me`
- **Açıklama:** Authenticated kullanıcının profil bilgilerini döndürür
- **Auth:** JWT token gerekli (`Authorization: Bearer <token>`)
- **Success Response (200):**
  ```json
  {
    "username": "admin",
    "role": "admin",
    "iat": 1703721600,
    "exp": 1703725200
  }
  ```
- **Error Response (401):**
  ```json
  {
    "error": "Unauthorized",
    "message": "Authentication required"
  }
  ```

#### `POST /api/refresh`
- **Açıklama:** Access token'ı refresh token kullanarak yeniler
- **Request Body:**
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Success Response (200):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "token_type": "Bearer"
  }
  ```
- **Error Response (401):**
  ```json
  {
    "error": "Invalid Refresh Token",
    "message": "Refresh token is invalid or expired"
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

### User Account System
- **Registration:** `/api/register` endpoint'i ile yeni hesap oluşturun
- **Roles:** `admin` (tam yetki) ve `editor` (sınırlı yetki) rolleri desteklenir
- **Username Rules:** 3-20 karakter, sadece harf, rakam ve underscore
- **Password Rules:** Minimum 6 karakter
- **Password Hashing:** SHA-256 with salt using Web Crypto API
- **Storage:** Cloudflare KV'de güvenli depolama

### JWT Token System
- **Login:** `/api/login` endpoint'i ile kullanıcı adı/şifre ile token çifti alın
- **Access Token:** API erişimi için kullanılır (1 saat geçerli)
- **Refresh Token:** Access token yenilemek için kullanılır (7 gün geçerli)
- **Usage:** `Authorization: Bearer <access-token>` header'ı ile korumalı endpoint'lere erişin
- **Auto-refresh:** Access token süresi dolduğunda refresh token ile otomatik yenileme
- **Session Management:** Refresh token süresi dolduğunda yeniden giriş gerekir
- **Role-based Access:** JWT token'ında kullanıcı rolü bulunur

### Legacy API Key (Deprecated)
- **Note:** API key authentication sistem JWT sistemine dönüştürülmüştür
- **Migration:** Yeni uygulamalar JWT authentication kullanmalıdır

## 🚀 Deployment

### Environment Variables

Cloudflare Pages dashboard'da aşağıdaki environment variable'ları ayarlayın:

```bash
# JWT Authentication
JWT_SECRET=your-strong-random-jwt-secret-here  # Access token signing (32+ chars)
JWT_REFRESH_SECRET=your-strong-random-refresh-secret-here  # Refresh token signing (32+ chars, different from JWT_SECRET)

# Legacy (Backward Compatibility)
API_KEY=your-legacy-api-key-here
```

### KV Storage

İki Cloudflare KV namespace oluşturun ve `wrangler.toml`'da yapılandırın:

```toml
# Project data storage
[[kv_namespaces]]
binding = "PORTFOLIO_KV"
id = "your-portfolio-kv-namespace-id"

# User account storage
[[kv_namespaces]]
binding = "USER_KV"
id = "your-user-kv-namespace-id"
```

## 📱 iOS App Integration

iOS uygulaması modern JWT refresh token sistemi kullanır:

1. **Login:** `/api/login` ile access ve refresh token çifti alır
2. **Storage:** Token çiftini güvenli olarak AuthTokenManager ile saklar
3. **Requests:** Tüm API isteklerinde `Authorization: Bearer <access-token>` header'ı kullanır
4. **Auto-refresh:** Access token süresi dolduğunda otomatik olarak refresh eder
5. **Session Management:** Refresh token süresi dolduğunda kullanıcıyı logout eder
6. **Background Refresh:** Uygulama açılışında token durumunu kontrol eder

### iOS Admin Features
- ✅ JWT refresh token tabanlı giriş sistemi (`AuthTokenManager`)
- ✅ Otomatik token yenileme ve session yönetimi
- ✅ Proje ekleme (`AddProjectView`)
- ✅ Proje düzenleme (`EditProjectView`)
- ✅ Proje silme (`DeleteProjectButton`)
- ✅ Proje listesi yönetimi (`AdminProjectListView`)
- ✅ Admin dashboard (`AdminDashboardView`)
- ✅ Güvenli logout ve credential temizleme

## 🔧 Technical Details

### File Structure
```
functions/
├── api/
│   ├── login.ts                 # JWT authentication
│   ├── verify-jwt.ts           # JWT verification middleware
│   ├── me.ts                   # User profile endpoint
│   ├── refresh.ts              # Token refresh endpoint
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

#### Register User
```bash
curl -X POST https://celal-site.pages.dev/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123","role":"editor"}'
```

#### Login
```bash
curl -X POST https://celal-site.pages.dev/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

#### Get User Profile (Authenticated)
```bash
curl https://celal-site.pages.dev/api/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Refresh Token (Authenticated)
```bash
curl -X POST https://celal-site.pages.dev/api/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}'
```

#### Get Projects (Public)
```bash
curl https://celal-site.pages.dev/api/projects
```

#### Add Project (Authenticated)
```bash
curl -X POST https://celal-site.pages.dev/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"id":"test","title":"Test Project","description":"Test","status":"active","tech":"Test","featured":false,"github":"","live":""}'
```

#### Delete Project (Authenticated)
```bash
curl -X DELETE https://celal-site.pages.dev/api/projects/test \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
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
**Version:** 2.2 (User Registration & Account System) 