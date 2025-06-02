/**
 * Main JavaScript for Celal Basaran Website
 */

// Global configuration
const config = {
    theme: localStorage.getItem('theme') || 'light',
    animations: true,
    autoSave: true
};

// Main App Class
class MainApp {
    constructor() {
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.initComponents();
        this.hideLoader();
    }

    loadSettings() {
        // Load settings from admin panel
        const siteSettings = JSON.parse(localStorage.getItem('admin-site-settings') || '{}');
        this.applySettings(siteSettings);
    }

    applySettings(settings) {
        if (settings.primaryColor) {
            document.documentElement.style.setProperty('--primary', settings.primaryColor);
        }
        if (settings.secondaryColor) {
            document.documentElement.style.setProperty('--secondary', settings.secondaryColor);
        }
        if (settings.accentColor) {
            document.documentElement.style.setProperty('--accent', settings.accentColor);
        }
        if (settings.backgroundColor) {
            document.documentElement.style.setProperty('--bg-primary', settings.backgroundColor);
        }
        
        // Update content
        if (settings.siteName) {
            const titleEl = document.getElementById('page-title');
            if (titleEl) titleEl.textContent = settings.siteName;
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Mobile menu
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        if (mobileToggle && navMenu) {
            mobileToggle.addEventListener('click', () => {
                navMenu.classList.toggle('open');
            });
        }

        // Smooth scrolling for nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Contact form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactForm(e));
        }
    }

    initComponents() {
        this.initAnimations();
        this.initSkills();
        this.initProjects();
        this.initTyping();
    }

    initAnimations() {
        if (!config.animations) return;

        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    initSkills() {
        const skills = JSON.parse(localStorage.getItem('admin-skills') || '[]');
        const skillsContainer = document.getElementById('skills-container');
        
        if (skillsContainer && skills.length > 0) {
            skillsContainer.innerHTML = skills.map(skill => `
                <div class="skill-card animate-on-scroll">
                    <div class="skill-header">
                        <div class="skill-icon">
                            <i class="${skill.icon}"></i>
                        </div>
                        <div class="skill-info">
                            <div class="skill-name">${skill.name}</div>
                            <div class="skill-category">${skill.category}</div>
                        </div>
                    </div>
                    <div class="skill-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${skill.level}%"></div>
                        </div>
                        <div class="skill-level">${skill.level}%</div>
                    </div>
                </div>
            `).join('');
        }
    }

    initProjects() {
        const projects = JSON.parse(localStorage.getItem('admin-projects') || '[]');
        const projectsContainer = document.getElementById('projects-container');
        
        if (projectsContainer && projects.length > 0) {
            projectsContainer.innerHTML = projects.map(project => `
                <div class="project-card animate-on-scroll">
                    <div class="project-image">
                        ${project.image ? `<img src="${project.image}" alt="${project.title}">` : '<i class="fas fa-image"></i>'}
                    </div>
                    <div class="project-content">
                        <div class="project-category">${project.category}</div>
                        <h3 class="project-title">${project.title}</h3>
                        <p class="project-description">${project.description}</p>
                        <div class="project-technologies">
                            ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                        <div class="project-links">
                            ${project.projectUrl ? `<a href="${project.projectUrl}" target="_blank" class="project-link"><i class="fas fa-external-link-alt"></i> Demo</a>` : ''}
                            ${project.githubUrl ? `<a href="${project.githubUrl}" target="_blank" class="project-link"><i class="fab fa-github"></i> GitHub</a>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    initTyping() {
        const typeElements = document.querySelectorAll('.typing-text');
        typeElements.forEach(element => {
            this.typeWriter(element, element.dataset.text || element.textContent);
        });
    }

    typeWriter(element, text, speed = 100) {
        element.textContent = '';
        let i = 0;
        
        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('.theme-icon');
            if (icon) {
                icon.textContent = newTheme === 'light' ? '🌙' : '☀️';
            }
        }
    }

    handleContactForm(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Save message to localStorage (admin panel will show these)
        const messages = JSON.parse(localStorage.getItem('admin-messages') || '[]');
        messages.unshift({
            id: Date.now(),
            ...data,
            date: new Date().toISOString(),
            read: false
        });
        localStorage.setItem('admin-messages', JSON.stringify(messages));
        
        // Show success message
        this.showNotification('Mesajınız başarıyla gönderildi!', 'success');
        e.target.reset();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                </div>
                <div class="notification-message">${message}</div>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto hide
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check',
            error: 'exclamation-triangle',
            warning: 'exclamation',
            info: 'info'
        };
        return icons[type] || 'info';
    }

    hideLoader() {
        const loader = document.getElementById('loading-screen');
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 300);
            }, 1000);
        }
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mainApp = new MainApp();
    
    // Header scroll effect
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', throttle(() => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, 100));
    }
});

// Export for global access
window.MainApp = MainApp; 