/**
 * Portfolio OS - Skills Chart Module
 * Apple Design Language V5
 * Interactive skills visualization with charts and animations
 */

class SkillsChart {
    constructor(options = {}) {
        this.options = {
            containerId: 'skillsChart',
            animationDuration: 2000,
            colors: {
                primary: '#007AFF',
                secondary: '#34C759',
                tertiary: '#AF52DE',
                background: '#F2F2F7',
                text: '#1D1D1F'
            },
            responsive: true,
            showTooltips: true,
            ...options
        };
        
        this.canvas = null;
        this.ctx = null;
        this.isInitialized = false;
        this.currentChart = 'radar';
        this.animationId = null;
        
        // Skills data
        this.skillsData = {
            categories: ['iOS Development', 'AI/ML', 'Tools', 'Design', 'Backend'],
            skills: [
                { name: 'SwiftUI', category: 'iOS Development', level: 95, usage: 90, projects: 25 },
                { name: 'UIKit', category: 'iOS Development', level: 90, usage: 85, projects: 35 },
                { name: 'Swift', category: 'iOS Development', level: 95, usage: 100, projects: 50 },
                { name: 'Core ML', category: 'AI/ML', level: 88, usage: 70, projects: 12 },
                { name: 'Vision', category: 'AI/ML', level: 85, usage: 60, projects: 8 },
                { name: 'ARKit', category: 'AI/ML', level: 87, usage: 65, projects: 8 },
                { name: 'Xcode', category: 'Tools', level: 95, usage: 100, projects: 50 },
                { name: 'Git', category: 'Tools', level: 90, usage: 100, projects: 50 },
                { name: 'Firebase', category: 'Tools', level: 85, usage: 80, projects: 20 },
                { name: 'Figma', category: 'Design', level: 80, usage: 70, projects: 30 },
                { name: 'Animation', category: 'Design', level: 88, usage: 85, projects: 30 },
                { name: 'Node.js', category: 'Backend', level: 75, usage: 40, projects: 15 }
            ]
        };
        
        // Performance tracking
        this.metrics = {
            renderTime: 0,
            animationFrames: 0,
            lastUpdate: performance.now(),
            averageFPS: 0
        };
        
        this.init();
    }
    
    init() {
        try {
            this.setupCanvas();
            this.setupEventListeners();
            this.bindControls();
            this.render();
            
            this.isInitialized = true;
            console.log('📊 Skills Chart initialized');
            
        } catch (error) {
            console.error('❌ Skills Chart initialization failed:', error);
        }
    }
    
    setupCanvas() {
        this.canvas = document.getElementById(this.options.containerId);
        if (!this.canvas) {
            console.warn('Canvas element not found:', this.options.containerId);
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvasSize();
        
        // Setup high DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    setupCanvasSize() {
        if (window.innerWidth < 768) {
            this.canvas.width = 300;
            this.canvas.height = 300;
        } else {
            this.canvas.width = 500;
            this.canvas.height = 400;
        }
    }
    
    setupEventListeners() {
        // Resize handler
        window.addEventListener('resize', this.debounce(() => {
            this.setupCanvasSize();
            this.render();
        }, 250));
        
        // Mouse events for interactivity
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
    }
    
    bindControls() {
        // Chart type selector
        const chartControls = document.querySelectorAll('[data-chart-type]');
        chartControls.forEach(control => {
            control.addEventListener('click', (e) => {
                const chartType = e.target.dataset.chartType;
                if (chartType) {
                    this.changeChartType(chartType);
                }
            });
        });
        
        // Filter controls
        const filterControls = document.querySelectorAll('[data-filter-category]');
        filterControls.forEach(control => {
            control.addEventListener('click', (e) => {
                const category = e.target.dataset.filterCategory;
                this.filterByCategory(category);
            });
        });
    }
    
    render() {
        const startTime = performance.now();
        
        this.clear();
        
        switch (this.currentChart) {
            case 'radar':
                this.renderRadarChart();
                break;
            case 'bar':
                this.renderBarChart();
                break;
            case 'bubble':
                this.renderBubbleChart();
                break;
            default:
                this.renderRadarChart();
        }
        
        this.metrics.renderTime = performance.now() - startTime;
        this.updatePerformanceMetrics();
    }
    
    clear() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderRadarChart() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 60;
        
        // Get category averages
        const categoryData = this.getCategoryAverages();
        const categories = Object.keys(categoryData);
        const values = Object.values(categoryData);
        const angleStep = (Math.PI * 2) / categories.length;
        
        // Draw grid
        this.drawRadarGrid(centerX, centerY, radius, categories);
        
        // Draw data
        this.drawRadarData(centerX, centerY, radius, values, angleStep);
        
        // Draw labels
        this.drawRadarLabels(centerX, centerY, radius, categories, angleStep);
    }
    
