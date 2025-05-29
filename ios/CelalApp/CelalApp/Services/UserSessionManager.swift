//
//  UserSessionManager.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.12.2024.
//  Manages user session state and persistence
//

import SwiftUI
import Foundation

// MARK: - User Model
struct User: Codable {
    let id: String
    let username: String
    let email: String?
    let role: UserRole
    let createdAt: String
    
    enum UserRole: String, Codable, CaseIterable {
        case admin = "admin"
        case editor = "editor"
        
        var displayName: String {
            switch self {
            case .admin: return "Admin"
            case .editor: return "Editor"
            }
        }
    }
}

// MARK: - UserSessionManager
@MainActor
class UserSessionManager: ObservableObject {
    static let shared = UserSessionManager()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var accessToken: String?
    @Published var refreshToken: String?
    
    private let keychain = KeychainService()
    
    private init() {
        loadStoredSession()
    }
    
    // MARK: - Session Management
    func setUserSession(token: String, refreshToken: String, user: User) {
        self.accessToken = token
        self.refreshToken = refreshToken
        self.currentUser = user
        self.isAuthenticated = true
        
        // Store in keychain
        storeSession(token: token, refreshToken: refreshToken, user: user)
    }
    
    func clearSession() {
        self.accessToken = nil
        self.refreshToken = nil
        self.currentUser = nil
        self.isAuthenticated = false
        
        // Clear from keychain
        clearStoredSession()
    }
    
    func loadStoredSession() {
        if let storedSession = keychain.getStoredSession() {
            self.accessToken = storedSession.accessToken
            self.refreshToken = storedSession.refreshToken
            self.currentUser = storedSession.user
            self.isAuthenticated = true
        }
    }
    
    // MARK: - Private Methods
    private func storeSession(token: String, refreshToken: String, user: User) {
        let session = StoredSession(
            accessToken: token,
            refreshToken: refreshToken,
            user: user
        )
        keychain.storeSession(session)
    }
    
    private func clearStoredSession() {
        keychain.clearSession()
    }
}

// MARK: - Stored Session Model
struct StoredSession: Codable {
    let accessToken: String
    let refreshToken: String
    let user: User
}

// MARK: - Keychain Service
class KeychainService {
    private let service = "CelalApp"
    private let account = "userSession"
    
    func storeSession(_ session: StoredSession) {
        guard let data = try? JSONEncoder().encode(session) else { return }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data
        ]
        
        // Delete existing item
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        SecItemAdd(query as CFDictionary, nil)
    }
    
    func getStoredSession() -> StoredSession? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let session = try? JSONDecoder().decode(StoredSession.self, from: data) else {
            return nil
        }
        
        return session
    }
    
    func clearSession() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        
        SecItemDelete(query as CFDictionary)
    }
} 