//
//  CelalSiteApp.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Main entry point for CelalSite iOS application
//

import SwiftUI

@main
struct CelalSiteApp: App {
    @StateObject private var sessionManager = UserSessionManager.shared
    
    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(sessionManager)
        }
    }
}
