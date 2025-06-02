//
//  UserManagementPanel.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Admin panel for managing registered users with CRUD operations
//

import SwiftUI

struct UserManagementPanel: View {
    @StateObject private var authManager = AuthTokenManager.shared
    @Environment(\.dismiss) private var dismiss
    
    @State private var users: [UserManagementUser] = []
    @State private var isLoading = false
    @State private var showingAlert = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""
    @State private var selectedUser: UserManagementUser?
    @State private var showingDeleteConfirmation = false
    @State private var showingRoleChangeSheet = false
    @State private var searchText = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header Stats
                headerStatsSection
                
                // Search Bar
                searchSection
                
                // Users List
                if isLoading {
                    loadingView
                } else if filteredUsers.isEmpty {
                    emptyStateView
                } else {
                    usersList
                }
            }
            .navigationTitle("Kullanıcı Yönetimi")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Kapat") {
                        dismiss()
                    }
                    .foregroundColor(.accentColor)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Yenile") {
                        Task {
                            await loadUsers()
                        }
                    }
                    .foregroundColor(.accentColor)
                }
            }
        }
        .onAppear {
            Task {
                await loadUsers()
            }
        }
        .alert(alertTitle, isPresented: $showingAlert) {
            Button("Tamam", role: .cancel) { }
        } message: {
            Text(alertMessage)
        }
        .confirmationDialog(
            "Kullanıcıyı Sil",
            isPresented: $showingDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Sil", role: .destructive) {
                if let user = selectedUser {
                    Task {
                        await deleteUser(user)
                    }
                }
            }
            Button("İptal", role: .cancel) {
                selectedUser = nil
            }
        } message: {
            if let user = selectedUser {
                Text("'\(user.username)' kullanıcısını kalıcı olarak silmek istediğinizden emin misiniz?")
            }
        }
        .sheet(isPresented: $showingRoleChangeSheet) {
            if let user = selectedUser {
                RoleChangeSheet(user: user) { newRole in
                    Task {
                        await changeUserRole(user, to: newRole)
                    }
                }
            }
        }
    }
    
    // MARK: - Header Stats Section
    private var headerStatsSection: some View {
        VStack(spacing: 16) {
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                StatCard(
                    title: "Toplam",
                    value: "\(users.count)",
                    icon: "person.3.fill",
                    color: .blue
                )
                
                StatCard(
                    title: "Admin",
                    value: "\(users.filter { $0.role == "admin" }.count)",
                    icon: "crown.fill",
                    color: .red
                )
                
                StatCard(
                    title: "Editor",
                    value: "\(users.filter { $0.role == "editor" }.count)",
                    icon: "pencil.circle.fill",
                    color: .green
                )
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 16)
    }
    
    // MARK: - Search Section
    private var searchSection: some View {
        VStack(spacing: 0) {
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)
                
                TextField("Kullanıcı ara...", text: $searchText)
                    .textInputAutocapitalization(.never)
                
                if !searchText.isEmpty {
                    Button("Temizle") {
                        searchText = ""
                    }
                    .font(.caption)
                    .foregroundColor(.accentColor)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal, 20)
            
            Divider()
                .padding(.top, 16)
        }
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.2)
            
            Text("Kullanıcılar yükleniyor...")
                .font(.callout)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - Empty State View
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: searchText.isEmpty ? "person.3.sequence" : "magnifyingglass")
                .font(.system(size: 50))
                .foregroundColor(.secondary)
            
            Text(searchText.isEmpty ? "Henüz kullanıcı yok" : "Kullanıcı bulunamadı")
                .font(.title3)
                .fontWeight(.medium)
            
            Text(searchText.isEmpty ? 
                 "Kullanıcı kayıt ekranından yeni kullanıcılar ekleyebilirsiniz." :
                 "'\(searchText)' için sonuç bulunamadı.")
                .font(.callout)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    // MARK: - Users List
    private var usersList: some View {
        List {
            ForEach(filteredUsers, id: \.username) { user in
                UserRow(user: user) { action in
                    selectedUser = user
                    switch action {
                    case .changeRole:
                        showingRoleChangeSheet = true
                    case .delete:
                        showingDeleteConfirmation = true
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }
    
    // MARK: - Computed Properties
    private var filteredUsers: [UserManagementUser] {
        if searchText.isEmpty {
            return users.sorted { $0.username < $1.username }
        } else {
            return users.filter { user in
                user.username.localizedCaseInsensitiveContains(searchText) ||
                user.role.localizedCaseInsensitiveContains(searchText)
            }.sorted { $0.username < $1.username }
        }
    }
    
    // MARK: - Actions
    @MainActor
    private func loadUsers() async {
        isLoading = true
        
        do {
            // Call backend API to get all users
            guard let url = URL(string: "https://celal-site.pages.dev/api/users") else {
                throw UserManagementError.invalidURL
            }
            
            let (data, response) = try await authManager.makeAuthenticatedRequest(to: url)
            
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 200:
                    let userResponse = try JSONDecoder().decode(UsersResponse.self, from: data)
                    self.users = userResponse.users
                    print("✅ Loaded \(users.count) users")
                    
                case 403:
                    throw UserManagementError.forbidden
                    
                default:
                    throw UserManagementError.serverError(httpResponse.statusCode)
                }
            }
            
        } catch {
            if let managementError = error as? UserManagementError {
                showAlert(title: "Hata", message: managementError.localizedDescription)
            } else {
                showAlert(title: "Hata", message: "Kullanıcılar yüklenemedi: \(error.localizedDescription)")
            }
            
            // Load mock data for development
            loadMockUsers()
        }
        
        isLoading = false
    }
    
    @MainActor
    private func deleteUser(_ user: UserManagementUser) async {
        do {
            guard let url = URL(string: "https://celal-site.pages.dev/api/users/\(user.username)") else {
                throw UserManagementError.invalidURL
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "DELETE"
            
            let (_, response) = try await authManager.makeAuthenticatedRequest(to: url)
            
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 200:
                    users.removeAll { $0.username == user.username }
                    showAlert(title: "Başarılı", message: "Kullanıcı '\(user.username)' silindi.")
                    
                case 403:
                    showAlert(title: "Yetkisiz", message: "Bu işlem için yetkiniz yok.")
                    
                case 404:
                    showAlert(title: "Hata", message: "Kullanıcı bulunamadı.")
                    
                default:
                    showAlert(title: "Hata", message: "Kullanıcı silinemedi. Kod: \(httpResponse.statusCode)")
                }
            }
            
        } catch {
            showAlert(title: "Hata", message: "Kullanıcı silinemedi: \(error.localizedDescription)")
        }
        
        selectedUser = nil
    }
    
    @MainActor
    private func changeUserRole(_ user: UserManagementUser, to newRole: String) async {
        do {
            guard let url = URL(string: "https://celal-site.pages.dev/api/users/\(user.username)/role") else {
                throw UserManagementError.invalidURL
            }
            
            let roleData = ["role": newRole]
            
            var request = URLRequest(url: url)
            request.httpMethod = "PUT"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: roleData)
            
            let (_, response) = try await authManager.makeAuthenticatedRequest(to: url)
            
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 200:
                    // Update local user data
                    if let index = users.firstIndex(where: { $0.username == user.username }) {
                        users[index].role = newRole
                    }
                    showAlert(title: "Başarılı", message: "Kullanıcı '\(user.username)' rolü '\(newRole)' olarak değiştirildi.")
                    
                case 403:
                    showAlert(title: "Yetkisiz", message: "Bu işlem için yetkiniz yok.")
                    
                case 404:
                    showAlert(title: "Hata", message: "Kullanıcı bulunamadı.")
                    
                default:
                    showAlert(title: "Hata", message: "Rol değiştirilemedi. Kod: \(httpResponse.statusCode)")
                }
            }
            
        } catch {
            showAlert(title: "Hata", message: "Rol değiştirilemedi: \(error.localizedDescription)")
        }
        
        selectedUser = nil
        showingRoleChangeSheet = false
    }
    
    private func loadMockUsers() {
        // Mock data for development/testing
        users = [
            UserManagementUser(username: "admin", role: "admin", createdAt: Date().timeIntervalSince1970),
            UserManagementUser(username: "editor1", role: "editor", createdAt: Date().addingTimeInterval(-86400).timeIntervalSince1970),
            UserManagementUser(username: "editor2", role: "editor", createdAt: Date().addingTimeInterval(-172800).timeIntervalSince1970),
            UserManagementUser(username: "testuser", role: "editor", createdAt: Date().addingTimeInterval(-259200).timeIntervalSince1970)
        ]
    }
    
    private func showAlert(title: String, message: String) {
        alertTitle = title
        alertMessage = message
        showingAlert = true
    }
}

