/**
 * Portfolio OS - AI Assistant Module
 * Apple Design Language V5
 * Enterprise-grade AI chat interface with voice support
 */

class AIAssistant {
    constructor(options = {}) {
        this.options = {
            containerId: 'aiAssistant',
            toggleId: 'aiToggle',
            apiEndpoint: '/api/ai-chat',
            voiceEnabled: true,
            typingSpeed: 30,
            maxMessages: 50,
            autoGreeting: true,
            persistHistory: true,
            ...options
        };
        
        this.isOpen = false;
        this.isTyping = false;
        this.isListening = false;
        this.messageHistory = [];
        this.currentSession = null;
        
        // DOM elements
        this.container = null;
        this.toggle = null;
        this.chatContainer = null;
        this.input = null;
        this.sendButton = null;
        
        // Voice recognition
        this.recognition = null;
        this.synthesis = null;
        
        // Performance metrics
        this.metrics = {
            messagesExchanged: 0,
            averageResponseTime: 0,
            voiceInteractions: 0,
            sessionStartTime: null
        };
        
        this.init();
    }
    
    init() {
        try {
            this.findElements();
            this.buildInterface();
            this.setupEventListeners();
            this.initializeVoice();
            this.loadHistory();
            
            if (this.options.autoGreeting) {
                this.showGreeting();
            }
            
            console.log('🤖 AI Assistant initialized');
            
        } catch (error) {
            console.error('❌ AI Assistant initialization failed:', error);
        }
    }
    
    findElements() {
        this.container = document.getElementById(this.options.containerId);
        this.toggle = document.getElementById(this.options.toggleId);
        
        if (!this.container) {
            throw new Error(`AI Assistant container not found: ${this.options.containerId}`);
        }
    }
    