    drawRadarGrid(centerX, centerY, radius, categories) {
        this.ctx.strokeStyle = this.options.colors.background;
        this.ctx.lineWidth = 1;
        
        // Draw concentric circles
        for (let i = 1; i <= 5; i++) {
            const r = (radius / 5) * i;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw radial lines
        const angleStep = (Math.PI * 2) / categories.length;
        for (let i = 0; i < categories.length; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
    }
    
    drawRadarData(centerX, centerY, radius, values, angleStep) {
        this.ctx.fillStyle = this.options.colors.primary + '40';
        this.ctx.strokeStyle = this.options.colors.primary;
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        
        for (let i = 0; i < values.length; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const value = values[i] / 100; // Normalize to 0-1
            const x = centerX + Math.cos(angle) * radius * value;
            const y = centerY + Math.sin(angle) * radius * value;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw points
        this.ctx.fillStyle = this.options.colors.primary;
        for (let i = 0; i < values.length; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const value = values[i] / 100;
            const x = centerX + Math.cos(angle) * radius * value;
            const y = centerY + Math.sin(angle) * radius * value;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawRadarLabels(centerX, centerY, radius, categories, angleStep) {
        this.ctx.fillStyle = this.options.colors.text;
        this.ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        for (let i = 0; i < categories.length; i++) {
            const angle = angleStep * i - Math.PI / 2;
            const labelRadius = radius + 30;
            const x = centerX + Math.cos(angle) * labelRadius;
            const y = centerY + Math.sin(angle) * labelRadius;
            
            this.ctx.fillText(categories[i], x, y);
        }
    }
    
    renderBarChart() {
        const margin = 60;
        const chartWidth = this.canvas.width - margin * 2;
        const chartHeight = this.canvas.height - margin * 2;
        
        const topSkills = this.getTopSkills(10);
        const barHeight = chartHeight / topSkills.length;
        const maxValue = Math.max(...topSkills.map(skill => skill.level));
        
        // Draw bars
        topSkills.forEach((skill, index) => {
            const y = margin + index * barHeight;
            const barWidth = (skill.level / maxValue) * chartWidth;
            
            // Background bar
            this.ctx.fillStyle = this.options.colors.background;
            this.ctx.fillRect(margin, y + 5, chartWidth, barHeight - 10);
            
            // Skill bar
            const gradient = this.ctx.createLinearGradient(margin, 0, margin + barWidth, 0);
            gradient.addColorStop(0, this.options.colors.primary);
            gradient.addColorStop(1, this.options.colors.secondary);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(margin, y + 5, barWidth, barHeight - 10);
            
            // Skill name
            this.ctx.fillStyle = this.options.colors.text;
            this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(skill.name, margin - 50, y + barHeight / 2);
            
            // Skill level
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${skill.level}%`, margin + chartWidth + 30, y + barHeight / 2);
        });
    }
    
    renderBubbleChart() {
        const margin = 80;
        const chartWidth = this.canvas.width - margin * 2;
        const chartHeight = this.canvas.height - margin * 2;
        
        const maxLevel = Math.max(...this.skillsData.skills.map(s => s.level));
        const maxUsage = Math.max(...this.skillsData.skills.map(s => s.usage));
        const maxProjects = Math.max(...this.skillsData.skills.map(s => s.projects));
        
        // Draw axes
        this.drawAxes(margin, chartWidth, chartHeight);
        
        // Draw bubbles
        this.skillsData.skills.forEach((skill, index) => {
            const x = margin + (skill.level / maxLevel) * chartWidth;
            const y = margin + chartHeight - (skill.usage / maxUsage) * chartHeight;
            const radius = (skill.projects / maxProjects) * 30 + 5;
            
            // Bubble
            const color = this.getCategoryColor(skill.category);
            this.ctx.fillStyle = color + '80';
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Label
            this.ctx.fillStyle = this.options.colors.text;
            this.ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(skill.name, x, y);
        });
        
        // Draw legend
        this.drawBubbleLegend(margin, chartHeight);
    }
    
    drawAxes(margin, chartWidth, chartHeight) {
        this.ctx.strokeStyle = this.options.colors.background;
        this.ctx.lineWidth = 2;
        
        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(margin, margin + chartHeight);
        this.ctx.lineTo(margin + chartWidth, margin + chartHeight);
        this.ctx.stroke();
        
        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(margin, margin);
        this.ctx.lineTo(margin, margin + chartHeight);
        this.ctx.stroke();
        
        // Labels
        this.ctx.fillStyle = this.options.colors.text;
        this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Expertise Level', margin + chartWidth / 2, margin + chartHeight + 20);
        
        this.ctx.save();
        this.ctx.translate(margin - 40, margin + chartHeight / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Usage Frequency', 0, 0);
        this.ctx.restore();
    }
    
    drawBubbleLegend(margin, chartHeight) {
        const legendX = margin;
        const legendY = margin - 40;
        
        this.ctx.fillStyle = this.options.colors.text;
        this.ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Bubble size = Project count', legendX, legendY);
    }
    
    getCategoryAverages() {
        const categories = {};
        
        this.skillsData.categories.forEach(category => {
            const categorySkills = this.skillsData.skills.filter(skill => 
                skill.category === category
            );
            
            if (categorySkills.length > 0) {
                const average = categorySkills.reduce((sum, skill) => 
                    sum + skill.level, 0) / categorySkills.length;
                categories[category] = average;
            }
        });
        
        return categories;
    }
    
    getTopSkills(count = 10) {
        return [...this.skillsData.skills]
            .sort((a, b) => b.level - a.level)
            .slice(0, count);
    }
    
    getCategoryColor(category) {
        const colors = {
            'iOS Development': this.options.colors.primary,
            'AI/ML': this.options.colors.secondary,
            'Tools': this.options.colors.tertiary,
            'Design': '#FF9500',
            'Backend': '#FF3B30'
        };
        
        return colors[category] || this.options.colors.primary;
    }
    
    changeChartType(type) {
        this.currentChart = type;
        this.render();
        
        // Update UI
        document.querySelectorAll('[data-chart-type]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-chart-type="${type}"]`)?.classList.add('active');
    }
    
    filterByCategory(category) {
        if (category === 'all') {
            // Show all skills
            this.render();
        } else {
            // Filter and re-render
            this.render();
        }
    }
    
    handleMouseMove(e) {
        if (!this.options.showTooltips) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if mouse is over any data point
        const hoveredPoint = this.getPointAtPosition(x, y);
        
        if (hoveredPoint) {
            this.showTooltip(hoveredPoint, x, y);
        } else {
            this.hideTooltip();
        }
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const clickedPoint = this.getPointAtPosition(x, y);
        
        if (clickedPoint) {
            this.onSkillClick(clickedPoint);
        }
    }
    
    getPointAtPosition(x, y) {
        // Implementation depends on current chart type
        // This is a simplified version
        return null;
    }
    
    showTooltip(data, x, y) {
        // Create or update tooltip element
        let tooltip = document.getElementById('skills-chart-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'skills-chart-tooltip';
            tooltip.style.cssText = `
                position: absolute;
                background: var(--bg-primary);
                border: 1px solid var(--separator);
                border-radius: var(--radius-lg);
                padding: var(--space-3);
                font-size: var(--text-sm);
                box-shadow: var(--shadow-lg);
                pointer-events: none;
                z-index: 1000;
                opacity: 0;
                transition: opacity var(--duration-fast) var(--ease-out);
            `;
            document.body.appendChild(tooltip);
        }
        
        tooltip.innerHTML = `
            <div><strong>${data.name}</strong></div>
            <div>Level: ${data.level}%</div>
            <div>Usage: ${data.usage}%</div>
            <div>Projects: ${data.projects}</div>
        `;
        
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.style.opacity = '1';
    }
    
    hideTooltip() {
        const tooltip = document.getElementById('skills-chart-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
        }
    }
    
    onSkillClick(skill) {
        // Emit custom event
        const event = new CustomEvent('skillClick', {
            detail: skill
        });
        
        window.dispatchEvent(event);
        document.dispatchEvent(event);
    }
    
    updatePerformanceMetrics() {
        const now = performance.now();
        const deltaTime = now - this.metrics.lastUpdate;
        
        if (deltaTime > 0) {
            const fps = 1000 / deltaTime;
            this.metrics.averageFPS = (this.metrics.averageFPS + fps) / 2;
        }
        
        this.metrics.lastUpdate = now;
        this.metrics.animationFrames++;
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            isInitialized: this.isInitialized,
            currentChart: this.currentChart,
            skillsCount: this.skillsData.skills.length,
            categoriesCount: this.skillsData.categories.length
        };
    }
    
    debounce(func, wait) {
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
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.setupCanvasSize);
        
        // Remove tooltip
        const tooltip = document.getElementById('skills-chart-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
        
        console.log('📊 Skills Chart destroyed');
    }
}

// Auto-initialization
function initializeSkillsChart() {
    if (typeof window !== 'undefined') {
        window.SkillsChart = SkillsChart;
        
        // Initialize when canvas is available
        const initChart = () => {
            const canvas = document.getElementById('skillsChart');
            if (canvas) {
                window.skillsChart = new SkillsChart({
                    containerId: 'skillsChart',
                    animationDuration: 2000,
                    responsive: true,
                    showTooltips: true
                });
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initChart);
        } else {
            initChart();
        }
    }
}

// Initialize when module is loaded
initializeSkillsChart();

export default SkillsChart; 