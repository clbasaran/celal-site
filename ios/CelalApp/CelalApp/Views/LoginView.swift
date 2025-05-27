//
//  LoginView.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Modern JWT-based authentication view with role-based navigation
//

import SwiftUI

struct LoginView: View {
    @StateObject private var authManager = AuthTokenManager.shared
    @StateObject private var sessionManager = UserSessionManager.shared
    
    @State private var email = ""
    @State private var password = ""
    @State private var isPasswordVisible = false
    @State private var isLoggingIn = false
    @State private var showingAlert = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""
    @State private var showingRegistration = false
    @State private var navigateToAdmin = false
    @State private var navigateToUserHome = false
    
    // Validation states
    @State private var emailError: String?
    @State private var passwordError: String?
    
    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                ScrollView {
                    VStack(spacing: 0) {
                        // Header Section
                        headerSection
                            .frame(height: geometry.size.height * 0.35)
                        
                        // Login Form Section
                        loginFormSection
                            .padding(.horizontal, 24)
                        
                        Spacer(minLength: 40)
                        
                        // Footer Section
                        footerSection
                            .padding(.horizontal, 24)
                            .padding(.bottom, 40)
                    }
                }
                .background(
                    LinearGradient(
                        colors: [
                            Color.accentColor.opacity(0.1),
                            Color.clear,
                            Color.secondary.opacity(0.05)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
            }
            .navigationBarHidden(true)
        }
        .sheet(isPresented: $showingRegistration) {
            UserRegistrationView()
        }
        .alert(alertTitle, isPresented: $showingAlert) {
            Button("Tamam", role: .cancel) { }
        } message: {
            Text(alertMessage)
        }
        .onChange(of: email) {
            validateEmail()
        }
        .onChange(of: password) {
            validatePassword()
        }
        // Navigation destinations
        .navigationDestination(isPresented: $navigateToAdmin) {
            AdminDashboardView()
        }
        .navigationDestination(isPresented: $navigateToUserHome) {
            UserHomeView()
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 24) {
            Spacer()
            
            // Logo and branding
            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 100, height: 100)
                        .shadow(color: .black.opacity(0.1), radius: 20, x: 0, y: 10)
                    
                    Image(systemName: "person.crop.circle.fill")
                        .font(.system(size: 50))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.accentColor, .accentColor.opacity(0.7)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                }
                
                VStack(spacing: 8) {
                    Text("Hoş Geldiniz")
                        .font(.system(.largeTitle, design: .rounded, weight: .bold))
                        .foregroundColor(.primary)
                    
                    Text("Hesabınıza giriş yapın")
                        .font(.system(.title3, design: .default, weight: .medium))
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
    }
    
