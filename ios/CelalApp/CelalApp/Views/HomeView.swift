//
//  HomeView.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Home view synchronized with web design and data
//

import SwiftUI

struct HomeView: View {
    @StateObject private var dataLoader = DataLoaderService.shared
    @State private var showingProjectDetail: Project?
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    // Hero Section
                    heroSection
                    
                    // Projects Section
                    projectsSection
                    
                    // Skills Section
                    skillsSection
                    
                    // Blog Section (Placeholder)
                    blogSection
                    
                    // About Section
                    aboutSection
                    
                    Spacer(minLength: 32)
                }
            }
            .navigationTitle("Celal Başaran")
            .navigationBarTitleDisplayMode(.large)
            .refreshable {
                // Try web sync first, fallback to local refresh
                await dataLoader.updateFromWeb()
                if dataLoader.errorMessage != nil {
                    dataLoader.refreshData()
                }
            }
        }
        .sheet(item: $showingProjectDetail) { project in
            ProjectDetailView(project: project)
        }
    }
    
    // MARK: - Hero Section
    private var heroSection: some View {
        VStack(spacing: 16) {
            // Profile Image Placeholder
            Circle()
                .fill(.ultraThinMaterial)
                .frame(width: 120, height: 120)
                .overlay {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: 60))
                        .foregroundStyle(.secondary)
                }
            
            VStack(spacing: 8) {
                Text("iOS Developer")
                    .font(.system(.title, design: .rounded, weight: .bold))
                    .foregroundStyle(.primary)
                
                Text("SwiftUI & Mobil Uygulama Geliştirme")
                    .font(.system(.title3, design: .default, weight: .medium))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            // Stats Row
            HStack(spacing: 24) {
                StatItem(
                    value: "\(dataLoader.projects.count)",
                    label: "Proje",
                    color: .blue
                )
                
                StatItem(
                    value: "\(dataLoader.totalSkillsCount)",
                    label: "Teknoloji",
                    color: .green
                )
                
                StatItem(
                    value: "\(dataLoader.completedProjects.count)",
                    label: "Tamamlandı",
                    color: .purple
                )
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 32)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 0))
    }
    
    // MARK: - Projects Section
    private var projectsSection: some View {
        VStack(spacing: 16) {
            SectionHeader(
                title: "Projeler",
                subtitle: "Son projelerim ve çalışmalarım",
                systemImage: "folder.fill"
            )
            
            if dataLoader.projects.isEmpty {
                ContentUnavailableView(
                    "Proje Bulunamadı",
                    systemImage: "folder.badge.questionmark",
                    description: Text("Henüz proje yüklenmedi")
                )
                .frame(height: 200)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    LazyHStack(spacing: 16) {
                        ForEach(dataLoader.featuredProjects) { project in
                            ProjectCard(project: project) {
                                showingProjectDetail = project
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
        .padding(.vertical, 20)
    }
    
    // MARK: - Skills Section
    private var skillsSection: some View {
        VStack(spacing: 16) {
            SectionHeader(
                title: "Teknolojiler",
                subtitle: "Kullandığım araçlar ve framework'ler",
                systemImage: "gear.badge"
            )
            
            if let skillsData = dataLoader.skillsData {
                LazyVStack(spacing: 12) {
                    ForEach(skillsData.skills.categories) { category in
                        SkillCategoryView(category: category)
                    }
                }
                .padding(.horizontal, 20)
            } else {
                ContentUnavailableView(
                    "Teknolojiler Yükleniyor",
                    systemImage: "gear.badge.questionmark",
                    description: Text("Teknoloji listesi hazırlanıyor")
                )
                .frame(height: 200)
            }
        }
        .padding(.vertical, 20)
    }
    
    // MARK: - Blog Section (Placeholder)
    private var blogSection: some View {
        VStack(spacing: 16) {
            SectionHeader(
                title: "Blog",
                subtitle: "Yazılarım ve deneyimlerim",
                systemImage: "doc.text.fill"
            )
            
            VStack(spacing: 12) {
                BlogPlaceholderCard(
                    title: "SwiftUI'da Modern Tasarım Prensipleri",
                    excerpt: "Apple'ın tasarım dilini uygulamalarınızda nasıl kullanabileceğinizi öğrenin",
                    date: "Yakında"
                )
                
                BlogPlaceholderCard(
                    title: "iOS Geliştirme Sürecim",
                    excerpt: "Sıfırdan uygulama geliştirme sürecimde edindiğim deneyimler",
                    date: "Yakında"
                )
            }
            .padding(.horizontal, 20)
        }
        .padding(.vertical, 20)
    }
    
    // MARK: - About Section
    private var aboutSection: some View {
        VStack(spacing: 16) {
            SectionHeader(
                title: "Hakkımda",
                subtitle: "Kim olduğum ve ne yaptığım",
                systemImage: "person.circle"
            )
            
            VStack(spacing: 16) {
                AboutCard(
                    icon: "graduationcap.fill",
                    title: "Eğitim",
                    content: "Bilgisayar Mühendisliği öğrencisi olarak mobil uygulama geliştirme alanında kendimi geliştiriyorum.",
                    color: .blue
                )
                
                AboutCard(
                    icon: "heart.fill",
                    title: "İlgi Alanlarım",
                    content: "iOS geliştirme, SwiftUI, kullanıcı deneyimi tasarımı ve modern uygulama mimarileri.",
                    color: .red
                )
                
                AboutCard(
                    icon: "target",
                    title: "Hedefim",
                    content: "Kullanıcıların hayatını kolaylaştıran, kullanışlı ve güzel iOS uygulamaları geliştirmek.",
                    color: .green
                )
            }
            .padding(.horizontal, 20)
        }
        .padding(.vertical, 20)
    }
}

// MARK: - Supporting Views

struct StatItem: View {
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(.title2, design: .rounded, weight: .bold))
                .foregroundStyle(color)
            
            Text(label)
                .font(.system(.caption, design: .default, weight: .medium))
                .foregroundStyle(.secondary)
        }
    }
}

struct SectionHeader: View {
    let title: String
    let subtitle: String
    let systemImage: String
    
    var body: some View {
        VStack(spacing: 8) {
            HStack(spacing: 12) {
                Image(systemName: systemImage)
                    .font(.system(size: 24, weight: .medium))
                    .foregroundStyle(.blue)
                
                Text(title)
                    .font(.system(.title2, design: .default, weight: .bold))
                
                Spacer()
            }
            
            HStack {
                Text(subtitle)
                    .font(.system(.callout, design: .default, weight: .regular))
                    .foregroundStyle(.secondary)
                Spacer()
            }
        }
        .padding(.horizontal, 20)
    }
}

struct ProjectCard: View {
    let project: Project
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text(project.statusDisplayText)
                        .font(.system(.caption, design: .default, weight: .semibold))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(
                            project.isCompleted ? .green.opacity(0.1) : .orange.opacity(0.1),
                            in: Capsule()
                        )
                        .foregroundStyle(project.isCompleted ? .green : .orange)
                    
                    Spacer()
                    
                    if project.featured {
                        Image(systemName: "star.fill")
                            .font(.system(size: 12))
                            .foregroundStyle(.yellow)
                    }
                }
                
                VStack(alignment: .leading, spacing: 8) {
                    Text(project.title)
                        .font(.system(.headline, design: .default, weight: .semibold))
                        .foregroundStyle(.primary)
                    
                    Text(project.description)
                        .font(.system(.subheadline, design: .default, weight: .regular))
                        .foregroundStyle(.secondary)
                        .lineLimit(3)
                }
                
                Text(project.techStackText)
                    .font(.system(.caption, design: .default, weight: .medium))
                    .foregroundStyle(.tertiary)
                    .lineLimit(2)
                
                Spacer()
                
                HStack {
                    if !project.github.isEmpty {
                        Image(systemName: "link.circle.fill")
                            .foregroundStyle(.blue)
                    }
                    
                    if project.hasLiveDemo {
                        Image(systemName: "globe.circle.fill")
                            .foregroundStyle(.green)
                    }
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.tertiary)
                }
            }
            .padding(16)
            .frame(width: 280, height: 200, alignment: .topLeading)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }
}

