//
//  AdminAnalyticsPanel.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.12.2024.
//

import SwiftUI
import Charts

struct AdminAnalyticsPanel: View {
    @State private var selectedChart: ChartType = .pie
    @State private var animationAmount: Double = 0
    @State private var showingDetails = false
    
    // Mock data for analytics
    @State private var userStats = UserStatistics(
        totalUsers: 24,
        adminUsers: 3,
        editorUsers: 21
    )
    
    @State private var dailyRegistrations: [DailyRegistration] = [
        DailyRegistration(date: Calendar.current.date(byAdding: .day, value: -6, to: Date())!, count: 2),
        DailyRegistration(date: Calendar.current.date(byAdding: .day, value: -5, to: Date())!, count: 5),
        DailyRegistration(date: Calendar.current.date(byAdding: .day, value: -4, to: Date())!, count: 3),
        DailyRegistration(date: Calendar.current.date(byAdding: .day, value: -3, to: Date())!, count: 8),
        DailyRegistration(date: Calendar.current.date(byAdding: .day, value: -2, to: Date())!, count: 4),
        DailyRegistration(date: Calendar.current.date(byAdding: .day, value: -1, to: Date())!, count: 6),
        DailyRegistration(date: Date(), count: 2)
    ]
    
    @State private var recentUsers: [RecentUser] = [
        RecentUser(id: "1", username: "john_doe", email: "john@example.com", role: "editor", joinedAt: Date()),
        RecentUser(id: "2", username: "jane_admin", email: "jane@example.com", role: "admin", joinedAt: Calendar.current.date(byAdding: .hour, value: -2, to: Date())!),
        RecentUser(id: "3", username: "mike_editor", email: "mike@example.com", role: "editor", joinedAt: Calendar.current.date(byAdding: .hour, value: -5, to: Date())!),
        RecentUser(id: "4", username: "sarah_writer", email: "sarah@example.com", role: "editor", joinedAt: Calendar.current.date(byAdding: .day, value: -1, to: Date())!),
        RecentUser(id: "5", username: "alex_dev", email: "alex@example.com", role: "editor", joinedAt: Calendar.current.date(byAdding: .day, value: -2, to: Date())!)
    ]
    
