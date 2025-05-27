# Cloudflare Pages API Functions

This directory contains serverless API functions for the Celal Başaran portfolio website, deployed on Cloudflare Pages.

## 📡 API Endpoints

### `GET /api/projects`
Returns the latest projects data from the repository.

**Response Format:**
```json
[
  {
    "id": "project-001",
    "title": "Project Title",
    "description": "Project description",
    "status": "Tamamlandı",
    "tech": ["SwiftUI", "Core Data"],
    "featured": true,
    "github": "https://github.com/...",
    "live": "https://example.com"
  }
]
```

**Headers:**
- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *`
- `X-Projects-Count: {number}`
- `Cache-Control: public, max-age=60`

### `POST /api/projects`
Adds a new project to the repository. **Requires authentication.**

**Request Headers:**
- `Content-Type: application/json`
- `X-API-Key: {your-api-key}`

**Request Body:**
```json
{
  "id": "new-project",
  "title": "New Project",
  "description": "Project description",
  "status": "Devam Ediyor",
  "tech": ["React", "TypeScript"],
  "featured": false,
  "github": "https://github.com/username/repo",
  "live": "https://demo.example.com"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Project added successfully",
  "project": { /* newly added project */ },
  "totalProjects": 5
}
```

### `PUT /api/projects`
Replaces all projects with the provided array. **Requires authentication.**

**Request Headers:**
- `Content-Type: application/json`
- `X-API-Key: {your-api-key}`

**Request Body:**
```json
[
  {
    "id": "project-001",
    "title": "Updated Project",
    "description": "Updated description",
    "status": "Tamamlandı",
    "tech": ["SwiftUI", "Core Data"],
    "featured": true,
    "github": "https://github.com/...",
    "live": "https://example.com"
  }
]
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Projects updated successfully",
  "totalProjects": 1
}
```

## 🔧 Individual Project Operations

### `GET /api/projects/{id}`
Retrieves a specific project by ID.

**Response Format:**
```json
{
  "id": "project-001",
  "title": "Portfolio Website",
  "description": "Modern portfolio built with latest tech",
  "status": "Tamamlandı",
  "tech": ["React", "TypeScript", "Tailwind CSS"],
  "featured": true,
  "github": "https://github.com/username/portfolio",
  "live": "https://portfolio.example.com"
}
```

**Headers:**
- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *`
- `X-Project-ID: {project-id}`
- `Cache-Control: public, max-age=60`

### `PUT /api/projects/{id}`
Updates a specific project by ID. **Requires authentication.**

**Request Headers:**
- `Content-Type: application/json`
- `X-API-Key: {your-api-key}`

**Request Body:**
```json
{
  "id": "project-001",
  "title": "Updated Project Title",
  "description": "Updated project description",
  "status": "Tamamlandı",
  "tech": ["React", "Next.js", "TypeScript"],
  "featured": true,
  "github": "https://github.com/username/updated-repo",
  "live": "https://updated-demo.example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "project": { /* updated project data */ }
}
```

### `DELETE /api/projects/{id}`
Deletes a specific project by ID. **Requires authentication.**

