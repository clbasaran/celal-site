//
//  AdminAnalyticsPanel.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Admin analytics dashboard with user statistics and visual charts
//

import SwiftUI

struct AdminAnalyticsPanel: View {
    @Environment(\.dismiss) private var dismiss
    @State private var isLoading = false
    @State private var selectedChartType: ChartType = .pie
    
    // Mock data - replace with real API calls
    @State private var totalUsers = 24
    @State private var adminUsers = 3
    @State private var editorUsers = 21
    @State private var dailyRegistrations: [DailyRegistration] = []
    @State private var recentUsers: [RecentUser] = []
    
    enum ChartType: String, CaseIterable {
        case pie = "Pasta Grafik"
        case bar = "Çubuk Grafik"
        
        var icon: String {
            switch self {
            case .pie: return "chart.pie.fill"
            case .bar: return "chart.bar.fill"
            }
        }
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 24) {
                    // Header Section
                    headerSection
                    
                    // Statistics Cards
                    statisticsSection
                    
                    // Role Distribution Chart
                    roleDistributionSection
                    
                    // Registration Trend Chart
                    registrationTrendSection
                    
                    // Recent Users Section
                    recentUsersSection
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 32)
            }
            .background(
                LinearGradient(
                    colors: [
                        Color.accentColor.opacity(0.05),
                        Color.clear,
                        Color.secondary.opacity(0.02)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .navigationTitle("Analytics")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Kapat") {
                        dismiss()
                    }
                    .foregroundColor(.accentColor)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: refreshData) {
                        Image(systemName: "arrow.clockwise")
                            .foregroundColor(.accentColor)
                            .rotationEffect(.degrees(isLoading ? 360 : 0))
                            .animation(isLoading ? .linear(duration: 1).repeatForever(autoreverses: false) : .default, value: isLoading)
                    }
                }
            }
        }
        .onAppear {
            loadMockData()
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Kullanıcı Analitikleri")
                        .font(.system(.title2, design: .rounded, weight: .bold))
                        .foregroundColor(.primary)
                    
                    Text("Sistem istatistikleri ve kullanıcı aktivitesi")
                        .font(.system(.callout, design: .default, weight: .medium))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.system(size: 32))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.accentColor, .accentColor.opacity(0.7)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            }
        }
        .padding(.top, 8)
    }
    
    // MARK: - Statistics Section
    private var statisticsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Genel İstatistikler")
                .font(.system(.headline, design: .rounded, weight: .semibold))
                .foregroundColor(.primary)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    AnalyticsStatCard(
                        title: "Toplam Kullanıcı",
                        value: "\(totalUsers)",
                        icon: "person.3.fill",
                        color: .blue,
                        trend: .up,
                        trendValue: "+12%"
                    )
                    
                    AnalyticsStatCard(
                        title: "Admin Kullanıcılar",
                        value: "\(adminUsers)",
                        icon: "crown.fill",
                        color: .purple,
                        trend: .stable,
                        trendValue: "0%"
                    )
                    
                    AnalyticsStatCard(
                        title: "Editor Kullanıcılar",
                        value: "\(editorUsers)",
                        icon: "pencil.circle.fill",
                        color: .green,
                        trend: .up,
                        trendValue: "+15%"
                    )
                    
                    AnalyticsStatCard(
                        title: "Bu Hafta",
                        value: "\(dailyRegistrations.suffix(7).reduce(0) { $0 + $1.count })",
                        icon: "calendar.badge.plus",
                        color: .orange,
                        trend: .up,
                        trendValue: "+8%"
                    )
                }
                .padding(.horizontal, 4)
            }
        }
    }
    
    // MARK: - Role Distribution Section
    private var roleDistributionSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Rol Dağılımı")
                    .font(.system(.headline, design: .rounded, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Picker("Chart Type", selection: $selectedChartType) {
                    ForEach(ChartType.allCases, id: \.self) { type in
                        HStack {
                            Image(systemName: type.icon)
                            Text(type.rawValue)
                        }
                        .tag(type)
                    }
                }
                .pickerStyle(.menu)
                .tint(.accentColor)
            }
            
            VStack(spacing: 20) {
                if selectedChartType == .pie {
                    pieChartView
                } else {
                    barChartView
                }
                
                // Legend
                HStack(spacing: 32) {
                    HStack(spacing: 8) {
                        Circle()
                            .fill(.purple)
                            .frame(width: 12, height: 12)
                        Text("Admin (\(adminUsers))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack(spacing: 8) {
                        Circle()
                            .fill(.green)
                            .frame(width: 12, height: 12)
                        Text("Editor (\(editorUsers))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                }
            }
            .padding(20)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
        }
    }
    
    // MARK: - Registration Trend Section
    private var registrationTrendSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Kayıt Trendi")
                    .font(.system(.headline, design: .rounded, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Text("Son 7 Gün")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 8))
            }
            
            VStack(spacing: 16) {
                // Simple line chart using basic views
                GeometryReader { geometry in
                    let maxValue = Double(dailyRegistrations.max(by: { $0.count < $1.count })?.count ?? 1)
                    let width = geometry.size.width
                    let height = geometry.size.height - 40
                    
                    ZStack {
                        // Background grid
                        VStack(spacing: 0) {
                            ForEach(0..<5) { i in
                                Rectangle()
                                    .fill(.gray.opacity(0.2))
                                    .frame(height: 1)
                                if i < 4 { Spacer() }
                            }
                        }
                        
                        // Line chart
                        Path { path in
                            for (index, registration) in dailyRegistrations.enumerated() {
                                let x = (width / Double(dailyRegistrations.count - 1)) * Double(index)
                                let y = height - (height * Double(registration.count) / maxValue)
                                
                                if index == 0 {
                                    path.move(to: CGPoint(x: x, y: y))
                                } else {
                                    path.addLine(to: CGPoint(x: x, y: y))
                                }
                            }
                        }
                        .stroke(.blue, lineWidth: 3)
                        
                        // Data points
                        ForEach(Array(dailyRegistrations.enumerated()), id: \.offset) { index, registration in
                            let x = (width / Double(dailyRegistrations.count - 1)) * Double(index)
                            let y = height - (height * Double(registration.count) / maxValue)
                            
                            Circle()
                                .fill(.blue)
                                .frame(width: 8, height: 8)
                                .position(x: x, y: y)
                        }
                        
                        // X-axis labels
                        HStack {
                            ForEach(Array(dailyRegistrations.enumerated()), id: \.offset) { index, registration in
                                Text(formatDate(registration.date))
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                if index < dailyRegistrations.count - 1 {
                                    Spacer()
                                }
                            }
                        }
                        .offset(y: height + 20)
                    }
                }
                .frame(height: 180)
            }
            .padding(20)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
        }
    }
    
    // MARK: - Recent Users Section
    private var recentUsersSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Son Kayıtlar")
                    .font(.system(.headline, design: .rounded, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button("Tümünü Gör") {
                    // Navigate to full user list
                }
                .font(.caption)
                .foregroundColor(.accentColor)
            }
            
            VStack(spacing: 12) {
                ForEach(recentUsers.prefix(5)) { user in
                    RecentUserRow(user: user)
                }
            }
            .padding(16)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
        }
    }
    
    // MARK: - Chart Views
    private var pieChartView: some View {
        VStack(spacing: 16) {
            ZStack {
                ForEach(Array(getRoleDataPercentages().enumerated()), id: \.offset) { index, data in
                    Circle()
                        .trim(from: data.startAngle, to: data.endAngle)
                        .stroke(data.color, lineWidth: 40)
                        .frame(width: 120, height: 120)
                        .rotationEffect(.degrees(-90))
                        .animation(.easeInOut(duration: 1.0), value: data.endAngle)
                }
                
                VStack(spacing: 4) {
                    Text("\(totalUsers)")
                        .font(.system(.title, design: .rounded, weight: .bold))
                        .foregroundColor(.primary)
                    Text("Toplam")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .frame(height: 200)
        }
    }
    
    private var barChartView: some View {
        VStack(spacing: 16) {
            HStack(alignment: .bottom, spacing: 32) {
                // Admin Bar
                VStack(spacing: 8) {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(.purple)
                        .frame(width: 60, height: CGFloat(adminUsers) * 10)
                        .animation(.easeInOut(duration: 0.8), value: adminUsers)
                    
                    Text("Admin")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("\(adminUsers)")
                        .font(.system(.callout, design: .rounded, weight: .semibold))
                        .foregroundColor(.purple)
                }
                
                // Editor Bar
                VStack(spacing: 8) {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(.green)
                        .frame(width: 60, height: CGFloat(editorUsers) * 10)
                        .animation(.easeInOut(duration: 0.8), value: editorUsers)
                    
                    Text("Editor")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("\(editorUsers)")
                        .font(.system(.callout, design: .rounded, weight: .semibold))
                        .foregroundColor(.green)
                }
            }
            .frame(height: 200)
        }
    }
    
    // MARK: - Helper Functions
    private func getRoleDataPercentages() -> [PieChartData] {
        let total = Double(totalUsers)
        let adminPercentage = Double(adminUsers) / total
        let editorPercentage = Double(editorUsers) / total
        
        var data: [PieChartData] = []
        var currentAngle: Double = 0
        
        // Admin slice
        let adminEndAngle = currentAngle + adminPercentage
        data.append(PieChartData(
            startAngle: currentAngle,
            endAngle: adminEndAngle,
            color: .purple
        ))
        currentAngle = adminEndAngle
        
        // Editor slice
        let editorEndAngle = currentAngle + editorPercentage
        data.append(PieChartData(
            startAngle: currentAngle,
            endAngle: editorEndAngle,
            color: .green
        ))
        
        return data
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "E"
        return formatter.string(from: date)
    }
    
    // MARK: - Actions
    private func refreshData() {
        withAnimation(.easeInOut(duration: 0.3)) {
            isLoading = true
        }
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            loadMockData()
            withAnimation(.easeInOut(duration: 0.3)) {
                isLoading = false
            }
        }
    }
    
    private func loadMockData() {
        // Load mock daily registrations
        let calendar = Calendar.current
        let today = Date()
        dailyRegistrations = (0..<7).compactMap { daysAgo in
            guard let date = calendar.date(byAdding: .day, value: -daysAgo, to: today) else { return nil }
            return DailyRegistration(
                date: date,
                count: Int.random(in: 0...5)
            )
        }.reversed()
        
        // Load mock recent users
        recentUsers = [
            RecentUser(id: "1", username: "ahmet_dev", email: "ahmet@example.com", role: "editor", joinDate: Date().addingTimeInterval(-3600)),
            RecentUser(id: "2", username: "ayse_design", email: "ayse@example.com", role: "editor", joinDate: Date().addingTimeInterval(-7200)),
            RecentUser(id: "3", username: "mehmet_pm", email: "mehmet@example.com", role: "admin", joinDate: Date().addingTimeInterval(-10800)),
            RecentUser(id: "4", username: "zeynep_qa", email: "zeynep@example.com", role: "editor", joinDate: Date().addingTimeInterval(-14400)),
            RecentUser(id: "5", username: "ali_backend", email: "ali@example.com", role: "editor", joinDate: Date().addingTimeInterval(-18000))
        ]
    }
}

