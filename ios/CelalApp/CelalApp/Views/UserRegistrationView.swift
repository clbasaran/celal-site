//
//  UserRegistrationView.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  User registration form with validation and role selection
//

import SwiftUI

struct UserRegistrationView: View {
    @StateObject private var authManager = AuthTokenManager.shared
    @Environment(\.dismiss) private var dismiss
    
    @State private var username = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var selectedRole: UserRole = .editor
    @State private var isRegistering = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var registrationSuccess = false
    
    enum UserRole: String, CaseIterable {
        case editor = "editor"
        case admin = "admin"
        
        var displayName: String {
            switch self {
            case .editor:
                return "Editor"
            case .admin:
                return "Admin"
            }
        }
        
        var description: String {
            switch self {
            case .editor:
                return "Proje ve blog yönetimi"
            case .admin:
                return "Tam yetki (sadece belirli kullanıcılar)"
            }
        }
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 32) {
                    // Header Section
                    VStack(spacing: 16) {
                        Image(systemName: "person.badge.plus")
                            .font(.system(size: 64))
                            .foregroundColor(.accentColor)
                        
                        Text("Hesap Oluştur")
                            .font(.system(.largeTitle, design: .default, weight: .bold))
                        
                        Text("Celal Site yönetimi için yeni hesap oluşturun")
                            .font(.system(.callout, design: .default, weight: .regular))
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 20)
                    
                    // Registration Form
                    VStack(spacing: 24) {
                        // Username Field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Kullanıcı Adı")
                                .font(.system(.callout, design: .default, weight: .semibold))
                                .foregroundColor(.primary)
                            
                            TextField("kullanici_adi", text: $username)
                                .textFieldStyle(.roundedBorder)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .onChange(of: username) { newValue in
                                    // Only allow alphanumeric and underscore
                                    username = newValue.filter { $0.isLetter || $0.isNumber || $0 == "_" }
                                }
                            
                            Text("3-20 karakter, sadece harf, rakam ve alt çizgi")
                                .font(.system(.caption, design: .default, weight: .regular))
                                .foregroundColor(.secondary)
                        }
                        
                        // Password Field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Şifre")
                                .font(.system(.callout, design: .default, weight: .semibold))
                                .foregroundColor(.primary)
                            
                            SecureField("Minimum 6 karakter", text: $password)
                                .textFieldStyle(.roundedBorder)
                            
                            // Password strength indicator
                            HStack {
                                Text("Şifre Gücü:")
                                    .font(.system(.caption, design: .default, weight: .regular))
                                    .foregroundColor(.secondary)
                                
                                Text(passwordStrength)
                                    .font(.system(.caption, design: .default, weight: .semibold))
                                    .foregroundColor(passwordStrengthColor)
                                
                                Spacer()
                            }
                        }
                        
                        // Confirm Password Field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Şifre Tekrar")
                                .font(.system(.callout, design: .default, weight: .semibold))
                                .foregroundColor(.primary)
                            
                            SecureField("Şifreyi tekrar girin", text: $confirmPassword)
                                .textFieldStyle(.roundedBorder)
                            
