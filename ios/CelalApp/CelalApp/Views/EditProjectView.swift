//
//  EditProjectView.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Admin view for editing existing projects via API
//

import SwiftUI

struct EditProjectView: View {
    let project: Project
    @Environment(\.dismiss) private var dismiss
    var onProjectUpdated: ((Project) -> Void)?
    
    // API Configuration
    @State private var apiKey: String = ""
    
    // Project Fields (editable)
    @State private var title: String = ""
    @State private var description: String = ""
    @State private var status: String = ""
    @State private var tech: String = ""
    @State private var github: String = ""
    @State private var live: String = ""
    @State private var featured: Bool = false
    
    // UI State
    @State private var isLoading = false
    @State private var showingAlert = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""
    @State private var isSuccess = false
    
    // Status options
    private let statusOptions = ["Devam Ediyor", "Tamamlandı"]
    
    var body: some View {
        NavigationStack {
            Form {
                // API Configuration Section
                Section {
                    SecureField("API Key", text: $apiKey)
                        .textContentType(.password)
                } header: {
                    Text("Kimlik Doğrulama")
                } footer: {
                    Text("Cloudflare Pages API key'inizi girin")
                }
                
                // Project Information Section
                Section {
                    TextField("Proje Başlığı", text: $title)
                        .textContentType(.none)
                    
                    TextField("Proje Açıklaması", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                        .textContentType(.none)
                    
                    Picker("Durum", selection: $status) {
                        ForEach(statusOptions, id: \.self) { status in
                            Text(status).tag(status)
                        }
                    }
                    .pickerStyle(.segmented)
                    
                    Toggle("Öne Çıkarılan Proje", isOn: $featured)
                    
                } header: {
                    Text("Proje Bilgileri")
                } footer: {
                    Text("Proje hakkında temel bilgileri düzenleyin")
                }
                
                // Technical Details Section
                Section {
                    TextField("Teknolojiler", text: $tech)
                        .textContentType(.none)
                    
                    TextField("GitHub URL (opsiyonel)", text: $github)
                        .textContentType(.URL)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                    
                    TextField("Demo URL (opsiyonel)", text: $live)
                        .textContentType(.URL)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                        
                } header: {
                    Text("Teknik Detaylar")
                } footer: {
                    Text("Teknolojileri virgülle ayırın (örn: SwiftUI, Core Data)")
                }
                
                // Project ID Info
                Section {
                    HStack {
                        Text("Proje ID")
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(project.id)
                            .font(.system(.caption, design: .monospaced))
                            .foregroundStyle(.tertiary)
                    }
                } header: {
                    Text("Sistem Bilgileri")
                } footer: {
                    Text("Proje ID'si değiştirilemez")
                }
                
                // Submit Section
                Section {
                    Button(action: updateProject) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .scaleEffect(0.8)
                                    .tint(.white)
                            } else {
                                Image(systemName: "square.and.pencil")
                            }
                            
                            Text("Projeyi Güncelle")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .foregroundStyle(.white)
                    }
                    .buttonStyle(.plain)
                    .frame(height: 50)
                    .background(
                        isFormValid ? .green : .secondary,
                        in: RoundedRectangle(cornerRadius: 12)
                    )
                    .disabled(!isFormValid || isLoading)
                    .animation(.easeInOut(duration: 0.2), value: isFormValid)
                    
                } footer: {
                    if !isFormValid {
                        Text("Lütfen gerekli alanları doldurun")
                            .foregroundStyle(.red)
                    }
                }
            }
            .formStyle(.grouped)
            .navigationTitle("Projeyi Düzenle")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("İptal") {
                        dismiss()
                    }
                }
            }
            .alert(alertTitle, isPresented: $showingAlert) {
                Button("Tamam") {
                    if isSuccess {
                        dismiss()
                    }
                }
            } message: {
                Text(alertMessage)
            }
            .onAppear {
                loadProjectData()
            }
        }
    }
    
    // MARK: - Data Loading
    
    private func loadProjectData() {
        title = project.title
        description = project.description
        status = project.status
        tech = project.tech.joined(separator: ", ")
        github = project.github
        live = project.live
        featured = project.featured
    }
    
    // MARK: - Validation
    
    private var isFormValid: Bool {
        !apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !tech.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    // MARK: - API Request
    
    private func updateProject() {
        Task {
            await performUpdateProject()
        }
    }
    
    @MainActor
    private func performUpdateProject() async {
        isLoading = true
        
        do {
            // Prepare updated project data
            let updatedProject = ProjectUpdateRequest(
                id: project.id,
                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                description: description.trimmingCharacters(in: .whitespacesAndNewlines),
                status: status,
                tech: parseTechStack(tech),
                featured: featured,
                github: github.trimmingCharacters(in: .whitespacesAndNewlines),
                live: live.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            
            // Create URL and request (PUT to specific project ID)
            guard let url = URL(string: "https://celal-site.pages.dev/api/projects/\(project.id)") else {
                throw EditAPIError.invalidURL
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "PUT"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue(apiKey.trimmingCharacters(in: .whitespacesAndNewlines), forHTTPHeaderField: "X-API-Key")
            
            // Encode project data
            let encoder = JSONEncoder()
            request.httpBody = try encoder.encode(updatedProject)
            
            // Perform request
            let (responseData, response) = try await URLSession.shared.data(for: request)
            
            // Handle response
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 200:
                    // Success
                    let responseObj = try JSONDecoder().decode(ProjectUpdateResponse.self, from: responseData)
                    
                    // Create updated project instance
                    let updatedProjectInstance = Project(
                        id: updatedProject.id,
                        title: updatedProject.title,
                        description: updatedProject.description,
                        status: updatedProject.status,
                        tech: updatedProject.tech,
                        featured: updatedProject.featured,
                        github: updatedProject.github,
                        live: updatedProject.live
                    )
                    
                    // Notify parent view
                    onProjectUpdated?(updatedProjectInstance)
                    
                    isSuccess = true
                    alertTitle = "✅ Başarılı"
                    alertMessage = "Proje '\(updatedProject.title)' başarıyla güncellendi!"
                    showingAlert = true
                    
                    print("✅ Project updated successfully: \(responseObj.message)")
                    
                case 400:
                    // Bad request
                    if let errorResponse = try? JSONDecoder().decode(EditAPIErrorResponse.self, from: responseData) {
                        throw EditAPIError.badRequest(errorResponse.message)
                    } else {
                        throw EditAPIError.badRequest("Geçersiz veri formatı")
                    }
                    
                case 401:
                    // Unauthorized
                    throw EditAPIError.unauthorized
                    
                case 404:
                    // Not found
                    throw EditAPIError.notFound("Bu ID ile proje bulunamadı")
                    
                default:
                    // Other errors
                    if let errorResponse = try? JSONDecoder().decode(EditAPIErrorResponse.self, from: responseData) {
                        throw EditAPIError.serverError(errorResponse.message)
                    } else {
                        throw EditAPIError.serverError("Bilinmeyen sunucu hatası")
                    }
                }
            } else {
                throw EditAPIError.networkError
            }
            
        } catch {
            // Handle errors
            isSuccess = false
            alertTitle = "❌ Hata"
            
            if let apiError = error as? EditAPIError {
                alertMessage = apiError.localizedDescription
            } else {
                alertMessage = "Beklenmeyen bir hata oluştu: \(error.localizedDescription)"
            }
            
            showingAlert = true
            print("❌ Error updating project: \(error)")
        }
        
        isLoading = false
    }
    
    // MARK: - Helper Methods
    
    private func parseTechStack(_ techString: String) -> [String] {
        return techString
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }
    

}