    buildInterface() {
        this.container.innerHTML = `
            <div class="ai-assistant-content">
                <div class="ai-header">
                    <div class="ai-status">
                        <div class="ai-avatar">
                            <div class="ai-pulse"></div>
                            🤖
                        </div>
                        <div class="ai-info">
                            <h3>Portfolio AI</h3>
                            <span class="ai-status-text">Online</span>
                        </div>
                    </div>
                    <div class="ai-controls">
                        <button class="ai-voice-btn" id="voiceToggle" aria-label="Voice toggle">
                            <span class="voice-icon">🎤</span>
                        </button>
                        <button class="ai-minimize-btn" id="aiMinimize" aria-label="Minimize">
                            <span>−</span>
                        </button>
                        <button class="ai-close-btn" id="aiClose" aria-label="Close">
                            <span>×</span>
                        </button>
                    </div>
                </div>
                
                <div class="ai-chat-container" id="aiChatContainer">
                    <div class="ai-messages" id="aiMessages"></div>
                </div>
                
                <div class="ai-input-section">
                    <div class="ai-typing-indicator" id="aiTyping" style="display: none;">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span class="typing-text">AI yazıyor...</span>
                    </div>
                    
                    <div class="ai-input-container">
                        <input 
                            type="text" 
                            id="aiInput" 
                            class="ai-input" 
                            placeholder="Merhaba! Size nasıl yardımcı olabilirim?"
                            autocomplete="off"
                            maxlength="500"
                        >
                        <button id="aiSend" class="ai-send-btn" aria-label="Send message">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="ai-suggestions" id="aiSuggestions">
                        <button class="suggestion-btn" data-message="Projeleriniz hakkında bilgi verir misiniz?">
                            💼 Projeler
                        </button>
                        <button class="suggestion-btn" data-message="Hangi teknolojilerde uzmanısınız?">
                            🛠️ Teknolojiler
                        </button>
                        <button class="suggestion-btn" data-message="İş birliği için nasıl iletişime geçebilirim?">
                            🤝 İletişim
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Get references to new elements
        this.chatContainer = document.getElementById('aiChatContainer');
        this.messagesContainer = document.getElementById('aiMessages');
        this.input = document.getElementById('aiInput');
        this.sendButton = document.getElementById('aiSend');
        this.typingIndicator = document.getElementById('aiTyping');
        this.suggestions = document.getElementById('aiSuggestions');
    }
    
    setupEventListeners() {
        // Toggle button
        if (this.toggle) {
            this.toggle.addEventListener('click', () => this.toggle());
        }
        
        // Close and minimize buttons
        document.getElementById('aiClose')?.addEventListener('click', () => this.close());
        document.getElementById('aiMinimize')?.addEventListener('click', () => this.minimize());
        
        // Voice toggle
        document.getElementById('voiceToggle')?.addEventListener('click', () => this.toggleVoice());
        
        // Send message
        this.sendButton?.addEventListener('click', () => this.sendMessage());
        
        // Input events
        this.input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.input?.addEventListener('input', () => this.handleInputChange());
        
        // Suggestion buttons
        this.suggestions?.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-btn')) {
                const message = e.target.dataset.message;
                this.input.value = message;
                this.sendMessage();
            }
        });
        
        // Outside click to close
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.container.contains(e.target) && !this.toggle?.contains(e.target)) {
                this.close();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }
            
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    initializeVoice() {
        if (!this.options.voiceEnabled) return;
        
        // Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'tr-TR';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.input.value = transcript;
                this.sendMessage();
                this.metrics.voiceInteractions++;
            };
            
            this.recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                this.stopListening();
            };
            
            this.recognition.onend = () => {
                this.stopListening();
            };
        }
        
        // Speech Synthesis
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        this.isOpen = true;
        this.container.classList.add('active');
        this.toggle?.classList.add('active');
        
        // Focus input
        setTimeout(() => {
            this.input?.focus();
        }, 300);
        
        // Start session tracking
        if (!this.metrics.sessionStartTime) {
            this.metrics.sessionStartTime = Date.now();
        }
        
        this.dispatchEvent('aiAssistantOpened');
    }
    
    close() {
        this.isOpen = false;
        this.container.classList.remove('active');
        this.toggle?.classList.remove('active');
        
        this.stopListening();
        this.dispatchEvent('aiAssistantClosed');
    }
    
    minimize() {
        this.container.classList.toggle('minimized');
        this.dispatchEvent('aiAssistantMinimized');
    }
    
    async sendMessage() {
        const message = this.input.value.trim();
        if (!message) return;
        
        // Clear input and hide suggestions
        this.input.value = '';
        this.suggestions.style.display = 'none';
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTyping();
        
        try {
            const startTime = Date.now();
            const response = await this.callAI(message);
            const responseTime = Date.now() - startTime;
            
            // Update metrics
            this.updateMetrics(responseTime);
            
            // Hide typing and show response
            this.hideTyping();
            await this.addMessage(response, 'ai', true);
            
        } catch (error) {
            console.error('AI response error:', error);
            this.hideTyping();
            await this.addMessage('Üzgünüm, şu anda bir teknik sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.', 'ai', true);
        }
        
        // Save to history
        this.saveHistory();
    }
    
    async callAI(message) {
        // Simulated AI responses for demo
        const responses = {
            'merhaba': 'Merhaba! Ben Celal\'ın portfolio AI asistanıyım. Size iOS geliştirme, projeler ve kariyer hakkında yardımcı olabilirim.',
            'projeler': 'Celal\'ın en öne çıkan projeleri arasında CleanITHX (AI-powered sistem optimizer), SignalCI (enterprise CI/CD platform) ve iOS 18 Feature Explorer bulunuyor. Hangi proje hakkında daha fazla bilgi almak istersiniz?',
            'teknoloji': 'Celal Swift, SwiftUI, Core ML, ARKit, UIKit, Combine gibi teknolojilerde uzman. Ayrıca AI/ML entegrasyonları ve Apple Design Language konularında deneyimli.',
            'iletişim': 'Celal ile iletişim kurmak için Contact sayfasından mesaj gönderebilir veya LinkedIn üzerinden bağlantı kurabilirsiniz.',
            'deneyim': '8+ yıl iOS geliştirme deneyimi, 50+ tamamlanmış proje ve 1.2M+ kullanıcıya ulaşan uygulamalar.',
            'default': 'Bu konuda daha detaylı bilgi için Contact sayfasından Celal ile direkt iletişime geçebilirsiniz. Size başka nasıl yardımcı olabilirim?'
        };
        
        // Simple keyword matching
        const lowerMessage = message.toLowerCase();
        let response = responses.default;
        
        for (const [keyword, reply] of Object.entries(responses)) {
            if (lowerMessage.includes(keyword)) {
                response = reply;
                break;
            }
        }
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        return response;
    }
    
    addMessage(content, sender, typewriter = false) {
        const message = document.createElement('div');
        message.className = `ai-message ai-message-${sender}`;
        
        const timestamp = new Date().toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        message.innerHTML = `
            <div class="message-content">
                <div class="message-text"></div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        
        this.messagesContainer.appendChild(message);
        
        // Scroll to bottom
        this.scrollToBottom();
        
        if (typewriter && sender === 'ai') {
            return this.typewriterEffect(message.querySelector('.message-text'), content);
        } else {
            message.querySelector('.message-text').textContent = content;
            return Promise.resolve();
        }
    }
    
