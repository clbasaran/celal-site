//
//  AdminDashboardView.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Admin dashboard with authentication and management features
//

import SwiftUI

struct AdminDashboardView: View {
    @State private var isAuthenticated = false
    @State private var username = ""
    @State private var password = ""
    @State private var showingAlert = false
    @State private var showingAddProject = false
    @State private var showingProjectList = false
    @State private var isLoggingIn = false
    @State private var jwtToken: String = ""
    @State private var currentUser: String = ""
    
    var body: some View {
        NavigationView {
            if isAuthenticated {
                adminDashboard
            } else {
                loginView
            }
        }
        .onAppear {
            checkStoredLogin()
        }
    }
    
    // MARK: - Login View
    private var loginView: some View {
        VStack(spacing: 32) {
            Spacer()
            
            // Logo Section
            VStack(spacing: 16) {
                Image(systemName: "lock.shield")
                    .font(.system(size: 64))
                    .foregroundColor(.accentColor)
                
                Text("Admin Girişi")
                    .font(.system(.largeTitle, design: .default, weight: .bold))
                
                Text("Site yönetimi için giriş yapın")
                    .font(.system(.callout, design: .default, weight: .regular))
                    .foregroundColor(.secondary)
            }
            
            // Login Form
            VStack(spacing: 20) {
                VStack(spacing: 12) {
                    TextField("Kullanıcı Adı", text: $username)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    
                    SecureField("Şifre", text: $password)
                        .textFieldStyle(.roundedBorder)
                }
                
                Button(action: authenticateUser) {
                    HStack {
                        if isLoggingIn {
                            ProgressView()
                                .scaleEffect(0.8)
                                .foregroundColor(.white)
                        } else {
                            Image(systemName: "key.fill")
                        }
                        Text(isLoggingIn ? "Giriş Yapılıyor..." : "Giriş Yap")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 12))
                    .foregroundColor(.white)
                    .font(.system(.headline, design: .default, weight: .semibold))
                }
                .disabled(username.isEmpty || password.isEmpty || isLoggingIn)
            }
            .padding(.horizontal, 32)
            
            Spacer()
            
            // Footer
            Text("CelalSite Admin v1.0")
                .font(.system(.caption, design: .default, weight: .regular))
                .foregroundStyle(.tertiary)
        }
        .navigationTitle("Admin")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Giriş Hatası", isPresented: $showingAlert) {
            Button("Tamam", role: .cancel) { }
        } message: {
            Text("Kullanıcı adı veya şifre hatalı")
        }
    }
    
    // MARK: - Admin Dashboard
    private var adminDashboard: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Welcome Header
                VStack(spacing: 8) {
                    Text("Hoş Geldiniz, Admin")
                        .font(.system(.title, design: .default, weight: .bold))
                    
                    Text("Site yönetim paneli")
                        .font(.system(.callout, design: .default, weight: .regular))
                        .foregroundColor(.secondary)
                }
                .padding(.top, 20)
                
                // Quick Stats
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 16) {
                    StatCard(title: "Projeler", value: "3", icon: "folder.fill", color: .blue)
                    StatCard(title: "Blog Yazıları", value: "12", icon: "doc.text.fill", color: .green)
                    StatCard(title: "Ziyaretçiler", value: "1.2K", icon: "person.3.fill", color: .orange)
                    StatCard(title: "Mesajlar", value: "5", icon: "envelope.fill", color: .purple)
                }
                
                // Management Sections
                VStack(spacing: 16) {
                    AdminSectionHeader(title: "İçerik Yönetimi")
                    
                    VStack(spacing: 12) {
                        Button(action: { showingAddProject = true }) {
                            AdminMenuItem(
                                title: "➕ Yeni Proje Ekle",
                                subtitle: "API ile yeni proje oluştur",
                                icon: "plus.square.fill",
                                color: .blue
                            )
                        }
                        .buttonStyle(.plain)
                        
                        Button(action: { showingProjectList = true }) {
                            AdminMenuItem(
                                title: "Proje Yönetimi",
                                subtitle: "Projeleri düzenle, ekle, sil",
                                icon: "folder.badge.gearshape",
                                color: .purple
                            )
                        }
                        .buttonStyle(.plain)
                        
                        AdminMenuItem(
                            title: "Blog Yönetimi",
                            subtitle: "Blog yazılarını yönet",
                            icon: "doc.text.badge.gearshape",
                            color: .green
                        )
                        
                        AdminMenuItem(
                            title: "Medya Galerisi",
                            subtitle: "Resim ve dosyaları yönet",
                            icon: "photo.stack",
                            color: .orange
                        )
                        
                        AdminMenuItem(
                            title: "Site Ayarları",
                            subtitle: "Genel ayarlar ve konfigürasyon",
                            icon: "gearshape.2",
                            color: .gray
                        )
                    }
                }
                
                // Logout Section
                VStack(spacing: 16) {
                    AdminSectionHeader(title: "Hesap")
                    
                    Button(action: logout) {
                        HStack {
                            Image(systemName: "arrow.right.square")
                            Text("Çıkış Yap")
                            Spacer()
                        }
                        .padding()
                        .background(.red.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                        .foregroundColor(.red)
                        .font(.system(.callout, design: .default, weight: .medium))
                    }
                }
                
                Spacer(minLength: 32)
            }
            .padding(.horizontal, 20)
        }
        .navigationTitle("Admin Panel")
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $showingAddProject) {
            AddProjectView()
        }
        .sheet(isPresented: $showingProjectList) {
            AdminProjectListView()
        }
    }
    
    // MARK: - Actions
    private func authenticateUser() {
        Task {
            await performLogin()
        }
    }
    
    @MainActor
    private func performLogin() async {
        isLoggingIn = true
        
        do {
            // Prepare login request
            guard let url = URL(string: "https://celal-site.pages.dev/api/login") else {
                throw LoginError.invalidURL
            }
            
            let loginData = [
                "username": username.trimmingCharacters(in: .whitespacesAndNewlines),
                "password": password
            ]
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: loginData)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 200:
                    // Parse success response
                    let loginResponse = try JSONDecoder().decode(LoginResponse.self, from: data)
                    
                    // Store JWT token and user info
                    jwtToken = loginResponse.token
                    currentUser = loginResponse.user.username
                    
                    // Save token to UserDefaults for persistence
                    UserDefaults.standard.set(jwtToken, forKey: "jwt_token")
                    UserDefaults.standard.set(currentUser, forKey: "current_user")
                    
                    withAnimation(.easeInOut(duration: 0.3)) {
                        isAuthenticated = true
                    }
                    
                    print("✅ Login successful for user: \(currentUser)")
                    
                case 401:
                    // Invalid credentials
                    showingAlert = true
                    print("❌ Invalid credentials")
                    
                default:
                    // Other errors
                    showingAlert = true
                    print("❌ Login failed with status: \(httpResponse.statusCode)")
                }
            }
            
        } catch {
            showingAlert = true
            print("❌ Login error: \(error)")
        }
        
        // Clear password for security
        password = ""
        isLoggingIn = false
    }
    
    private func logout() {
        // Clear stored credentials
        UserDefaults.standard.removeObject(forKey: "jwt_token")
        UserDefaults.standard.removeObject(forKey: "current_user")
        
        withAnimation(.easeInOut(duration: 0.3)) {
            isAuthenticated = false
            username = ""
            password = ""
            jwtToken = ""
            currentUser = ""
        }
    }
    
    private func checkStoredLogin() {
        if let storedToken = UserDefaults.standard.string(forKey: "jwt_token"),
           let storedUser = UserDefaults.standard.string(forKey: "current_user"),
           !storedToken.isEmpty {
            jwtToken = storedToken
            currentUser = storedUser
            isAuthenticated = true
        }
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
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
                Text(value)
                    .font(.system(.title2, design: .default, weight: .bold))
            }
            
            HStack {
                Text(title)
                    .font(.system(.caption, design: .default, weight: .medium))
                    .foregroundColor(.secondary)
                Spacer()
            }
        }
        .padding(16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

struct AdminMenuItem: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(color)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(.callout, design: .default, weight: .semibold))
                
                Text(subtitle)
                    .font(.system(.caption, design: .default, weight: .regular))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(.tertiary)
        }
        .padding(16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

struct AdminSectionHeader: View {
    let title: String
    
    var body: some View {
        HStack {
            Text(title)
                .font(.system(.title3, design: .default, weight: .semibold))
            Spacer()
        }
    }
}

// MARK: - Supporting Types

enum LoginError: Error {
    case invalidURL
    case invalidResponse
    case unauthorized
}

struct LoginResponse: Codable {
    let token: String
    let user: UserInfo
    let expiresIn: Int
}

struct UserInfo: Codable {
    let username: String
    let role: String
}

#Preview("Login") {
    AdminDashboardView()
}

#Preview("Dashboard") {
    AdminDashboardView()
        .onAppear {
            // For preview purposes, simulate being logged in
        }
} 