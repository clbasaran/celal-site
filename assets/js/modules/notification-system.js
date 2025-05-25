/**
 * Notification System Module
 * Advanced notification system with toast notifications, modal alerts,
 * progress notifications, and sound effects
 * 
 * @version 2.0.0
 * @author Celal Başaran
 * @license MIT
 */

class NotificationSystem {
    constructor(options = {}) {
        this.options = {
            position: options.position || 'top-right',
            maxNotifications: options.maxNotifications || 5,
            defaultDuration: options.defaultDuration || 5000,
            enableSounds: options.enableSounds !== false,
            enableAnimations: options.enableAnimations !== false,
            enableProgress: options.enableProgress !== false,
            respectReducedMotion: options.respectReducedMotion !== false,
            ...options
        };

        this.notifications = new Map();
        this.container = null;
        this.soundContext = null;
        this.isReducedMotion = false;
        
        this.types = {
            success: {
                icon: '✅',
                color: '#10b981',
                sound: 'success'
            },
            error: {
                icon: '❌',
                color: '#ef4444',
                sound: 'error'
            },
            warning: {
                icon: '⚠️',
                color: '#f59e0b',
                sound: 'warning'
            },
            info: {
                icon: 'ℹ️',
                color: '#06b6d4',
                sound: 'info'
            },
            loading: {
                icon: '⏳',
                color: '#6b7280',
                sound: null
            }
        };

        this.sounds = {
            success: [523.25, 659.25, 783.99], // C5, E5, G5
            error: [220, 196, 174.61], // A3, G3, F3
            warning: [440, 554.37], // A4, C#5
            info: [523.25, 659.25] // C5, E5
        };

        this.metrics = {
            totalNotifications: 0,
            notificationsByType: new Map(),
            averageDisplayTime: 0,
            userInteractions: 0
        };

        this.init();
    }

    init() {
        try {
            this.checkReducedMotion();
            this.createContainer();
            this.setupSoundContext();
            this.setupEventListeners();
            
            this.dispatchEvent('notificationSystem:initialized');
            console.log('Notification System initialized');
        } catch (error) {
            console.error('Notification System initialization failed:', error);
        }
    }

    checkReducedMotion() {
        if (!this.options.respectReducedMotion) return;
        
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addEventListener('change', (e) => {
            this.isReducedMotion = e.matches;
        });
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = `notification-container notification-${this.options.position}`;
        this.container.setAttribute('aria-live', 'polite');
        this.container.setAttribute('aria-label', 'Bildirimler');
        
        document.body.appendChild(this.container);
    }

    setupSoundContext() {
        if (!this.options.enableSounds) return;
        
        try {
            this.soundContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.options.enableSounds = false;
        }
    }

