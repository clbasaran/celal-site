/**
 * Portfolio OS - FAQ Toggle Module
 * Apple Design Language V5
 * Interactive FAQ accordion with smooth animations
 */

class FAQToggle {
    constructor(options = {}) {
        this.options = {
            selector: '.faq-item',
            questionSelector: '.faq-question',
            answerSelector: '.faq-answer',
            iconSelector: '.faq-icon',
            animationDuration: 300,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            allowMultiple: false,
            autoClose: true,
            ...options
        };
        
        this.faqItems = [];
        this.activeItems = new Set();
        
        // Performance tracking
        this.metrics = {
            totalToggles: 0,
            averageAnimationTime: 0,
            itemsProcessed: 0
        };
        
        this.init();
    }
    
    init() {
        try {
            this.findFAQItems();
            this.setupEventListeners();
            this.setupKeyboardNavigation();
            
            console.log(`❓ FAQ Toggle initialized with ${this.faqItems.length} items`);
            
        } catch (error) {
            console.error('❌ FAQ Toggle initialization failed:', error);
        }
    }
    
    findFAQItems() {
        const items = document.querySelectorAll(this.options.selector);
        
        items.forEach((item, index) => {
            const question = item.querySelector(this.options.questionSelector);
            const answer = item.querySelector(this.options.answerSelector);
            const icon = item.querySelector(this.options.iconSelector);
            
            if (question && answer) {
                const faqData = {
                    element: item,
                    question: question,
                    answer: answer,
                    icon: icon,
                    index: index,
                    isOpen: false,
                    id: `faq-${index}`
                };
                
                this.setupFAQItem(faqData);
                this.faqItems.push(faqData);
            }
        });
        
        this.metrics.itemsProcessed = this.faqItems.length;
    }
    
    setupFAQItem(faqData) {
        const { question, answer, icon, id } = faqData;
        
        // Set up ARIA attributes
        question.setAttribute('aria-expanded', 'false');
        question.setAttribute('aria-controls', `${id}-answer`);
        question.setAttribute('id', `${id}-question`);
        
        answer.setAttribute('id', `${id}-answer`);
        answer.setAttribute('aria-labelledby', `${id}-question`);
        answer.setAttribute('role', 'region');
        
        // Set initial styles
        answer.style.maxHeight = '0';
        answer.style.overflow = 'hidden';
        answer.style.transition = `max-height ${this.options.animationDuration}ms ${this.options.easing}`;
        
        // Add tabindex for keyboard navigation
        question.setAttribute('tabindex', '0');
    }
    
