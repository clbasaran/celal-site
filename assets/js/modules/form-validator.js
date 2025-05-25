/**
 * Portfolio OS - Form Validator Module
 * Apple Design Language V5
 * Enterprise-grade form validation with accessibility support
 */

class FormValidator {
    constructor(formSelector, options = {}) {
        this.form = typeof formSelector === 'string' ? 
            document.querySelector(formSelector) : formSelector;
        
        if (!this.form) {
            throw new Error('Form not found');
        }
        
        this.options = {
            validateOnInput: true,
            validateOnBlur: true,
            showSuccessStates: true,
            animateErrors: true,
            scrollToError: true,
            submitCallback: null,
            customRules: {},
            messages: {
                required: 'Bu alan zorunludur',
                email: 'Geçerli bir e-mail adresi girin',
                minLength: 'En az {min} karakter olmalıdır',
                maxLength: 'En fazla {max} karakter olabilir',
                pattern: 'Geçersiz format',
                phone: 'Geçerli bir telefon numarası girin',
                url: 'Geçerli bir URL girin',
                number: 'Geçerli bir sayı girin',
                date: 'Geçerli bir tarih girin',
                checkbox: 'Bu seçeneği işaretlemelisiniz'
            },
            ...options
        };
        
        this.fields = new Map();
        this.isValid = false;
        this.isSubmitting = false;
        
        // Performance tracking
        this.metrics = {
            validationCount: 0,
            errorCount: 0,
            successfulSubmissions: 0,
            averageValidationTime: 0
        };
        
        this.init();
    }
    
    init() {
        try {
            this.findFields();
            this.setupEventListeners();
            this.setupCustomValidations();
            
            console.log(`✅ Form Validator initialized for ${this.fields.size} fields`);
            
        } catch (error) {
            console.error('❌ Form Validator initialization failed:', error);
        }
    }
    