// MARK: - Supporting Views

struct AnalyticsStatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    let trend: TrendDirection
    let trendValue: String
    
    enum TrendDirection {
        case up, down, stable
        
        var icon: String {
            switch self {
            case .up: return "arrow.up.right"
            case .down: return "arrow.down.right"
            case .stable: return "minus"
            }
        }
        
        var color: Color {
            switch self {
            case .up: return .green
            case .down: return .red
            case .stable: return .gray
            }
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                Spacer()
                
                HStack(spacing: 4) {
                    Image(systemName: trend.icon)
                        .font(.caption)
                    Text(trendValue)
                        .font(.caption)
                        .fontWeight(.medium)
                }
                .foregroundColor(trend.color)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(trend.color.opacity(0.1), in: RoundedRectangle(cornerRadius: 6))
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.system(.title, design: .rounded, weight: .bold))
                    .foregroundColor(.primary)
                
                Text(title)
                    .font(.system(.callout, design: .default, weight: .medium))
                    .foregroundColor(.secondary)
            }
        }
        .frame(width: 160)
        .padding(16)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 4)
    }
}

struct RecentUserRow: View {
    let user: RecentUser
    
    var body: some View {
        HStack(spacing: 12) {
            // Avatar
            Circle()
                .fill(
                    LinearGradient(
                        colors: [.accentColor, .accentColor.opacity(0.7)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 40, height: 40)
                .overlay(
                    Text(user.username.prefix(1).uppercased())
                        .font(.system(.callout, design: .rounded, weight: .semibold))
                        .foregroundColor(.white)
                )
            
            VStack(alignment: .leading, spacing: 2) {
                Text(user.username)
                    .font(.system(.callout, design: .default, weight: .semibold))
                    .foregroundColor(.primary)
                
                Text(user.email)
                    .font(.system(.caption, design: .default, weight: .regular))
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 4) {
                // Role Badge
                Text(user.role.capitalized)
                    .font(.system(.caption, design: .rounded, weight: .semibold))
                    .foregroundColor(user.role == "admin" ? .purple : .green)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        (user.role == "admin" ? Color.purple : Color.green).opacity(0.1),
                        in: RoundedRectangle(cornerRadius: 6)
                    )
                
                Text(timeAgoString(from: user.joinDate))
                    .font(.system(.caption2, design: .default, weight: .regular))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
    
    private func timeAgoString(from date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Supporting Types

struct DailyRegistration {
    let date: Date
    let count: Int
}

struct RecentUser: Identifiable {
    let id: String
    let username: String
    let email: String
    let role: String
    let joinDate: Date
}

struct RoleData {
    let role: String
    let count: Int
    let color: Color
}

struct PieChartData {
    let startAngle: Double
    let endAngle: Double
    let color: Color
}

// MARK: - Previews

#Preview("Admin Analytics Panel") {
    AdminAnalyticsPanel()
}

#Preview("Analytics Stat Card") {
    VStack {
        AnalyticsStatCard(
            title: "Toplam Kullanıcı",
            value: "24",
            icon: "person.3.fill",
            color: .blue,
            trend: .up,
            trendValue: "+12%"
        )
    }
    .padding()
    .background(Color.gray.opacity(0.1))
}

#Preview("Recent User Row") {
    VStack {
        RecentUserRow(
            user: RecentUser(
                id: "1",
                username: "ahmet_dev",
                email: "ahmet@example.com",
                role: "editor",
                joinDate: Date().addingTimeInterval(-3600)
            )
        )
    }
    .padding()
    .background(Color.gray.opacity(0.1))
} 