    // MARK: - Login Form Section
    private var loginFormSection: some View {
        VStack(spacing: 24) {
            // Form container
            VStack(spacing: 20) {
                // Email Field
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "envelope.fill")
                            .foregroundColor(.accentColor)
                            .frame(width: 20)
                        
                        Text("E-posta")
                            .font(.system(.callout, design: .default, weight: .semibold))
                            .foregroundColor(.primary)
                    }
                    
                    TextField("ornek@email.com", text: $email)
                        .textFieldStyle(CustomTextFieldStyle(
                            isValid: emailError == nil && !email.isEmpty,
                            hasError: emailError != nil
                        ))
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .autocorrectionDisabled()
                    
                    if let emailError = emailError {
                        Label(emailError, systemImage: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
                
                // Password Field
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: "lock.fill")
                            .foregroundColor(.accentColor)
                            .frame(width: 20)
                        
                        Text("Şifre")
                            .font(.system(.callout, design: .default, weight: .semibold))
                            .foregroundColor(.primary)
                    }
                    
                    HStack {
                        Group {
                            if isPasswordVisible {
                                TextField("Şifrenizi girin", text: $password)
                            } else {
                                SecureField("Şifrenizi girin", text: $password)
                            }
                        }
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        
                        Button(action: { 
                            withAnimation(.easeInOut(duration: 0.2)) {
                                isPasswordVisible.toggle() 
                            }
                        }) {
                            Image(systemName: isPasswordVisible ? "eye.slash.fill" : "eye.fill")
                                .foregroundColor(.secondary)
                        }
                    }
                    .textFieldStyle(CustomTextFieldStyle(
                        isValid: passwordError == nil && !password.isEmpty,
                        hasError: passwordError != nil
                    ))
                    
                    if let passwordError = passwordError {
                        Label(passwordError, systemImage: "exclamationmark.triangle.fill")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
            }
            .padding(24)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
            .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
            
            // Login Button
            Button(action: performLogin) {
                HStack(spacing: 12) {
                    if isLoggingIn {
                        ProgressView()
                            .scaleEffect(0.9)
                            .tint(.white)
                    } else {
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.title3)
                    }
                    
                    Text(isLoggingIn ? "Giriş yapılıyor..." : "Giriş Yap")
                        .font(.system(.headline, design: .default, weight: .semibold))
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background {
                    if isFormValid && !isLoggingIn {
                        LinearGradient(
                            colors: [.accentColor, .accentColor.opacity(0.8)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    } else {
                        Color.gray.opacity(0.3)
                    }
                }
                .foregroundStyle(isFormValid && !isLoggingIn ? .white : .gray)
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .shadow(
                    color: isFormValid ? .accentColor.opacity(0.3) : .clear,
                    radius: 8,
                    x: 0,
                    y: 4
                )
                .scaleEffect(isLoggingIn ? 0.98 : 1.0)
                .animation(.easeInOut(duration: 0.1), value: isLoggingIn)
            }
            .disabled(!isFormValid || isLoggingIn)
        }
    }
    
    // MARK: - Footer Section
    private var footerSection: some View {
        VStack(spacing: 16) {
            // Forgot password link
            Button("Şifremi Unuttum") {
                // TODO: Implement forgot password
                showAlert(title: "Şifre Sıfırlama", message: "Bu özellik yakında eklenecek.")
            }
            .font(.system(.callout, design: .default, weight: .medium))
            .foregroundColor(.accentColor)
            
            // Divider
            HStack {
                Rectangle()
                    .fill(.tertiary)
                    .frame(height: 1)
                
                Text("veya")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 16)
                
                Rectangle()
                    .fill(.tertiary)
                    .frame(height: 1)
            }
            
            // Registration button
            Button(action: { showingRegistration = true }) {
                VStack(spacing: 8) {
                    HStack(spacing: 8) {
                        Image(systemName: "person.badge.plus")
                        Text("Hesap Oluştur")
                            .font(.system(.callout, design: .default, weight: .semibold))
                    }
                    
                    Text("Henüz hesabınız yok mu?")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                .foregroundColor(.accentColor)
            }
            
            // App version info
            Text("CelalSite v1.0")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
    }
    
    // MARK: - Computed Properties
    private var isFormValid: Bool {
        return emailError == nil && 
               passwordError == nil && 
               !email.isEmpty && 
               !password.isEmpty
    }
    
    // MARK: - Validation Methods
    private func validateEmail() {
        if email.isEmpty {
            emailError = nil
            return
        }
        
        let emailRegex = #"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"#
        let emailTest = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        
        if !emailTest.evaluate(with: email) {
            emailError = "Geçerli bir e-posta adresi girin"
        } else {
            emailError = nil
        }
    }
    
    private func validatePassword() {
        if password.isEmpty {
            passwordError = nil
            return
        }
        
        if password.count < 6 {
            passwordError = "Şifre en az 6 karakter olmalı"
        } else {
            passwordError = nil
        }
    }
    
    // MARK: - Actions
    private func performLogin() {
        // Validate before proceeding
        validateEmail()
        validatePassword()
        
        guard isFormValid else { return }
        
        Task {
            await loginUser()
        }
    }
    
    @MainActor
    private func loginUser() async {
        isLoggingIn = true
        
        let result = await authManager.loginUser(
            email: email.trimmingCharacters(in: .whitespacesAndNewlines),
            password: password
        )
        
        switch result {
        case .success(let loginResponse):
            // Store token in session manager
            sessionManager.setUserSession(
                token: loginResponse.accessToken,
                refreshToken: loginResponse.refreshToken,
                user: loginResponse.user
            )
            
            // Navigate based on role
            handleSuccessfulLogin(role: loginResponse.user.role)
            
        case .failure(let error):
            handleLoginError(error)
        }
        
        isLoggingIn = false
    }
    
    private func handleSuccessfulLogin(role: UserRole) {
        withAnimation(.easeInOut(duration: 0.3)) {
            switch role {
            case .admin:
                navigateToAdmin = true
            case .editor:
                navigateToUserHome = true
            }
        }
        
        // Clear form
        email = ""
        password = ""
    }
    
    private func handleLoginError(_ error: LoginError) {
        switch error {
        case .invalidCredentials:
            showAlert(
                title: "Giriş Başarısız",
                message: "E-posta veya şifre hatalı. Lütfen tekrar deneyin."
            )
            
        case .networkError(let description):
            showAlert(
                title: "Bağlantı Hatası",
                message: "İnternet bağlantınızı kontrol edin.\n\nHata: \(description)"
            )
            
        case .serverError(let statusCode):
            showAlert(
                title: "Sunucu Hatası",
                message: "Geçici bir hata oluştu. Lütfen daha sonra tekrar deneyin.\n\nKod: \(statusCode)"
            )
            
        case .invalidResponse:
            showAlert(
                title: "Beklenmeyen Hata",
                message: "Sunucudan geçersiz bir yanıt alındı. Lütfen tekrar deneyin."
            )
        }
    }
    
    private func showAlert(title: String, message: String) {
        alertTitle = title
        alertMessage = message
        showingAlert = true
    }
}

// MARK: - Supporting Views

struct CustomTextFieldStyle: TextFieldStyle {
    let isValid: Bool
    let hasError: Bool
    
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(
                        hasError ? .red : (isValid ? .green : .clear),
                        lineWidth: hasError || isValid ? 1.5 : 0
                    )
            )
            .animation(.easeInOut(duration: 0.2), value: isValid)
            .animation(.easeInOut(duration: 0.2), value: hasError)
    }
}

