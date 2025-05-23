/*
 * ============================================================================
 * AI ASSISTANT MODULE
 * Advanced AI-Powered Chat Assistant with NLP and Smart Suggestions
 * ============================================================================
 * Features:
 * - Natural Language Processing
 * - Context-aware Responses
 * - Smart Auto-suggestions
 * - Conversation Memory
 * - Multi-language Support
 * - Advanced Animation System
 * ============================================================================
 */

class AIAssistant {
    constructor() {
        this.isActive = false;
        this.isTyping = false;
        this.conversation = [];
        this.context = {
            currentSection: 'home',
            userIntent: null,
            topics: [],
            preferences: {
                language: 'tr',
                responseStyle: 'professional'
            }
        };
        
        // Predefined responses and knowledge base
        this.knowledgeBase = {
            tr: {
                greetings: [
                    "Merhaba! Ben Celal'ın AI asistanıyım. Size nasıl yardımcı olabilirim?",
                    "Selam! Celal hakkında merak ettiğiniz bir şey var mı?",
                    "Hoş geldiniz! Celal'ın yetenekleri ve projeleri hakkında sorularınızı yanıtlayabilirim."
                ],
                skills: {
                    "ios": "Celal, 8+ yıllık iOS geliştirme deneyimine sahip. SwiftUI, UIKit, Core Data ve modern iOS mimarilerinde uzman.",
                    "ai": "Yapay zeka ve makine öğrenmesi alanında derin bilgiye sahip. TensorFlow, PyTorch ve Core ML ile projeler geliştirmiş.",
                    "swift": "Swift programlama dilinde expert seviyede. Protocol-oriented programming ve modern Swift paradigmalarında uzman.",
                    "swiftui": "SwiftUI'da advanced seviyede geliştirme yapabiliyor. Declarative UI ve state management konularında uzman."
                },
                projects: {
                    "portfolio": "Bu portfolyo sitesi WebGL, advanced animations ve AI özellikleri ile geliştirilmiş ultra-modern bir showcase.",
                    "ios_apps": "20+ iOS uygulaması yayımlamış, toplam 1M+ download almış projeler geliştirmiş.",
                    "ai_projects": "Computer vision, NLP ve recommendation engine projeleri üzerinde çalışmış."
                },
                suggestions: [
                    "Celal'ın iOS projelerini görmek ister misiniz?",
                    "AI geliştirme yetenekleri hakkında bilgi alabilirsiniz",
                    "SwiftUI ile yaptığı modern uygulamaları inceleyebilirsiniz",
                    "Celal ile iletişime geçmek için tıklayın"
                ]
            },
            en: {
                greetings: [
                    "Hello! I'm Celal's AI assistant. How can I help you?",
                    "Hi there! Is there something you'd like to know about Celal?",
                    "Welcome! I can answer questions about Celal's skills and projects."
                ],
                skills: {
                    "ios": "Celal has 8+ years of iOS development experience. Expert in SwiftUI, UIKit, Core Data and modern iOS architectures.",
                    "ai": "Deep knowledge in artificial intelligence and machine learning. Developed projects with TensorFlow, PyTorch and Core ML.",
                    "swift": "Expert level in Swift programming language. Specialist in protocol-oriented programming and modern Swift paradigms.",
                    "swiftui": "Advanced level SwiftUI development. Expert in declarative UI and state management."
                },
                projects: {
                    "portfolio": "This portfolio site is an ultra-modern showcase developed with WebGL, advanced animations and AI features.",
                    "ios_apps": "Published 20+ iOS applications with 1M+ total downloads.",
                    "ai_projects": "Worked on computer vision, NLP and recommendation engine projects."
                },
                suggestions: [
                    "Would you like to see Celal's iOS projects?",
                    "You can learn about AI development capabilities",
                    "Check out modern applications built with SwiftUI",
                    "Click to contact Celal"
                ]
            }
        };
        
        this.responses = {
            unknown: {
                tr: "Üzgünüm, bu konuda size yardımcı olamıyorum. Celal'ın yetenekleri, projeleri veya deneyimi hakkında soru sorabilirsiniz.",
                en: "Sorry, I can't help with that. You can ask about Celal's skills, projects or experience."
            },
            error: {
                tr: "Bir hata oluştu. Lütfen tekrar deneyin.",
                en: "An error occurred. Please try again."
            }
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadConversationHistory();
        this.initializeQuickActions();
        console.log('🤖 AI Assistant initialized');
    }
    
    setupEventListeners() {
        const sendButton = document.getElementById('aiSend');
        const input = document.getElementById('aiInput');
        const quickActions = document.querySelectorAll('.quick-action');
        
        if (sendButton) {
            sendButton.addEventListener('click', () => {
                this.handleUserInput();
            });
        }
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleUserInput();
                }
            });
            
            input.addEventListener('input', () => {
                this.handleTyping();
            });
        }
        
        quickActions.forEach(action => {
            action.addEventListener('click', () => {
                const message = action.getAttribute('data-message');
                this.simulateUserMessage(message);
            });
        });
    }
    
    async handleUserInput() {
        const input = document.getElementById('aiInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        // Clear input
        input.value = '';
        
        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Process message and generate response
        const response = await this.processMessage(message);
        
        // Hide typing indicator and show response
        setTimeout(() => {
            this.hideTypingIndicator();
            this.addMessage(response.text, 'assistant');
            
            if (response.suggestions) {
                this.showSuggestions(response.suggestions);
            }
        }, 1000 + Math.random() * 1000); // Realistic typing delay
    }
    
    async processMessage(message) {
        const lang = this.context.preferences.language;
        const lowerMessage = message.toLowerCase();
        
        // Update context
        this.updateContext(message);
        
        // Intent recognition
        const intent = this.recognizeIntent(lowerMessage);
        
        // Generate response based on intent
        let response = await this.generateResponse(intent, lowerMessage, lang);
        
        // Add conversation to history
        this.conversation.push({
            user: message,
            assistant: response.text,
            timestamp: new Date().toISOString(),
            intent: intent
        });
        
        this.saveConversationHistory();
        
        return response;
    }
    
    recognizeIntent(message) {
        const intents = {
            greeting: ['merhaba', 'selam', 'hey', 'hello', 'hi', 'günaydın', 'good morning'],
            skills: ['yetenek', 'beceri', 'skill', 'neler yapıyor', 'ne yapabiliyor', 'expertise'],
            ios: ['ios', 'swift', 'swiftui', 'uikit', 'mobile', 'app', 'uygulama'],
            ai: ['ai', 'artificial intelligence', 'yapay zeka', 'machine learning', 'makine öğrenmesi'],
            projects: ['proje', 'project', 'portfolio', 'çalışma', 'work', 'experience'],
            contact: ['iletişim', 'contact', 'nasıl ulaşırım', 'email', 'telefon'],
            about: ['hakkında', 'about', 'kim', 'who', 'biography', 'bio']
        };
        
        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(keyword => message.includes(keyword))) {
                return intent;
            }
        }
        
        return 'unknown';
    }
    
    async generateResponse(intent, message, lang) {
        const kb = this.knowledgeBase[lang];
        
        switch (intent) {
            case 'greeting':
                return {
                    text: this.getRandomItem(kb.greetings),
                    suggestions: kb.suggestions.slice(0, 3)
                };
                
            case 'skills':
                return {
                    text: "Celal'ın ana yetenekleri:\n\n• iOS Geliştirme (8+ yıl)\n• AI/ML Geliştirme\n• SwiftUI & Swift\n• Full-Stack Development\n• Problem Çözme",
                    suggestions: ["iOS projeleri", "AI yetenekleri", "SwiftUI uygulamaları"]
                };
                
            case 'ios':
                const iosSkill = this.findBestMatch(message, Object.keys(kb.skills));
                if (iosSkill && kb.skills[iosSkill]) {
                    return {
                        text: kb.skills[iosSkill],
                        suggestions: ["Projeler", "Portfolio", "İletişim"]
                    };
                }
                return {
                    text: kb.skills.ios,
                    suggestions: ["SwiftUI detayları", "iOS projeleri", "App Store uygulamaları"]
                };
                
            case 'ai':
                return {
                    text: kb.skills.ai,
                    suggestions: ["AI projeleri", "Machine Learning", "Computer Vision"]
                };
                
            case 'projects':
                return {
                    text: "Celal'ın öne çıkan projeleri:\n\n🚀 20+ iOS Uygulaması\n🤖 AI/ML Projeleri\n🎨 Bu Portfolio Sitesi\n📱 SwiftUI Showcase Apps",
                    suggestions: ["iOS uygulamaları", "AI projeleri", "Portfolio detayları"]
                };
                
            case 'contact':
                return {
                    text: "Celal ile iletişim kurmak için:\n\n📧 Email: celal@example.com\n💼 LinkedIn: linkedin.com/in/celalbasaran\n🐦 Twitter: @celalbasaran",
                    suggestions: ["LinkedIn profili", "GitHub", "Email gönder"]
                };
                
            case 'about':
                return {
                    text: "Celal Başaran, 8+ yıllık deneyime sahip Senior iOS Developer ve AI enthusiast. Apple ekosisteminde uzmanlaşmış, modern teknolojilerle kullanıcı odaklı çözümler geliştiren bir teknoloji lideri.",
                    suggestions: ["Deneyim", "Eğitim", "Başarılar"]
                };
                
            default:
                return {
                    text: this.responses.unknown[lang],
                    suggestions: kb.suggestions.slice(0, 2)
                };
        }
    }
    
    findBestMatch(text, keywords) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                return keyword;
            }
        }
        return null;
    }
    
    updateContext(message) {
        // Extract topics and update context
        const topics = this.extractTopics(message);
        this.context.topics = [...new Set([...this.context.topics, ...topics])];
        
        // Update current section based on message
        if (message.includes('proje') || message.includes('project')) {
            this.context.currentSection = 'projects';
        } else if (message.includes('hakkında') || message.includes('about')) {
            this.context.currentSection = 'about';
        } else if (message.includes('iletişim') || message.includes('contact')) {
            this.context.currentSection = 'contact';
        }
    }
    
    extractTopics(message) {
        const topics = [];
        const topicKeywords = {
            'ios': ['ios', 'swift', 'swiftui', 'uikit'],
            'ai': ['ai', 'artificial intelligence', 'yapay zeka', 'machine learning'],
            'web': ['web', 'javascript', 'html', 'css'],
            'mobile': ['mobile', 'app', 'uygulama', 'mobil']
        };
        
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
                topics.push(topic);
            }
        }
        
        return topics;
    }
    
    addMessage(message, sender) {
        const chatContainer = document.getElementById('aiChat');
        if (!chatContainer) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${sender}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = message;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.appendChild(messageContent);
        messageElement.appendChild(messageTime);
        
        // Add avatar for assistant messages
        if (sender === 'assistant') {
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            avatar.innerHTML = '🤖';
            messageElement.prepend(avatar);
        }
        
        chatContainer.appendChild(messageElement);
        
        // Animate message appearance
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            messageElement.style.transition = 'all 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        });
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    showTypingIndicator() {
        const chatContainer = document.getElementById('aiChat');
        if (!chatContainer) return;
        
        this.isTyping = true;
        
        const typingElement = document.createElement('div');
        typingElement.className = 'message message-assistant typing-indicator';
        typingElement.id = 'typingIndicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = '🤖';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'message-content';
        typingContent.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        typingElement.appendChild(avatar);
        typingElement.appendChild(typingContent);
        chatContainer.appendChild(typingElement);
        
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }
    
    showSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('aiSuggestions');
        if (!suggestionsContainer) return;
        
        suggestionsContainer.innerHTML = '';
        
        suggestions.forEach((suggestion, index) => {
            const suggestionElement = document.createElement('button');
            suggestionElement.className = 'suggestion-btn';
            suggestionElement.textContent = suggestion;
            suggestionElement.style.animationDelay = `${index * 0.1}s`;
            
            suggestionElement.addEventListener('click', () => {
                this.simulateUserMessage(suggestion);
            });
            
            suggestionsContainer.appendChild(suggestionElement);
        });
    }
    
    simulateUserMessage(message) {
        const input = document.getElementById('aiInput');
        if (input) {
            input.value = message;
            this.handleUserInput();
        }
    }
    
    handleTyping() {
        const input = document.getElementById('aiInput');
        if (!input) return;
        
        const message = input.value;
        
        // Smart suggestions while typing
        if (message.length > 2) {
            this.showSmartSuggestions(message);
        }
    }
    
    showSmartSuggestions(partialMessage) {
        const suggestions = this.generateSmartSuggestions(partialMessage);
        if (suggestions.length > 0) {
            this.showQuickSuggestions(suggestions);
        }
    }
    
    generateSmartSuggestions(partialMessage) {
        const lang = this.context.preferences.language;
        const suggestions = [];
        const lower = partialMessage.toLowerCase();
        
        const smartSuggestions = {
            tr: {
                'ios': ['iOS geliştirme deneyimi nedir?', 'iOS projeleri gösterir misin?'],
                'ai': ['AI yetenekleri nelerdir?', 'Yapay zeka projeleri var mı?'],
                'proje': ['Hangi projeler geliştirmiş?', 'Portfolio örnekleri'],
                'nasıl': ['Nasıl iletişim kurabilirim?', 'Nasıl çalışıyor?']
            },
            en: {
                'ios': ['What is iOS development experience?', 'Can you show iOS projects?'],
                'ai': ['What are AI capabilities?', 'Any artificial intelligence projects?'],
                'project': ['What projects has he developed?', 'Portfolio examples'],
                'how': ['How can I contact?', 'How does it work?']
            }
        };
        
        const currentSuggestions = smartSuggestions[lang] || smartSuggestions.tr;
        
        for (const [keyword, suggestionList] of Object.entries(currentSuggestions)) {
            if (lower.includes(keyword)) {
                suggestions.push(...suggestionList);
            }
        }
        
        return suggestions.slice(0, 3);
    }
    
    showQuickSuggestions(suggestions) {
        // Implementation for real-time suggestions dropdown
        console.log('Smart suggestions:', suggestions);
    }
    
    scrollToBottom() {
        const chatContainer = document.getElementById('aiChat');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
    
    initializeQuickActions() {
        const quickActions = [
            { icon: '🎯', text: 'Yetenekler', message: 'Celal\'ın yetenekleri nelerdir?' },
            { icon: '📱', text: 'iOS Projeleri', message: 'iOS projelerini gösterebilir misin?' },
            { icon: '🤖', text: 'AI Deneyimi', message: 'AI geliştirme deneyimi nedir?' },
            { icon: '📞', text: 'İletişim', message: 'Celal ile nasıl iletişim kurabilirim?' }
        ];
        
        const actionsContainer = document.getElementById('quickActions');
        if (!actionsContainer) return;
        
        actionsContainer.innerHTML = '';
        
        quickActions.forEach((action, index) => {
            const actionElement = document.createElement('button');
            actionElement.className = 'quick-action';
            actionElement.setAttribute('data-message', action.message);
            actionElement.innerHTML = `
                <span class="action-icon">${action.icon}</span>
                <span class="action-text">${action.text}</span>
            `;
            
            actionElement.style.animationDelay = `${index * 0.1}s`;
            actionsContainer.appendChild(actionElement);
        });
    }
    
    saveConversationHistory() {
        try {
            localStorage.setItem('ai_conversation_history', JSON.stringify(this.conversation));
        } catch (error) {
            console.warn('Failed to save conversation history:', error);
        }
    }
    
    loadConversationHistory() {
        try {
            const history = localStorage.getItem('ai_conversation_history');
            if (history) {
                this.conversation = JSON.parse(history);
                this.restoreConversation();
            } else {
                this.showWelcomeMessage();
            }
        } catch (error) {
            console.warn('Failed to load conversation history:', error);
            this.showWelcomeMessage();
        }
    }
    
    restoreConversation() {
        const recentConversations = this.conversation.slice(-5);
        recentConversations.forEach(conv => {
            this.addMessage(conv.user, 'user');
            this.addMessage(conv.assistant, 'assistant');
        });
        
        if (this.conversation.length === 0) {
            this.showWelcomeMessage();
        }
    }
    
    showWelcomeMessage() {
        const lang = this.context.preferences.language;
        const welcome = this.knowledgeBase[lang].greetings[0];
        
        setTimeout(() => {
            this.addMessage(welcome, 'assistant');
            this.showSuggestions(this.knowledgeBase[lang].suggestions.slice(0, 3));
        }, 1000);
    }
    
    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    clearConversation() {
        const chatContainer = document.getElementById('aiChat');
        if (chatContainer) {
            chatContainer.innerHTML = '';
        }
        this.conversation = [];
        this.saveConversationHistory();
        this.showWelcomeMessage();
    }
    
    setLanguage(language) {
        this.context.preferences.language = language;
        localStorage.setItem('ai_assistant_language', language);
    }
    
    // Public API methods
    sendMessage(message) {
        const input = document.getElementById('aiInput');
        if (input) {
            input.value = message;
            this.handleUserInput();
        }
    }
    
    activate() {
        this.isActive = true;
        const assistant = document.getElementById('aiAssistant');
        if (assistant) {
            assistant.classList.add('open');
        }
    }
    
    deactivate() {
        this.isActive = false;
        const assistant = document.getElementById('aiAssistant');
        if (assistant) {
            assistant.classList.remove('open');
        }
    }
    
    toggle() {
        if (this.isActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    }
}

// Initialize and export
const aiAssistant = new AIAssistant();

export default aiAssistant; 