// MARK: - Data Models

struct ProjectUpdateRequest: Codable {
    let id: String
    let title: String
    let description: String
    let status: String
    let tech: [String]
    let featured: Bool
    let github: String
    let live: String
}

struct ProjectUpdateResponse: Codable {
    let success: Bool
    let message: String
    let project: ProjectUpdateData?
}

struct ProjectUpdateData: Codable {
    let id: String
    let title: String
    let description: String
    let status: String
    let tech: [String]
    let featured: Bool
    let github: String
    let live: String
}

struct EditAPIErrorResponse: Codable {
    let error: String
    let message: String
}

// MARK: - Error Handling

enum EditAPIError: LocalizedError {
    case invalidURL
    case networkError
    case unauthorized
    case badRequest(String)
    case notFound(String)
    case serverError(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Geçersiz API URL'si"
        case .networkError:
            return "Ağ bağlantısı hatası"
        case .unauthorized:
            return "Yetkisiz erişim. API key'inizi kontrol edin"
        case .badRequest(let message):
            return "Geçersiz istek: \(message)"
        case .notFound(let message):
            return "Bulunamadı: \(message)"
        case .serverError(let message):
            return "Sunucu hatası: \(message)"
        }
    }
}

// MARK: - Preview

#Preview("Edit Project View") {
    @Previewable @State var sampleProject = Project.sampleProjects[0]
    return EditProjectView(project: sampleProject) { updatedProject in
        print("Project updated: \(updatedProject.title)")
    }
} 