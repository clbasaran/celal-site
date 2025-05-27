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
    
    var body: some View {
        NavigationView {
            if isAuthenticated {
                adminDashboard
            } else {
                loginView
            }
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
                        Image(systemName: "key.fill")
                        Text("Giriş Yap")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 12))
                    .foregroundColor(.white)
                    .font(.system(.headline, design: .default, weight: .semibold))
                }
                .disabled(username.isEmpty || password.isEmpty)
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
                    SectionHeader(title: "İçerik Yönetimi")
                    
                    VStack(spacing: 12) {
                        AdminMenuItem(
                            title: "Proje Yönetimi",
                            subtitle: "Projeleri düzenle, ekle, sil",
                            icon: "folder.badge.gearshape",
                            color: .blue
                        )
                        
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
                    SectionHeader(title: "Hesap")
                    
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
    }
    
    // MARK: - Actions
    private func authenticateUser() {
        // Simple demo authentication
        if username.lowercased() == "admin" && password == "admin123" {
            withAnimation(.easeInOut(duration: 0.3)) {
                isAuthenticated = true
            }
        } else {
            showingAlert = true
        }
        
        // Clear password for security
        password = ""
    }
    
    private func logout() {
        withAnimation(.easeInOut(duration: 0.3)) {
            isAuthenticated = false
            username = ""
            password = ""
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

struct SectionHeader: View {
    let title: String
    
    var body: some View {
        HStack {
            Text(title)
                .font(.system(.title3, design: .default, weight: .semibold))
            Spacer()
        }
    }
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