//
//  AuthTokenManager.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  JWT Token management with refresh token support
//

import Foundation

/**
 * AuthTokenManager handles all JWT token operations including:
 * - Storing access and refresh tokens securely
 * - Checking token expiration
 * - Automatic token refresh
 * - Secure logout
 */
class AuthTokenManager: ObservableObject {
    
    // MARK: - Singleton
    static let shared = AuthTokenManager()
    
    // MARK: - Published Properties
    @Published var isAuthenticated = false
    @Published var currentUser: String = ""
    @Published var currentRole: String = ""
    
    // MARK: - Private Properties
    private let accessTokenKey = "jwt_access_token"
    private let refreshTokenKey = "jwt_refresh_token"
    private let userKey = "current_user"
    private let roleKey = "current_role"
    
    private var accessToken: String = ""
    private var refreshToken: String = ""
    
    // MARK: - Init
    private init() {
        loadStoredTokens()
    }
    
    // MARK: - Public Methods
    
    /**
     * Save tokens after successful login
     */
    func saveTokens(accessToken: String, refreshToken: String, username: String, role: String) {
        self.accessToken = accessToken
        self.refreshToken = refreshToken
        self.currentUser = username
        self.currentRole = role
        
        // Store in UserDefaults
        UserDefaults.standard.set(accessToken, forKey: accessTokenKey)
        UserDefaults.standard.set(refreshToken, forKey: refreshTokenKey)
        UserDefaults.standard.set(username, forKey: userKey)
        UserDefaults.standard.set(role, forKey: roleKey)
        
        DispatchQueue.main.async {
            self.isAuthenticated = true
        }
        
        print("✅ Tokens saved successfully for user: \(username)")
    }
    
    /**
     * Get current valid access token (refreshes if expired)
     */
    func getValidAccessToken() async -> String? {
        // Check if access token exists
        guard !accessToken.isEmpty else {
            print("❌ No access token available")
            return nil
        }
        
        // Check if access token is expired
        if isTokenExpired(accessToken) {
            print("⏰ Access token expired, attempting refresh...")
            
            // Try to refresh token
            let success = await refreshAccessToken()
            if success {
                return accessToken
            } else {
                print("❌ Token refresh failed, user needs to login again")
                await logout()
                return nil
            }
        }
        
        return accessToken
    }
    
    /**
     * Refresh access token using refresh token
     */
    @MainActor
    func refreshAccessToken() async -> Bool {
        guard !refreshToken.isEmpty else {
            print("❌ No refresh token available")
            return false
        }
        
        // Check if refresh token is expired
        if isTokenExpired(refreshToken) {
            print("❌ Refresh token is expired")
            await logout()
            return false
        }
        
        do {
            guard let url = URL(string: "https://celal-site.pages.dev/api/refresh") else {
                print("❌ Invalid refresh URL")
                return false
            }
            
            let requestBody = [
                "refresh_token": refreshToken
            ]
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse {
                switch httpResponse.statusCode {
                case 200:
                    let refreshResponse = try JSONDecoder().decode(RefreshTokenResponse.self, from: data)
                    
                    // Update tokens
                    self.accessToken = refreshResponse.access_token
                    self.refreshToken = refreshResponse.refresh_token
                    
                    // Save to UserDefaults
                    UserDefaults.standard.set(refreshResponse.access_token, forKey: accessTokenKey)
                    UserDefaults.standard.set(refreshResponse.refresh_token, forKey: refreshTokenKey)
                    
                    print("✅ Tokens refreshed successfully")
                    return true
                    
                case 401:
                    print("❌ Refresh token invalid or expired")
                    await logout()
                    return false
                    
                default:
                    print("❌ Token refresh failed with status: \(httpResponse.statusCode)")
                    return false
                }
            }
            
            return false
            
        } catch {
            print("❌ Token refresh error: \(error)")
            return false
        }
    }
    
