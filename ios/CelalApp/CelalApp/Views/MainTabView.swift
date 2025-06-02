//
//  MainTabView.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Main tab structure for CelalSite iOS application
//

import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Ana Sayfa")
                }
                .tag(0)
            
            AdminDashboardView()
                .tabItem {
                    Image(systemName: "gear")
                    Text("Admin")
                }
                .tag(1)
        }
        .accentColor(.primary)
    }
}

#Preview {
    MainTabView()
} 