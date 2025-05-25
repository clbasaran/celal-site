/**
 * Portfolio OS - Voice Module
 * Apple Design Language V5
 * Advanced voice recognition and speech synthesis system
 */

class Voice {
    constructor(options = {}) {
        this.options = {
            continuous: true,
            interimResults: true,
            language: 'tr-TR',
            maxAlternatives: 1,
            speechRate: 1,
            speechPitch: 1,
            speechVolume: 1,
            voiceURI: '',
            autoStart: false,
            commands: {},
            debug: false,
            ...options
        };
        
        this.isSupported = this.checkSupport();
        this.isListening = false;
        this.isSpeaking = false;
        this.recognition = null;
        this.synthesis = null;
        this.voices = [];
        this.currentVoice = null;
        
        // Event listeners
        this.listeners = new Map();
        
        // Command patterns
        this.commands = new Map();
        this.aliases = new Map();
        
        // Audio context for advanced features
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        
        // Performance metrics
        this.metrics = {
            recognitionAttempts: 0,
            successfulRecognitions: 0,
            commandsExecuted: 0,
            speechSyntheses: 0,
            averageConfidence: 0,
            errors: []
        };
        
        this.init();
    }
    
    init() {
        try {
            if (!this.isSupported) {
                console.warn('⚠️ Voice features not supported in this browser');
                return;
            }
            
            this.setupSpeechRecognition();
            this.setupSpeechSynthesis();
            this.loadVoices();
            this.registerDefaultCommands();
            
            if (this.options.autoStart) {
                this.startListening();
            }
            
            if (this.options.debug) {
                console.log('🎤 Voice module initialized');
            }
            
        } catch (error) {
            console.error('❌ Voice initialization failed:', error);
        }
    }
    
