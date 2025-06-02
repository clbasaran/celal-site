class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = new Map();
        this.init();
    }

    init() {
        this.createContainer();
    }

    createContainer() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', options = {}) {
        const defaultOptions = {
            duration: 4000,
            closable: true,
            showProgress: true,
            id: null
        };

        const config = { ...defaultOptions, ...options };
        const toastId = config.id || Date.now().toString();

        // Aynı ID'ye sahip toast varsa kaldır
        if (this.toasts.has(toastId)) {
            this.hide(toastId);
        }

        const toast = this.createToast(message, type, config, toastId);
        this.container.appendChild(toast);
        this.toasts.set(toastId, toast);

        // Animasyon için setTimeout
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Progress bar animasyonu
        if (config.showProgress && config.duration > 0) {
            this.startProgressBar(toast, config.duration);
        }

        // Otomatik kapatma
        if (config.duration > 0) {
            setTimeout(() => {
                this.hide(toastId);
            }, config.duration);
        }

        return toastId;
    }

    createToast(message, type, config, toastId) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.dataset.toastId = toastId;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <div class="toast-message">${message}</div>
                ${config.closable ? '<button class="toast-close" aria-label="Kapat">×</button>' : ''}
            </div>
            ${config.showProgress ? '<div class="toast-progress"></div>' : ''}
        `;

        // Kapatma butonu event listener'ı
        if (config.closable) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => {
                this.hide(toastId);
            });
        }

        // Toast'a tıklama ile kapatma
        toast.addEventListener('click', (e) => {
            if (e.target === toast || e.target === toast.querySelector('.toast-content')) {
                this.hide(toastId);
            }
        });

        // Keyboard support
        toast.setAttribute('tabindex', '0');
        toast.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide(toastId);
            }
        });

        return toast;
    }

    startProgressBar(toast, duration) {
        const progressBar = toast.querySelector('.toast-progress');
        if (!progressBar) return;

        progressBar.style.width = '100%';
        progressBar.style.transition = `width ${duration}ms linear`;
        
        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 10);
    }

    hide(toastId) {
        const toast = this.toasts.get(toastId);
        if (!toast) return;

        toast.classList.remove('show');
        toast.classList.add('hide');

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(toastId);
        }, 400);
    }

    hideAll() {
        this.toasts.forEach((toast, id) => {
            this.hide(id);
        });
    }

    // Convenience methods
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', options);
    }

    // Özel metodlar
    saved() {
        return this.success('Kaydedildi', { duration: 2000 });
    }

    jsonError() {
        return this.error('Geçersiz JSON verisi', { duration: 3000 });
    }

    networkError() {
        return this.error('Ağ bağlantısı hatası', { duration: 4000 });
    }

    loading(message = 'Yükleniyor...') {
        return this.info(message, { duration: 0, closable: false, showProgress: false });
    }
}

// Global toast instance oluştur
window.toast = new ToastManager();

// Global kullanım için shortcut metodlar
window.showToast = (message, type, options) => toast.show(message, type, options);
window.toastSuccess = (message, options) => toast.success(message, options);
window.toastError = (message, options) => toast.error(message, options);
window.toastWarning = (message, options) => toast.warning(message, options);
window.toastInfo = (message, options) => toast.info(message, options);

export default ToastManager; 