    typewriterEffect(element, text) {
        return new Promise((resolve) => {
            let index = 0;
            element.textContent = '';
            
            const timer = setInterval(() => {
                element.textContent += text[index];
                index++;
                
                if (index >= text.length) {
                    clearInterval(timer);
                    resolve();
                }
                
                // Scroll during typing
                this.scrollToBottom();
            }, this.options.typingSpeed);
        });
    }
    
    showTyping() {
        this.isTyping = true;
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }
    
    hideTyping() {
        this.isTyping = false;
        this.typingIndicator.style.display = 'none';
    }
    
    scrollToBottom() {
        if (this.chatContainer) {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }
    }
    
    toggleVoice() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    startListening() {
        if (!this.recognition) {
            console.warn('Speech recognition not available');
            return;
        }
        
        this.isListening = true;
        document.getElementById('voiceToggle')?.classList.add('listening');
        
        try {
            this.recognition.start();
        } catch (error) {
            console.warn('Speech recognition start error:', error);
            this.stopListening();
        }
    }
    
    stopListening() {
        this.isListening = false;
        document.getElementById('voiceToggle')?.classList.remove('listening');
        
        if (this.recognition) {
            this.recognition.stop();
        }
    }
    
    speak(text) {
        if (!this.synthesis) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'tr-TR';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        this.synthesis.speak(utterance);
    }
    
    handleInputChange() {
        const hasText = this.input.value.trim().length > 0;
        this.sendButton.classList.toggle('active', hasText);
        
        // Show/hide suggestions
        this.suggestions.style.display = hasText ? 'none' : 'flex';
    }
    
    showGreeting() {
        setTimeout(() => {
            this.addMessage(
                'Merhaba! Ben Celal\'ın AI asistanıyım. iOS geliştirme, projeler ve kariyer hakkında sorularınızı yanıtlayabilirim. Size nasıl yardımcı olabilirim?',
                'ai',
                true
            );
        }, 1000);
    }
    
    updateMetrics(responseTime) {
        this.metrics.messagesExchanged++;
        
        // Calculate average response time
        if (this.metrics.averageResponseTime === 0) {
            this.metrics.averageResponseTime = responseTime;
        } else {
            this.metrics.averageResponseTime = (
                (this.metrics.averageResponseTime + responseTime) / 2
            );
        }
    }
    
    saveHistory() {
        if (!this.options.persistHistory) return;
        
        try {
            const messages = Array.from(this.messagesContainer.children).map(msg => ({
                content: msg.querySelector('.message-text').textContent,
                sender: msg.classList.contains('ai-message-user') ? 'user' : 'ai',
                timestamp: msg.querySelector('.message-time').textContent
            }));
            
            localStorage.setItem('portfolioAI_history', JSON.stringify(messages));
        } catch (error) {
            console.warn('Failed to save AI history:', error);
        }
    }
    
    loadHistory() {
        if (!this.options.persistHistory) return;
        
        try {
            const history = localStorage.getItem('portfolioAI_history');
            if (history) {
                const messages = JSON.parse(history);
                
                // Load last few messages
                messages.slice(-10).forEach(msg => {
                    this.addMessage(msg.content, msg.sender);
                });
            }
        } catch (error) {
            console.warn('Failed to load AI history:', error);
        }
    }
    
    clearHistory() {
        this.messagesContainer.innerHTML = '';
        localStorage.removeItem('portfolioAI_history');
        this.showGreeting();
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            sessionDuration: this.metrics.sessionStartTime ? 
                Date.now() - this.metrics.sessionStartTime : 0,
            isOpen: this.isOpen,
            isListening: this.isListening
        };
    }
    
    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                ...data,
                timestamp: Date.now(),
                module: 'AIAssistant'
            }
        });
        
        window.dispatchEvent(event);
    }
    
    destroy() {
        // Stop any ongoing processes
        this.stopListening();
        
        // Remove event listeners
        // (Implementation depends on how events were attached)
        
        // Clear references
        this.container = null;
        this.toggle = null;
        this.recognition = null;
        this.synthesis = null;
        
        console.log('🤖 AI Assistant destroyed');
    }
}

// Auto-initialize
function initializeAIAssistant() {
    if (typeof window !== 'undefined') {
        window.AIAssistant = AIAssistant;
        
        // Create global instance
        window.aiAssistant = new AIAssistant();
        
        // Global shortcut
        window.toggleAI = () => window.aiAssistant?.toggle();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAIAssistant);
} else {
    initializeAIAssistant();
}

export default AIAssistant; 