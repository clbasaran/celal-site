/**
 * Portfolio OS - AI Assistant Modal Module
 * Apple Design Language V5 - Modal Implementation
 * Popup modal version of AI Assistant with glassmorphism and full functionality
 */

class AIAssistantModal {
  constructor(options = {}) {
    this.options = {
      modalSelector: '#assistantModal',
      fabSelector: '#assistantFAB',
      chatLogSelector: '#assistantChatLog',
      chatFormSelector: '#assistantChatForm',
      chatInputSelector: '#assistantChatInput',
      sendButtonSelector: '#assistantSendBtn',
      voiceButtonSelector: '#assistantVoiceBtn',
      closeButtonSelector: '#assistantModalClose',
      minimizeButtonSelector: '#assistantModalMinimize',
      welcomeSelector: '#assistantWelcome',
      typingSelector: '#assistantTyping',
      statusSelector: '#assistantStatus',
      fabStatusSelector: '#fabStatus',
      charCountSelector: '#chatCharCount',
      apiEndpoint: options.apiEndpoint || '/api/assistant',
      maxHistoryLength: 50,
      typingSpeed: 30,
      autoSuggestions: true,
      contextAware: true,
      multiLanguage: true,
      voiceEnabled: false,
      sessionKey: 'aiAssistantModal',
      ...options
    };

    this.isInitialized = false;
    this.isOpen = false;
    this.isMinimized = false;
    this.isTyping = false;
    this.conversationHistory = [];
    this.currentContext = {};
    this.suggestions = [];
    this.language = document.documentElement.lang || 'tr';
    
    // DOM element references
    this.modal = null;
    this.fab = null;
    this.chatLog = null;
    this.chatForm = null;
    this.chatInput = null;
    this.sendButton = null;
    this.voiceButton = null;
    this.closeButton = null;
    this.minimizeButton = null;
    this.welcomeSection = null;
    this.typingIndicator = null;
    this.statusIndicator = null;
    this.fabStatus = null;
    this.charCount = null;
    
    this.init();
  }

  /**
   * Initialize the AI Assistant Modal
   */
  async init() {
    try {
      this.setupDOMReferences();
      await this.loadConfiguration();
      this.bindEvents();
      this.loadConversationHistory();
      this.setupContextTracking();
      this.initializeKeyboardShortcuts();
      this.updateStatus('online');
      
      this.isInitialized = true;
      this.log('AI Assistant Modal initialized successfully');
      
      // Show initial suggestions
      setTimeout(() => this.showInitialSuggestions(), 1000);
      
    } catch (error) {
      this.log('Failed to initialize AI Assistant Modal:', error);
      this.updateStatus('error');
    }
  }

  /**
   * Setup DOM element references
   */
  setupDOMReferences() {
    this.modal = document.querySelector(this.options.modalSelector);
    this.fab = document.querySelector(this.options.fabSelector);
    this.chatLog = document.querySelector(this.options.chatLogSelector);
    this.chatForm = document.querySelector(this.options.chatFormSelector);
    this.chatInput = document.querySelector(this.options.chatInputSelector);
    this.sendButton = document.querySelector(this.options.sendButtonSelector);
    this.voiceButton = document.querySelector(this.options.voiceButtonSelector);
    this.closeButton = document.querySelector(this.options.closeButtonSelector);
    this.minimizeButton = document.querySelector(this.options.minimizeButtonSelector);
    this.welcomeSection = document.querySelector(this.options.welcomeSelector);
    this.typingIndicator = document.querySelector(this.options.typingSelector);
    this.statusIndicator = document.querySelector(this.options.statusSelector);
    this.fabStatus = document.querySelector(this.options.fabStatusSelector);
    this.charCount = document.querySelector(this.options.charCountSelector);

    if (!this.modal || !this.fab) {
      throw new Error('Required modal elements not found');
    }
  }