// MARK: - Supporting Views

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(color)
            
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

struct UserRow: View {
    let user: UserManagementUser
    let onAction: (UserAction) -> Void
    
    enum UserAction {
        case changeRole
        case delete
    }
    
    var body: some View {
        VStack(spacing: 12) {
            // User Info
            HStack(spacing: 12) {
                // Avatar
                ZStack {
                    Circle()
                        .fill(user.role == "admin" ? .red.opacity(0.1) : .blue.opacity(0.1))
                        .frame(width: 44, height: 44)
                    
                    Image(systemName: user.role == "admin" ? "crown.fill" : "pencil.circle.fill")
                        .font(.system(size: 20))
                        .foregroundColor(user.role == "admin" ? .red : .blue)
                }
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(user.username)
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    HStack {
                        Text(user.role.capitalized)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        Text(user.createdDate)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
            }
            
            // Action Buttons
            HStack(spacing: 12) {
                Button("Rol Değiştir") {
                    onAction(.changeRole)
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
                
                Button("Sil") {
                    onAction(.delete)
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
                .tint(.red)
            }
        }
        .padding(.vertical, 8)
    }
}

struct RoleChangeSheet: View {
    let user: UserManagementUser
    let onRoleChange: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedRole: String
    
    init(user: UserManagementUser, onRoleChange: @escaping (String) -> Void) {
        self.user = user
        self.onRoleChange = onRoleChange
        self._selectedRole = State(initialValue: user.role)
    }
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                // User Info
                VStack(spacing: 12) {
                    Image(systemName: "person.crop.circle")
                        .font(.system(size: 50))
                        .foregroundColor(.accentColor)
                    
                    Text(user.username)
                        .font(.title2)
                        .fontWeight(.semibold)
                    
                    Text("Mevcut rol: \(user.role.capitalized)")
                        .font(.callout)
                        .foregroundColor(.secondary)
                }
                
                // Role Selection
                VStack(alignment: .leading, spacing: 16) {
                    Text("Yeni Rol Seçin")
                        .font(.headline)
                    
                    VStack(spacing: 8) {
                        RoleOption(
                            title: "Editor",
                            description: "Proje ve blog yönetimi",
                            icon: "pencil.circle.fill",
                            color: .blue,
                            isSelected: selectedRole == "editor"
                        ) {
                            selectedRole = "editor"
                        }
                        
                        RoleOption(
                            title: "Admin",
                            description: "Tam yetki ve kullanıcı yönetimi",
                            icon: "crown.fill",
                            color: .red,
                            isSelected: selectedRole == "admin"
                        ) {
                            selectedRole = "admin"
                        }
                    }
                }
                
                Spacer()
                
                // Action Buttons
                VStack(spacing: 12) {
                    Button("Rolü Değiştir") {
                        onRoleChange(selectedRole)
                        dismiss()
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(selectedRole == user.role)
                    
                    Button("İptal") {
                        dismiss()
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding(24)
            .navigationTitle("Rol Değiştir")
            .navigationBarTitleDisplayMode(.inline)
        }
        .presentationDetents([.medium, .large])
    }
}

struct RoleOption: View {
    let title: String
    let description: String
    let icon: String
    let color: Color
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 20))
                    .foregroundColor(color)
                    .frame(width: 24)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.callout)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                    
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20))
                    .foregroundColor(isSelected ? .accentColor : .gray)
            }
            .padding(12)
            .background(
                isSelected ? Color.accentColor.opacity(0.1) : Color.clear,
                in: RoundedRectangle(cornerRadius: 8)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? Color.accentColor : Color.gray.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Supporting Types

struct UserManagementUser: Codable {
    let username: String
    var role: String
    let createdAt: Double
    
    var createdDate: String {
        let date = Date(timeIntervalSince1970: createdAt)
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
}

struct UsersResponse: Codable {
    let users: [UserManagementUser]
}

enum UserManagementError: Error {
    case invalidURL
    case forbidden
    case serverError(Int)
    case networkError(String)
    
    var localizedDescription: String {
        switch self {
        case .invalidURL:
            return "Geçersiz URL"
        case .forbidden:
            return "Bu işlem için yetkiniz yok"
        case .serverError(let code):
            return "Sunucu hatası: \(code)"
        case .networkError(let description):
            return "Bağlantı hatası: \(description)"
        }
    }
}

// MARK: - Previews

#Preview("User Management") {
    UserManagementPanel()
}

#Preview("Role Change Sheet") {
    RoleChangeSheet(
        user: UserManagementUser(username: "testuser", role: "editor", createdAt: Date().timeIntervalSince1970)
    ) { _ in }
} 