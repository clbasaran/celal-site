//
//  HomeView.swift
//  CelalApp
//
//  Created by Celal Başaran on 27.05.2025.
//  Main home screen matching web design
//

import SwiftUI

struct HomeView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 32) {
                    // Hero Section
                    heroSection
                    
                    // Projects Section
                    projectsSection
                    
                    // Blog Section
                    blogSection
                    
                    // About Section
                    aboutSection
                }
                .padding(.horizontal, 20)
                .padding(.top, 20)
            }
            .navigationTitle("Celal Başaran")
            .navigationBarTitleDisplayMode(.large)
        }
    }
    
    // MARK: - Hero Section
    private var heroSection: some View {
        VStack(spacing: 16) {
            // Logo placeholder - matches web design
            RoundedRectangle(cornerRadius: 16)
                .fill(.quaternary)
                .frame(width: 120, height: 30)
                .overlay {
                    Text("Celal Başaran")
                        .font(.system(.title3, design: .default, weight: .semibold))
                        .foregroundColor(.primary)
                }
            
            Text("Modern Web Development")
                .font(.system(.largeTitle, design: .default, weight: .bold))
                .multilineTextAlignment(.center)
            
            Text("Apple Design Language ile premium portfolio ve web çözümleri")
                .font(.system(.title3, design: .default, weight: .regular))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 16)
        }
        .padding(.vertical, 24)
    }
    
    // MARK: - Projects Section
    private var projectsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Projeler")
                    .font(.system(.title2, design: .default, weight: .semibold))
                Spacer()
                Button("Tümünü Gör") {
                    // Navigation to projects
                }
                .font(.system(.callout, design: .default, weight: .medium))
                .foregroundColor(.accentColor)
            }
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(sampleProjects, id: \.title) { project in
                        ProjectCard(project: project)
                    }
                }
                .padding(.horizontal, 4)
            }
        }
    }
    
    // MARK: - Blog Section
    private var blogSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Blog")
                    .font(.system(.title2, design: .default, weight: .semibold))
                Spacer()
                Button("Tümünü Gör") {
                    // Navigation to blog
                }
                .font(.system(.callout, design: .default, weight: .medium))
                .foregroundColor(.accentColor)
            }
            
            VStack(spacing: 12) {
                ForEach(sampleBlogPosts, id: \.title) { post in
                    BlogPostRow(post: post)
                }
            }
        }
    }
    
    // MARK: - About Section
    private var aboutSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Hakkında")
                .font(.system(.title2, design: .default, weight: .semibold))
            
            Text("Apple Design Language 2025 standartlarında modern web uygulamaları geliştiren full-stack developer. SwiftUI, React ve premium UI/UX tasarım konularında uzmanlaşmış.")
                .font(.system(.body, design: .default, weight: .regular))
                .foregroundColor(.secondary)
                .lineLimit(nil)
        }
        .padding(.bottom, 32)
    }
}

// MARK: - Supporting Views
struct ProjectCard: View {
    let project: SampleProject
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            RoundedRectangle(cornerRadius: 12)
                .fill(.quaternary)
                .frame(width: 280, height: 160)
                .overlay {
                    Image(systemName: project.icon)
                        .font(.system(size: 32))
                        .foregroundColor(.secondary)
                }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(project.title)
                    .font(.system(.headline, design: .default, weight: .semibold))
                    .lineLimit(1)
                
                Text(project.description)
                    .font(.system(.caption, design: .default, weight: .regular))
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
        }
        .frame(width: 280)
        .padding(16)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

struct BlogPostRow: View {
    let post: SampleBlogPost
    
    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 8)
                .fill(.quaternary)
                .frame(width: 60, height: 60)
                .overlay {
                    Image(systemName: post.icon)
                        .font(.system(size: 20))
                        .foregroundColor(.secondary)
                }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(post.title)
                    .font(.system(.subheadline, design: .default, weight: .semibold))
                    .lineLimit(2)
                
                Text(post.date)
                    .font(.system(.caption2, design: .default, weight: .regular))
                    .foregroundColor(.tertiary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.tertiary)
        }
        .padding(12)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

// MARK: - Sample Data
struct SampleProject {
    let title: String
    let description: String
    let icon: String
}

struct SampleBlogPost {
    let title: String
    let date: String
    let icon: String
}

extension HomeView {
    private var sampleProjects: [SampleProject] {
        [
            SampleProject(
                title: "Portfolio Website",
                description: "Apple Design Language ile modern portfolio",
                icon: "globe"
            ),
            SampleProject(
                title: "Brand Design System",
                description: "CSS custom properties ile design system",
                icon: "paintbrush"
            ),
            SampleProject(
                title: "iOS Application",
                description: "SwiftUI ile native mobile uygulama",
                icon: "iphone"
            )
        ]
    }
    
    private var sampleBlogPosts: [SampleBlogPost] {
        [
            SampleBlogPost(
                title: "SwiftUI 5.0 Yenilikleri",
                date: "27 Mayıs 2025",
                icon: "swift"
            ),
            SampleBlogPost(
                title: "Apple Design Language 2025",
                date: "25 Mayıs 2025",
                icon: "apple.logo"
            ),
            SampleBlogPost(
                title: "Modern CSS Grid Patterns",
                date: "23 Mayıs 2025",
                icon: "grid"
            )
        ]
    }
}

#Preview {
    HomeView()
} 