**Request Headers:**
- `X-API-Key: {your-api-key}`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Project deleted successfully",
  "deletedProject": { /* deleted project data */ },
  "totalProjects": 4
}
```

### `GET /api/skills`
Returns the latest skills data from the repository.

**Response Format:**
```json
{
  "skills": {
    "categories": [
      {
        "id": "programming-languages",
        "title": "Programlama Dilleri",
        "skills": [
          {
            "name": "Swift",
            "level": "advanced",
            "years": 2
          }
        ]
      }
    ]
  },
  "levelLabels": {
    "expert": "Uzman",
    "advanced": "İleri",
    "intermediate": "Orta"
  },
  "stats": {
    "totalSkills": 15,
    "averageLevel": 3.2,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

**Headers:**
- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *`
- `X-Skills-Count: {number}`
- `X-Categories-Count: {number}`
- `Cache-Control: public, max-age=60`

### `PUT /api/skills`
Replaces the entire skills data. **Requires authentication.**

**Request Headers:**
- `Content-Type: application/json`
- `X-API-Key: {your-api-key}`

**Request Body:**
```json
{
  "skills": {
    "categories": [
      {
        "id": "programming-languages",
        "title": "Programlama Dilleri",
        "skills": [
          {
            "name": "Swift",
            "level": "advanced",
            "years": 2
          }
        ]
      }
    ]
  },
  "levelLabels": {
    "expert": "Uzman",
    "advanced": "İleri",
    "intermediate": "Orta"
  },
  "stats": {
    "totalSkills": 15,
    "averageLevel": 3.2,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Skills updated successfully",
  "totalSkills": 15,
  "totalCategories": 4
}
```

## 🔧 Technical Details

### Architecture
- **Runtime**: Cloudflare Pages Functions (V8 isolates)
- **Data Storage**: Cloudflare KV (primary) + Static JSON fallback
- **Authentication**: API key-based authentication for write operations
- **CORS**: Enabled for cross-origin requests (iOS app integration)
- **Caching**: 1-minute cache for better performance (shorter for dynamic data)
- **Error Handling**: Comprehensive error responses with logging

### Error Responses
All endpoints return structured error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable error description"
}
```

**HTTP Status Codes:**
- `200`: Success (GET, PUT)
- `201`: Created (POST)
- `400`: Bad request (invalid data, missing fields)
- `401`: Unauthorized (invalid/missing API key)
- `404`: Data not found
- `405`: Method not allowed
- `500`: Internal server error

### CORS Support
All endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key`

OPTIONS requests are handled for preflight checks.

### Authentication
Write operations (POST, PUT) require API key authentication:
- Header: `X-API-Key: {your-secret-key}`
- Set up via Cloudflare Pages environment variable: `API_KEY`

## 📱 iOS App Integration

The iOS SwiftUI app automatically synchronizes with these API endpoints:

```swift
// iOS DataLoaderService.swift
func updateFromWeb() async {
    // Fetch from /api/projects
    let projectsURL = URL(string: "https://celalbasaran.dev/api/projects")
    
    // Fetch from /api/skills
    let skillsURL = URL(string: "https://celalbasaran.dev/api/skills")
}
```

### Pull-to-Refresh
The iOS app implements pull-to-refresh that:
1. First tries to sync from web API
2. Falls back to local JSON if API fails
3. Shows appropriate error messages

## 🚀 Deployment

Functions are automatically deployed with Cloudflare Pages:

1. **Automatic**: On every push to main branch
2. **Build Command**: Not required (static functions)
3. **Output Directory**: `functions/`
4. **Environment**: Production functions run in global edge locations

### Local Development
```bash
# Install Wrangler CLI
npm install -g wrangler

# Run locally
wrangler pages dev . --compatibility-flags=nodejs_compat

# Test endpoints
curl http://localhost:8788/api/projects
curl http://localhost:8788/api/skills
```

## 📊 Monitoring

### Logs
Function logs are available in Cloudflare Dashboard:
- Success: `Successfully loaded X projects/skills`
- Errors: Full error stack traces
- Performance: Response times and memory usage

### Analytics
Cloudflare Pages provides:
- Request counts and success rates
- Geographic distribution
- Cache hit ratios
- Error rate monitoring

## 🔮 Future Enhancements

- [ ] **Authentication**: JWT-based auth for write operations
- [ ] **Blog API**: `/api/blog` endpoint for blog posts
- [ ] **Admin API**: CRUD operations for content management
- [ ] **Webhooks**: GitHub webhook for automatic content updates
- [ ] **Rate Limiting**: Request throttling for abuse prevention
- [ ] **GraphQL**: Alternative query interface
- [ ] **Real-time**: WebSocket support for live updates

## 🛡️ Security

- **Input Validation**: All JSON data is validated
- **CORS**: Properly configured for cross-origin requests
- **Headers**: Security headers included (`X-Content-Type-Options`)
- **Error Handling**: No sensitive information in error responses
- **Logging**: Errors logged for debugging without exposing internals 