struct SkillCategoryView: View {
    let category: SkillCategory
    @State private var isExpanded = true
    
    var body: some View {
        VStack(spacing: 12) {
            Button(action: { isExpanded.toggle() }) {
                HStack {
                    Text(category.title)
                        .font(.system(.headline, design: .default, weight: .semibold))
                        .foregroundStyle(.primary)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                        .rotationEffect(.degrees(isExpanded ? 0 : -90))
                        .animation(.easeInOut(duration: 0.2), value: isExpanded)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
            
            if isExpanded {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 8) {
                    ForEach(category.skills) { skill in
                        SkillBadge(skill: skill)
                    }
                }
            }
        }
    }
}

struct SkillBadge: View {
    let skill: Skill
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(skill.name)
                    .font(.system(.callout, design: .default, weight: .semibold))
                    .foregroundStyle(.primary)
                
                Spacer()
                
                Text(skill.levelDisplayText)
                    .font(.system(.caption2, design: .default, weight: .medium))
                    .foregroundStyle(skill.levelColor)
            }
            
            HStack {
                Text(skill.experienceText)
                    .font(.system(.caption2, design: .default, weight: .regular))
                    .foregroundStyle(.secondary)
                
                Spacer()
            }
            
            ProgressView(value: skill.progressValue)
                .progressViewStyle(LinearProgressViewStyle(tint: skill.levelColor))
                .frame(height: 2)
        }
        .padding(12)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
    }
}

