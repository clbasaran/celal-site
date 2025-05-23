/*
 * ============================================================================
 * VOICE COMMANDS MODULE
 * Advanced Voice Recognition and Command Processing System
 * ============================================================================
 * Features:
 * - Web Speech API Integration
 * - Multi-language Voice Recognition
 * - Smart Command Processing
 * - Voice-to-Text Conversion
 * - Audio Feedback System
 * - Accessibility Compliance
 * ============================================================================
 */

class VoiceCommands {
    constructor() {
        this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
        this.isListening = false;
        this.isEnabled = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        
        // Language settings
        this.currentLanguage = 'tr-TR';
        this.supportedLanguages = {
            'tr-TR': 'Türkçe',
            'en-US': 'English',
            'en-GB': 'English (UK)'
        };
        
        // Command patterns
        this.commands = {
            'tr-TR': {
                navigation: {
                    patterns: [
                        'ana sayfa', 'anasayfa', 'ev', 'home',
                        'hakkımda', 'hakkında', 'about',
                        'projeler', 'proje', 'projects',
                        'iletişim', 'contact', 'kontak'
                    ],
                    actions: {
                        'ana sayfa|anasayfa|ev|home': () => this.navigateTo('#home'),
                        'hakkımda|hakkında|about': () => this.navigateTo('#about'),
                        'projeler|proje|projects': () => this.navigateTo('#projects'),
                        'iletişim|contact|kontak': () => this.navigateTo('#contact')
                    }
                },
                ui: {
                    patterns: [
                        'tema değiştir', 'dark mode', 'light mode', 'karanlık mod', 'aydınlık mod',
                        'arama aç', 'arama', 'search', 'ara',
                        'asistan aç', 'asistan', 'yardım', 'help',
                        'menü aç', 'menü', 'menu'
                    ],
                    actions: {
                        'tema değiştir|dark mode|light mode|karanlık mod|aydınlık mod': () => this.toggleTheme(),
                        'arama aç|arama|search|ara': () => this.openSearch(),
                        'asistan aç|asistan|yardım|help': () => this.openAssistant(),
                        'menü aç|menü|menu': () => this.toggleMobileMenu()
                    }
                },
                feedback: {
                    listening: "Dinliyorum...",
                    processing: "İşleniyor...",
                    command_executed: "Komut çalıştırıldı",
                    command_not_found: "Komut bulunamadı. 'Yardım' diyerek komutları öğrenebilirsiniz.",
                    error: "Ses tanıma hatası oluştu"
                }
            },
            'en-US': {
                navigation: {
                    patterns: [
                        'home', 'homepage', 'main page',
                        'about', 'about me', 'biography',
                        'projects', 'portfolio', 'work',
                        'contact', 'get in touch', 'reach out'
                    ],
                    actions: {
                        'home|homepage|main page': () => this.navigateTo('#home'),
                        'about|about me|biography': () => this.navigateTo('#about'),
                        'projects|portfolio|work': () => this.navigateTo('#projects'),
                        'contact|get in touch|reach out': () => this.navigateTo('#contact')
                    }
                },
                ui: {
                    patterns: [
                        'toggle theme', 'dark mode', 'light mode', 'change theme',
                        'open search', 'search', 'find',
                        'open assistant', 'assistant', 'help',
                        'open menu', 'menu', 'navigation'
                    ],
                    actions: {
                        'toggle theme|dark mode|light mode|change theme': () => this.toggleTheme(),
                        'open search|search|find': () => this.openSearch(),
                        'open assistant|assistant|help': () => this.openAssistant(),
                        'open menu|menu|navigation': () => this.toggleMobileMenu()
                    }
                },
                feedback: {
                    listening: "Listening...",
                    processing: "Processing...",
                    command_executed: "Command executed",
                    command_not_found: "Command not found. Say 'help' to learn available commands.",
                    error: "Speech recognition error occurred"
                }
            }
        };
        
        // Voice settings
        this.voiceSettings = {
            continuous: true,
            interimResults: false,
            maxAlternatives: 1
        };
        
        // Confidence threshold
        this.confidenceThreshold = 0.7;
        
        // Wake word detection
        this.wakeWords = ['hey celal', 'celal', 'assistant', 'asistan'];
        this.isWakeWordMode = false;
        
        this.init();
    }
    
