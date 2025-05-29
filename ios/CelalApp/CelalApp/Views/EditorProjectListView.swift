//
//  EditorProjectListView.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.12.2024.
//  Editor view for managing their own projects with CRUD operations
//

import SwiftUI

struct EditorProjectListView: View {
    @EnvironmentObject private var sessionManager: UserSessionManager
    
    // Data State
    @State private var allProjects: [Project] = []
    @State private var isLoading = false
    @State private var selectedProject: Project? = nil
    
    // UI State
    @State private var isEditing = false
    @State private var showingAddProject = false
    @State private var showingError = false
    @State private var errorMessage = ""
    
    // Computed property for filtered projects
    private var myProjects: [Project] {
        guard let username = sessionManager.currentUser?.username else { return [] }
        return allProjects.filter { project in
            // Check if project has createdBy field and matches current user
            project.createdBy?.lowercased() == username.lowercased()
        }
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Stats Header
                if !myProjects.isEmpty {
                    VStack(spacing: 8) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Projelerim")
                                    .font(.title2)
                                    .fontWeight(.bold)
                                
                                Text("\(myProjects.count) proje")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            
                            Spacer()
                            
                            Button(action: { showingAddProject = true }) {
                                HStack(spacing: 6) {
                                    Image(systemName: "plus")
                                        .font(.system(size: 14, weight: .semibold))
                                    Text("Yeni Proje")
                                        .font(.system(.callout, design: .default, weight: .semibold))
                                }
                                .foregroundStyle(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 10)
                                .background(.blue, in: RoundedRectangle(cornerRadius: 10))
                            }
                        }
                        
                        // Quick Stats
                        HStack(spacing: 16) {
                            StatCard(
                                title: "Tamamlanan",
                                count: myProjects.filter { $0.status == "Tamamlandı" }.count,
                                color: .green
                            )
                            
                            StatCard(
                                title: "Devam Eden",
                                count: myProjects.filter { $0.status == "Devam Ediyor" }.count,
                                color: .orange
                            )
                            
                            StatCard(
                                title: "Öne Çıkan",
                                count: myProjects.filter { $0.featured }.count,
                                color: .purple
                            )
                        }
                    }
                    .padding()
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
                    .padding(.horizontal)
                    .padding(.bottom)
                }
                
                // Projects List
                if isLoading && allProjects.isEmpty {
                    // Initial Loading State
                    VStack(spacing: 16) {
                        ProgressView()
                            .scaleEffect(1.2)
                        Text("Projeleriniz yükleniyor...")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if myProjects.isEmpty && !isLoading {
                    // Empty State
                    VStack(spacing: 20) {
                        Image(systemName: "folder.badge.plus")
                            .font(.system(size: 64))
                            .foregroundStyle(.blue.opacity(0.7))
                        
                        VStack(spacing: 8) {
                            Text("Henüz Proje Yok")
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            Text("İlk projenizi oluşturarak başlayın!")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                        }
                        
                        Button(action: { showingAddProject = true }) {
                            HStack(spacing: 8) {
                                Image(systemName: "plus.circle.fill")
                                Text("İlk Projemi Oluştur")
                                    .fontWeight(.semibold)
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 24)
                            .padding(.vertical, 12)
                            .background(.blue, in: RoundedRectangle(cornerRadius: 12))
                        }
                        
                        Button("Projeleri Yenile") {
                            Task {
                                await fetchProjects()
                            }
                        }
                        .foregroundStyle(.blue)
                        .padding(.top, 8)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding()
                } else {
                    // Projects List
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(myProjects) { project in
                                EditorProjectCard(
                                    project: project,
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
            .navigationTitle("Projelerim")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Geri") {
                        // This will be handled by navigation dismiss
                    }
                    .foregroundStyle(.blue)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { showingAddProject = true }) {
                            Label("Yeni Proje", systemImage: "plus")
                        }
                        
                        Button(action: {
                            Task {
                                await fetchProjects()
                            }
                        }) {
                            Label("Yenile", systemImage: "arrow.clockwise")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
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
                            if let index = allProjects.firstIndex(where: { $0.id == updatedProject.id }) {
                                allProjects[index] = updatedProject
                            }
                        }
                    )
                }
            }
            .sheet(isPresented: $showingAddProject) {
                AddProjectView(
                    onProjectAdded: { newProject in
                        // Add the new project to the list
                        allProjects.append(newProject)
                    }
                )
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
                throw EditorProjectError.invalidURL
            }
            
            let (data, response) = try await URLSession.shared.data(from: url)
            
            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200 {
                let fetchedProjects = try JSONDecoder().decode([Project].self, from: data)
                allProjects = fetchedProjects
                print("✅ Loaded \(fetchedProjects.count) total projects, \(myProjects.count) are mine")
            } else {
                throw EditorProjectError.serverError
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
        await fetchProjects()
    }
    
    private func handleError(_ error: Error) -> String {
        if let projectError = error as? EditorProjectError {
            return projectError.localizedDescription
        } else {
            return "Projeler yüklenirken bir hata oluştu: \(error.localizedDescription)"
        }
    }
}

// MARK: - Editor Project Card Component

struct EditorProjectCard: View {
    let project: Project
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
                
                // Delete Button - Only for editor's own projects
                DeleteProjectButton(
                    projectID: project.id,
                    apiKey: "", // Editor doesn't need API key for their own projects
                    onDeleteSuccess: onDeleteSuccess
                )
            }
        }
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(.blue.opacity(0.2), lineWidth: 1)
        )
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

// MARK: - Stat Card Component

struct StatCard: View {
    let title: String
    let count: Int
    let color: Color
    
    var body: some View {
        VStack(spacing: 6) {
            Text("\(count)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(color)
            
            Text(title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(color.opacity(0.1), in: RoundedRectangle(cornerRadius: 10))
    }
}

// MARK: - Error Handling

enum EditorProjectError: LocalizedError {
    case invalidURL
    case serverError
    case decodingError
    case unauthorized
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Geçersiz URL"
        case .serverError:
            return "Sunucu hatası"
        case .decodingError:
            return "Veri işleme hatası"
        case .unauthorized:
            return "Yetkiniz bulunmuyor"
        }
    }
}

// MARK: - Previews

#Preview("Editor Project List - With Projects") {
    NavigationStack {
        EditorProjectListView()
            .environmentObject({
                let manager = UserSessionManager.shared
                manager.setUserSession(
                    token: "mock_token",
                    refreshToken: "mock_refresh",
                    user: User(
                        id: "2",
                        username: "editor",
                        email: "editor@celal.com",
                        role: .editor,
                        createdAt: "2024-01-01"
                    )
                )
                return manager
            }())
    }
}

#Preview("Editor Project List - Empty") {
    NavigationStack {
        EditorProjectListView()
            .environmentObject({
                let manager = UserSessionManager.shared
                manager.setUserSession(
                    token: "mock_token",
                    refreshToken: "mock_refresh",
                    user: User(
                        id: "3",
                        username: "neweditor",
                        email: "new@celal.com",
                        role: .editor,
                        createdAt: "2024-01-01"
                    )
                )
                return manager
            }())
    }
} 