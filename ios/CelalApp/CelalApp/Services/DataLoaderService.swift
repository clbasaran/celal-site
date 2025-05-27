//
//  DataLoaderService.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Service for loading JSON data from bundle and future web synchronization
//

import Foundation
import Combine

@MainActor
class DataLoaderService: ObservableObject {
    static let shared = DataLoaderService()
    
    @Published var projects: [Project] = []
    @Published var skillsData: SkillsData?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private init() {
        loadData()
    }
    
    // MARK: - Public Methods
    
    func loadData() {
        Task {
            await loadProjects()
            await loadSkills()
        }
    }
    
    func refreshData() {
        loadData()
    }
    
    // Web sync method - Uses Cloudflare Pages API endpoints
    func updateFromWeb() async {
        isLoading = true
        errorMessage = nil
        
        do {
            // Fetch projects from web API
            if let projectsURL = URL(string: "https://celalbasaran.dev/api/projects") {
                let (projectsData, _) = try await URLSession.shared.data(from: projectsURL)
                let webProjects = try JSONDecoder().decode([Project].self, from: projectsData)
                await MainActor.run {
                    self.projects = webProjects
                    print("✅ Successfully updated \(webProjects.count) projects from web API")
                }
            }
            
            // Fetch skills from web API
            if let skillsURL = URL(string: "https://celalbasaran.dev/api/skills") {
                let (skillsData, _) = try await URLSession.shared.data(from: skillsURL)
                let webSkills = try JSONDecoder().decode(SkillsData.self, from: skillsData)
                await MainActor.run {
                    self.skillsData = webSkills
                    print("✅ Successfully updated skills data from web API")
                }
            }
            
        } catch {
            await MainActor.run {
                self.errorMessage = "Web'den veri alınamadı: \(error.localizedDescription)"
                print("❌ Web API sync failed: \(error.localizedDescription)")
            }
        }
        
        await MainActor.run {
            self.isLoading = false
        }
    }
    
    // MARK: - Private Methods
    
    private func loadProjects() async {
        do {
            let projectsData = try loadJSONFromBundle(filename: "projects", type: [Project].self)
            await MainActor.run {
                self.projects = projectsData
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Projeler yüklenemedi: \(error.localizedDescription)"
                self.projects = Project.sampleProjects // Fallback to sample data
            }
        }
    }
    
    private func loadSkills() async {
        do {
            let skillsData = try loadJSONFromBundle(filename: "skills", type: SkillsData.self)
            await MainActor.run {
                self.skillsData = skillsData
            }
        } catch {
            await MainActor.run {
                self.errorMessage = "Yetenekler yüklenemedi: \(error.localizedDescription)"
                self.skillsData = SkillsData.sampleData // Fallback to sample data
            }
        }
    }
    
    private func loadJSONFromBundle<T: Codable>(filename: String, type: T.Type) throws -> T {
        guard let url = Bundle.main.url(forResource: filename, withExtension: "json") else {
            throw DataLoaderError.fileNotFound(filename)
        }
        
        let data = try Data(contentsOf: url)
        let decoder = JSONDecoder()
        
        return try decoder.decode(type, from: data)
    }
}

// MARK: - Error Handling

enum DataLoaderError: LocalizedError {
    case fileNotFound(String)
    case decodingError(String)
    case networkError(String)
    
    var errorDescription: String? {
        switch self {
        case .fileNotFound(let filename):
            return "Dosya bulunamadı: \(filename).json"
        case .decodingError(let message):
            return "Veri işlenirken hata: \(message)"
        case .networkError(let message):
            return "Ağ hatası: \(message)"
        }
    }
}

// MARK: - Computed Properties for UI

extension DataLoaderService {
    var featuredProjects: [Project] {
        projects.filter { $0.featured }
    }
    
    var completedProjects: [Project] {
        projects.filter { $0.isCompleted }
    }
    
    var inProgressProjects: [Project] {
        projects.filter { $0.isInProgress }
    }
    
    var totalSkillsCount: Int {
        skillsData?.skills.categories.flatMap { $0.skills }.count ?? 0
    }
    
    var allSkills: [Skill] {
        skillsData?.skills.categories.flatMap { $0.skills } ?? []
    }
} 