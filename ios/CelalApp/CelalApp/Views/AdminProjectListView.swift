//
//  AdminProjectListView.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Admin view for managing projects with CRUD operations
//

import SwiftUI

struct AdminProjectListView: View {
    // Data State
    @State private var projects: [Project] = []
    @State private var isLoading = false
    @State private var selectedProject: Project? = nil
    
    // UI State
    @State private var isEditing = false
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var apiKey: String = ""
    
    // Refresh Control
    @State private var isRefreshing = false
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // API Key Input Section
                VStack(spacing: 12) {
                    SecureField("API Key", text: $apiKey)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.password)
                    
                    Text("API key'inizi proje düzenleme ve silme işlemleri için girin")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal)
                .padding(.bottom)
                
                // Projects List
                if isLoading && projects.isEmpty {
                    // Initial Loading State
                    VStack(spacing: 16) {
                        ProgressView()
                            .scaleEffect(1.2)
                        Text("Projeler yükleniyor...")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if projects.isEmpty && !isLoading {
                    // Empty State
                    VStack(spacing: 16) {
                        Image(systemName: "folder.badge.questionmark")
                            .font(.system(size: 48))
                            .foregroundStyle(.secondary)
                        
                        VStack(spacing: 8) {
                            Text("Henüz Proje Yok")
                                .font(.title3)
                                .fontWeight(.semibold)
                            
                            Text("Sistemde kayıtlı proje bulunamadı")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        
                        Button("Tekrar Dene") {
                            Task {
                                await fetchProjects()
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding()
                } else {
                    // Projects List
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(projects) { project in
                                AdminProjectCard(
                                    project: project,
                                    apiKey: apiKey,
                                    onEdit: {
                                        selectedProject = project
                                        isEditing = true
                                    },
                                    onDeleteSuccess: {
                                        Task {
                                            await fetchProjects()
                                        }
                                    }
                                )
                            }
                        }
                        .padding(.horizontal)
                        .padding(.bottom, 100) // Safe area for tab bar
                    }
                    .refreshable {
                        await refreshProjects()
                    }
                }
            }
            .navigationTitle("Proje Yönetimi")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        Task {
                            await fetchProjects()
                        }
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(isLoading)
                }
            }
            .task {
                await fetchProjects()
            }
            .sheet(isPresented: $isEditing) {
                if let selected = selectedProject {
                    EditProjectView(
                        project: selected,
                        onProjectUpdated: { updatedProject in
                            // Update the project in the list
                            if let index = projects.firstIndex(where: { $0.id == updatedProject.id }) {
                                projects[index] = updatedProject
                            }
                        }
                    )
                }
            }
            .alert("Hata", isPresented: $showingError) {
                Button("Tamam") { }
            } message: {
                Text(errorMessage)
            }
        }
    }
    
    // MARK: - API Methods
    
    @MainActor
    private func fetchProjects() async {
        isLoading = true
        
        do {
            guard let url = URL(string: "https://celal-site.pages.dev/api/projects") else {
                throw ProjectListError.invalidURL
            }
            
            let (data, response) = try await URLSession.shared.data(from: url)
            
            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200 {
                let fetchedProjects = try JSONDecoder().decode([Project].self, from: data)
                projects = fetchedProjects
                print("✅ Loaded \(fetchedProjects.count) projects")
            } else {
                throw ProjectListError.serverError
            }
            
        } catch {
            errorMessage = handleError(error)
            showingError = true
            print("❌ Error fetching projects: \(error)")
        }
        
        isLoading = false
    }
    
    @MainActor
    private func refreshProjects() async {
        isRefreshing = true
        await fetchProjects()
        isRefreshing = false
    }
    
    private func handleError(_ error: Error) -> String {
        if let projectError = error as? ProjectListError {
            return projectError.localizedDescription
        } else {
            return "Projeler yüklenirken bir hata oluştu: \(error.localizedDescription)"
        }
    }
}

// MARK: - Admin Project Card Component

struct AdminProjectCard: View {
    let project: Project
    let apiKey: String
    let onEdit: () -> Void
    let onDeleteSuccess: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header: Title and Status
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(project.title)
                        .font(.headline)
                        .fontWeight(.bold)
                        .lineLimit(2)
                    
                    if project.featured {
                        HStack(spacing: 4) {
                            Image(systemName: "star.fill")
                                .font(.caption)
                            Text("Öne Çıkan")
                                .font(.caption)
                                .fontWeight(.medium)
                        }
                        .foregroundStyle(.orange)
                    }
                }
                
                Spacer()
                
                // Status Badge
                Text(project.status)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusColor.opacity(0.2), in: Capsule())
                    .foregroundStyle(statusColor)
            }
            
            // Description
            Text(project.description)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .lineLimit(3)
            
            // Tech Stack
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(project.tech, id: \.self) { tech in
                        Text(tech)
                            .font(.caption)
                            .fontWeight(.medium)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.blue.opacity(0.1), in: Capsule())
                            .foregroundStyle(.blue)
                    }
                }
                .padding(.horizontal, 1)
            }
            
            // Links Section
            if !project.github.isEmpty || !project.live.isEmpty {
                HStack(spacing: 12) {
                    if !project.github.isEmpty {
                        Link(destination: URL(string: project.github)!) {
                            HStack(spacing: 4) {
                                Image(systemName: "chevron.left.forwardslash.chevron.right")
                                    .font(.caption)
                                Text("GitHub")
                                    .font(.caption)
                                    .fontWeight(.medium)
                            }
                            .foregroundStyle(.primary)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.gray.opacity(0.1), in: Capsule())
                        }
                    }
                    
                    if !project.live.isEmpty {
                        Link(destination: URL(string: project.live)!) {
                            HStack(spacing: 4) {
                                Image(systemName: "globe")
                                    .font(.caption)
                                Text("Demo")
                                    .font(.caption)
                                    .fontWeight(.medium)
                            }
                            .foregroundStyle(.primary)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(.gray.opacity(0.1), in: Capsule())
                        }
                    }
                    
                    Spacer()
                }
            }
            
            // Action Buttons
            HStack(spacing: 12) {
                // Edit Button
                Button(action: onEdit) {
                    HStack(spacing: 6) {
                        Image(systemName: "pencil")
                            .font(.system(size: 14, weight: .medium))
                        Text("Düzenle")
                            .font(.system(.callout, design: .default, weight: .semibold))
                    }
                    .foregroundStyle(.blue)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8))
                }
                
                Spacer()
                
                // Delete Button
                DeleteProjectButton(
                    projectID: project.id,
                    apiKey: apiKey,
                    onDeleteSuccess: onDeleteSuccess
                )
            }
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
    
    private var statusColor: Color {
        switch project.status {
        case "Tamamlandı":
            return .green
        case "Devam Ediyor":
            return .orange
        default:
            return .gray
        }
    }
}

// MARK: - Error Handling

enum ProjectListError: LocalizedError {
    case invalidURL
    case serverError
    case decodingError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Geçersiz API URL'si"
        case .serverError:
            return "Sunucu hatası"
        case .decodingError:
            return "Veri formatı hatası"
        }
    }
}

// MARK: - Preview

#Preview("Admin Project List") {
    NavigationStack {
        AdminProjectListView()
    }
} 