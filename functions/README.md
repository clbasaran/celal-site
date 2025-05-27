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
- `Cache-Control: public, max-age=300`

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
- `Cache-Control: public, max-age=300`

## 🔧 Technical Details

### Architecture
- **Runtime**: Cloudflare Pages Functions (V8 isolates)
- **Data Source**: Static JSON files in `/data/` directory
- **CORS**: Enabled for cross-origin requests (iOS app integration)
- **Caching**: 5-minute cache for better performance
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
- `200`: Success
- `404`: Data not found
- `405`: Method not allowed (only GET supported)
- `500`: Internal server error

### CORS Support
All endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

OPTIONS requests are handled for preflight checks.

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