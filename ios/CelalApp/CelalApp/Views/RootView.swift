//
//  RootView.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.12.2024.
//  Role-based root navigation view that determines main interface based on user role
//

import SwiftUI

struct RootView: View {
    @EnvironmentObject private var sessionManager: UserSessionManager
    
    var body: some View {
        Group {
            if sessionManager.isAuthenticated, let user = sessionManager.currentUser {
                // Kullanıcı giriş yapmış, role'üne göre arayüz göster
                switch user.role {
                case .admin:
                    // Admin kullanıcıları için tam yönetim paneli
                    MainTabView()
                        .transition(.opacity.combined(with: .scale))
                        
                case .editor:
                    // Editor kullanıcıları için kısıtlı yönetim paneli
                    EditorDashboardView()
                        .transition(.opacity.combined(with: .scale))
                }
            } else {
                // Kullanıcı giriş yapmamış, login ekranını göster
                LoginView()
                    .transition(.move(edge: .bottom))
            }
        }
        .animation(.easeInOut(duration: 0.5), value: sessionManager.isAuthenticated)
        .animation(.easeInOut(duration: 0.3), value: sessionManager.currentUser?.role)
        .onAppear {
            // Uygulama açıldığında stored session'ı kontrol et
            sessionManager.loadStoredSession()
        }
    }
}

// MARK: - Editor Dashboard View (Placeholder)

struct EditorDashboardView: View {
    @EnvironmentObject private var sessionManager: UserSessionManager
    @State private var showingLogoutAlert = false
    @State private var showingProjectList = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header Section
                    VStack(spacing: 12) {
                        Image(systemName: "pencil.and.outline")
                            .font(.system(size: 64))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.accentColor, .accentColor.opacity(0.7)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                        
                        Text("Editor Dashboard")
                            .font(.system(.largeTitle, design: .rounded, weight: .bold))
                            .foregroundColor(.primary)
                        
                        if let user = sessionManager.currentUser {
                            Text("Hoş geldin, \(user.username)!")
                                .font(.system(.title2, design: .default, weight: .medium))
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding(.top, 40)
                    
                    // Quick Actions Section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Hızlı İşlemler")
                            .font(.system(.title2, design: .default, weight: .semibold))
                            .foregroundColor(.primary)
                        
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 16) {
                            EditorActionCard(
                                icon: "folder.badge.plus",
                                title: "Yeni Proje",
                                subtitle: "Proje oluştur",
                                color: .blue
                            ) {
                                // TODO: Navigate to add project
                            }
                            
                            EditorActionCard(
                                icon: "pencil.circle",
                                title: "Projelerimi Düzenle",
                                subtitle: "Mevcut projeler",
                                color: .green
                            ) {
                                showingProjectList = true
                            }
                            
                            EditorActionCard(
                                icon: "doc.text",
                                title: "Blog Yazısı",
                                subtitle: "Yeni yazı ekle",
                                color: .orange
                            ) {
                                // TODO: Navigate to blog editor
                            }
                            
                            EditorActionCard(
                                icon: "chart.bar",
                                title: "İstatistikler",
                                subtitle: "Performans görün",
                                color: .purple
                            ) {
                                // TODO: Navigate to analytics
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    
                    // Recent Activity Section
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Son Aktiviteler")
                            .font(.system(.title2, design: .default, weight: .semibold))
                            .foregroundColor(.primary)
                        
                        VStack(spacing: 12) {
                            ActivityRow(
                                icon: "doc.badge.plus",
                                title: "Yeni proje eklendi",
                                subtitle: "2 saat önce",
                                color: .blue
                            )
                            
                            ActivityRow(
                                icon: "pencil",
                                title: "Portfolio güncellemesi",
                                subtitle: "1 gün önce",
                                color: .green
                            )
                            
                            ActivityRow(
                                icon: "paperplane",
                                title: "Blog yazısı yayınlandı",
                                subtitle: "3 gün önce",
                                color: .orange
                            )
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
                    }
                    .padding(.horizontal, 20)
                    
                    Spacer(minLength: 20)
                }
            }
            .navigationTitle("CelalSite Editor")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingLogoutAlert = true }) {
                        Image(systemName: "power")
                            .foregroundColor(.red)
                    }
                }
            }
        }
        .alert("Çıkış Yap", isPresented: $showingLogoutAlert) {
            Button("İptal", role: .cancel) { }
            Button("Çıkış Yap", role: .destructive) {
                withAnimation(.easeInOut(duration: 0.3)) {
                    sessionManager.clearSession()
                }
            }
        } message: {
            Text("Hesabınızdan çıkmak istediğinizden emin misiniz?")
        }
        .sheet(isPresented: $showingProjectList) {
            EditorProjectListView()
                .environmentObject(sessionManager)
        }
    }
}

// MARK: - Supporting Views

struct EditorActionCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.system(size: 32))
                    .foregroundColor(color)
                
                VStack(spacing: 4) {
                    Text(title)
                        .font(.system(.callout, design: .default, weight: .semibold))
                        .foregroundColor(.primary)
                        .multilineTextAlignment(.center)
                    
                    Text(subtitle)
                        .font(.system(.caption, design: .default, weight: .regular))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)
            .padding(.horizontal, 12)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(color.opacity(0.2), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

struct ActivityRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(color)
                .frame(width: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(.callout, design: .default, weight: .medium))
                    .foregroundColor(.primary)
                
                Text(subtitle)
                    .font(.system(.caption, design: .default, weight: .regular))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
    }
}

// MARK: - Previews

#Preview("Root View - Admin") {
    RootView()
        .environmentObject({
            let manager = UserSessionManager.shared
            manager.setUserSession(
                token: "mock_token",
                refreshToken: "mock_refresh",
                user: User(
                    id: "1",
                    username: "admin",
                    email: "admin@celal.com",
                    role: .admin,
                    createdAt: "2024-01-01"
                )
            )
            return manager
        }())
}

#Preview("Root View - Editor") {
    RootView()
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

#Preview("Root View - Unauthenticated") {
    RootView()
        .environmentObject({
            let manager = UserSessionManager.shared
            manager.clearSession()
            return manager
        }())
} 