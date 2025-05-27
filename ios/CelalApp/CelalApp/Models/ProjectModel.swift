//
//  ProjectModel.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Project data model for JSON synchronization with web
//

import Foundation

struct Project: Codable, Identifiable {
    let id: String
    let title: String
    let description: String
    let status: String
    let tech: [String]
    let featured: Bool
    let github: String
    let live: String
    
    // Computed properties for UI
    var isCompleted: Bool {
        status == "Tamamlandı"
    }
    
    var isInProgress: Bool {
        status == "Devam Ediyor"
    }
    
    var hasLiveDemo: Bool {
        !live.isEmpty
    }
    
    var statusDisplayText: String {
        switch status {
        case "Tamamlandı":
            return "✅ Tamamlandı"
        case "Devam Ediyor":
            return "🚧 Devam Ediyor"
        default:
            return status
        }
    }
    
    var techStackText: String {
        tech.joined(separator: " • ")
    }
}

// Extension for sample data and preview
extension Project {
    static let sampleProject = Project(
        id: "sample-001",
        title: "Sample Project",
        description: "Bu bir örnek proje açıklamasıdır",
        status: "Tamamlandı",
        tech: ["SwiftUI", "Core Data"],
        featured: true,
        github: "https://github.com/sample",
        live: ""
    )
    
    static let sampleProjects = [
        Project(
            id: "project-001",
            title: "Portfolio Website",
            description: "Modern ve responsive kişisel portfolio websitesi",
            status: "Tamamlandı",
            tech: ["HTML", "CSS", "JavaScript"],
            featured: true,
            github: "https://github.com/celalbasaran/portfolio",
            live: "https://celalbasaran.dev"
        ),
        Project(
            id: "project-003",
            title: "Öğrenci Bütçe Takip",
            description: "Üniversite öğrencileri için geliştirilmiş basit ve kullanışlı bütçe takip uygulaması",
            status: "Tamamlandı",
            tech: ["SwiftUI", "Core Data", "Charts"],
            featured: true,
            github: "https://github.com/celalbasaran/student-budget",
            live: ""
        )
    ]
} 