                            if !confirmPassword.isEmpty && password != confirmPassword {
                                Text("⚠️ Şifreler eşleşmiyor")
                                    .font(.system(.caption, design: .default, weight: .regular))
                                    .foregroundColor(.red)
                            }
                        }
                        
                        // Role Selection
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Kullanıcı Rolü")
                                .font(.system(.callout, design: .default, weight: .semibold))
                                .foregroundColor(.primary)
                            
                            VStack(spacing: 8) {
                                ForEach(UserRole.allCases, id: \.self) { role in
                                    RoleSelectionCard(
                                        role: role,
                                        isSelected: selectedRole == role,
                                        onTap: { selectedRole = role }
                                    )
                                }
                            }
                        }
                        
                        // Register Button
                        Button(action: registerUser) {
                            HStack {
                                if isRegistering {
                                    ProgressView()
                                        .scaleEffect(0.8)
                                        .foregroundColor(.white)
                                } else {
                                    Image(systemName: "person.badge.plus")
                                }
                                Text(isRegistering ? "Hesap Oluşturuluyor..." : "Hesap Oluştur")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                isFormValid ? Color.accentColor : Color.gray.opacity(0.3),
                                in: RoundedRectangle(cornerRadius: 12)
                            )
                            .foregroundColor(isFormValid ? .white : .gray)
                            .font(.system(.headline, design: .default, weight: .semibold))
                        }
                        .disabled(!isFormValid || isRegistering)
                        
                        // Login Link
                        Button("Zaten hesabınız var mı? Giriş yapın") {
                            dismiss()
                        }
                        .font(.system(.callout, design: .default, weight: .medium))
                        .foregroundColor(.accentColor)
                    }
                    .padding(.horizontal, 32)
                    
                    Spacer(minLength: 32)
                }
            }
            .navigationTitle("Kayıt Ol")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarBackButtonHidden()
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("İptal") {
                        dismiss()
                    }
                    .foregroundColor(.accentColor)
                }
            }
        }
        .alert("Hesap Oluşturma", isPresented: $showingAlert) {
            if registrationSuccess {
                Button("Giriş Yap") {
                    dismiss()
                }
            } else {
                Button("Tamam", role: .cancel) { }
            }
        } message: {
            Text(alertMessage)
        }
    }
    
    // MARK: - Computed Properties
    
    private var isFormValid: Bool {
        !username.isEmpty &&
        username.count >= 3 &&
        username.count <= 20 &&
        password.count >= 6 &&
        password == confirmPassword &&
        username.allSatisfy { $0.isLetter || $0.isNumber || $0 == "_" }
    }
    
    private var passwordStrength: String {
        if password.isEmpty {
            return "—"
        } else if password.count < 6 {
            return "Zayıf"
        } else if password.count < 8 {
            return "Orta"
        } else if password.count >= 8 && password.rangeOfCharacter(from: CharacterSet.decimalDigits) != nil {
            return "Güçlü"
        } else {
            return "Orta"
        }
    }
    
    private var passwordStrengthColor: Color {
        switch passwordStrength {
        case "Zayıf":
            return .red
        case "Orta":
            return .orange
        case "Güçlü":
            return .green
        default:
            return .gray
        }
    }
    
    // MARK: - Actions
    
    private func registerUser() {
        Task {
            await performRegistration()
        }
    }
    
    @MainActor
    private func performRegistration() async {
        isRegistering = true
        
        // Use AuthTokenManager for registration
        let result = await authManager.registerUser(
            username: username.trimmingCharacters(in: .whitespacesAndNewlines),
            password: password,
            role: selectedRole.rawValue
        )
        
        switch result {
        case .success(let response):
            alertMessage = "Hesap başarıyla oluşturuldu!\n\nKullanıcı: \(response.user.username)\nRol: \(response.user.role)\n\nŞimdi giriş yapabilirsiniz."
            registrationSuccess = true
            showingAlert = true
            
        case .failure(let errorMessage):
            alertMessage = errorMessage
            registrationSuccess = false
            showingAlert = true
        }
        
        isRegistering = false
    }
}

// MARK: - Supporting Views

struct RoleSelectionCard: View {
    let role: UserRegistrationView.UserRole
    let isSelected: Bool
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                // Selection indicator
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 20))
                    .foregroundColor(isSelected ? .accentColor : .gray)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(role.displayName)
                        .font(.system(.callout, design: .default, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    Text(role.description)
                        .font(.system(.caption, design: .default, weight: .regular))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
            }
            .padding(12)
            .background(
                isSelected ? Color.accentColor.opacity(0.1) : Color.gray.opacity(0.05),
                in: RoundedRectangle(cornerRadius: 8)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(isSelected ? Color.accentColor : Color.clear, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Supporting Types

enum RegistrationError: Error {
    case invalidURL
    case invalidResponse
    case validationError(String)
}

struct RegistrationResponse: Codable {
    let message: String
    let user: RegistrationUser
}

struct RegistrationUser: Codable {
    let username: String
    let role: String
}



#Preview("Registration Form") {
    UserRegistrationView()
} 