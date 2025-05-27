//
//  AddProjectView.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Admin view for adding new projects via API
//

import SwiftUI

struct AddProjectView: View {
    @Environment(\.dismiss) private var dismiss
    
    // API Configuration
    @State private var apiKey: String = ""
    
    // Project Fields
    @State private var title: String = ""
    @State private var description: String = ""
    @State private var status: String = "Devam Ediyor"
    @State private var tech: String = ""
    @State private var github: String = ""
    @State private var live: String = ""
    
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
                    
                } header: {
                    Text("Proje Bilgileri")
                } footer: {
                    Text("Proje hakkında temel bilgileri girin")
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
                
                // Submit Section
                Section {
                    Button(action: addProject) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .scaleEffect(0.8)
                                    .tint(.white)
                            } else {
                                Image(systemName: "plus.circle.fill")
                            }
                            
                            Text("Projeyi Ekle")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .foregroundStyle(.white)
                    }
                    .buttonStyle(.plain)
                    .frame(height: 50)
                    .background(
                        isFormValid ? .blue : .secondary,
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
            .navigationTitle("Yeni Proje Ekle")
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
        }
    }
    
    // MARK: - Validation
    
    private var isFormValid: Bool {
        !apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !tech.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    // MARK: - API Request
    
    private func addProject() {
        Task {
            await performAddProject()
        }
    }
    
    @MainActor
    private func performAddProject() async {
        isLoading = true
        
        do {
            // Prepare project data
            let projectData = ProjectCreateRequest(
                id: UUID().uuidString,
                title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                description: description.trimmingCharacters(in: .whitespacesAndNewlines),
                status: status,
                tech: parseTechStack(tech),
                featured: false,
                github: github.trimmingCharacters(in: .whitespacesAndNewlines),
                live: live.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            
            // Create URL and request
            guard let url = URL(string: "https://celal-site.pages.dev/api/projects") else {
                throw APIError.invalidURL
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue(apiKey.trimmingCharacters(in: .whitespacesAndNewlines), forHTTPHeaderField: "X-API-Key")
            
            // Encode project data
            let encoder = JSONEncoder()
            request.httpBody = try encoder.encode(projectData)
            
            // Perform request
            let (responseData, response) = try await URLSession.shared.data(for: request)
            
            // Handle response
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 201:
                    // Success
                    let responseObj = try JSONDecoder().decode(ProjectCreateResponse.self, from: responseData)
                    
                    isSuccess = true
                    alertTitle = "✅ Başarılı"
                    alertMessage = "Proje '\(projectData.title)' başarıyla eklendi!"
                    showingAlert = true
                    
                    print("✅ Project added successfully: \(responseObj.message)")
                    
                case 400:
                    // Bad request
                    if let errorResponse = try? JSONDecoder().decode(APIErrorResponse.self, from: responseData) {
                        throw APIError.badRequest(errorResponse.message)
                    } else {
                        throw APIError.badRequest("Geçersiz veri formatı")
                    }
                    
                case 401:
                    // Unauthorized
                    throw APIError.unauthorized
                    
                case 409:
                    // Conflict (duplicate ID)
                    throw APIError.conflict("Bu ID ile bir proje zaten mevcut")
                    
                default:
                    // Other errors
                    if let errorResponse = try? JSONDecoder().decode(APIErrorResponse.self, from: responseData) {
                        throw APIError.serverError(errorResponse.message)
                    } else {
                        throw APIError.serverError("Bilinmeyen sunucu hatası")
                    }
                }
            } else {
                throw APIError.networkError
            }
            
        } catch {
            // Handle errors
            isSuccess = false
            alertTitle = "❌ Hata"
            
            if let apiError = error as? APIError {
                alertMessage = apiError.localizedDescription
            } else {
                alertMessage = "Beklenmeyen bir hata oluştu: \(error.localizedDescription)"
            }
            
            showingAlert = true
            print("❌ Error adding project: \(error)")
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

struct ProjectCreateRequest: Codable {
    let id: String
    let title: String
    let description: String
    let status: String
    let tech: [String]
    let featured: Bool
    let github: String
    let live: String
}

struct ProjectCreateResponse: Codable {
    let success: Bool
    let message: String
    let project: ProjectData?
    let totalProjects: Int
}

struct ProjectData: Codable {
    let id: String
    let title: String
    let description: String
    let status: String
    let tech: [String]
    let featured: Bool
    let github: String
    let live: String
}

struct APIErrorResponse: Codable {
    let error: String
    let message: String
}

// MARK: - Error Handling

enum APIError: LocalizedError {
    case invalidURL
    case networkError
    case unauthorized
    case badRequest(String)
    case conflict(String)
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
        case .conflict(let message):
            return "Çakışma: \(message)"
        case .serverError(let message):
            return "Sunucu hatası: \(message)"
        }
    }
}

// MARK: - Preview

#Preview("Add Project View") {
    AddProjectView()
} 