    enum ChartType: String, CaseIterable {
        case pie = "Pasta"
        case bar = "Çubuk"
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVStack(spacing: 24) {
                    // Header
                    headerSection
                    
                    // Statistics Cards
                    statisticsSection
                    
                    // Role Distribution Chart
                    roleDistributionSection
                    
                    // Registration Trend Chart
                    registrationTrendSection
                    
                    // Recent Users
                    recentUsersSection
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 100)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Analitikler")
            .navigationBarTitleDisplayMode(.large)
            .onAppear {
                withAnimation(.easeInOut(duration: 1.0)) {
                    animationAmount = 1.0
                }
            }
        }
    }
    
    // MARK: - Header Section
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "chart.bar.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
                
                Text("Kullanıcı Analitikleri")
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Button(action: { showingDetails.toggle() }) {
                    Image(systemName: "info.circle")
                        .font(.title3)
                        .foregroundColor(.secondary)
                }
            }
            
            Text("Son güncellenme: \(Date(), formatter: timeFormatter)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.top, 8)
    }
    
    // MARK: - Statistics Section
    private var statisticsSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 16) {
                AnalyticsStatCard(
                    title: "Toplam Kullanıcı",
                    value: "\(userStats.totalUsers)",
                    icon: "person.3.fill",
                    color: .blue,
                    trend: .up,
                    trendValue: "+12%"
                )
                
                AnalyticsStatCard(
                    title: "Admin Kullanıcı",
                    value: "\(userStats.adminUsers)",
                    icon: "crown.fill",
                    color: .purple,
                    trend: .stable,
                    trendValue: "0%"
                )
                
                AnalyticsStatCard(
                    title: "Editor Kullanıcı",
                    value: "\(userStats.editorUsers)",
                    icon: "pencil.circle.fill",
                    color: .green,
                    trend: .up,
                    trendValue: "+18%"
                )
            }
            .padding(.horizontal, 20)
        }
        .opacity(animationAmount)
        .scaleEffect(0.95 + (animationAmount * 0.05))
    }
    
    // MARK: - Role Distribution Section
    private var roleDistributionSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Rol Dağılımı")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Picker("Grafik Tipi", selection: $selectedChart) {
                    ForEach(ChartType.allCases, id: \.self) { type in
                        Text(type.rawValue).tag(type)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .frame(width: 140)
            }
            
            VStack {
                if selectedChart == .pie {
                    pieChartView
                } else {
                    barChartView
                }
            }
            .frame(height: 250)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        }
        .opacity(animationAmount)
    }
    
    // MARK: - Registration Trend Section
    private var registrationTrendSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("7 Günlük Kayıt Trendi")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.title3)
                    .foregroundColor(.blue)
            }
            
            VStack {
                if #available(iOS 16.0, *) {
                    Chart(dailyRegistrations) { registration in
                        LineMark(
                            x: .value("Tarih", registration.date),
                            y: .value("Kayıt", registration.count)
                        )
                        .foregroundStyle(.blue)
                        .interpolationMethod(.catmullRom)
                        
                        AreaMark(
                            x: .value("Tarih", registration.date),
                            y: .value("Kayıt", registration.count)
                        )
                        .foregroundStyle(.blue.opacity(0.1))
                        .interpolationMethod(.catmullRom)
                    }
                    .frame(height: 200)
                    .chartXAxis {
                        AxisMarks(values: .stride(by: .day)) { value in
                            AxisGridLine()
                            AxisTick()
                            AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                        }
                    }
                    .chartYAxis {
                        AxisMarks { value in
                            AxisGridLine()
                            AxisTick()
                            AxisValueLabel()
                        }
                    }
                } else {
                    // Fallback for iOS 15
                    customLineChart
                }
            }
            .padding(20)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        }
        .opacity(animationAmount)
    }
    
    // MARK: - Recent Users Section
    private var recentUsersSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Son Kayıtlar")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
                
                Text("\(recentUsers.count) kullanıcı")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            VStack(spacing: 12) {
                ForEach(recentUsers) { user in
                    AnalyticsUserRow(user: user)
                        .opacity(animationAmount)
                        .offset(x: (1 - animationAmount) * 50)
                }
            }
            .padding(16)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        }
    }
    
    // MARK: - Chart Views
    private var pieChartView: some View {
        VStack {
            if #available(iOS 17.0, *) {
                Chart(roleData, id: \.role) { item in
                    SectorMark(
                        angle: .value("Sayı", item.count),
                        innerRadius: .ratio(0.5)
                    )
                    .foregroundStyle(by: .value("Rol", item.role))
                    .opacity(animationAmount)
                }
                .frame(height: 180)
                .chartLegend(position: .bottom)
            } else {
                // iOS 16 fallback - simple representation
                HStack(spacing: 30) {
                    VStack {
                        Circle()
                            .fill(.purple)
                            .frame(width: 60, height: 60)
                            .overlay(
                                Text("\(userStats.adminUsers)")
                                    .font(.headline)
                                    .foregroundColor(.white)
                            )
                        Text("Admin")
                            .font(.caption)
                    }
                    
                    VStack {
                        Circle()
                            .fill(.green)
                            .frame(width: 60, height: 60)
                            .overlay(
                                Text("\(userStats.editorUsers)")
                                    .font(.headline)
                                    .foregroundColor(.white)
                            )
                        Text("Editor")
                            .font(.caption)
                    }
                }
                .scaleEffect(animationAmount)
            }
        }
        .padding()
    }
    
    private var barChartView: some View {
        VStack {
            if #available(iOS 16.0, *) {
                Chart(roleData, id: \.role) { item in
                    BarMark(
                        x: .value("Rol", item.role),
                        y: .value("Sayı", item.count)
                    )
                    .foregroundStyle(item.role == "Admin" ? .purple : .green)
                    .opacity(animationAmount)
                }
                .frame(height: 180)
                .chartYAxis {
                    AxisMarks { value in
                        AxisGridLine()
                        AxisTick()
                        AxisValueLabel()
                    }
                }
            } else {
                // iOS 15 fallback
                HStack(alignment: .bottom, spacing: 40) {
                    VStack {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(.purple)
                            .frame(width: 50, height: CGFloat(userStats.adminUsers * 8))
                            .scaleEffect(y: animationAmount, anchor: .bottom)
                        Text("Admin (\(userStats.adminUsers))")
                            .font(.caption)
                    }
                    
                    VStack {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(.green)
                            .frame(width: 50, height: CGFloat(userStats.editorUsers * 8))
                            .scaleEffect(y: animationAmount, anchor: .bottom)
                        Text("Editor (\(userStats.editorUsers))")
                            .font(.caption)
                    }
                }
                .frame(height: 180)
            }
        }
        .padding()
    }
    
    // Custom line chart for iOS 15
    private var customLineChart: some View {
        GeometryReader { geometry in
            let maxCount = dailyRegistrations.map(\.count).max() ?? 1
            let width = geometry.size.width
            let height = geometry.size.height
            
            Path { path in
                for (index, registration) in dailyRegistrations.enumerated() {
                    let x = (width / CGFloat(dailyRegistrations.count - 1)) * CGFloat(index)
                    let y = height - (CGFloat(registration.count) / CGFloat(maxCount)) * height
                    
                    if index == 0 {
                        path.move(to: CGPoint(x: x, y: y))
                    } else {
                        path.addLine(to: CGPoint(x: x, y: y))
                    }
                }
            }
            .stroke(.blue, lineWidth: 3)
            .scaleEffect(y: animationAmount, anchor: .bottom)
            
            // Data points
            ForEach(Array(dailyRegistrations.enumerated()), id: \.offset) { index, registration in
                let x = (width / CGFloat(dailyRegistrations.count - 1)) * CGFloat(index)
                let y = height - (CGFloat(registration.count) / CGFloat(maxCount)) * height
                
                Circle()
                    .fill(.blue)
                    .frame(width: 8, height: 8)
                    .position(x: x, y: y)
                    .scaleEffect(animationAmount)
            }
        }
        .frame(height: 150)
    }
    
    // MARK: - Data
    private var roleData: [RoleDistribution] {
        [
            RoleDistribution(role: "Admin", count: userStats.adminUsers),
            RoleDistribution(role: "Editor", count: userStats.editorUsers)
        ]
    }
    
    // MARK: - Formatters
    private var timeFormatter: DateFormatter {
        let formatter = DateFormatter()
        formatter.dateStyle = .none
        formatter.timeStyle = .short
        return formatter
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
            case .stable: return .orange
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
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.primary)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(16)
        .frame(width: 160, height: 100)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct AnalyticsUserRow: View {
    let user: RecentUser
    
    var body: some View {
        HStack(spacing: 12) {
            // User Avatar
            Circle()
                .fill(user.role == "admin" ? Color.purple.gradient : Color.green.gradient)
                .frame(width: 40, height: 40)
                .overlay(
                    Text(String(user.username.prefix(1)).uppercased())
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                )
            
            // User Info
            VStack(alignment: .leading, spacing: 2) {
                Text(user.username)
                    .font(.subheadline)
                    .fontWeight(.medium)
                
                Text(user.email)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Role Badge & Time
            VStack(alignment: .trailing, spacing: 4) {
                Text(user.role.capitalized)
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(
                        (user.role == "admin" ? Color.purple : Color.green).opacity(0.2),
                        in: Capsule()
                    )
                    .foregroundColor(user.role == "admin" ? Color.purple : Color.green)
                
                Text(relativeTime(from: user.joinedAt))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 8)
    }
    
    private func relativeTime(from date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Data Models

struct UserStatistics {
    let totalUsers: Int
    let adminUsers: Int
    let editorUsers: Int
}

struct DailyRegistration: Identifiable {
    let id = UUID()
    let date: Date
    let count: Int
}

struct RoleDistribution {
    let role: String
    let count: Int
}

struct RecentUser: Identifiable {
    let id: String
    let username: String
    let email: String
    let role: String
    let joinedAt: Date
}

// MARK: - Preview

struct AdminAnalyticsPanel_Previews: PreviewProvider {
    static var previews: some View {
        AdminAnalyticsPanel()
            .preferredColorScheme(.light)
        
        AdminAnalyticsPanel()
            .preferredColorScheme(.dark)
    }
} 