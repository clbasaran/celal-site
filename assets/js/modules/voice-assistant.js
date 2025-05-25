/**
 * Portfolio OS - Voice Assistant Module
 * Apple Design Language V5
 * AI-powered voice interaction with speech recognition and synthesis
 */

class VoiceAssistant {
    constructor(options = {}) {
        this.options = {
            language: 'tr-TR',
            voiceRate: 1,
            voicePitch: 1,
            voiceVolume: 1,
            autoStart: false,
            continuous: true,
            interimResults: true,
            maxAlternatives: 3,
            commands: {},
            ...options
        };
        
        this.isSupported = false;
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.synthesis = null;
        this.currentUtterance = null;
        
        // Voice commands
        this.commands = new Map();
        this.context = 'general';
        
        // Performance tracking
        this.metrics = {
            recognitionAttempts: 0,
            successfulRecognitions: 0,
            speechSynthesisCount: 0,
            averageConfidence: 0,
            commandMatches: 0
        };
        
        // Response templates
        this.responses = {
            greeting: [
                "Merhaba! Size nasıl yardımcı olabilirim?",
                "Selam! Portfolio OS'a hoş geldiniz.",
                "Merhaba! Celal'ın projeleri hakkında sorular sorabilirsiniz."
            ],
            projectInfo: [
                "Celal'ın {count} adet tamamlanmış projesi bulunuyor.",
                "En son projesi {project} adında bir {type} uygulaması.",
                "SwiftUI, Core ML ve ARKit konularında uzman."
            ],
            navigation: [
                "{page} sayfasına yönlendiriyorum.",
                "{page} bölümünü açıyorum.",
                "İstediğiniz sayfaya gidiyoruz."
            ],
            error: [
                "Anlayamadım, tekrar edebilir misiniz?",
                "Bu konuda size yardımcı olamıyorum.",
                "Başka bir şey deneyebilirsiniz."
            ]
        };
        
        this.init();
    }
    
    init() {
        try {
            this.checkSupport();
            if (!this.isSupported) return;
            
            this.setupSpeechRecognition();
            this.setupSpeechSynthesis();
            this.setupDefaultCommands();
            this.setupUI();
            this.setupEventListeners();
            
            if (this.options.autoStart) {
                this.startListening();
            }
            
            console.log('🎤 Voice Assistant initialized');
            
        } catch (error) {
            console.error('❌ Voice Assistant initialization failed:', error);
        }
    }
    
    checkSupport() {
        this.isSupported = (
            'webkitSpeechRecognition' in window ||
            'SpeechRecognition' in window
        ) && (
            'speechSynthesis' in window
        );
        
        if (!this.isSupported) {
            console.warn('🎤 Speech API not supported in this browser');
            this.showUnsupportedMessage();
        }
        
        return this.isSupported;
    }
    
    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.recognition.lang = this.options.language;
        this.recognition.continuous = this.options.continuous;
        this.recognition.interimResults = this.options.interimResults;
        this.recognition.maxAlternatives = this.options.maxAlternatives;
        
