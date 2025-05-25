/**
 * Portfolio OS - Modal Manager Module
 * Apple Design Language V5
 * Advanced modal and popup management system
 */

class ModalManager {
    constructor(options = {}) {
        this.options = {
            closeOnEscape: true,
            closeOnOverlayClick: true,
            animationDuration: 300,
            stackable: true,
            preventBodyScroll: true,
            focusTrap: true,
            autoFocus: true,
            restoreFocus: true,
            debug: false,
            ...options
        };
        
        this.modals = new Map();
        this.stack = [];
        this.listeners = new Map();
        this.focusHistory = [];
        
        // Performance tracking
        this.metrics = {
            modalsCreated: 0,
            modalsOpened: 0,
            modalsClosed: 0,
            averageOpenTime: 0,
            userInteractions: 0
        };
        
        this.init();
    }
    
    init() {
        try {
            this.setupEventListeners();
            this.createGlobalStyles();
            this.registerDefaultModals();
            
            if (this.options.debug) {
                console.log('🔲 Modal Manager initialized');
            }
            
        } catch (error) {
            console.error('❌ Modal Manager initialization failed:', error);
        }
    }
    
    setupEventListeners() {
        // Global keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.options.closeOnEscape) {
                this.closeTopModal();
            }
            
            if (e.key === 'Tab' && this.options.focusTrap) {
                this.handleTabKey(e);
            }
        });
        
        // Handle clicks on modal triggers
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-modal-target]');
            if (trigger) {
                e.preventDefault();
                const modalId = trigger.dataset.modalTarget;
                this.open(modalId);
            }
            
            const closeTrigger = e.target.closest('[data-modal-close]');
            if (closeTrigger) {
                e.preventDefault();
                const modalId = closeTrigger.dataset.modalClose || this.getTopModalId();
                this.close(modalId);
            }
        });
        
        // Handle resize events
        window.addEventListener('resize', this.debounce(() => {
            this.stack.forEach(modalId => {
                const modal = this.modals.get(modalId);
                if (modal && modal.isOpen) {
                    this.centerModal(modal.element);
                }
            });
        }, 100));
    }
    
    createGlobalStyles() {
        if (document.getElementById('modal-manager-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'modal-manager-styles';
        styles.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(20px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: all var(--duration-normal) var(--ease-out);
            }
            
            .modal-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            .modal {
                background: var(--bg-primary);
                border-radius: var(--radius-2xl);
                border: 1px solid var(--separator);
                box-shadow: var(--shadow-2xl);
                max-width: 90vw;
                max-height: 90vh;
                width: 100%;
                margin: auto;
                position: relative;
                transform: scale(0.9) translateY(20px);
                transition: all var(--duration-normal) var(--ease-out);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .modal-overlay.active .modal {
                transform: scale(1) translateY(0);
            }
            
            .modal-header {
                padding: var(--space-6);
                border-bottom: 1px solid var(--separator);
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-shrink: 0;
            }
            
            .modal-title {
                font-size: var(--text-xl);
                font-weight: 600;
                color: var(--text-primary);
                margin: 0;
            }
            
            .modal-close {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: none;
                background: var(--fill-quaternary);
                color: var(--text-secondary);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all var(--duration-fast) var(--ease-out);
            }
            
            .modal-close:hover {
                background: var(--red);
                color: white;
            }
            
            .modal-body {
                padding: var(--space-6);
                flex: 1;
                overflow-y: auto;
            }
            
            .modal-footer {
                padding: var(--space-6);
                border-top: 1px solid var(--separator);
                display: flex;
                gap: var(--space-3);
                justify-content: flex-end;
                flex-shrink: 0;
            }
            
            .modal-btn {
                padding: var(--space-3) var(--space-6);
                border-radius: var(--radius-lg);
                border: 1px solid var(--separator);
                background: var(--bg-secondary);
                color: var(--text-primary);
                font-weight: 500;
                cursor: pointer;
                transition: all var(--duration-fast) var(--ease-out);
            }
            
            .modal-btn:hover {
                background: var(--fill-tertiary);
            }
            
            .modal-btn.primary {
                background: var(--blue);
                color: white;
                border-color: var(--blue);
            }
            
            .modal-btn.primary:hover {
                background: var(--blue-dark);
            }
            
            .modal-btn.danger {
                background: var(--red);
                color: white;
                border-color: var(--red);
            }
            
            .modal-btn.danger:hover {
                background: var(--red-dark);
            }
            
            body.modal-open {
                overflow: hidden;
            }
            
            @media (max-width: 768px) {
                .modal {
                    max-width: 95vw;
                    max-height: 95vh;
                    margin: var(--space-4);
                }
                
                .modal-header,
                .modal-body,
                .modal-footer {
                    padding: var(--space-4);
                }
                
                .modal-footer {
                    flex-direction: column;
                }
                
                .modal-btn {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // Modal Creation and Registration
    create(id, config = {}) {
        if (this.modals.has(id)) {
            console.warn(`Modal "${id}" already exists`);
            return this.modals.get(id);
        }
        
        const modal = {
            id,
            element: null,
            overlay: null,
            isOpen: false,
            openTime: null,
            config: {
                title: '',
                content: '',
                size: 'medium',
                closeButton: true,
                footer: null,
                customClass: '',
                beforeOpen: null,
                afterOpen: null,
                beforeClose: null,
                afterClose: null,
                ...config
            }
        };
        
        this.buildModal(modal);
        this.modals.set(id, modal);
        this.metrics.modalsCreated++;
        
        if (this.options.debug) {
            console.log(`🔲 Modal created: ${id}`);
        }
        
        return modal;
    }
    
    buildModal(modal) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', `${modal.id}-title`);
        
        if (this.options.closeOnOverlayClick) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.close(modal.id);
                }
            });
        }
        
        // Create modal container
        const modalElement = document.createElement('div');
        modalElement.className = `modal ${modal.config.customClass}`;
        modalElement.setAttribute('data-modal-id', modal.id);
        
        // Size classes
        const sizeClasses = {
            small: 'max-width: 400px;',
            medium: 'max-width: 600px;',
            large: 'max-width: 800px;',
            xlarge: 'max-width: 1000px;',
            fullscreen: 'max-width: 95vw; max-height: 95vh;'
        };
        
        if (sizeClasses[modal.config.size]) {
            modalElement.style.cssText = sizeClasses[modal.config.size];
        }
        
        // Build header
        if (modal.config.title || modal.config.closeButton) {
            const header = document.createElement('div');
            header.className = 'modal-header';
            
            if (modal.config.title) {
                const title = document.createElement('h3');
                title.className = 'modal-title';
                title.id = `${modal.id}-title`;
                title.textContent = modal.config.title;
                header.appendChild(title);
            }
            
            if (modal.config.closeButton) {
                const closeBtn = document.createElement('button');
                closeBtn.className = 'modal-close';
                closeBtn.innerHTML = '×';
                closeBtn.setAttribute('aria-label', 'Close modal');
                closeBtn.addEventListener('click', () => this.close(modal.id));
                header.appendChild(closeBtn);
            }
            
            modalElement.appendChild(header);
        }
        
        // Build body
        const body = document.createElement('div');
        body.className = 'modal-body';
        
        if (typeof modal.config.content === 'string') {
            body.innerHTML = modal.config.content;
        } else if (modal.config.content instanceof HTMLElement) {
            body.appendChild(modal.config.content);
        }
        
        modalElement.appendChild(body);
        
        // Build footer
        if (modal.config.footer) {
            const footer = document.createElement('div');
            footer.className = 'modal-footer';
            
            if (typeof modal.config.footer === 'string') {
                footer.innerHTML = modal.config.footer;
            } else if (Array.isArray(modal.config.footer)) {
                modal.config.footer.forEach(button => {
                    const btn = document.createElement('button');
                    btn.className = `modal-btn ${button.type || ''}`;
                    btn.textContent = button.text;
                    
                    if (button.action) {
                        btn.addEventListener('click', () => {
                            button.action(modal, this);
                        });
                    }
                    
                    footer.appendChild(btn);
                });
            }
            
            modalElement.appendChild(footer);
        }
        
        overlay.appendChild(modalElement);
        modal.element = modalElement;
        modal.overlay = overlay;
    }
    
    // Modal Operations
    open(id, data = {}) {
        const modal = this.modals.get(id);
        if (!modal) {
            console.warn(`Modal "${id}" not found`);
            return false;
        }
        
        if (modal.isOpen) {
            return true;
        }
        
        // Execute beforeOpen callback
        if (modal.config.beforeOpen) {
            const result = modal.config.beforeOpen(modal, data);
            if (result === false) return false;
        }
        
        // Store current focus
        if (this.options.restoreFocus) {
            this.focusHistory.push(document.activeElement);
        }
        
        // Add to DOM
        document.body.appendChild(modal.overlay);
        
        // Prevent body scroll
        if (this.options.preventBodyScroll) {
            document.body.classList.add('modal-open');
        }
        
        // Add to stack
        if (this.options.stackable) {
            this.stack.push(id);
            modal.overlay.style.zIndex = 1000 + this.stack.length;
        } else {
            this.closeAll();
            this.stack = [id];
        }
        
        // Update state
        modal.isOpen = true;
        modal.openTime = Date.now();
        this.metrics.modalsOpened++;
        
        // Trigger animation
        requestAnimationFrame(() => {
            modal.overlay.classList.add('active');
        });
        
        // Handle focus
        if (this.options.autoFocus) {
            this.setInitialFocus(modal);
        }
        
        // Execute afterOpen callback
        setTimeout(() => {
            if (modal.config.afterOpen) {
                modal.config.afterOpen(modal, data);
            }
            
            this.emit('open', { modal, data });
        }, this.options.animationDuration);
        
        if (this.options.debug) {
            console.log(`🔲 Modal opened: ${id}`);
        }
        
        return true;
    }
    
    close(id) {
        const modal = this.modals.get(id);
        if (!modal || !modal.isOpen) {
            return false;
        }
        
        // Execute beforeClose callback
        if (modal.config.beforeClose) {
            const result = modal.config.beforeClose(modal);
            if (result === false) return false;
        }
        
        // Update metrics
        if (modal.openTime) {
            const openDuration = Date.now() - modal.openTime;
            this.metrics.averageOpenTime = 
                (this.metrics.averageOpenTime + openDuration) / 2;
        }
        
        // Remove from stack
        const stackIndex = this.stack.indexOf(id);
        if (stackIndex > -1) {
            this.stack.splice(stackIndex, 1);
        }
        
        // Update state
        modal.isOpen = false;
        modal.openTime = null;
        this.metrics.modalsClosed++;
        
        // Trigger animation
        modal.overlay.classList.remove('active');
        
        setTimeout(() => {
            // Remove from DOM
            if (modal.overlay.parentNode) {
                modal.overlay.parentNode.removeChild(modal.overlay);
            }
            
            // Restore body scroll if no modals are open
            if (this.stack.length === 0 && this.options.preventBodyScroll) {
                document.body.classList.remove('modal-open');
            }
            
            // Restore focus
            if (this.options.restoreFocus && this.focusHistory.length > 0) {
                const previousFocus = this.focusHistory.pop();
                if (previousFocus && previousFocus.focus) {
                    previousFocus.focus();
                }
            }
            
            // Execute afterClose callback
            if (modal.config.afterClose) {
                modal.config.afterClose(modal);
            }
            
            this.emit('close', { modal });
            
        }, this.options.animationDuration);
        
        if (this.options.debug) {
            console.log(`🔲 Modal closed: ${id}`);
        }
        
        return true;
    }
    
    closeAll() {
        const openModals = [...this.stack];
        openModals.forEach(id => this.close(id));
    }
    
    closeTopModal() {
        if (this.stack.length > 0) {
            const topModalId = this.stack[this.stack.length - 1];
            this.close(topModalId);
        }
    }
    
    // Utility Methods
    isOpen(id) {
        const modal = this.modals.get(id);
        return modal ? modal.isOpen : false;
    }
    
    getModal(id) {
        return this.modals.get(id);
    }
    
    getTopModalId() {
        return this.stack.length > 0 ? this.stack[this.stack.length - 1] : null;
    }
    
    updateContent(id, content) {
        const modal = this.modals.get(id);
        if (!modal) return false;
        
        const body = modal.element.querySelector('.modal-body');
        if (body) {
            if (typeof content === 'string') {
                body.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                body.innerHTML = '';
                body.appendChild(content);
            }
            return true;
        }
        
        return false;
    }
    
    updateTitle(id, title) {
        const modal = this.modals.get(id);
        if (!modal) return false;
        
        const titleElement = modal.element.querySelector('.modal-title');
        if (titleElement) {
            titleElement.textContent = title;
            return true;
        }
        
        return false;
    }
    
    // Focus Management
    setInitialFocus(modal) {
        const focusableElements = this.getFocusableElements(modal.element);
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
    
    getFocusableElements(container) {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])'
        ];
        
        return Array.from(container.querySelectorAll(focusableSelectors.join(', ')))
            .filter(el => {
                return el.offsetWidth > 0 && el.offsetHeight > 0;
            });
    }
    
    handleTabKey(e) {
        if (this.stack.length === 0) return;
        
        const topModalId = this.stack[this.stack.length - 1];
        const modal = this.modals.get(topModalId);
        if (!modal) return;
        
        const focusableElements = this.getFocusableElements(modal.element);
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }
    
    centerModal(modalElement) {
        // Reset any previous positioning
        modalElement.style.marginTop = '';
        modalElement.style.marginBottom = '';
        
        const rect = modalElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        if (rect.height > viewportHeight * 0.9) {
            modalElement.style.marginTop = '5vh';
            modalElement.style.marginBottom = '5vh';
        }
    }
    
    // Predefined Modals
    registerDefaultModals() {
        // Confirmation modal
        this.create('confirm', {
            title: 'Confirm Action',
            size: 'small',
            footer: [
                {
                    text: 'Cancel',
                    type: '',
                    action: (modal, manager) => manager.close('confirm')
                },
                {
                    text: 'Confirm',
                    type: 'primary',
                    action: (modal, manager) => {
                        if (modal.confirmCallback) {
                            modal.confirmCallback();
                        }
                        manager.close('confirm');
                    }
                }
            ]
        });
        
        // Alert modal
        this.create('alert', {
            title: 'Alert',
            size: 'small',
            footer: [
                {
                    text: 'OK',
                    type: 'primary',
                    action: (modal, manager) => manager.close('alert')
                }
            ]
        });
        
        // Loading modal
        this.create('loading', {
            title: 'Loading...',
            content: '<div style="text-align: center; padding: 2rem;"><div class="spinner"></div></div>',
            size: 'small',
            closeButton: false
        });
    }
    
    // Convenience Methods
    confirm(message, callback, options = {}) {
        const modal = this.getModal('confirm');
        modal.confirmCallback = callback;
        
        this.updateContent('confirm', message);
        this.updateTitle('confirm', options.title || 'Confirm Action');
        
        return this.open('confirm');
    }
    
    alert(message, options = {}) {
        this.updateContent('alert', message);
        this.updateTitle('alert', options.title || 'Alert');
        
        return this.open('alert');
    }
    
    loading(show = true, message = 'Loading...') {
        if (show) {
            this.updateContent('loading', `<div style="text-align: center; padding: 2rem;">${message}</div>`);
            return this.open('loading');
        } else {
            return this.close('loading');
        }
    }
    
    // Event System
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in modal callback for ${event}:`, error);
                }
            });
        }
    }
    
    // Utility Functions
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
    
    getMetrics() {
        return {
            ...this.metrics,
            modalsRegistered: this.modals.size,
            modalsOpen: this.stack.length,
            currentStack: [...this.stack]
        };
    }
    
    destroy() {
        this.closeAll();
        
        // Remove global styles
        const styles = document.getElementById('modal-manager-styles');
        if (styles) {
            styles.remove();
        }
        
        // Clear data
        this.modals.clear();
        this.listeners.clear();
        this.stack = [];
        this.focusHistory = [];
        
        console.log('🔲 Modal Manager destroyed');
    }
}

// Auto-initialization
function initializeModalManager() {
    if (typeof window !== 'undefined') {
        window.ModalManager = ModalManager;
        window.modals = new ModalManager();
        
        // Global convenience functions
        window.showModal = (id, data) => window.modals.open(id, data);
        window.hideModal = (id) => window.modals.close(id);
        window.confirmDialog = (message, callback, options) => 
            window.modals.confirm(message, callback, options);
        window.alertDialog = (message, options) => 
            window.modals.alert(message, options);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModalManager);
} else {
    initializeModalManager();
}

export default ModalManager; 