    setupEventListeners() {
        this.faqItems.forEach(faqData => {
            const { question } = faqData;
            
            // Click event
            question.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleFAQ(faqData);
            });
            
            // Keyboard events
            question.addEventListener('keydown', (e) => {
                this.handleKeydown(e, faqData);
            });
        });
    }
    
    setupKeyboardNavigation() {
        // Add keyboard navigation between FAQ items
        document.addEventListener('keydown', (e) => {
            if (e.target.matches(this.options.questionSelector)) {
                this.handleGlobalKeydown(e);
            }
        });
    }
    
    handleKeydown(e, faqData) {
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.toggleFAQ(faqData);
                break;
            case 'Escape':
                if (faqData.isOpen) {
                    this.closeFAQ(faqData);
                }
                break;
        }
    }
    
    handleGlobalKeydown(e) {
        const currentIndex = this.faqItems.findIndex(item => 
            item.question === e.target
        );
        
        if (currentIndex === -1) return;
        
        let targetIndex = currentIndex;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                targetIndex = (currentIndex + 1) % this.faqItems.length;
                break;
            case 'ArrowUp':
                e.preventDefault();
                targetIndex = currentIndex === 0 ? 
                    this.faqItems.length - 1 : currentIndex - 1;
                break;
            case 'Home':
                e.preventDefault();
                targetIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                targetIndex = this.faqItems.length - 1;
                break;
            default:
                return;
        }
        
        this.faqItems[targetIndex].question.focus();
    }
    
    async toggleFAQ(faqData) {
        const startTime = performance.now();
        
        if (faqData.isOpen) {
            await this.closeFAQ(faqData);
        } else {
            // Close other items if allowMultiple is false
            if (!this.options.allowMultiple && this.options.autoClose) {
                await this.closeAllExcept(faqData);
            }
            
            await this.openFAQ(faqData);
        }
        
        // Update metrics
        this.metrics.totalToggles++;
        const animationTime = performance.now() - startTime;
        this.updateMetrics(animationTime);
        
        // Dispatch toggle event
        this.dispatchToggleEvent(faqData);
    }
    
    async openFAQ(faqData) {
        const { question, answer, icon } = faqData;
        
        // Update state
        faqData.isOpen = true;
        this.activeItems.add(faqData);
        
        // Update ARIA
        question.setAttribute('aria-expanded', 'true');
        
        // Add active class
        faqData.element.classList.add('faq-active');
        
        // Animate icon
        if (icon) {
            icon.style.transform = 'rotate(45deg)';
        }
        
        // Calculate content height
        const contentHeight = this.getContentHeight(answer);
        
        // Animate open
        answer.style.maxHeight = `${contentHeight}px`;
        
        // Wait for animation to complete
        await this.waitForAnimation(this.options.animationDuration);
        
        // Set to auto for dynamic content
        answer.style.maxHeight = 'auto';
        
        console.log(`❓ FAQ opened: ${faqData.index}`);
    }
    
    async closeFAQ(faqData) {
        const { question, answer, icon } = faqData;
        
        // Get current height
        const currentHeight = answer.scrollHeight;
        answer.style.maxHeight = `${currentHeight}px`;
        
        // Force reflow
        answer.offsetHeight;
        
        // Update state
        faqData.isOpen = false;
        this.activeItems.delete(faqData);
        
        // Update ARIA
        question.setAttribute('aria-expanded', 'false');
        
        // Remove active class
        faqData.element.classList.remove('faq-active');
        
        // Animate icon
        if (icon) {
            icon.style.transform = 'rotate(0deg)';
        }
        
        // Animate close
        answer.style.maxHeight = '0';
        
        // Wait for animation to complete
        await this.waitForAnimation(this.options.animationDuration);
        
        console.log(`❓ FAQ closed: ${faqData.index}`);
    }
    
    async closeAllExcept(exceptItem) {
        const closePromises = Array.from(this.activeItems)
            .filter(item => item !== exceptItem)
            .map(item => this.closeFAQ(item));
        
        await Promise.all(closePromises);
    }
    
    getContentHeight(element) {
        // Temporarily set to auto to measure
        const originalMaxHeight = element.style.maxHeight;
        const originalOverflow = element.style.overflow;
        
        element.style.maxHeight = 'auto';
        element.style.overflow = 'visible';
        
        const height = element.scrollHeight;
        
        // Restore original styles
        element.style.maxHeight = originalMaxHeight;
        element.style.overflow = originalOverflow;
        
        return height;
    }
    
    waitForAnimation(duration) {
        return new Promise(resolve => {
            setTimeout(resolve, duration);
        });
    }
    
    dispatchToggleEvent(faqData) {
        const event = new CustomEvent('faqToggle', {
            detail: {
                faqData,
                isOpen: faqData.isOpen,
                index: faqData.index,
                timestamp: performance.now()
            }
        });
        
        faqData.element.dispatchEvent(event);
        document.dispatchEvent(event);
    }
    
    updateMetrics(animationTime) {
        if (this.metrics.averageAnimationTime === 0) {
            this.metrics.averageAnimationTime = animationTime;
        } else {
            this.metrics.averageAnimationTime = 
                (this.metrics.averageAnimationTime * 0.9) + (animationTime * 0.1);
        }
    }
    
    // Public API methods
    openItem(index) {
        const faqData = this.faqItems[index];
        if (faqData && !faqData.isOpen) {
            this.toggleFAQ(faqData);
        }
    }
    
    closeItem(index) {
        const faqData = this.faqItems[index];
        if (faqData && faqData.isOpen) {
            this.toggleFAQ(faqData);
        }
    }
    
    openAll() {
        if (!this.options.allowMultiple) {
            console.warn('Cannot open all items when allowMultiple is false');
            return;
        }
        
        this.faqItems.forEach(faqData => {
            if (!faqData.isOpen) {
                this.openFAQ(faqData);
            }
        });
    }
    
    closeAll() {
        Array.from(this.activeItems).forEach(faqData => {
            this.closeFAQ(faqData);
        });
    }
    
    getOpenItems() {
        return Array.from(this.activeItems).map(item => item.index);
    }
    
    isItemOpen(index) {
        const faqData = this.faqItems[index];
        return faqData ? faqData.isOpen : false;
    }
    
    addItem(element) {
        const question = element.querySelector(this.options.questionSelector);
        const answer = element.querySelector(this.options.answerSelector);
        const icon = element.querySelector(this.options.iconSelector);
        
        if (question && answer) {
            const faqData = {
                element: element,
                question: question,
                answer: answer,
                icon: icon,
                index: this.faqItems.length,
                isOpen: false,
                id: `faq-${this.faqItems.length}`
            };
            
            this.setupFAQItem(faqData);
            this.faqItems.push(faqData);
            
            // Add event listeners
            question.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleFAQ(faqData);
            });
            
            question.addEventListener('keydown', (e) => {
                this.handleKeydown(e, faqData);
            });
            
            console.log(`❓ FAQ item added: ${faqData.index}`);
        }
    }
    
    removeItem(index) {
        const faqData = this.faqItems[index];
        if (!faqData) return;
        
        // Close if open
        if (faqData.isOpen) {
            this.closeFAQ(faqData);
        }
        
        // Remove from arrays
        this.faqItems.splice(index, 1);
        this.activeItems.delete(faqData);
        
        // Update indices
        this.faqItems.forEach((item, newIndex) => {
            item.index = newIndex;
            item.id = `faq-${newIndex}`;
        });
        
        console.log(`❓ FAQ item removed: ${index}`);
    }
    
    refresh() {
        // Clear existing items
        this.faqItems = [];
        this.activeItems.clear();
        
        // Re-initialize
        this.findFAQItems();
        
        console.log(`❓ FAQ refreshed with ${this.faqItems.length} items`);
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            totalItems: this.faqItems.length,
            activeItems: this.activeItems.size,
            openRate: this.faqItems.length > 0 ? 
                (this.metrics.totalToggles / this.faqItems.length) : 0
        };
    }
    
    destroy() {
        // Close all items
        this.closeAll();
        
        // Remove event listeners by cloning elements
        this.faqItems.forEach(faqData => {
            const newQuestion = faqData.question.cloneNode(true);
            faqData.question.parentNode.replaceChild(newQuestion, faqData.question);
        });
        
        // Clear arrays
        this.faqItems = [];
        this.activeItems.clear();
        
        console.log('❓ FAQ Toggle destroyed');
    }
}

// Auto-initialization
function initializeFAQToggle() {
    if (typeof window !== 'undefined') {
        window.FAQToggle = FAQToggle;
        
        // Initialize FAQ if exists
        const faqSection = document.querySelector('.faq-section');
        if (faqSection) {
            window.faqToggle = new FAQToggle();
            
            // Listen for dynamic content
            document.addEventListener('contentAdded', (event) => {
                if (event.detail?.container) {
                    const newFAQItems = event.detail.container.querySelectorAll('.faq-item');
                    
                    if (newFAQItems.length > 0) {
                        newFAQItems.forEach(item => {
                            window.faqToggle.addItem(item);
                        });
                    }
                }
            });
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFAQToggle);
} else {
    initializeFAQToggle();
}

export default FAQToggle; 