struct BlogPlaceholderCard: View {
    let title: String
    let excerpt: String
    let date: String
    
    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 8)
                .fill(.ultraThinMaterial)
                .frame(width: 60, height: 60)
                .overlay {
                    Image(systemName: "doc.text")
                        .font(.system(size: 24))
                        .foregroundStyle(.secondary)
                }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(.headline, design: .default, weight: .semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                
                Text(excerpt)
                    .font(.system(.subheadline, design: .default, weight: .regular))
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                
                Text(date)
                    .font(.system(.caption, design: .default, weight: .medium))
                    .foregroundStyle(.tertiary)
            }
            
            Spacer()
        }
        .padding(16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

struct AboutCard: View {
    let icon: String
    let title: String
    let content: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundStyle(color)
                .frame(width: 40, height: 40)
                .background(color.opacity(0.1), in: Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(.headline, design: .default, weight: .semibold))
                    .foregroundStyle(.primary)
                
                Text(content)
                    .font(.system(.subheadline, design: .default, weight: .regular))
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            
            Spacer()
        }
        .padding(16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Project Detail View
struct ProjectDetailView: View {
    let project: Project
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Status and Featured
                    HStack {
                        Text(project.statusDisplayText)
                            .font(.system(.callout, design: .default, weight: .semibold))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(
                                project.isCompleted ? .green.opacity(0.1) : .orange.opacity(0.1),
                                in: Capsule()
                            )
                            .foregroundStyle(project.isCompleted ? .green : .orange)
                        
                        if project.featured {
                            Text("⭐ Öne Çıkan")
                                .font(.system(.callout, design: .default, weight: .semibold))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(.yellow.opacity(0.1), in: Capsule())
                                .foregroundStyle(.yellow)
                        }
                        
                        Spacer()
                    }
                    
                    // Title and Description
                    VStack(alignment: .leading, spacing: 12) {
                        Text(project.title)
                            .font(.system(.largeTitle, design: .default, weight: .bold))
                        
                        Text(project.description)
                            .font(.system(.body, design: .default, weight: .regular))
                            .foregroundStyle(.secondary)
                    }
                    
                    // Tech Stack
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Teknolojiler")
                            .font(.system(.headline, design: .default, weight: .semibold))
                        
                        LazyVGrid(columns: [
                            GridItem(.adaptive(minimum: 100))
                        ], spacing: 8) {
                            ForEach(project.tech, id: \.self) { tech in
                                Text(tech)
                                    .font(.system(.callout, design: .default, weight: .medium))
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(.blue.opacity(0.1), in: Capsule())
                                    .foregroundStyle(.blue)
                            }
                        }
                    }
                    
                    // Links
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Bağlantılar")
                            .font(.system(.headline, design: .default, weight: .semibold))
                        
                        if !project.github.isEmpty {
                            Link(destination: URL(string: project.github)!) {
                                HStack {
                                    Image(systemName: "link.circle.fill")
                                        .foregroundStyle(.blue)
                                    Text("GitHub Repository")
                                        .foregroundStyle(.blue)
                                    Spacer()
                                    Image(systemName: "arrow.up.right")
                                        .font(.system(size: 12))
                                        .foregroundStyle(.blue)
                                }
                                .padding(12)
                                .background(.blue.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
                            }
                        }
                        
                        if project.hasLiveDemo {
                            Link(destination: URL(string: project.live)!) {
                                HStack {
                                    Image(systemName: "globe.circle.fill")
                                        .foregroundStyle(.green)
                                    Text("Canlı Demo")
                                        .foregroundStyle(.green)
                                    Spacer()
                                    Image(systemName: "arrow.up.right")
                                        .font(.system(size: 12))
                                        .foregroundStyle(.green)
                                }
                                .padding(12)
                                .background(.green.opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
                            }
                        }
                    }
                    
                    Spacer(minLength: 32)
                }
                .padding(20)
            }
            .navigationTitle("Proje Detayı")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Kapat") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview("Home View") {
    HomeView()
}

#Preview("Project Detail") {
    ProjectDetailView(project: Project.sampleProject)
} 