    async init() {
        if (!this.isSupported) {
            console.warn('Voice commands not supported in this browser');
            return;
        }
        
        this.setupSpeechRecognition();
        this.setupEventListeners();
        this.loadSettings();
        
        console.log('🎤 Voice Commands initialized');
    }
    
    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.continuous = this.voiceSettings.continuous;
        this.recognition.interimResults = this.voiceSettings.interimResults;
        this.recognition.maxAlternatives = this.voiceSettings.maxAlternatives;
        this.recognition.lang = this.currentLanguage;
        
        // Event listeners
        this.recognition.onstart = () => {
            this.onListeningStart();
        };
        
        this.recognition.onresult = (event) => {
            this.onResult(event);
        };
        
        this.recognition.onerror = (event) => {
            this.onError(event);
        };
        
        this.recognition.onend = () => {
            this.onListeningEnd();
        };
    }
    
    setupEventListeners() {
        // Voice toggle button
        const voiceToggle = document.getElementById('voiceToggle');
        if (voiceToggle) {
            voiceToggle.addEventListener('click', () => {
                this.toggle();
            });
        }
        
        // Keyboard shortcut (Ctrl/Cmd + `)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === '`') {
                e.preventDefault();
                this.toggle();
            }
        });
        
        // Long press on space bar to activate voice
        let spacePressed = false;
        let spaceTimer = null;
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !spacePressed && !this.isInputFocused()) {
                spacePressed = true;
                spaceTimer = setTimeout(() => {
                    if (spacePressed) {
                        this.startListening();
                    }
                }, 500); // 500ms long press
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && spacePressed) {
                spacePressed = false;
                if (spaceTimer) {
                    clearTimeout(spaceTimer);
                    spaceTimer = null;
                }
                if (this.isListening) {
                    this.stopListening();
                }
            }
        });
        
        // Wake word detection toggle
        const wakeWordToggle = document.getElementById('wakeWordToggle');
        if (wakeWordToggle) {
            wakeWordToggle.addEventListener('change', (e) => {
                this.isWakeWordMode = e.target.checked;
                if (this.isWakeWordMode) {
                    this.startWakeWordDetection();
                } else {
                    this.stopWakeWordDetection();
                }
            });
        }
    }
    
    onListeningStart() {
        this.isListening = true;
        this.showVoiceIndicator(true);
        this.updateVoiceButton(true);
        console.log('🎤 Voice listening started');
    }
    
    onResult(event) {
        const results = event.results;
        const lastResult = results[results.length - 1];
        
        if (lastResult.isFinal) {
            const transcript = lastResult[0].transcript.toLowerCase().trim();
            const confidence = lastResult[0].confidence;
            
            console.log(`Voice input: "${transcript}" (confidence: ${confidence})`);
            
            if (confidence >= this.confidenceThreshold) {
                this.processCommand(transcript);
            } else {
                this.provideFeedback('command_not_found');
            }
        }
    }
    
    onError(event) {
        console.error('Speech recognition error:', event.error);
        this.provideFeedback('error');
        this.stopListening();
    }
    
    onListeningEnd() {
        this.isListening = false;
        this.showVoiceIndicator(false);
        this.updateVoiceButton(false);
        console.log('🎤 Voice listening ended');
        
        // Auto-restart if in wake word mode
        if (this.isWakeWordMode && this.isEnabled) {
            setTimeout(() => {
                this.startListening();
            }, 500);
        }
    }
    
    async processCommand(transcript) {
        const commands = this.commands[this.currentLanguage];
        if (!commands) return;
        
        // Check for wake word first if in wake word mode
        if (this.isWakeWordMode) {
            const hasWakeWord = this.wakeWords.some(word => 
                transcript.includes(word.toLowerCase())
            );
            
            if (!hasWakeWord) {
                return; // Ignore if no wake word detected
            }
            
            // Remove wake word from transcript
            let cleanTranscript = transcript;
            this.wakeWords.forEach(word => {
                cleanTranscript = cleanTranscript.replace(word.toLowerCase(), '').trim();
            });
            transcript = cleanTranscript;
        }
        
        this.provideFeedback('processing');
        
        // Check all command categories
        let commandExecuted = false;
        
        for (const [category, config] of Object.entries(commands)) {
            if (category === 'feedback') continue;
            
            for (const [pattern, action] of Object.entries(config.actions)) {
                const regex = new RegExp(`\\b(${pattern})\\b`, 'i');
                if (regex.test(transcript)) {
                    try {
                        await action();
                        this.provideFeedback('command_executed');
                        commandExecuted = true;
                        break;
                    } catch (error) {
                        console.error('Command execution error:', error);
                        this.provideFeedback('error');
                        return;
                    }
                }
            }
            
            if (commandExecuted) break;
        }
        
        // Special commands
        if (!commandExecuted) {
            commandExecuted = await this.handleSpecialCommands(transcript);
        }
        
        if (!commandExecuted) {
            this.provideFeedback('command_not_found');
        }
    }
    
    async handleSpecialCommands(transcript) {
        const lang = this.currentLanguage;
        
        // Help command
        if (transcript.includes('help') || transcript.includes('yardım') || transcript.includes('komutlar')) {
            this.showAvailableCommands();
            return true;
        }
        
        // Stop listening
        if (transcript.includes('stop') || transcript.includes('dur') || transcript.includes('kapat')) {
            this.stopListening();
            this.speak(lang === 'tr-TR' ? 'Ses komutları kapatıldı' : 'Voice commands disabled');
            return true;
        }
        
        // Scroll commands
        if (transcript.includes('scroll up') || transcript.includes('yukarı kaydır')) {
            window.scrollBy(0, -300);
            return true;
        }
        
        if (transcript.includes('scroll down') || transcript.includes('aşağı kaydır')) {
            window.scrollBy(0, 300);
            return true;
        }
        
        // AI Assistant commands
        if (transcript.includes('ask') || transcript.includes('sor')) {
            const question = transcript.replace(/(ask|sor)/gi, '').trim();
            if (question) {
                this.sendToAI(question);
                return true;
            }
        }
        
        return false;
    }
    
    showAvailableCommands() {
        const commands = this.commands[this.currentLanguage];
        if (!commands) return;
        
        let commandsList = '';
        
        for (const [category, config] of Object.entries(commands)) {
            if (category === 'feedback') continue;
            
            commandsList += `${category.toUpperCase()}:\n`;
            for (const pattern of Object.keys(config.actions)) {
                const examples = pattern.split('|').slice(0, 2);
                commandsList += `• ${examples.join(' or ')}\n`;
            }
            commandsList += '\n';
        }
        
        // Show in modal or console
        console.log('Available voice commands:\n', commandsList);
        this.speak(this.currentLanguage === 'tr-TR' ? 
            'Mevcut komutlar konsola yazdırıldı' : 
            'Available commands printed to console'
        );
    }
    
    // Navigation actions
    navigateTo(section) {
        const element = document.querySelector(section);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            
            // Update active nav link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === section) {
                    link.classList.add('active');
                }
            });
        }
    }
    
    // UI actions
    toggleTheme() {
        const app = window.portfolioApp;
        if (app && app.toggleTheme) {
            app.toggleTheme();
        }
    }
    
    openSearch() {
        const app = window.portfolioApp;
        if (app && app.openSearch) {
            app.openSearch();
        }
    }
    
    openAssistant() {
        const aiAssistant = document.getElementById('aiAssistant');
        if (aiAssistant) {
            aiAssistant.classList.add('open');
        }
    }
    
    toggleMobileMenu() {
        const mobileToggle = document.getElementById('mobileToggle');
        if (mobileToggle) {
            mobileToggle.click();
        }
    }
    
    sendToAI(question) {
        const aiInput = document.getElementById('aiInput');
        const aiSend = document.getElementById('aiSend');
        
        if (aiInput && aiSend) {
            aiInput.value = question;
            aiSend.click();
            this.openAssistant();
        }
    }
    
    // Voice feedback
    provideFeedback(type) {
        const feedback = this.commands[this.currentLanguage]?.feedback;
        if (feedback && feedback[type]) {
            this.speak(feedback[type]);
        }
    }
    
    speak(text, options = {}) {
        if (!this.synthesis) return;
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice
        utterance.lang = this.currentLanguage;
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 0.8;
        
        // Find appropriate voice
        const voices = this.synthesis.getVoices();
        const voice = voices.find(v => v.lang === this.currentLanguage) || voices[0];
        if (voice) {
            utterance.voice = voice;
        }
        
        this.synthesis.speak(utterance);
    }
    
    // Voice indicator UI
    showVoiceIndicator(show) {
        const indicator = document.getElementById('voiceIndicator');
        if (indicator) {
            if (show) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        }
    }
    
    updateVoiceButton(listening) {
        const button = document.getElementById('voiceToggle');
        if (button) {
            if (listening) {
                button.classList.add('listening');
                button.setAttribute('title', 'Voice listening... (Click to stop)');
            } else {
                button.classList.remove('listening');
                button.setAttribute('title', 'Start voice commands');
            }
        }
    }
    
    // Control methods
    toggle() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    startListening() {
        if (!this.isSupported || this.isListening) return;
        
        try {
            this.recognition.start();
            this.isEnabled = true;
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
        }
    }
    
    stopListening() {
        if (!this.isListening) return;
        
        try {
            this.recognition.stop();
            this.isEnabled = false;
        } catch (error) {
            console.error('Failed to stop voice recognition:', error);
        }
    }
    
    startWakeWordDetection() {
        this.isWakeWordMode = true;
        this.startListening();
    }
    
    stopWakeWordDetection() {
        this.isWakeWordMode = false;
        this.stopListening();
    }
    
    // Language management
    setLanguage(language) {
        if (this.supportedLanguages[language]) {
            this.currentLanguage = language;
            if (this.recognition) {
                this.recognition.lang = language;
            }
            this.saveSettings();
            console.log(`Voice language set to: ${language}`);
        }
    }
    
    // Settings management
    saveSettings() {
        const settings = {
            language: this.currentLanguage,
            enabled: this.isEnabled,
            wakeWordMode: this.isWakeWordMode,
            confidenceThreshold: this.confidenceThreshold
        };
        
        try {
            localStorage.setItem('voice_commands_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save voice settings:', error);
        }
    }
    
    loadSettings() {
        try {
            const settings = localStorage.getItem('voice_commands_settings');
            if (settings) {
                const parsed = JSON.parse(settings);
                this.currentLanguage = parsed.language || this.currentLanguage;
                this.isWakeWordMode = parsed.wakeWordMode || false;
                this.confidenceThreshold = parsed.confidenceThreshold || 0.7;
                
                if (this.recognition) {
                    this.recognition.lang = this.currentLanguage;
                }
            }
        } catch (error) {
            console.warn('Failed to load voice settings:', error);
        }
    }
    
    // Utility methods
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );
    }
    
    // Public API
    enable() {
        this.isEnabled = true;
        this.startListening();
    }
    
    disable() {
        this.isEnabled = false;
        this.stopListening();
    }
    
    isAvailable() {
        return this.isSupported;
    }
    
    getStatus() {
        return {
            supported: this.isSupported,
            enabled: this.isEnabled,
            listening: this.isListening,
            language: this.currentLanguage,
            wakeWordMode: this.isWakeWordMode
        };
    }
    
    // Debug methods
    test() {
        if (!this.isSupported) {
            console.log('Voice commands not supported');
            return;
        }
        
        console.log('Voice Commands Test:');
        console.log('- Supported:', this.isSupported);
        console.log('- Current language:', this.currentLanguage);
        console.log('- Available voices:', this.synthesis.getVoices().length);
        console.log('- Wake word mode:', this.isWakeWordMode);
        
        this.speak(this.currentLanguage === 'tr-TR' ? 
            'Ses komutları test ediliyor' : 
            'Voice commands testing'
        );
    }
}

// Initialize and export
const voiceCommands = new VoiceCommands();

export default voiceCommands; 