// MARK: - Supporting Types

enum UserRole: String, CaseIterable {
    case admin = "admin"
    case editor = "editor"
    
    var displayName: String {
        switch self {
        case .admin:
            return "Admin"
        case .editor:
            return "Editor"
        }
    }
}

enum LoginError: Error {
    case invalidCredentials
    case networkError(String)
    case serverError(Int)
    case invalidResponse
    
    var localizedDescription: String {
        switch self {
        case .invalidCredentials:
            return "Invalid email or password"
        case .networkError(let description):
            return "Network error: \(description)"
        case .serverError(let code):
            return "Server error: \(code)"
        case .invalidResponse:
            return "Invalid response from server"
        }
    }
}

struct LoginResponse {
    let accessToken: String
    let refreshToken: String
    let user: User
}

struct User {
    let id: String
    let email: String
    let role: UserRole
    let username: String
}

// MARK: - User Session Manager (Mock)

class UserSessionManager: ObservableObject {
    static let shared = UserSessionManager()
    
    @Published var isLoggedIn = false
    @Published var currentUser: User?
    @Published var token: String?
    
    private init() {}
    
    func setUserSession(token: String, refreshToken: String, user: User) {
        self.token = token
        self.currentUser = user
        self.isLoggedIn = true
        
        // Store in secure storage (UserDefaults for demo)
        UserDefaults.standard.set(token, forKey: "access_token")
        UserDefaults.standard.set(refreshToken, forKey: "refresh_token")
        
        print("✅ User session set for: \(user.username) (\(user.role.rawValue))")
    }
    
    func clearSession() {
        self.token = nil
        self.currentUser = nil
        self.isLoggedIn = false
        
        UserDefaults.standard.removeObject(forKey: "access_token")
        UserDefaults.standard.removeObject(forKey: "refresh_token")
        
        print("✅ User session cleared")
    }
}

// MARK: - User Home View (Placeholder)

struct UserHomeView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "house.fill")
                .font(.system(size: 60))
                .foregroundColor(.accentColor)
            
            Text("Editor Dashboard")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Welcome to your editor workspace!")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .navigationTitle("Home")
        .navigationBarTitleDisplayMode(.large)
    }
}

// MARK: - AuthTokenManager Extension (Mock methods)

extension AuthTokenManager {
    func loginUser(email: String, password: String) async -> Result<LoginResponse, LoginError> {
        // Simulate network delay
        try? await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 seconds
        
        // Mock validation
        if email == "admin@celal.com" && password == "admin123" {
            let user = User(
                id: "1",
                email: email,
                role: .admin,
                username: "admin"
            )
            let response = LoginResponse(
                accessToken: "mock_access_token",
                refreshToken: "mock_refresh_token",
                user: user
            )
            return .success(response)
        } else if email == "editor@celal.com" && password == "editor123" {
            let user = User(
                id: "2",
                email: email,
                role: .editor,
                username: "editor"
            )
            let response = LoginResponse(
                accessToken: "mock_access_token",
                refreshToken: "mock_refresh_token",
                user: user
            )
            return .success(response)
        } else {
            return .failure(.invalidCredentials)
        }
    }
}

// MARK: - Previews

#Preview("Login View") {
    LoginView()
}

#Preview("User Home") {
    NavigationView {
        UserHomeView()
    }
} 