    findFields() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            const fieldData = this.processField(input);
            this.fields.set(input, fieldData);
        });
    }
    
    processField(input) {
        const label = this.form.querySelector(`label[for="${input.id}"]`);
        const errorElement = this.form.querySelector(`#${input.id}Error, [data-error-for="${input.id}"]`);
        
        return {
            element: input,
            label: label,
            errorElement: errorElement,
            rules: this.extractRules(input),
            isValid: false,
            hasBeenValidated: false,
            value: input.value
        };
    }
    
    extractRules(input) {
        const rules = {};
        
        // Required rule
        if (input.hasAttribute('required')) {
            rules.required = true;
        }
        
        // Type-based rules
        switch (input.type) {
            case 'email':
                rules.email = true;
                break;
            case 'tel':
                rules.phone = true;
                break;
            case 'url':
                rules.url = true;
                break;
            case 'number':
                rules.number = true;
                if (input.min) rules.min = parseFloat(input.min);
                if (input.max) rules.max = parseFloat(input.max);
                break;
            case 'date':
                rules.date = true;
                break;
        }
        
        // Length rules
        if (input.minLength) {
            rules.minLength = parseInt(input.minLength);
        }
        if (input.maxLength) {
            rules.maxLength = parseInt(input.maxLength);
        }
        
        // Pattern rule
        if (input.pattern) {
            rules.pattern = new RegExp(input.pattern);
        }
        
        // Custom data attributes
        if (input.dataset.rules) {
            try {
                const customRules = JSON.parse(input.dataset.rules);
                Object.assign(rules, customRules);
            } catch (e) {
                console.warn('Invalid rules JSON:', input.dataset.rules);
            }
        }
        
        return rules;
    }
    
    setupEventListeners() {
        // Input event listeners
        this.fields.forEach((fieldData, input) => {
            if (this.options.validateOnInput) {
                input.addEventListener('input', (e) => {
                    this.debounce(() => this.validateField(input), 300)();
                });
            }
            
            if (this.options.validateOnBlur) {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
            }
            
            // Focus event for accessibility
            input.addEventListener('focus', () => {
                this.clearFieldError(input);
            });
        });
        
        // Form submit listener
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Character counter for textareas
        this.setupCharacterCounters();
    }
    
    setupCharacterCounters() {
        const textareas = this.form.querySelectorAll('textarea[maxlength]');
        
        textareas.forEach(textarea => {
            const counter = this.form.querySelector(`#${textarea.id} + .char-counter #charCount`);
            
            if (counter) {
                const updateCounter = () => {
                    const length = textarea.value.length;
                    const maxLength = textarea.maxLength;
                    counter.textContent = length;
                    
                    // Color coding
                    if (length > maxLength * 0.9) {
                        counter.style.color = 'var(--red)';
                    } else if (length > maxLength * 0.75) {
                        counter.style.color = 'var(--orange)';
                    } else {
                        counter.style.color = 'var(--text-secondary)';
                    }
                };
                
                textarea.addEventListener('input', updateCounter);
                updateCounter(); // Initial count
            }
        });
    }
    
    setupCustomValidations() {
        // Add common custom validations
        this.addCustomRule('phone', (value) => {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
            return phoneRegex.test(value);
        });
        
        this.addCustomRule('strongPassword', (value) => {
            // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
            const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
            return strongPasswordRegex.test(value);
        });
        
        this.addCustomRule('url', (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        });
    }
    
    addCustomRule(name, validator) {
        this.options.customRules[name] = validator;
    }
    
    validateField(input) {
        const startTime = performance.now();
        const fieldData = this.fields.get(input);
        
        if (!fieldData) return false;
        
        const value = input.value.trim();
        const rules = fieldData.rules;
        
        // Clear previous errors
        this.clearFieldError(input);
        
        // Validate each rule
        for (const [ruleName, ruleValue] of Object.entries(rules)) {
            const isValid = this.validateRule(value, ruleName, ruleValue, input);
            
            if (!isValid) {
                const message = this.getErrorMessage(ruleName, ruleValue, input);
                this.showFieldError(input, message);
                fieldData.isValid = false;
                fieldData.hasBeenValidated = true;
                
                this.metrics.errorCount++;
                this.updateMetrics(performance.now() - startTime);
                return false;
            }
        }
        
        // Field is valid
        fieldData.isValid = true;
        fieldData.hasBeenValidated = true;
        fieldData.value = value;
        
        if (this.options.showSuccessStates) {
            this.showFieldSuccess(input);
        }
        
        this.metrics.validationCount++;
        this.updateMetrics(performance.now() - startTime);
        return true;
    }
    
    validateRule(value, ruleName, ruleValue, input) {
        switch (ruleName) {
            case 'required':
                if (input.type === 'checkbox') {
                    return input.checked;
                }
                return value.length > 0;
                
            case 'email':
                if (!value) return true; // Empty is valid unless required
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
                
            case 'minLength':
                return value.length >= ruleValue;
                
            case 'maxLength':
                return value.length <= ruleValue;
                
            case 'pattern':
                if (!value) return true;
                return ruleValue.test(value);
                
            case 'min':
                const numValue = parseFloat(value);
                return !isNaN(numValue) && numValue >= ruleValue;
                
            case 'max':
                const maxNumValue = parseFloat(value);
                return !isNaN(maxNumValue) && maxNumValue <= ruleValue;
                
            case 'number':
                if (!value) return true;
                return !isNaN(parseFloat(value));
                
            case 'date':
                if (!value) return true;
                return !isNaN(Date.parse(value));
                
            default:
                // Check custom rules
                if (this.options.customRules[ruleName]) {
                    return this.options.customRules[ruleName](value, ruleValue, input);
                }
                return true;
        }
    }
    
    getErrorMessage(ruleName, ruleValue, input) {
        let message = this.options.messages[ruleName] || 'Geçersiz değer';
        
        // Replace placeholders
        message = message.replace('{min}', ruleValue);
        message = message.replace('{max}', ruleValue);
        message = message.replace('{field}', this.getFieldLabel(input));
        
        return message;
    }
    
    getFieldLabel(input) {
        const fieldData = this.fields.get(input);
        if (fieldData?.label) {
            return fieldData.label.textContent.replace('*', '').trim();
        }
        return input.placeholder || input.name || 'Bu alan';
    }
    
    showFieldError(input, message) {
        const fieldData = this.fields.get(input);
        
        // Add error class to input
        input.classList.add('error');
        input.classList.remove('success');
        
        // Show error message
        if (fieldData?.errorElement) {
            fieldData.errorElement.textContent = message;
            fieldData.errorElement.style.display = 'block';
            
            if (this.options.animateErrors) {
                fieldData.errorElement.style.opacity = '0';
                fieldData.errorElement.style.transform = 'translateY(-10px)';
                
                requestAnimationFrame(() => {
                    fieldData.errorElement.style.transition = 'all 0.3s ease';
                    fieldData.errorElement.style.opacity = '1';
                    fieldData.errorElement.style.transform = 'translateY(0)';
                });
            }
        }
        
        // Update ARIA attributes
        input.setAttribute('aria-invalid', 'true');
        if (fieldData?.errorElement) {
            input.setAttribute('aria-describedby', fieldData.errorElement.id);
        }
        
        // Dispatch error event
        this.dispatchFieldEvent(input, 'fieldError', { message });
    }
    
    showFieldSuccess(input) {
        input.classList.remove('error');
        input.classList.add('success');
        
        // Update ARIA attributes
        input.setAttribute('aria-invalid', 'false');
        input.removeAttribute('aria-describedby');
        
        // Dispatch success event
        this.dispatchFieldEvent(input, 'fieldSuccess');
    }
    
    clearFieldError(input) {
        const fieldData = this.fields.get(input);
        
        input.classList.remove('error');
        input.setAttribute('aria-invalid', 'false');
        
        if (fieldData?.errorElement) {
            fieldData.errorElement.style.display = 'none';
            fieldData.errorElement.textContent = '';
        }
    }
    
    validateForm() {
        let isFormValid = true;
        const firstErrorField = [];
        
        this.fields.forEach((fieldData, input) => {
            const isFieldValid = this.validateField(input);
            
            if (!isFieldValid) {
                isFormValid = false;
                if (firstErrorField.length === 0) {
                    firstErrorField.push(input);
                }
            }
        });
        
        this.isValid = isFormValid;
        
        // Scroll to first error if needed
        if (!isFormValid && this.options.scrollToError && firstErrorField.length > 0) {
            this.scrollToField(firstErrorField[0]);
        }
        
        return isFormValid;
    }
    
    async handleSubmit() {
        if (this.isSubmitting) return;
        
        this.isSubmitting = true;
        this.showSubmitLoading(true);
        
        try {
            const isValid = this.validateForm();
            
            if (!isValid) {
                this.showSubmitLoading(false);
                this.isSubmitting = false;
                return;
            }
            
            const formData = this.getFormData();
            
            // Call custom submit callback
            if (this.options.submitCallback) {
                await this.options.submitCallback(formData, this.form);
            } else {
                // Default form submission
                await this.defaultSubmit(formData);
            }
            
            this.metrics.successfulSubmissions++;
            this.showSuccessMessage();
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showSubmitError(error.message);
        } finally {
            this.showSubmitLoading(false);
            this.isSubmitting = false;
        }
    }
    
    async defaultSubmit(formData) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('Form Data:', formData);
        
        // In real implementation, send to server
        // const response = await fetch('/api/contact', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // });
    }
    
    getFormData() {
        const formData = {};
        
        this.fields.forEach((fieldData, input) => {
            if (input.type === 'checkbox') {
                formData[input.name] = input.checked;
            } else {
                formData[input.name] = input.value.trim();
            }
        });
        
        return formData;
    }
    
    showSubmitLoading(show) {
        const submitBtn = this.form.querySelector('[type="submit"]');
        const btnText = submitBtn?.querySelector('.btn-text');
        const btnLoading = submitBtn?.querySelector('.btn-loading');
        
        if (submitBtn) {
            submitBtn.disabled = show;
            
            if (btnText) {
                btnText.style.display = show ? 'none' : 'inline';
            }
            
            if (btnLoading) {
                btnLoading.style.display = show ? 'inline-flex' : 'none';
            }
        }
    }
    
    showSuccessMessage() {
        const successElement = this.form.parentNode.querySelector('#successMessage');
        
        if (successElement) {
            this.form.style.display = 'none';
            successElement.style.display = 'block';
            
            // Animate in
            successElement.style.opacity = '0';
            successElement.style.transform = 'translateY(20px)';
            
            requestAnimationFrame(() => {
                successElement.style.transition = 'all 0.5s ease';
                successElement.style.opacity = '1';
                successElement.style.transform = 'translateY(0)';
            });
        }
        
        // Dispatch success event
        this.dispatchFormEvent('formSuccess', this.getFormData());
    }
    
    showSubmitError(message) {
        // Create or update error message
        let errorElement = this.form.querySelector('.form-submit-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-submit-error';
            errorElement.style.cssText = `
                color: var(--red);
                background: rgba(255, 59, 48, 0.1);
                padding: var(--space-3);
                border-radius: var(--radius-lg);
                margin-top: var(--space-4);
                text-align: center;
            `;
            
            const submitBtn = this.form.querySelector('[type="submit"]');
            submitBtn?.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
    
    scrollToField(field) {
        field.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // Focus the field
        setTimeout(() => {
            field.focus();
        }, 500);
    }
    
    dispatchFieldEvent(field, eventName, data = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                field,
                form: this.form,
                ...data,
                timestamp: performance.now()
            }
        });
        
        field.dispatchEvent(event);
        this.form.dispatchEvent(event);
    }
    
    dispatchFormEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                form: this.form,
                formData: data,
                timestamp: performance.now()
            }
        });
        
        this.form.dispatchEvent(event);
        window.dispatchEvent(event);
    }
    
    updateMetrics(validationTime) {
        if (this.metrics.averageValidationTime === 0) {
            this.metrics.averageValidationTime = validationTime;
        } else {
            this.metrics.averageValidationTime = 
                (this.metrics.averageValidationTime * 0.9) + (validationTime * 0.1);
        }
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
    
    // Public API methods
    validate() {
        return this.validateForm();
    }
    
    reset() {
        this.form.reset();
        
        this.fields.forEach((fieldData, input) => {
            this.clearFieldError(input);
            input.classList.remove('success', 'error');
            fieldData.isValid = false;
            fieldData.hasBeenValidated = false;
        });
        
        this.isValid = false;
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            fieldsCount: this.fields.size,
            validFieldsCount: Array.from(this.fields.values()).filter(f => f.isValid).length,
            isFormValid: this.isValid
        };
    }
    
    destroy() {
        // Remove all event listeners
        this.fields.forEach((fieldData, input) => {
            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);
        });
        
        this.fields.clear();
        
        console.log('✅ Form Validator destroyed');
    }
}

// Auto-initialization for contact form
function initializeFormValidator() {
    if (typeof window !== 'undefined') {
        window.FormValidator = FormValidator;
        
        // Initialize contact form if exists
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            window.contactFormValidator = new FormValidator(contactForm, {
                submitCallback: async (formData, form) => {
                    // Custom submission logic for contact form
                    console.log('Contact form submitted:', formData);
                    
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // In production, send to your backend
                    // await fetch('/api/contact', {
                    //     method: 'POST',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify(formData)
                    // });
                }
            });
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFormValidator);
} else {
    initializeFormValidator();
}

export default FormValidator; 