    /**
     * Logout user and clear all tokens
     */
    @MainActor
    func logout() {
        // Clear in-memory tokens
        accessToken = ""
        refreshToken = ""
        currentUser = ""
        currentRole = ""
        
        // Clear stored tokens
        UserDefaults.standard.removeObject(forKey: accessTokenKey)
        UserDefaults.standard.removeObject(forKey: refreshTokenKey)
        UserDefaults.standard.removeObject(forKey: userKey)
        UserDefaults.standard.removeObject(forKey: roleKey)
        
        // Update UI
        isAuthenticated = false
        
        print("✅ User logged out successfully")
    }
    
    /**
     * Check if user is authenticated with valid tokens
     */
    func checkAuthenticationStatus() async -> Bool {
        guard !accessToken.isEmpty, !refreshToken.isEmpty else {
            return false
        }
        
        // Try to get valid access token (will refresh if needed)
        let validToken = await getValidAccessToken()
        return validToken != nil
    }
    
    // MARK: - Private Methods
    
    /**
     * Load stored tokens from UserDefaults
     */
    private func loadStoredTokens() {
        accessToken = UserDefaults.standard.string(forKey: accessTokenKey) ?? ""
        refreshToken = UserDefaults.standard.string(forKey: refreshTokenKey) ?? ""
        currentUser = UserDefaults.standard.string(forKey: userKey) ?? ""
        currentRole = UserDefaults.standard.string(forKey: roleKey) ?? ""
        
        // Update authentication status
        DispatchQueue.main.async {
            self.isAuthenticated = !self.accessToken.isEmpty && !self.refreshToken.isEmpty
        }
        
        if isAuthenticated {
            print("📱 Loaded stored tokens for user: \(currentUser)")
        }
    }
    
    /**
     * Check if JWT token is expired by decoding exp claim
     */
    private func isTokenExpired(_ token: String) -> Bool {
        guard let payload = decodeJWTPayload(token) else {
            print("❌ Failed to decode token payload")
            return true
        }
        
        guard let exp = payload["exp"] as? TimeInterval else {
            print("❌ No expiration time found in token")
            return true
        }
        
        let currentTime = Date().timeIntervalSince1970
        let isExpired = currentTime >= exp
        
        if isExpired {
            let expiryDate = Date(timeIntervalSince1970: exp)
            print("⏰ Token expired at: \(expiryDate)")
        }
        
        return isExpired
    }
    
    /**
     * Decode JWT payload without verification (for expiration check only)
     */
    private func decodeJWTPayload(_ token: String) -> [String: Any]? {
        let parts = token.split(separator: ".")
        guard parts.count == 3 else {
            print("❌ Invalid JWT format")
            return nil
        }
        
        let payloadPart = String(parts[1])
        
        // Add padding if needed for base64 decoding
        var base64String = payloadPart
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        
        while base64String.count % 4 != 0 {
            base64String += "="
        }
        
        guard let data = Data(base64Encoded: base64String),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            print("❌ Failed to decode JWT payload")
            return nil
        }
        
        return json
    }
    
    /**
     * Get time until token expiration in seconds
     */
    func getTokenExpirationTime(_ token: String) -> TimeInterval? {
        guard let payload = decodeJWTPayload(token),
              let exp = payload["exp"] as? TimeInterval else {
            return nil
        }
        
        let currentTime = Date().timeIntervalSince1970
        return max(0, exp - currentTime)
    }
}

// MARK: - Supporting Types

struct RefreshTokenResponse: Codable {
    let access_token: String
    let refresh_token: String
    let expires_in: Int
    let token_type: String
}

// MARK: - Extensions

extension AuthTokenManager {
    
    /**
     * Convenience method to make authenticated API requests
     */
    func makeAuthenticatedRequest(to url: URL, method: String = "GET", body: Data? = nil) async throws -> (Data, URLResponse) {
        guard let accessToken = await getValidAccessToken() else {
            throw AuthError.unauthorized
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let body = body {
            request.httpBody = body
        }
        
        return try await URLSession.shared.data(for: request)
    }
}

enum AuthError: Error {
    case unauthorized
    case tokenExpired
    case refreshFailed
    
    var localizedDescription: String {
        switch self {
        case .unauthorized:
            return "Authentication required"
        case .tokenExpired:
            return "Session expired"
        case .refreshFailed:
            return "Failed to refresh session"
        }
    }
} 