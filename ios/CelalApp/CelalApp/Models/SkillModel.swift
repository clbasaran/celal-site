//
//  SkillModel.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Skill data model for JSON synchronization with web
//

import Foundation
import SwiftUI

struct SkillsData: Codable {
    let skills: SkillsContainer
    let levelLabels: LevelLabels
    let stats: SkillStats
}

struct SkillsContainer: Codable {
    let categories: [SkillCategory]
}

struct SkillCategory: Codable, Identifiable {
    let id: String
    let title: String
    let skills: [Skill]
}

struct Skill: Codable, Identifiable {
    var id: String { name }
    let name: String
    let level: String
    let years: Int
    
    // Computed properties for UI
    var levelColor: Color {
        switch level {
        case "expert":
            return .purple
        case "advanced":
            return .blue
        case "intermediate":
            return .green
        default:
            return .gray
        }
    }
    
    var levelDisplayText: String {
        switch level {
        case "expert":
            return "Uzman"
        case "advanced":
            return "İleri"
        case "intermediate":
            return "Orta"
        default:
            return level.capitalized
        }
    }
    
    var experienceText: String {
        "\(years) yıl deneyim"
    }
    
    var progressValue: Double {
        switch level {
        case "expert":
            return 1.0
        case "advanced":
            return 0.8
        case "intermediate":
            return 0.6
        default:
            return 0.3
        }
    }
}

struct LevelLabels: Codable {
    let expert: String
    let advanced: String
    let intermediate: String
}

struct SkillStats: Codable {
    let totalSkills: Int
    let averageLevel: Double
    let lastUpdated: String
    
    var lastUpdatedDate: Date? {
        let formatter = ISO8601DateFormatter()
        return formatter.date(from: lastUpdated)
    }
    
    var lastUpdatedDisplayText: String {
        guard let date = lastUpdatedDate else { return "Bilinmiyor" }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.locale = Locale(identifier: "tr_TR")
        return formatter.string(from: date)
    }
}

// Extension for sample data and preview
extension SkillsData {
    static let sampleData = SkillsData(
        skills: SkillsContainer(categories: [
            SkillCategory(
                id: "programming-languages",
                title: "Programlama Dilleri",
                skills: [
                    Skill(name: "Swift", level: "advanced", years: 2),
                    Skill(name: "Python", level: "intermediate", years: 3)
                ]
            ),
            SkillCategory(
                id: "ios-frameworks",
                title: "iOS Framework'ler",
                skills: [
                    Skill(name: "SwiftUI", level: "advanced", years: 2),
                    Skill(name: "UIKit", level: "intermediate", years: 1)
                ]
            )
        ]),
        levelLabels: LevelLabels(
            expert: "Uzman",
            advanced: "İleri",
            intermediate: "Orta"
        ),
        stats: SkillStats(
            totalSkills: 5,
            averageLevel: 3.2,
            lastUpdated: "2024-01-15T10:30:00.000Z"
        )
    )
} 