    setupEventListeners() {
        // Handle container clicks for dismissing notifications
        this.container.addEventListener('click', (e) => {
            const notification = e.target.closest('.notification');
            if (notification && e.target.closest('.notification-close')) {
                this.dismiss(notification.dataset.id);
            }
        });

        // Handle keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.dismissAll();
            }
        });

        // Handle focus management
        document.addEventListener('focusin', (e) => {
            const notification = e.target.closest('.notification');
            if (notification) {
                this.pauseTimer(notification.dataset.id);
            }
        });

        document.addEventListener('focusout', (e) => {
            const notification = e.target.closest('.notification');
            if (notification) {
                this.resumeTimer(notification.dataset.id);
            }
        });
    }

    // ===== PUBLIC API =====

    /**
     * Show success notification
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    /**
     * Show error notification
     */
    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    /**
     * Show warning notification
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    /**
     * Show info notification
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    /**
     * Show loading notification
     */
    loading(message, options = {}) {
        return this.show(message, 'loading', { 
            duration: 0, 
            dismissible: false,
            ...options 
        });
    }

    /**
     * Show custom notification
     */
    show(message, type = 'info', options = {}) {
        const id = this.generateId();
        const config = this.buildConfig(message, type, options);
        
        // Check if we need to remove old notifications
        this.enforceMaxNotifications();
        
        // Create notification element
        const element = this.createElement(id, config);
        
        // Store notification data
        this.notifications.set(id, {
            id,
            element,
            config,
            timer: null,
            startTime: Date.now(),
            isPaused: false
        });
        
        // Add to container
        this.container.appendChild(element);
        
        // Animate in
        this.animateIn(element);
        
        // Play sound
        this.playSound(type);
        
        // Set auto-dismiss timer
        if (config.duration > 0) {
            this.setTimer(id, config.duration);
        }
        
        // Update metrics
        this.updateMetrics(type);
        
        // Dispatch event
        this.dispatchEvent('notification:shown', { id, type, message });
        
        return id;
    }

    /**
     * Update existing notification
     */
    update(id, updates = {}) {
        const notification = this.notifications.get(id);
        if (!notification) return false;
        
        const { element, config } = notification;
        
        // Update message
        if (updates.message) {
            const messageEl = element.querySelector('.notification-message');
            if (messageEl) {
                messageEl.textContent = updates.message;
            }
        }
        
        // Update type
        if (updates.type && updates.type !== config.type) {
            const typeConfig = this.types[updates.type];
            if (typeConfig) {
                element.className = element.className.replace(/notification-\w+/, `notification-${updates.type}`);
                
                const iconEl = element.querySelector('.notification-icon');
                if (iconEl) {
                    iconEl.textContent = typeConfig.icon;
                }
                
                config.type = updates.type;
                this.playSound(updates.type);
            }
        }
        
        // Update progress
        if (updates.progress !== undefined) {
            this.updateProgress(id, updates.progress);
        }
        
        // Reset timer if duration changed
        if (updates.duration !== undefined) {
            this.clearTimer(id);
            if (updates.duration > 0) {
                this.setTimer(id, updates.duration);
            }
            config.duration = updates.duration;
        }
        
        this.dispatchEvent('notification:updated', { id, updates });
        return true;
    }

    /**
     * Dismiss notification
     */
    dismiss(id) {
        const notification = this.notifications.get(id);
        if (!notification) return false;
        
        const { element } = notification;
        
        // Clear timer
        this.clearTimer(id);
        
        // Animate out
        this.animateOut(element, () => {
            // Remove from DOM
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            
            // Remove from map
            this.notifications.delete(id);
            
            // Update metrics
            const displayTime = Date.now() - notification.startTime;
            this.updateDisplayTimeMetrics(displayTime);
            
            // Dispatch event
            this.dispatchEvent('notification:dismissed', { id });
        });
        
        return true;
    }

    /**
     * Dismiss all notifications
     */
    dismissAll() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.dismiss(id));
    }

    /**
     * Show modal alert
     */
    alert(message, options = {}) {
        return new Promise((resolve) => {
            const config = {
                title: options.title || 'Uyarı',
                type: options.type || 'info',
                confirmText: options.confirmText || 'Tamam',
                ...options
            };
            
            const modal = this.createModal(message, config, (result) => {
                this.removeModal(modal);
                resolve(result);
            });
            
            document.body.appendChild(modal);
            this.animateModalIn(modal);
            
            // Focus first button
            const firstButton = modal.querySelector('button');
            if (firstButton) {
                firstButton.focus();
            }
        });
    }

    /**
     * Show confirmation dialog
     */
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            const config = {
                title: options.title || 'Onay',
                type: options.type || 'warning',
                confirmText: options.confirmText || 'Evet',
                cancelText: options.cancelText || 'Hayır',
                ...options
            };
            
            const modal = this.createModal(message, config, (result) => {
                this.removeModal(modal);
                resolve(result);
            });
            
            document.body.appendChild(modal);
            this.animateModalIn(modal);
            
            // Focus cancel button by default
            const cancelButton = modal.querySelector('.btn-cancel');
            if (cancelButton) {
                cancelButton.focus();
            }
        });
    }

    /**
     * Show progress notification
     */
    progress(message, options = {}) {
        const id = this.show(message, 'loading', {
            duration: 0,
            dismissible: false,
            showProgress: true,
            progress: 0,
            ...options
        });
        
        return {
            update: (progress, newMessage) => {
                const updates = { progress };
                if (newMessage) updates.message = newMessage;
                this.update(id, updates);
            },
            complete: (successMessage) => {
                if (successMessage) {
                    this.update(id, { 
                        type: 'success', 
                        message: successMessage,
                        duration: this.options.defaultDuration,
                        dismissible: true,
                        showProgress: false
                    });
                } else {
                    this.dismiss(id);
                }
            },
            error: (errorMessage) => {
                this.update(id, { 
                    type: 'error', 
                    message: errorMessage,
                    duration: this.options.defaultDuration,
                    dismissible: true,
                    showProgress: false
                });
            },
            dismiss: () => this.dismiss(id)
        };
    }

    // ===== PRIVATE METHODS =====

    buildConfig(message, type, options) {
        const typeConfig = this.types[type] || this.types.info;
        
        return {
            message,
            type,
            icon: options.icon || typeConfig.icon,
            color: options.color || typeConfig.color,
            duration: options.duration !== undefined ? options.duration : this.options.defaultDuration,
            dismissible: options.dismissible !== false,
            showProgress: options.showProgress || false,
            progress: options.progress || 0,
            actions: options.actions || [],
            className: options.className || '',
            ...options
        };
    }

    createElement(id, config) {
        const element = document.createElement('div');
        element.className = `notification notification-${config.type} ${config.className}`.trim();
        element.dataset.id = id;
        element.setAttribute('role', 'alert');
        element.setAttribute('aria-live', 'assertive');
        
        const iconHtml = config.icon ? `<span class="notification-icon">${config.icon}</span>` : '';
        const closeHtml = config.dismissible ? 
            `<button class="notification-close" aria-label="Bildirimi kapat" title="Kapat">×</button>` : '';
        const progressHtml = config.showProgress ? 
            `<div class="notification-progress">
                <div class="notification-progress-bar" style="width: ${config.progress}%"></div>
            </div>` : '';
        const actionsHtml = config.actions.length > 0 ? 
            `<div class="notification-actions">
                ${config.actions.map(action => 
                    `<button class="notification-action" data-action="${action.id}">${action.text}</button>`
                ).join('')}
            </div>` : '';
        
        element.innerHTML = `
            <div class="notification-content">
                ${iconHtml}
                <div class="notification-body">
                    <div class="notification-message">${config.message}</div>
                    ${actionsHtml}
                </div>
                ${closeHtml}
            </div>
            ${progressHtml}
        `;
        
        // Add action event listeners
        if (config.actions.length > 0) {
            element.addEventListener('click', (e) => {
                const actionButton = e.target.closest('.notification-action');
                if (actionButton) {
                    const actionId = actionButton.dataset.action;
                    const action = config.actions.find(a => a.id === actionId);
                    if (action && action.handler) {
                        action.handler();
                    }
                    this.metrics.userInteractions++;
                }
            });
        }
        
        return element;
    }

    createModal(message, config, callback) {
        const modal = document.createElement('div');
        modal.className = 'notification-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'modal-title');
        
        const typeConfig = this.types[config.type] || this.types.info;
        const cancelButton = config.cancelText ? 
            `<button class="btn btn-cancel">${config.cancelText}</button>` : '';
        
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <span class="modal-icon" style="color: ${typeConfig.color}">${typeConfig.icon}</span>
                    <h3 id="modal-title">${config.title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-actions">
                    ${cancelButton}
                    <button class="btn btn-confirm">${config.confirmText}</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const overlay = modal.querySelector('.modal-overlay');
        const confirmBtn = modal.querySelector('.btn-confirm');
        const cancelBtn = modal.querySelector('.btn-cancel');
        
        const handleConfirm = () => callback(true);
        const handleCancel = () => callback(false);
        
        overlay.addEventListener('click', handleCancel);
        confirmBtn.addEventListener('click', handleConfirm);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', handleCancel);
        }
        
        // Keyboard handling
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            } else if (e.key === 'Enter') {
                handleConfirm();
            }
        });
        
        return modal;
    }

    animateIn(element) {
        if (this.isReducedMotion || !this.options.enableAnimations) {
            element.style.opacity = '1';
            element.style.transform = 'none';
            return;
        }
        
        element.style.opacity = '0';
        element.style.transform = this.getInitialTransform();
        
        requestAnimationFrame(() => {
            element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.opacity = '1';
            element.style.transform = 'none';
        });
    }

    animateOut(element, callback) {
        if (this.isReducedMotion || !this.options.enableAnimations) {
            callback();
            return;
        }
        
        element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        element.style.opacity = '0';
        element.style.transform = this.getExitTransform();
        
        setTimeout(callback, 300);
    }

    animateModalIn(modal) {
        if (this.isReducedMotion || !this.options.enableAnimations) {
            return;
        }
        
        const overlay = modal.querySelector('.modal-overlay');
        const content = modal.querySelector('.modal-content');
        
        overlay.style.opacity = '0';
        content.style.opacity = '0';
        content.style.transform = 'scale(0.9) translateY(-20px)';
        
        requestAnimationFrame(() => {
            overlay.style.transition = 'opacity 0.3s ease';
            content.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            overlay.style.opacity = '1';
            content.style.opacity = '1';
            content.style.transform = 'scale(1) translateY(0)';
        });
    }

    removeModal(modal) {
        if (this.isReducedMotion || !this.options.enableAnimations) {
            modal.remove();
            return;
        }
        
        const overlay = modal.querySelector('.modal-overlay');
        const content = modal.querySelector('.modal-content');
        
        overlay.style.opacity = '0';
        content.style.opacity = '0';
        content.style.transform = 'scale(0.9) translateY(-20px)';
        
        setTimeout(() => modal.remove(), 300);
    }

    getInitialTransform() {
        const position = this.options.position;
        
        if (position.includes('top')) {
            return 'translateY(-100%)';
        } else if (position.includes('bottom')) {
            return 'translateY(100%)';
        } else if (position.includes('left')) {
            return 'translateX(-100%)';
        } else if (position.includes('right')) {
            return 'translateX(100%)';
        }
        
        return 'scale(0.8)';
    }

    getExitTransform() {
        return 'translateX(100%) scale(0.8)';
    }

    updateProgress(id, progress) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        const progressBar = notification.element.querySelector('.notification-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        }
    }

    setTimer(id, duration) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        notification.timer = setTimeout(() => {
            this.dismiss(id);
        }, duration);
    }

    clearTimer(id) {
        const notification = this.notifications.get(id);
        if (!notification || !notification.timer) return;
        
        clearTimeout(notification.timer);
        notification.timer = null;
    }

    pauseTimer(id) {
        const notification = this.notifications.get(id);
        if (!notification || notification.isPaused) return;
        
        this.clearTimer(id);
        notification.isPaused = true;
    }

    resumeTimer(id) {
        const notification = this.notifications.get(id);
        if (!notification || !notification.isPaused) return;
        
        const remainingTime = notification.config.duration - (Date.now() - notification.startTime);
        if (remainingTime > 0) {
            this.setTimer(id, remainingTime);
        }
        notification.isPaused = false;
    }

    enforceMaxNotifications() {
        const notifications = Array.from(this.notifications.values());
        const excess = notifications.length - this.options.maxNotifications + 1;
        
        if (excess > 0) {
            // Remove oldest notifications
            notifications
                .sort((a, b) => a.startTime - b.startTime)
                .slice(0, excess)
                .forEach(notification => this.dismiss(notification.id));
        }
    }

    playSound(type) {
        if (!this.options.enableSounds || !this.soundContext || !this.sounds[type]) return;
        
        try {
            const frequencies = this.sounds[type];
            const duration = 0.2;
            
            frequencies.forEach((freq, index) => {
                const oscillator = this.soundContext.createOscillator();
                const gainNode = this.soundContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.soundContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.soundContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, this.soundContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, this.soundContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.soundContext.currentTime + duration);
                
                const startTime = this.soundContext.currentTime + (index * 0.1);
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            });
        } catch (error) {
            console.warn('Failed to play notification sound:', error);
        }
    }

    generateId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    updateMetrics(type) {
        this.metrics.totalNotifications++;
        
        const typeCount = this.metrics.notificationsByType.get(type) || 0;
        this.metrics.notificationsByType.set(type, typeCount + 1);
    }

    updateDisplayTimeMetrics(displayTime) {
        const total = this.metrics.averageDisplayTime * (this.metrics.totalNotifications - 1) + displayTime;
        this.metrics.averageDisplayTime = total / this.metrics.totalNotifications;
    }

    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: { ...detail, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    // ===== PUBLIC API =====

    getMetrics() {
        return { ...this.metrics };
    }

    getActiveNotifications() {
        return Array.from(this.notifications.keys());
    }

    setPosition(position) {
        this.options.position = position;
        this.container.className = `notification-container notification-${position}`;
    }

    destroy() {
        this.dismissAll();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        if (this.soundContext) {
            this.soundContext.close();
        }
        
        this.dispatchEvent('notificationSystem:destroyed');
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.notifications = new NotificationSystem();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}

// Global access
window.NotificationSystem = NotificationSystem; 