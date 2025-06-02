//
//  DeleteProjectButton.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Reusable component for deleting projects via API
//

import SwiftUI

struct DeleteProjectButton: View {
    let projectID: String
    let apiKey: String
    let onDeleteSuccess: () -> Void
    
    // UI State
    @State private var showingDeleteConfirmation = false
    @State private var isDeleting = false
    @State private var showingAlert = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""
    @State private var isSuccess = false
    
    var body: some View {
        Button(action: showDeleteConfirmation) {
            HStack(spacing: 6) {
                if isDeleting {
                    ProgressView()
                        .scaleEffect(0.8)
                        .tint(.red)
                } else {
                    Image(systemName: "trash.fill")
                        .font(.system(size: 14, weight: .medium))
                }
                
                Text("Sil")
                    .font(.system(.callout, design: .default, weight: .semibold))
            }
            .foregroundStyle(.red)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8))
        }
        .disabled(isDeleting || apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        .opacity(apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 0.5 : 1.0)
        .confirmationDialog(
            "Projeyi Sil",
            isPresented: $showingDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Sil", role: .destructive) {
                deleteProject()
            }
            
            Button("İptal", role: .cancel) {
                // Do nothing
            }
        } message: {
            Text("Bu projeyi kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.")
        }
        .alert(alertTitle, isPresented: $showingAlert) {
            Button("Tamam") {
                if isSuccess {
                    onDeleteSuccess()
                }
            }
        } message: {
            Text(alertMessage)
        }
    }
    
    // MARK: - Actions
    
    private func showDeleteConfirmation() {
        showingDeleteConfirmation = true
    }
    
    private func deleteProject() {
        Task {
            await performDeleteProject()
        }
    }
    
    @MainActor
    private func performDeleteProject() async {
        isDeleting = true
        
        do {
            // Create URL and request
            guard let url = URL(string: "https://celal-site.pages.dev/api/projects/\(projectID)") else {
                throw DeleteAPIError.invalidURL
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "DELETE"
            request.setValue(apiKey.trimmingCharacters(in: .whitespacesAndNewlines), forHTTPHeaderField: "X-API-Key")
            
            // Perform request
            let (responseData, response) = try await URLSession.shared.data(for: request)
            
            // Handle response
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 200:
                    // Success
                    let responseObj = try JSONDecoder().decode(DeleteProjectResponse.self, from: responseData)
                    
                    isSuccess = true
                    alertTitle = "✅ Silindi"
                    alertMessage = "Proje başarıyla silindi!"
                    showingAlert = true
                    
                    print("✅ Project deleted successfully: \(responseObj.message)")
                    
                case 400:
                    // Bad request
                    if let errorResponse = try? JSONDecoder().decode(DeleteAPIErrorResponse.self, from: responseData) {
                        throw DeleteAPIError.badRequest(errorResponse.message)
                    } else {
                        throw DeleteAPIError.badRequest("Geçersiz istek")
                    }
                    
                case 401:
                    // Unauthorized
                    throw DeleteAPIError.unauthorized
                    
                case 404:
                    // Not found
                    throw DeleteAPIError.notFound("Bu ID ile proje bulunamadı")
                    
                default:
                    // Other errors
                    if let errorResponse = try? JSONDecoder().decode(DeleteAPIErrorResponse.self, from: responseData) {
                        throw DeleteAPIError.serverError(errorResponse.message)
                    } else {
                        throw DeleteAPIError.serverError("Bilinmeyen sunucu hatası")
                    }
                }
            } else {
                throw DeleteAPIError.networkError
            }
            
        } catch {
            // Handle errors
            isSuccess = false
            alertTitle = "❌ Hata"
            
            if let apiError = error as? DeleteAPIError {
                alertMessage = apiError.localizedDescription
            } else {
                alertMessage = "Beklenmeyen bir hata oluştu: \(error.localizedDescription)"
            }
            
            showingAlert = true
            print("❌ Error deleting project: \(error)")
        }
        
        isDeleting = false
    }
}

// MARK: - Data Models

struct DeleteProjectResponse: Codable {
    let success: Bool
    let message: String
    let deletedProject: DeletedProjectData?
    let totalProjects: Int
}

struct DeletedProjectData: Codable {
    let id: String
    let title: String
    let description: String
    let status: String
    let tech: [String]
    let featured: Bool
    let github: String
    let live: String
}

struct DeleteAPIErrorResponse: Codable {
    let error: String
    let message: String
}

// MARK: - Error Handling

enum DeleteAPIError: LocalizedError {
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

#Preview("Delete Project Button") {
    VStack(spacing: 20) {
        DeleteProjectButton(
            projectID: "sample-project-001",
            apiKey: "sample-api-key"
        ) {
            print("Project deleted successfully!")
        }
        
        DeleteProjectButton(
            projectID: "sample-project-002",
            apiKey: "" // Empty API key to test disabled state
        ) {
            print("Project deleted successfully!")
        }
    }
    .padding()
    .background(.regularMaterial)
} 