  /**
   * Load configuration from remote or local storage
   */
  async loadConfiguration() {
    try {
      const savedConfig = localStorage.getItem(`${this.options.sessionKey}-config`);
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }

      // Load remote configuration if available
      if (this.options.configEndpoint) {
        const response = await fetch(this.options.configEndpoint);
        if (response.ok) {
          const remoteConfig = await response.json();
          this.config = { ...this.config, ...remoteConfig };
          localStorage.setItem(`${this.options.sessionKey}-config`, JSON.stringify(this.config));
        }
      }
    } catch (error) {
      this.log('Failed to load configuration:', error);
    }
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // FAB click events
    if (this.fab) {
      this.fab.addEventListener('click', () => this.toggle());
      this.fab.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggle();
        }
      });
    }

    // Modal control events
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.close());
    }

    if (this.minimizeButton) {
      this.minimizeButton.addEventListener('click', () => this.minimize());
    }

    // Chat form events
    if (this.chatForm) {
      this.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    if (this.chatInput) {
      this.chatInput.addEventListener('input', () => this.handleInputChange());
      this.chatInput.addEventListener('keydown', (e) => this.handleInputKeydown(e));
      this.chatInput.addEventListener('paste', () => {
        setTimeout(() => this.handleInputChange(), 0);
      });
    }

    // Voice button (disabled for now)
    if (this.voiceButton) {
      this.voiceButton.addEventListener('click', () => this.toggleVoiceInput());
    }

    // Backdrop click to close
    const backdrop = this.modal?.querySelector('.assistant-modal__backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.close());
    }

    // Global escape key
    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

    // Suggestion chips
    this.bindSuggestionEvents();

    // Resize handling
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Bind suggestion chip events
   */
  bindSuggestionEvents() {
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    suggestionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const suggestion = chip.dataset.suggestion;
        if (suggestion) {
          this.chatInput.value = suggestion;
          this.handleInputChange();
          this.chatInput.focus();
          this.hideWelcome();
        }
      });
    });
  }

  /**
   * Handle input changes (character count, button states)
   */
  handleInputChange() {
    const text = this.chatInput.value.trim();
    const length = this.chatInput.value.length;
    
    // Update character count
    if (this.charCount) {
      this.charCount.textContent = length;
    }

    // Update send button state
    if (this.sendButton) {
      this.sendButton.disabled = text.length === 0;
    }

    // Auto-resize textarea
    this.autoResizeTextarea();

    // Generate suggestions if enabled
    if (this.options.autoSuggestions && text.length > 2) {
      this.generateSuggestions(text);
    }
  }

  /**
   * Handle input keydown events
   */
  handleInputKeydown(e) {
    // Send with Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      this.sendMessage();
    }
    
    // Allow Shift + Enter for new lines
    if (e.shiftKey && e.key === 'Enter') {
      return; // Let default behavior happen
    }
    
    // Prevent Enter from submitting (mobile keyboards)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Handle global keyboard shortcuts
   */
  handleGlobalKeydown(e) {
    // Toggle modal with Cmd/Ctrl + /
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      this.toggle();
      return;
    }

    // Close modal with Escape
    if (e.key === 'Escape' && this.isOpen) {
      e.preventDefault();
      this.close();
      return;
    }
  }

  /**
   * Initialize keyboard shortcuts
   */
  initializeKeyboardShortcuts() {
    // Focus trap when modal is open
    this.modal.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.key === 'Tab') {
        this.handleTabKeyInModal(e);
      }
    });
  }

  /**
   * Handle tab key for focus trapping
   */
  handleTabKeyInModal(e) {
    const focusableElements = this.modal.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
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

  /**
   * Auto-resize textarea based on content
   */
  autoResizeTextarea() {
    if (!this.chatInput) return;

    this.chatInput.style.height = 'auto';
    const scrollHeight = this.chatInput.scrollHeight;
    const maxHeight = 120; // 5 lines approximately
    
    this.chatInput.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }

  /**
   * Send message to AI
   */
  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message || this.isTyping) return;

    try {
      // Add user message to chat
      this.addMessage(message, 'user');
      
      // Clear input and hide welcome
      this.chatInput.value = '';
      this.handleInputChange();
      this.hideWelcome();
      
      // Show typing indicator
      this.showTypingIndicator();
      
      // Get AI response
      const response = await this.getAIResponse(message);
      
      // Hide typing indicator
      this.hideTypingIndicator();
      
      // Add AI response
      await this.typeMessage(response, 'assistant');
      
      // Save conversation
      this.saveConversationHistory();
      
      // Track event
      this.trackEvent('message_sent', { messageLength: message.length });
      
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', 'assistant', true);
      this.log('Error sending message:', error);
    }
  }

  /**
   * Get AI response (mock implementation)
   */
  async getAIResponse(message) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = {
      // Portfolio related
      'projeler': 'Portfolio OS ile birlikte çeşitli iOS, React ve Node.js projeleri geliştirdim. Özellikle SwiftUI modern arayüzler ve Firebase realtime uygulamalar konusunda deneyimliyim.',
      'hangi projeler': 'Son projelerim arasında Portfolio OS, Modern SwiftUI UI, Firebase Realtime Chat ve iOS 18 Yenilikleri blog yazıları bulunuyor.',
      'yetenekler': 'iOS/SwiftUI, React/Next.js, Node.js, TypeScript, Python, Firebase, PostgreSQL ve çeşitli modern web teknolojilerinde deneyimliyim.',
      'nelerdir': 'Swift, SwiftUI, React, Next.js, TypeScript, Node.js, Python, Firebase, Supabase, PostgreSQL, MongoDB teknolojilerinde uzmanım.',
      
      // Contact related
      'iletişim': 'Benimle LinkedIn, GitHub veya email üzerinden iletişime geçebilirsiniz. Portfolio sitesindeki iletişim sayfasından detaylı bilgilere ulaşabilirsiniz.',
      'contact': 'You can reach me through LinkedIn, GitHub or email. Visit the contact page for detailed information.',
      
      // System related
      'sistem': 'Portfolio OS v2.0 şu anda 12 modül ile aktif durumda. Tüm sistemler çalışıyor ve performans optimal seviyede.',
      'durumu': 'Sistem durumu mükemmel! AI Assistant online, Analytics aktif, tüm modüller sorunsuz çalışıyor.',
      'status': 'All systems operational! AI Assistant online, Analytics active, all 12 modules running smoothly.',
      
      // Help
      'help': 'I can help you with information about projects, skills, contact details, or system status. What would you like to know?',
      'yardım': 'Projeler, yetenekler, iletişim bilgileri veya sistem durumu hakkında size yardımcı olabilirim. Ne öğrenmek istiyorsunuz?',
      
      // Default responses
      'default': [
        'Bu konuda size nasıl yardımcı olabilirim? Projeler, yetenekler veya iletişim bilgileri hakkında soru sorabilirsiniz.',
        'Portfolio OS ile ilgili ne öğrenmek istiyorsunuz? Sistem özellikleri, projeler veya teknik detaylar hakkında sorabilirsiniz.',
        'Size nasıl yardımcı olabilirim? İş deneyimleri, teknik yetenekler veya projeler hakkında bilgi verebilirim.',
        'Hangi konuda bilgi almak istiyorsunuz? Portfolyo, projeler, teknolojiler veya sistem durumu hakkında soru sorabilirsiniz.'
      ]
    };

    // Find matching response
    const lowerMessage = message.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (key !== 'default' && lowerMessage.includes(key)) {
        return response;
      }
    }

    // Return random default response
    const defaultResponses = responses.default;
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  /**
   * Add message to chat log
   */
  addMessage(content, sender, isError = false) {
    if (!this.chatLog) return;

    const messageElement = document.createElement('div');
    messageElement.className = `chat-message chat-message--${sender}`;
    if (isError) messageElement.classList.add('chat-message--error');

    const timestamp = new Date().toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const avatar = sender === 'user' ? '👤' : '🤖';
    
    messageElement.innerHTML = `
      <div class="chat-message__avatar chat-message__avatar--${sender}">
        ${avatar}
      </div>
      <div class="chat-message__content">
        ${this.formatMessage(content)}
        <div class="chat-message__timestamp">${timestamp}</div>
      </div>
    `;

    this.chatLog.appendChild(messageElement);
    this.scrollToBottom();

    // Update conversation history
    this.conversationHistory.push({
      content,
      sender,
      timestamp: Date.now(),
      isError
    });

    // Limit history length
    if (this.conversationHistory.length > this.options.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.options.maxHistoryLength);
    }
  }

  /**
   * Type message with animation
   */
  async typeMessage(content, sender) {
    if (!this.options.typingSpeed) {
      this.addMessage(content, sender);
      return;
    }

    this.isTyping = true;
    
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message chat-message--${sender}`;

    const timestamp = new Date().toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const avatar = sender === 'user' ? '👤' : '🤖';
    
    messageElement.innerHTML = `
      <div class="chat-message__avatar chat-message__avatar--${sender}">
        ${avatar}
      </div>
      <div class="chat-message__content">
        <div class="chat-message__text"></div>
        <div class="chat-message__timestamp">${timestamp}</div>
      </div>
    `;

    this.chatLog.appendChild(messageElement);
    const textElement = messageElement.querySelector('.chat-message__text');

    // Type character by character
    for (let i = 0; i <= content.length; i++) {
      textElement.textContent = content.substring(0, i);
      this.scrollToBottom();
      await new Promise(resolve => setTimeout(resolve, this.options.typingSpeed));
    }

    // Format final message
    textElement.innerHTML = this.formatMessage(content);
    this.isTyping = false;

    // Update conversation history
    this.conversationHistory.push({
      content,
      sender,
      timestamp: Date.now()
    });
  }

  /**
   * Format message content (basic markdown-like formatting)
   */
  formatMessage(content) {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    if (this.typingIndicator) {
      this.typingIndicator.setAttribute('aria-hidden', 'false');
      this.scrollToBottom();
    }
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    if (this.typingIndicator) {
      this.typingIndicator.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Show initial suggestions
   */
  showInitialSuggestions() {
    // Already handled in HTML, just bind events
    this.bindSuggestionEvents();
  }

  /**
   * Hide welcome section
   */
  hideWelcome() {
    if (this.welcomeSection) {
      this.welcomeSection.style.display = 'none';
    }
  }

  /**
   * Show welcome section
   */
  showWelcome() {
    if (this.welcomeSection) {
      this.welcomeSection.style.display = 'block';
    }
  }

  /**
   * Generate auto-suggestions
   */
  generateSuggestions(input) {
    // Basic suggestion system
    const suggestions = [
      'Hangi projeler yapıldı?',
      'Yetenekler nelerdir?',
      'İletişim bilgileri nedir?',
      'Sistem durumu nasıl?'
    ].filter(suggestion => 
      suggestion.toLowerCase().includes(input.toLowerCase())
    );

    this.suggestions = suggestions;
  }

  /**
   * Scroll chat to bottom
   */
  scrollToBottom() {
    if (this.chatLog) {
      this.chatLog.scrollTop = this.chatLog.scrollHeight;
    }
  }

  /**
   * Open modal
   */
  open() {
    if (this.isOpen || !this.modal) return;

    this.modal.classList.add('assistant-modal--open');
    this.modal.setAttribute('aria-hidden', 'false');
    this.fab.classList.add('assistant-fab--open');
    
    this.isOpen = true;
    this.isMinimized = false;

    // Focus management
    setTimeout(() => {
      if (this.chatInput) {
        this.chatInput.focus();
      }
    }, 300);

    // Announce to screen readers
    this.announceToScreenReader('AI Assistant açıldı');
    
    this.trackEvent('modal_opened');
    this.log('Modal opened');
  }

  /**
   * Close modal
   */
  close() {
    if (!this.isOpen || !this.modal) return;

    this.modal.classList.remove('assistant-modal--open');
    this.modal.setAttribute('aria-hidden', 'true');
    this.fab.classList.remove('assistant-fab--open');
    
    this.isOpen = false;
    this.isMinimized = false;

    // Show welcome again when reopened
    setTimeout(() => {
      this.showWelcome();
    }, 300);

    // Announce to screen readers
    this.announceToScreenReader('AI Assistant kapatıldı');
    
    this.trackEvent('modal_closed');
    this.log('Modal closed');
  }

  /**
   * Toggle modal
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Minimize modal
   */
  minimize() {
    if (!this.isOpen) return;

    this.modal.classList.add('assistant-modal--minimized');
    this.isMinimized = true;

    setTimeout(() => {
      this.modal.classList.remove('assistant-modal--minimized');
      this.close();
    }, 300);

    this.trackEvent('modal_minimized');
    this.log('Modal minimized');
  }

  /**
   * Toggle voice input (placeholder)
   */
  toggleVoiceInput() {
    // Voice input not implemented yet
    this.announceToScreenReader('Sesli giriş henüz desteklenmiyor');
  }

  /**
   * Update status indicator
   */
  updateStatus(status) {
    const statusMap = {
      'online': { dot: '#30d158', text: 'Online' },
      'offline': { dot: '#8e8e93', text: 'Offline' },
      'error': { dot: '#ff3b30', text: 'Error' },
      'typing': { dot: '#007AFF', text: 'Typing...' }
    };

    const statusConfig = statusMap[status] || statusMap.online;

    [this.statusIndicator, this.fabStatus].forEach(indicator => {
      if (indicator) {
        const dot = indicator.querySelector('.status-dot');
        if (dot) {
          dot.style.background = statusConfig.dot;
        }
      }
    });
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Adjust modal position on mobile
    if (window.innerWidth <= 480) {
      // Full screen on small devices
      this.modal?.style.setProperty('--modal-height', '100vh');
    } else {
      this.modal?.style.removeProperty('--modal-height');
    }
  }

  /**
   * Load conversation history
   */
  loadConversationHistory() {
    try {
      const saved = localStorage.getItem(`${this.options.sessionKey}-history`);
      if (saved) {
        this.conversationHistory = JSON.parse(saved);
        
        // Restore messages (but not too many)
        const recentMessages = this.conversationHistory.slice(-10);
        recentMessages.forEach(msg => {
          this.addMessage(msg.content, msg.sender, msg.isError);
        });

        if (recentMessages.length > 0) {
          this.hideWelcome();
        }
      }
    } catch (error) {
      this.log('Failed to load conversation history:', error);
    }
  }

  /**
   * Save conversation history
   */
  saveConversationHistory() {
    try {
      localStorage.setItem(
        `${this.options.sessionKey}-history`, 
        JSON.stringify(this.conversationHistory)
      );
    } catch (error) {
      this.log('Failed to save conversation history:', error);
    }
  }

  /**
   * Setup context tracking
   */
  setupContextTracking() {
    this.currentContext = {
      page: window.location.pathname,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      language: this.language
    };
  }

  /**
   * Track events
   */
  trackEvent(eventName, data = {}) {
    try {
      // Integration with analytics if available
      if (window.analytics) {
        window.analytics.track('AI Assistant Modal', {
          action: eventName,
          ...data,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      this.log('Failed to track event:', error);
    }
  }

  /**
   * Announce to screen reader
   */
  announceToScreenReader(message) {
    const announcement = document.getElementById('polite-announcements') || 
                        document.getElementById('assertive-announcements');
    if (announcement) {
      announcement.textContent = message;
      setTimeout(() => {
        announcement.textContent = '';
      }, 1000);
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    if (this.chatLog) {
      this.chatLog.innerHTML = '';
    }
    this.showWelcome();
    this.saveConversationHistory();
    this.trackEvent('history_cleared');
  }

  /**
   * Get assistant status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isOpen: this.isOpen,
      isMinimized: this.isMinimized,
      isTyping: this.isTyping,
      conversationLength: this.conversationHistory.length,
      language: this.language
    };
  }

  /**
   * Log with prefix
   */
  log(message, ...args) {
    console.log(`[AIAssistantModal] ${message}`, ...args);
  }

  /**
   * Destroy instance
   */
  destroy() {
    // Remove event listeners
    this.fab?.removeEventListener('click', this.toggle);
    this.closeButton?.removeEventListener('click', this.close);
    this.minimizeButton?.removeEventListener('click', this.minimize);
    
    // Clear data
    this.conversationHistory = [];
    
    // Reset state
    this.isInitialized = false;
    this.isOpen = false;
    
    this.log('AI Assistant Modal destroyed');
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAssistantModal;
}

// Global window reference
window.AIAssistantModal = AIAssistantModal; 