        this.recognition.onstart = () => this.handleRecognitionStart();
        this.recognition.onresult = (event) => this.handleRecognitionResult(event);
        this.recognition.onerror = (event) => this.handleRecognitionError(event);
        this.recognition.onend = () => this.handleRecognitionEnd();
    }
    
    setupSpeechSynthesis() {
        this.synthesis = window.speechSynthesis;
        
        // Get available voices
        this.getVoices();
        
        // Update voices when they change
        this.synthesis.addEventListener('voiceschanged', () => {
            this.getVoices();
        });
    }
    
    getVoices() {
        this.voices = this.synthesis.getVoices();
        
        // Find Turkish voice or use default
        this.preferredVoice = this.voices.find(voice => 
            voice.lang.startsWith('tr') || voice.lang.includes('TR')
        ) || this.voices[0];
        
        console.log(`🗣️ Voice selected: ${this.preferredVoice?.name || 'Default'}`);
    }
    
    setupDefaultCommands() {
        // Navigation commands
        this.addCommand(['ana sayfa', 'anasayfa', 'home'], () => {
            this.navigate('/');
            return this.getRandomResponse('navigation', { page: 'Ana Sayfa' });
        });
        
        this.addCommand(['hakkımda', 'hakkında', 'about'], () => {
            this.navigate('/about.html');
            return this.getRandomResponse('navigation', { page: 'Hakkımda' });
        });
        
        this.addCommand(['projeler', 'proje', 'projects'], () => {
            this.navigate('/projects.html');
            return this.getRandomResponse('navigation', { page: 'Projeler' });
        });
        
        this.addCommand(['blog'], () => {
            this.navigate('/blog.html');
            return this.getRandomResponse('navigation', { page: 'Blog' });
        });
        
        this.addCommand(['iletişim', 'iletisim', 'contact'], () => {
            this.navigate('/contact.html');
            return this.getRandomResponse('navigation', { page: 'İletişim' });
        });
        
        // Information commands
        this.addCommand(['merhaba', 'selam', 'hello', 'hi'], () => {
            return this.getRandomResponse('greeting');
        });
        
        this.addCommand(['kaç proje', 'proje sayısı', 'projects count'], () => {
            return this.getRandomResponse('projectInfo', { count: '50+' });
        });
        
        this.addCommand(['son proje', 'latest project'], () => {
            return this.getRandomResponse('projectInfo', { 
                project: 'FitTrack Pro', 
                type: 'fitness' 
            });
        });
        
        // Theme commands
        this.addCommand(['karanlık tema', 'dark mode'], () => {
            if (window.themeManager) {
                window.themeManager.setTheme('dark');
                return "Karanlık tema etkinleştirildi.";
            }
            return "Tema değiştirilemedi.";
        });
        
        this.addCommand(['aydınlık tema', 'light mode'], () => {
            if (window.themeManager) {
                window.themeManager.setTheme('light');
                return "Aydınlık tema etkinleştirildi.";
            }
            return "Tema değiştirilemedi.";
        });
        
        // System commands
        this.addCommand(['dur', 'durdur', 'stop'], () => {
            this.stopListening();
            return "Dinlemeyi durdurdum.";
        });
        
        this.addCommand(['başla', 'dinle', 'start listening'], () => {
            this.startListening();
            return "Dinlemeye başladım.";
        });
        
        this.addCommand(['yardım', 'help'], () => {
            return "Ana sayfa, hakkımda, projeler, blog ve iletişim sayfalarına gidebilirim. Ayrıca tema değiştirebilirim.";
        });
    }
    
    setupUI() {
        this.createVoiceButton();
        this.createStatusIndicator();
        this.createTranscriptDisplay();
    }
    
    createVoiceButton() {
        this.voiceButton = document.createElement('button');
        this.voiceButton.className = 'voice-assistant-btn';
        this.voiceButton.innerHTML = `
            <span class="voice-icon">🎤</span>
            <span class="voice-status">Dinle</span>
        `;
        this.voiceButton.setAttribute('aria-label', 'Sesli asistan');
        this.voiceButton.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: var(--blue);
            color: white;
            border: none;
            box-shadow: var(--shadow-lg);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: var(--text-xs);
            font-weight: 500;
            transition: all var(--duration-fast) var(--ease-out);
            z-index: 1000;
        `;
        
        document.body.appendChild(this.voiceButton);
    }
    
    createStatusIndicator() {
        this.statusIndicator = document.createElement('div');
        this.statusIndicator.className = 'voice-status-indicator';
        this.statusIndicator.style.cssText = `
            position: fixed;
            bottom: 150px;
            right: 20px;
            padding: var(--space-3) var(--space-4);
            background: var(--bg-secondary);
            backdrop-filter: blur(20px);
            border-radius: var(--radius-xl);
            border: 1px solid var(--separator);
            font-size: var(--text-sm);
            font-weight: 500;
            color: var(--text-primary);
            opacity: 0;
            transform: translateY(10px);
            transition: all var(--duration-fast) var(--ease-out);
            z-index: 1000;
            pointer-events: none;
        `;
        
        document.body.appendChild(this.statusIndicator);
    }
    
    createTranscriptDisplay() {
        this.transcriptDisplay = document.createElement('div');
        this.transcriptDisplay.className = 'voice-transcript';
        this.transcriptDisplay.style.cssText = `
            position: fixed;
            bottom: 200px;
            right: 20px;
            left: 20px;
            max-width: 400px;
            margin-left: auto;
            padding: var(--space-4);
            background: var(--bg-primary);
            backdrop-filter: blur(20px);
            border-radius: var(--radius-xl);
            border: 1px solid var(--separator);
            font-size: var(--text-sm);
            line-height: 1.4;
            color: var(--text-primary);
            opacity: 0;
            transform: translateY(10px);
            transition: all var(--duration-fast) var(--ease-out);
            z-index: 1000;
            pointer-events: none;
            max-height: 150px;
            overflow-y: auto;
        `;
        
        document.body.appendChild(this.transcriptDisplay);
    }
    
    setupEventListeners() {
        this.voiceButton.addEventListener('click', () => {
            if (this.isListening) {
                this.stopListening();
            } else {
                this.startListening();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                this.toggleListening();
            }
        });
        
        // Page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isListening) {
                this.stopListening();
            }
        });
    }
    
    startListening() {
        if (!this.isSupported || this.isListening) return;
        
        try {
            this.recognition.start();
            this.metrics.recognitionAttempts++;
            
        } catch (error) {
            console.error('❌ Failed to start speech recognition:', error);
        }
    }
    
    stopListening() {
        if (!this.isListening) return;
        
        this.recognition.stop();
    }
    
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    handleRecognitionStart() {
        this.isListening = true;
        this.updateUI('listening');
        this.showStatus('Dinliyorum...');
        
        this.dispatchEvent('listeningStart');
    }
    
    handleRecognitionResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0].transcript;
            
            if (result.isFinal) {
                finalTranscript += transcript;
                this.metrics.successfulRecognitions++;
                this.metrics.averageConfidence = (
                    (this.metrics.averageConfidence + result[0].confidence) / 2
                );
            } else {
                interimTranscript += transcript;
            }
        }
        
        if (finalTranscript) {
            this.processCommand(finalTranscript.trim().toLowerCase());
        }
        
        this.updateTranscript(finalTranscript || interimTranscript);
    }
    
    handleRecognitionError(event) {
        console.error('🎤 Speech recognition error:', event.error);
        
        this.showStatus(`Hata: ${event.error}`, 'error');
        this.updateUI('error');
        
        setTimeout(() => {
            if (this.isListening) {
                this.updateUI('idle');
            }
        }, 2000);
    }
    
    handleRecognitionEnd() {
        this.isListening = false;
        this.updateUI('idle');
        this.hideStatus();
        
        this.dispatchEvent('listeningEnd');
    }
    
    processCommand(text) {
        console.log('🎤 Processing command:', text);
        
        let response = null;
        let commandFound = false;
        
        // Check for command matches
        for (const [keywords, handler] of this.commands) {
            if (keywords.some(keyword => text.includes(keyword))) {
                try {
                    response = handler(text);
                    commandFound = true;
                    this.metrics.commandMatches++;
                    break;
                } catch (error) {
                    console.error('❌ Command handler error:', error);
                    response = this.getRandomResponse('error');
                }
            }
        }
        
        if (!commandFound) {
            response = this.getRandomResponse('error');
        }
        
        if (response) {
            this.speak(response);
        }
        
        this.dispatchEvent('commandProcessed', {
            text,
            response,
            commandFound
        });
    }
    
    speak(text, options = {}) {
        if (!this.synthesis || this.isSpeaking) return;
        
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance.voice = this.preferredVoice;
        this.currentUtterance.rate = options.rate || this.options.voiceRate;
        this.currentUtterance.pitch = options.pitch || this.options.voicePitch;
        this.currentUtterance.volume = options.volume || this.options.voiceVolume;
        
        this.currentUtterance.onstart = () => {
            this.isSpeaking = true;
            this.updateUI('speaking');
            this.showStatus('Konuşuyorum...');
        };
        
        this.currentUtterance.onend = () => {
            this.isSpeaking = false;
            this.updateUI('idle');
            this.hideStatus();
        };
        
        this.currentUtterance.onerror = (event) => {
            console.error('🗣️ Speech synthesis error:', event.error);
            this.isSpeaking = false;
            this.updateUI('error');
        };
        
        this.synthesis.speak(this.currentUtterance);
        this.metrics.speechSynthesisCount++;
        
        console.log('🗣️ Speaking:', text);
    }
    
    stopSpeaking() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.updateUI('idle');
            this.hideStatus();
        }
    }
    
    updateUI(state) {
        const button = this.voiceButton;
        const icon = button.querySelector('.voice-icon');
        const status = button.querySelector('.voice-status');
        
        switch (state) {
            case 'listening':
                button.style.background = 'var(--red)';
                icon.textContent = '🎙️';
                status.textContent = 'Dinle';
                button.style.animation = 'pulse 1s infinite';
                break;
                
            case 'speaking':
                button.style.background = 'var(--green)';
                icon.textContent = '🗣️';
                status.textContent = 'Konuş';
                button.style.animation = 'none';
                break;
                
            case 'error':
                button.style.background = 'var(--orange)';
                icon.textContent = '⚠️';
                status.textContent = 'Hata';
                button.style.animation = 'none';
                break;
                
            default: // idle
                button.style.background = 'var(--blue)';
                icon.textContent = '🎤';
                status.textContent = 'Dinle';
                button.style.animation = 'none';
                break;
        }
    }
    
    showStatus(message, type = 'info') {
        this.statusIndicator.textContent = message;
        this.statusIndicator.style.opacity = '1';
        this.statusIndicator.style.transform = 'translateY(0)';
        
        if (type === 'error') {
            this.statusIndicator.style.background = 'var(--red)';
            this.statusIndicator.style.color = 'white';
        } else {
            this.statusIndicator.style.background = 'var(--bg-secondary)';
            this.statusIndicator.style.color = 'var(--text-primary)';
        }
    }
    
    hideStatus() {
        this.statusIndicator.style.opacity = '0';
        this.statusIndicator.style.transform = 'translateY(10px)';
    }
    
    updateTranscript(text) {
        this.transcriptDisplay.textContent = text;
        
        if (text) {
            this.transcriptDisplay.style.opacity = '1';
            this.transcriptDisplay.style.transform = 'translateY(0)';
            
            // Auto hide after delay
            setTimeout(() => {
                this.transcriptDisplay.style.opacity = '0';
                this.transcriptDisplay.style.transform = 'translateY(10px)';
            }, 3000);
        }
    }
    
    addCommand(keywords, handler) {
        if (typeof keywords === 'string') {
            keywords = [keywords];
        }
        
        this.commands.set(keywords, handler);
    }
    
    removeCommand(keywords) {
        if (typeof keywords === 'string') {
            keywords = [keywords];
        }
        
        for (const [commandKeywords] of this.commands) {
            if (commandKeywords.some(k => keywords.includes(k))) {
                this.commands.delete(commandKeywords);
                break;
            }
        }
    }
    
    navigate(url) {
        if (url.startsWith('/')) {
            window.location.href = url;
        } else {
            const element = document.getElementById(url);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
    
    getRandomResponse(type, variables = {}) {
        const responses = this.responses[type] || this.responses.error;
        let response = responses[Math.floor(Math.random() * responses.length)];
        
        // Replace variables
        for (const [key, value] of Object.entries(variables)) {
            response = response.replace(`{${key}}`, value);
        }
        
        return response;
    }
    
    showUnsupportedMessage() {
        if (window.notificationSystem) {
            window.notificationSystem.warning(
                'Tarayıcınız sesli asistan özelliğini desteklemiyor.',
                { duration: 5000 }
            );
        }
    }
    
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`voiceAssistant:${eventName}`, {
            detail: {
                ...detail,
                timestamp: performance.now()
            }
        });
        
        window.dispatchEvent(event);
        document.dispatchEvent(event);
    }
    
    // Public API methods
    setLanguage(language) {
        this.options.language = language;
        if (this.recognition) {
            this.recognition.lang = language;
        }
        this.getVoices();
    }
    
    setVoiceSettings(settings) {
        Object.assign(this.options, settings);
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            isSupported: this.isSupported,
            isListening: this.isListening,
            isSpeaking: this.isSpeaking,
            commandCount: this.commands.size,
            recognitionSuccessRate: this.metrics.recognitionAttempts > 0 ? 
                (this.metrics.successfulRecognitions / this.metrics.recognitionAttempts) * 100 : 0
        };
    }
    
    destroy() {
        this.stopListening();
        this.stopSpeaking();
        
        // Remove UI elements
        if (this.voiceButton) this.voiceButton.remove();
        if (this.statusIndicator) this.statusIndicator.remove();
        if (this.transcriptDisplay) this.transcriptDisplay.remove();
        
        // Clear commands
        this.commands.clear();
        
        console.log('🎤 Voice Assistant destroyed');
    }
}

// Auto-initialization
function initializeVoiceAssistant() {
    if (typeof window !== 'undefined') {
        window.VoiceAssistant = VoiceAssistant;
        
        // Create global instance
        window.voiceAssistant = new VoiceAssistant({
            autoStart: false,
            language: 'tr-TR'
        });
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
            
            .voice-assistant-btn:hover {
                transform: scale(1.05);
                box-shadow: var(--shadow-xl);
            }
            
            .voice-transcript::-webkit-scrollbar {
                width: 4px;
            }
            
            .voice-transcript::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .voice-transcript::-webkit-scrollbar-thumb {
                background: var(--separator);
                border-radius: 2px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVoiceAssistant);
} else {
    initializeVoiceAssistant();
}

export default VoiceAssistant; 