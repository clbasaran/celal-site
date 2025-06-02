# Celal Başaran - Portfolio Website & iOS App

Modern portfolio website with synchronized iOS application showcasing projects, skills, and blog content.

## 🚀 Project Overview

This project consists of two synchronized parts:
- **Web Portfolio**: Modern, responsive website with Apple Design Language V6
- **iOS App**: Native SwiftUI application with real-time data synchronization

## 📱 iOS Application Features

### ✅ Completed Features
- **Home View**: Complete design sync with web version
  - Hero section with live statistics
  - Projects carousel with JSON data
  - Skills categories with progress indicators
  - Blog preview section
  - About section with modern cards
- **Admin Dashboard**: Authentication & management interface
- **JSON Data Sync**: Real-time synchronization with web data
- **Apple Design Language V6**: Native iOS design patterns

### 🏗️ Architecture
```
ios/CelalApp/CelalApp/
├── Models/
│   ├── ProjectModel.swift       # Project data structure
│   └── SkillModel.swift         # Skills data structure
├── Services/
│   └── DataLoaderService.swift  # JSON data management
├── Views/
│   ├── HomeView.swift          # Main portfolio view
│   ├── AdminDashboardView.swift # Admin management
│   └── MainTabView.swift       # Tab navigation
├── Resources/
│   ├── projects.json           # Projects data
│   └── skills.json             # Skills data
└── CelalAppApp.swift           # App entry point
```

## 🌐 Web Portfolio Features

### ✅ Completed Features
- **Brand Design System**: Comprehensive CSS design system
- **Apple Design Language V6**: Modern, clean interface
- **Component Library**: Reusable UI components
- **Dark/Light Mode**: Automatic theme switching
- **Responsive Design**: Mobile-first approach
- **JSON Data Management**: Structured content system

### 📁 Web Structure
```
assets/
├── style/
│   ├── brand-style.css         # Design system
│   └── brand-style-guide.html  # Interactive guide
└── data/
    ├── projects.json           # Projects database
    └── skills.json             # Skills database
```

## 🔧 Technical Stack

### iOS Application
- **Framework**: SwiftUI
- **Architecture**: MVVM + ObservableObject
- **Data**: JSON + Bundle Resources
- **UI**: Apple Design Language V6
- **Deployment**: iOS 18.1+

### Web Portfolio
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Design System**: Custom CSS with Apple Design principles
- **Data**: JSON-based content management
- **Deployment**: Static hosting ready

## 🚀 Getting Started

### iOS Development
```bash
# Open Xcode project
cd ios/CelalApp
open CelalApp.xcodeproj

# Build and run
xcodebuild -scheme CelalApp -destination 'platform=iOS Simulator,name=iPhone 16'
```

### Web Development
```bash
# Start local server
python3 -m http.server 8080
# or
live-server

# Open browser
open http://localhost:8080
```

## 📊 Data Synchronization

The iOS app automatically synchronizes with web data through:

1. **Bundle Resources**: JSON files copied to iOS project
2. **DataLoaderService**: Centralized data management
3. **Model Classes**: Type-safe data structures
4. **Future Ready**: Prepared for web API integration

### JSON Structure
```json
// projects.json
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

// skills.json
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
  }
}
```

## 🎨 Design System

Both web and iOS follow Apple Design Language V6 principles:

- **Typography**: SF Pro font family
- **Colors**: Apple Noir (#1d1d1f) + System colors
- **Spacing**: 8pt grid system
- **Components**: Modern, accessible UI elements
- **Motion**: Smooth, purposeful animations

## 📱 Demo Credentials

### iOS Admin Panel
- **Username**: admin
- **Password**: admin123

## 🔮 Future Enhancements

- [ ] Real-time web API synchronization
- [ ] Push notifications for content updates
- [ ] iPad optimized layouts
- [ ] Apple Watch companion app
- [ ] Core Data persistence
- [ ] CloudKit synchronization

## 🛠️ Development Status

| Feature | Web | iOS | Status |
|---------|-----|-----|--------|
| Portfolio Design | ✅ | ✅ | Complete |
| Data Management | ✅ | ✅ | Complete |
| Admin Panel | ✅ | ✅ | Complete |
| JSON Sync | ✅ | ✅ | Complete |
| Responsive Design | ✅ | ✅ | Complete |
| Dark Mode | ✅ | ✅ | Complete |

## 📄 License

MIT License - feel free to use this project as reference for your own portfolio.

---

**Celal Başaran** - iOS Developer & Computer Engineering Student  
📧 celal@example.com | 🌐 [Portfolio](https://celalbasaran.dev) | 📱 iOS App