    checkSupport() {
        return 'speechSynthesis' in window && 
               ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    }
    
    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            return;
        }
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = this.options.continuous;
        this.recognition.interimResults = this.options.interimResults;
        this.recognition.lang = this.options.language;
        this.recognition.maxAlternatives = this.options.maxAlternatives;
        
        // Event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
            this.emit('start', { type: 'recognition' });
            
            if (this.options.debug) {
                console.log('🎤 Voice recognition started');
            }
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.emit('end', { type: 'recognition' });
            
            if (this.options.debug) {
                console.log('🎤 Voice recognition ended');
            }
        };
        
        this.recognition.onresult = (event) => {
            this.handleRecognitionResult(event);
        };
        
        this.recognition.onerror = (event) => {
            this.handleRecognitionError(event);
        };
        
        this.recognition.onnomatch = () => {
            this.emit('nomatch', { message: 'No speech was recognized' });
        };
        
        this.recognition.onsoundstart = () => {
            this.emit('soundstart');
        };
        
        this.recognition.onsoundend = () => {
            this.emit('soundend');
        };
    }
    
    setupSpeechSynthesis() {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            return;
        }
        
        this.synthesis = window.speechSynthesis;
        
        // Handle voice changed event
        this.synthesis.addEventListener('voiceschanged', () => {
            this.loadVoices();
        });
    }
    
    loadVoices() {
        if (!this.synthesis) return;
        
        this.voices = this.synthesis.getVoices();
        
        // Find best voice for current language
        const langCode = this.options.language.split('-')[0];
        this.currentVoice = this.voices.find(voice => 
            voice.lang.startsWith(langCode) && voice.localService
        ) || this.voices.find(voice => 
            voice.lang.startsWith(langCode)
        ) || this.voices[0];
        
        if (this.options.debug) {
            console.log('🔊 Loaded voices:', this.voices.length);
            console.log('🔊 Current voice:', this.currentVoice?.name);
        }
    }
    
    // Speech Recognition Methods
    startListening() {
        if (!this.recognition || this.isListening) return;
        
        try {
            this.recognition.start();
            this.metrics.recognitionAttempts++;
        } catch (error) {
            console.error('Failed to start listening:', error);
        }
    }
    
    stopListening() {
        if (!this.recognition || !this.isListening) return;
        
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Failed to stop listening:', error);
        }
    }
    
    handleRecognitionResult(event) {
        const results = Array.from(event.results);
        const lastResult = results[results.length - 1];
        
        if (lastResult.isFinal) {
            const transcript = lastResult[0].transcript.trim();
            const confidence = lastResult[0].confidence;
            
            this.metrics.successfulRecognitions++;
            this.metrics.averageConfidence = 
                (this.metrics.averageConfidence + confidence) / 2;
            
            const result = {
                transcript,
                confidence,
                isFinal: true,
                timestamp: Date.now()
            };
            
            this.emit('result', result);
            this.processCommand(transcript, confidence);
            
            if (this.options.debug) {
                console.log('🎤 Final result:', transcript, `(${Math.round(confidence * 100)}%)`);
            }
        } else {
            const transcript = lastResult[0].transcript.trim();
            
            this.emit('result', {
                transcript,
                confidence: lastResult[0].confidence,
                isFinal: false,
                timestamp: Date.now()
            });
        }
    }
    
    handleRecognitionError(event) {
        const error = {
            error: event.error,
            message: event.message || 'Recognition error',
            timestamp: Date.now()
        };
        
        this.metrics.errors.push(error);
        this.emit('error', error);
        
        if (this.options.debug) {
            console.error('🎤 Recognition error:', event.error, event.message);
        }
    }
    
    // Speech Synthesis Methods
    speak(text, options = {}) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not available');
            return Promise.reject(new Error('Speech synthesis not available'));
        }
        
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Set voice options
            utterance.voice = options.voice || this.currentVoice;
            utterance.rate = options.rate || this.options.speechRate;
            utterance.pitch = options.pitch || this.options.speechPitch;
            utterance.volume = options.volume || this.options.speechVolume;
            utterance.lang = options.language || this.options.language;
            
            // Event handlers
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.emit('speechstart', { text, utterance });
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this.metrics.speechSyntheses++;
                this.emit('speechend', { text, utterance });
                resolve();
            };
            
            utterance.onerror = (event) => {
                this.isSpeaking = false;
                this.emit('speecherror', { error: event.error, text, utterance });
                reject(new Error(event.error));
            };
            
            utterance.onpause = () => {
                this.emit('speechpause', { text, utterance });
            };
            
            utterance.onresume = () => {
                this.emit('speechresume', { text, utterance });
            };
            
            // Speak
            this.synthesis.speak(utterance);
            
            if (this.options.debug) {
                console.log('🔊 Speaking:', text);
            }
        });
    }
    
    stopSpeaking() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }
    
    pauseSpeaking() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.pause();
        }
    }
    
    resumeSpeaking() {
        if (this.synthesis) {
            this.synthesis.resume();
        }
    }
    
    // Command System
    registerCommand(pattern, callback, options = {}) {
        const commandId = options.id || `cmd_${Date.now()}`;
        
        const command = {
            id: commandId,
            pattern: typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern,
            callback,
            options: {
                confidence: 0.7,
                description: '',
                examples: [],
                ...options
            }
        };
        
        this.commands.set(commandId, command);
        
        // Register aliases
        if (options.aliases) {
            options.aliases.forEach(alias => {
                this.aliases.set(alias.toLowerCase(), commandId);
            });
        }
        
        return commandId;
    }
    
    unregisterCommand(commandId) {
        this.commands.delete(commandId);
        
        // Remove aliases
        for (const [alias, id] of this.aliases.entries()) {
            if (id === commandId) {
                this.aliases.delete(alias);
            }
        }
    }
    
    processCommand(transcript, confidence) {
        const text = transcript.toLowerCase().trim();
        
        // Check aliases first
        const aliasCommand = this.aliases.get(text);
        if (aliasCommand && this.commands.has(aliasCommand)) {
            const command = this.commands.get(aliasCommand);
            if (confidence >= command.options.confidence) {
                this.executeCommand(command, transcript, confidence);
                return;
            }
        }
        
        // Check pattern matches
        for (const [id, command] of this.commands.entries()) {
            const match = text.match(command.pattern);
            if (match && confidence >= command.options.confidence) {
                this.executeCommand(command, transcript, confidence, match);
                return;
            }
        }
        
        // No command matched
        this.emit('commandnotfound', { transcript, confidence });
    }
    
    executeCommand(command, transcript, confidence, match = null) {
        try {
            const context = {
                transcript,
                confidence,
                match,
                timestamp: Date.now(),
                voice: this
            };
            
            command.callback(context);
            this.metrics.commandsExecuted++;
            
            this.emit('commandexecuted', {
                command: command.id,
                transcript,
                confidence,
                match
            });
            
            if (this.options.debug) {
                console.log('🎯 Command executed:', command.id, transcript);
            }
            
        } catch (error) {
            console.error('Command execution error:', error);
            this.emit('commanderror', {
                command: command.id,
                error: error.message,
                transcript
            });
        }
    }
    
    registerDefaultCommands() {
        // Navigation commands
        this.registerCommand(
            /(?:git|go to|open) (.*)/,
            (context) => {
                const target = context.match[1];
                this.navigateToPage(target);
            },
            {
                id: 'navigate',
                description: 'Navigate to a page',
                examples: ['git anasayfa', 'go to about', 'open projects'],
                aliases: ['anasayfa', 'projeler', 'hakkımda', 'iletişim']
            }
        );
        
        // UI commands
        this.registerCommand(
            /(?:scroll|kaydır) (up|down|yukarı|aşağı)/,
            (context) => {
                const direction = context.match[1];
                this.scrollPage(direction);
            },
            {
                id: 'scroll',
                description: 'Scroll the page',
                examples: ['scroll up', 'kaydır aşağı']
            }
        );
        
        // Search command
        this.registerCommand(
            /(?:search|ara) (.*)/,
            (context) => {
                const query = context.match[1];
                this.performSearch(query);
            },
            {
                id: 'search',
                description: 'Search content',
                examples: ['search javascript', 'ara react']
            }
        );
        
        // Theme commands
        this.registerCommand(
            /(?:switch to|change to|değiştir) (dark|light|koyu|açık) (?:mode|tema)/,
            (context) => {
                const theme = context.match[1];
                this.changeTheme(theme);
            },
            {
                id: 'theme',
                description: 'Change theme',
                examples: ['switch to dark mode', 'değiştir koyu tema']
            }
        );
        
        // Voice control
        this.registerCommand(
            /(?:stop listening|dur|kapat)/,
            () => {
                this.stopListening();
                this.speak('Ses tanıma durduruldu');
            },
            {
                id: 'stop',
                description: 'Stop voice recognition',
                aliases: ['dur', 'kapat', 'stop']
            }
        );
    }
    
    // Helper Methods
    navigateToPage(target) {
        const pageMap = {
            'anasayfa': '/',
            'home': '/',
            'hakkımda': '/about.html',
            'about': '/about.html',
            'projeler': '/projects.html',
            'projects': '/projects.html',
            'yetenekler': '/skills.html',
            'skills': '/skills.html',
            'blog': '/blog.html',
            'iletişim': '/contact.html',
            'contact': '/contact.html',
            'hire': '/hire-me.html'
        };
        
        const url = pageMap[target.toLowerCase()] || `/${target.toLowerCase()}.html`;
        
        if (pageMap[target.toLowerCase()]) {
            window.location.href = url;
            this.speak(`${target} sayfasına gidiliyor`);
        } else {
            this.speak('Sayfa bulunamadı');
        }
    }
    
    scrollPage(direction) {
        const scrollAmount = window.innerHeight * 0.8;
        const isDown = ['down', 'aşağı'].includes(direction.toLowerCase());
        
        window.scrollBy({
            top: isDown ? scrollAmount : -scrollAmount,
            behavior: 'smooth'
        });
        
        this.speak(isDown ? 'Aşağı kaydırıldı' : 'Yukarı kaydırıldı');
    }
    
    performSearch(query) {
        // Trigger search functionality
        const searchInput = document.querySelector('input[type="search"], .search-input');
        if (searchInput) {
            searchInput.value = query;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.focus();
        }
        
        this.speak(`"${query}" aranıyor`);
    }
    
    changeTheme(theme) {
        const isDark = ['dark', 'koyu'].includes(theme.toLowerCase());
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        this.speak(`${isDark ? 'Koyu' : 'Açık'} tema aktifleştirildi`);
    }
    
    // Voice List Methods
    getVoices() {
        return this.voices;
    }
    
    setVoice(voiceURI) {
        const voice = this.voices.find(v => v.voiceURI === voiceURI);
        if (voice) {
            this.currentVoice = voice;
            return true;
        }
        return false;
    }
    
    // Audio Analysis (Advanced Features)
    async setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.microphone.connect(this.analyser);
            
            this.analyser.fftSize = 256;
            
        } catch (error) {
            console.error('Failed to setup audio context:', error);
        }
    }
    
    getAudioLevel() {
        if (!this.analyser) return 0;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        return average / 255;
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
                    console.error(`Error in voice callback for ${event}:`, error);
                }
            });
        }
    }
    
    // Utility Methods
    getMetrics() {
        return {
            ...this.metrics,
            isSupported: this.isSupported,
            isListening: this.isListening,
            isSpeaking: this.isSpeaking,
            commandsRegistered: this.commands.size,
            voicesAvailable: this.voices.length,
            currentVoice: this.currentVoice?.name
        };
    }
    
    setLanguage(language) {
        this.options.language = language;
        if (this.recognition) {
            this.recognition.lang = language;
        }
        this.loadVoices();
    }
    
    destroy() {
        this.stopListening();
        this.stopSpeaking();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.commands.clear();
        this.aliases.clear();
        this.listeners.clear();
        
        console.log('🎤 Voice module destroyed');
    }
}

// Auto-initialization
function initializeVoice() {
    if (typeof window !== 'undefined') {
        window.Voice = Voice;
        window.voice = new Voice({
            language: document.documentElement.lang || 'tr-TR',
            debug: false
        });
        
        // Add voice activation button functionality
        document.addEventListener('click', (e) => {
            const voiceBtn = e.target.closest('[data-voice-toggle]');
            if (voiceBtn) {
                if (window.voice.isListening) {
                    window.voice.stopListening();
                } else {
                    window.voice.startListening();
                }
            }
        });
        
        // Add keyboard shortcut (Ctrl/Cmd + Shift + V)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
                e.preventDefault();
                if (window.voice.isListening) {
                    window.voice.stopListening();
                } else {
                    window.voice.startListening();
                }
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeVoice);
} else {
    initializeVoice();
}

export default Voice; 