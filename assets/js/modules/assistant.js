/**
 * Portfolio OS - AI UI Assistant Module
 * Apple Design Language V5
 * iOS-style intelligent chat assistant with contextual help and natural language processing
 */

class AIAssistant {
  constructor(options = {}) {
    this.options = {
      containerId: 'ai-assistant',
      triggerButtonId: 'ai-assistant-trigger',
      apiEndpoint: options.apiEndpoint || '/api/assistant',
      maxHistoryLength: 50,
      typingSpeed: 30,
      autoSuggestions: true,
      contextAware: true,
      multiLanguage: true,
      voiceEnabled: true,
      ...options
    };

    this.isInitialized = false;
    this.isOpen = false;
    this.isTyping = false;
    this.conversationHistory = [];
    this.currentContext = {};
    this.suggestions = [];
    this.language = document.documentElement.lang || 'en';
    
    this.init();
  }

  /**
   * Initialize the AI Assistant
   */
  async init() {
    try {
      await this.loadConfiguration();
      this.createAssistantInterface();
      this.bindEvents();
      this.loadConversationHistory();
      this.setupContextTracking();
      this.initializeVoiceCapabilities();
      
      this.isInitialized = true;
      this.log('AI Assistant initialized successfully');
      
      // Show welcome message after a delay
      setTimeout(() => this.showWelcomeMessage(), 2000);
      
    } catch (error) {
      this.log('Failed to initialize AI Assistant:', error);
    }
  }

  /**
   * Load configuration from remote or local storage
   */
  async loadConfiguration() {
    try {
      const savedConfig = localStorage.getItem('ai-assistant-config');
      if (savedConfig) {
        this.config = { ...this.config, ...JSON.parse(savedConfig) };
      }

      // Load remote configuration if available
      if (this.options.configEndpoint) {
        const response = await fetch(this.options.configEndpoint);
        if (response.ok) {
          const remoteConfig = await response.json();
          this.config = { ...this.config, ...remoteConfig };
          localStorage.setItem('ai-assistant-config', JSON.stringify(this.config));
        }
      }
    } catch (error) {
      this.log('Failed to load configuration:', error);
    }
  }

  /**
   * Create the assistant interface elements
   */
  createAssistantInterface() {
    // Create trigger button
    this.createTriggerButton();
    
    // Create assistant container
    this.createAssistantContainer();
    
    // Create assistant window
    this.createAssistantWindow();
  }

  /**
   * Create floating trigger button
   */
  createTriggerButton() {
    const existingButton = document.getElementById(this.options.triggerButtonId);
    if (existingButton) {
      this.triggerButton = existingButton;
      return;
    }

    this.triggerButton = document.createElement('button');
    this.triggerButton.id = this.options.triggerButtonId;
    this.triggerButton.className = 'ai-assistant__trigger';
    this.triggerButton.innerHTML = `
      <div class="ai-assistant__trigger-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <circle cx="9" cy="10" r="1"/>
          <circle cx="15" cy="10" r="1"/>
          <path d="M8 15h8"/>
        </svg>
      </div>
      <div class="ai-assistant__trigger-pulse"></div>
    `;
    this.triggerButton.setAttribute('aria-label', 'Open AI Assistant');
    this.triggerButton.setAttribute('title', 'AI Assistant - Ask me anything!');
    
    document.body.appendChild(this.triggerButton);
  }

  /**
   * Create assistant container
   */
  createAssistantContainer() {
    this.container = document.createElement('div');
    this.container.id = this.options.containerId;
    this.container.className = 'ai-assistant';
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-labelledby', 'ai-assistant-title');
    this.container.setAttribute('aria-hidden', 'true');
    
    document.body.appendChild(this.container);
  }

  /**
   * Create assistant window interface
   */
  createAssistantWindow() {
    this.container.innerHTML = `
      <div class="ai-assistant__backdrop"></div>
      <div class="ai-assistant__window">
        <!-- Header -->
        <div class="ai-assistant__header">
          <div class="ai-assistant__title-section">
            <div class="ai-assistant__avatar">
              <div class="ai-assistant__avatar-image">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 21H5V3H15V9H19Z"/>
                </svg>
              </div>
              <div class="ai-assistant__status-indicator"></div>
            </div>
            <div class="ai-assistant__title-text">
              <h2 id="ai-assistant-title">AI Assistant</h2>
              <span class="ai-assistant__status">Online</span>
            </div>
          </div>
          <div class="ai-assistant__header-actions">
            <button class="ai-assistant__minimize-btn" aria-label="Minimize">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            <button class="ai-assistant__close-btn" aria-label="Close Assistant">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="ai-assistant__quick-actions">
          <button class="ai-assistant__quick-action" data-action="help">
            <span class="ai-assistant__quick-action-icon">❓</span>
            <span class="ai-assistant__quick-action-text">Help</span>
          </button>
          <button class="ai-assistant__quick-action" data-action="portfolio">
            <span class="ai-assistant__quick-action-icon">💼</span>
            <span class="ai-assistant__quick-action-text">Portfolio</span>
          </button>
          <button class="ai-assistant__quick-action" data-action="contact">
            <span class="ai-assistant__quick-action-icon">📧</span>
            <span class="ai-assistant__quick-action-text">Contact</span>
          </button>
          <button class="ai-assistant__quick-action" data-action="skills">
            <span class="ai-assistant__quick-action-icon">🛠️</span>
            <span class="ai-assistant__quick-action-text">Skills</span>
          </button>
        </div>

        <!-- Messages Area -->
        <div class="ai-assistant__messages" id="ai-assistant-messages">
          <div class="ai-assistant__welcome">
            <div class="ai-assistant__welcome-avatar">
              <div class="ai-assistant__welcome-pulse"></div>
            </div>
            <div class="ai-assistant__welcome-text">
              <h3>Hello! I'm your AI assistant</h3>
              <p>I can help you navigate this portfolio, answer questions about skills and projects, or assist with any other inquiries.</p>
            </div>
          </div>
        </div>

        <!-- Suggestions -->
        <div class="ai-assistant__suggestions" id="ai-assistant-suggestions"></div>

        <!-- Input Area -->
        <div class="ai-assistant__input-area">
          <div class="ai-assistant__input-container">
            <textarea 
              class="ai-assistant__input" 
              id="ai-assistant-input"
              placeholder="Ask me anything..."
              rows="1"
              aria-label="Message input"
            ></textarea>
            <div class="ai-assistant__input-actions">
              <button class="ai-assistant__voice-btn" aria-label="Voice input" title="Voice input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <button class="ai-assistant__send-btn" aria-label="Send message" title="Send message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div class="ai-assistant__typing" id="ai-assistant-typing">
          <div class="ai-assistant__typing-avatar">
            <div class="ai-assistant__typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <span class="ai-assistant__typing-text">AI is typing...</span>
        </div>
      </div>
    `;

    // Cache DOM elements
    this.elements = {
      backdrop: this.container.querySelector('.ai-assistant__backdrop'),
      window: this.container.querySelector('.ai-assistant__window'),
      messages: this.container.querySelector('.ai-assistant__messages'),
      input: this.container.querySelector('.ai-assistant__input'),
      sendBtn: this.container.querySelector('.ai-assistant__send-btn'),
      voiceBtn: this.container.querySelector('.ai-assistant__voice-btn'),
      closeBtn: this.container.querySelector('.ai-assistant__close-btn'),
      minimizeBtn: this.container.querySelector('.ai-assistant__minimize-btn'),
      suggestions: this.container.querySelector('.ai-assistant__suggestions'),
      typing: this.container.querySelector('.ai-assistant__typing'),
      quickActions: this.container.querySelectorAll('.ai-assistant__quick-action')
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Trigger button
    this.triggerButton.addEventListener('click', () => this.toggle());

    // Close and minimize buttons
    this.elements.closeBtn.addEventListener('click', () => this.close());
    this.elements.minimizeBtn.addEventListener('click', () => this.minimize());

    // Backdrop click to close
    this.elements.backdrop.addEventListener('click', () => this.close());

    // Input events
    this.elements.input.addEventListener('keydown', (e) => this.handleInputKeydown(e));
    this.elements.input.addEventListener('input', () => this.handleInputChange());
    this.elements.sendBtn.addEventListener('click', () => this.sendMessage());

    // Voice button
    this.elements.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());

    // Quick actions
    this.elements.quickActions.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleQuickAction(action);
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

    // Window resize
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Handle input keydown events
   */
  handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    } else if (e.key === 'Escape') {
      this.close();
    }
  }

  /**
   * Handle input changes
   */
  handleInputChange() {
    const value = this.elements.input.value.trim();
    
    // Auto-resize textarea
    this.elements.input.style.height = 'auto';
    this.elements.input.style.height = this.elements.input.scrollHeight + 'px';

    // Show/hide send button
    this.elements.sendBtn.classList.toggle('ai-assistant__send-btn--active', value.length > 0);

    // Generate suggestions
    if (this.options.autoSuggestions && value.length > 2) {
      this.generateSuggestions(value);
    } else {
      this.hideSuggestions();
    }
  }

  /**
   * Handle global keyboard shortcuts
   */
  handleGlobalKeydown(e) {
    // Cmd/Ctrl + K to open assistant
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.toggle();
    }

    // Escape to close when open
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (this.isOpen) {
      this.adjustWindowSize();
    }
  }

  /**
   * Handle quick action clicks
   */
  async handleQuickAction(action) {
    const responses = {
      help: "I can help you with:\n• Portfolio navigation\n• Skills and experience questions\n• Project details\n• Contact information\n• Technical discussions\n\nWhat would you like to know?",
      portfolio: "I'd be happy to tell you about the portfolio! It showcases various projects including web applications, mobile apps, and design work. Which type of project interests you most?",
      contact: "You can reach out through:\n• Email: contact@example.com\n• LinkedIn: /in/example\n• GitHub: /example\n• Direct message here\n\nWhat's the best way to connect with you?",
      skills: "The main technical skills include:\n• Frontend: React, Vue.js, TypeScript\n• Backend: Node.js, Python, PHP\n• Mobile: React Native, Flutter\n• Design: Figma, Adobe Suite\n\nWhich area would you like to explore?"
    };

    const message = responses[action] || "I'm not sure how to help with that. Can you be more specific?";
    
    // Add user action as message
    this.addMessage(action.charAt(0).toUpperCase() + action.slice(1), 'user');
    
    // Add assistant response
    await this.typeMessage(message, 'assistant');
  }

  /**
   * Send a message
   */
  async sendMessage() {
    const message = this.elements.input.value.trim();
    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    
    // Clear input
    this.elements.input.value = '';
    this.elements.input.style.height = 'auto';
    this.elements.sendBtn.classList.remove('ai-assistant__send-btn--active');
    this.hideSuggestions();

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Get AI response
      const response = await this.getAIResponse(message);
      
      // Hide typing indicator
      this.hideTypingIndicator();
      
      // Type assistant response
      await this.typeMessage(response, 'assistant');
      
    } catch (error) {
      this.hideTypingIndicator();
      this.addMessage("I'm sorry, I'm having trouble responding right now. Please try again.", 'assistant', true);
      this.log('Failed to get AI response:', error);
    }

    // Save conversation
    this.saveConversationHistory();
  }

  /**
   * Get AI response (mock implementation)
   */
  async getAIResponse(message) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const lowerMessage = message.toLowerCase();
    
    // Context-aware responses
    if (lowerMessage.includes('skill') || lowerMessage.includes('technology')) {
      return "I can tell you about various technical skills! The portfolio showcases expertise in modern web development, mobile apps, and design. React, Vue.js, Node.js, and TypeScript are frequently used technologies. What specific skills would you like to know more about?";
    }
    
    if (lowerMessage.includes('project') || lowerMessage.includes('work')) {
      return "There are several interesting projects in the portfolio! From e-commerce platforms to mobile applications and design systems. Each project demonstrates different technical challenges and solutions. Would you like details about a specific type of project?";
    }
    
    if (lowerMessage.includes('contact') || lowerMessage.includes('hire') || lowerMessage.includes('work together')) {
      return "I'd love to help connect you! There are several ways to get in touch for collaboration opportunities. The contact form is available on the site, or you can reach out through professional networks. What type of project or collaboration are you considering?";
    }
    
    if (lowerMessage.includes('experience') || lowerMessage.includes('background')) {
      return "The experience spans several years in full-stack development, with expertise in both frontend and backend technologies. There's a strong focus on user experience, performance optimization, and modern development practices. What aspect of the background interests you most?";
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! It's great to meet you. I'm here to help you explore this portfolio and answer any questions you might have about the projects, skills, or experience showcased here. What would you like to know?";
    }

    // Default response
    return "That's an interesting question! I'm designed to help with information about this portfolio, including projects, skills, experience, and contact details. Could you tell me more about what you're looking for?";
  }

  /**
   * Add a message to the conversation
   */
  addMessage(content, sender, isError = false) {
    const messageElement = document.createElement('div');
    messageElement.className = `ai-assistant__message ai-assistant__message--${sender}`;
    if (isError) messageElement.classList.add('ai-assistant__message--error');

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
      <div class="ai-assistant__message-avatar">
        ${sender === 'assistant' ? 
          '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"/></svg>' :
          '<div class="ai-assistant__user-avatar"></div>'
        }
      </div>
      <div class="ai-assistant__message-content">
        <div class="ai-assistant__message-text">${this.formatMessage(content)}</div>
        <div class="ai-assistant__message-time">${timestamp}</div>
      </div>
    `;

    this.elements.messages.appendChild(messageElement);
    this.scrollToBottom();

    // Add to history
    this.conversationHistory.push({
      content,
      sender,
      timestamp: Date.now(),
      isError
    });

    // Animate in
    requestAnimationFrame(() => {
      messageElement.classList.add('ai-assistant__message--visible');
    });
  }

  /**
   * Type a message with animation
   */
  async typeMessage(content, sender) {
    const messageElement = document.createElement('div');
    messageElement.className = `ai-assistant__message ai-assistant__message--${sender}`;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageElement.innerHTML = `
      <div class="ai-assistant__message-avatar">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"/>
        </svg>
      </div>
      <div class="ai-assistant__message-content">
        <div class="ai-assistant__message-text"></div>
        <div class="ai-assistant__message-time">${timestamp}</div>
      </div>
    `;

    this.elements.messages.appendChild(messageElement);
    this.scrollToBottom();

    // Animate in
    requestAnimationFrame(() => {
      messageElement.classList.add('ai-assistant__message--visible');
    });

    const textElement = messageElement.querySelector('.ai-assistant__message-text');
    
    // Type each character
    for (let i = 0; i < content.length; i++) {
      textElement.textContent = content.substring(0, i + 1);
      this.scrollToBottom();
      await new Promise(resolve => setTimeout(resolve, this.options.typingSpeed));
    }

    // Format final content
    textElement.innerHTML = this.formatMessage(content);

    // Add to history
    this.conversationHistory.push({
      content,
      sender,
      timestamp: Date.now()
    });
  }

  /**
   * Format message content
   */
  formatMessage(content) {
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    this.isTyping = true;
    this.elements.typing.classList.add('ai-assistant__typing--visible');
    this.scrollToBottom();
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    this.isTyping = false;
    this.elements.typing.classList.remove('ai-assistant__typing--visible');
  }

  /**
   * Generate contextual suggestions
   */
  generateSuggestions(input) {
    const suggestions = [
      "What skills are showcased?",
      "Tell me about the projects",
      "How can I get in touch?",
      "What's your experience with React?",
      "Can you help me navigate the portfolio?"
    ];

    const filteredSuggestions = suggestions.filter(s => 
      s.toLowerCase().includes(input.toLowerCase()) ||
      input.toLowerCase().split(' ').some(word => s.toLowerCase().includes(word))
    );

    if (filteredSuggestions.length > 0) {
      this.showSuggestions(filteredSuggestions.slice(0, 3));
    }
  }

  /**
   * Show suggestions
   */
  showSuggestions(suggestions) {
    this.elements.suggestions.innerHTML = suggestions.map(suggestion => 
      `<button class="ai-assistant__suggestion" data-suggestion="${suggestion}">${suggestion}</button>`
    ).join('');

    this.elements.suggestions.classList.add('ai-assistant__suggestions--visible');

    // Bind suggestion clicks
    this.elements.suggestions.querySelectorAll('.ai-assistant__suggestion').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const suggestion = e.target.dataset.suggestion;
        this.elements.input.value = suggestion;
        this.hideSuggestions();
        this.sendMessage();
      });
    });
  }

  /**
   * Hide suggestions
   */
  hideSuggestions() {
    this.elements.suggestions.classList.remove('ai-assistant__suggestions--visible');
  }

  /**
   * Scroll messages to bottom
   */
  scrollToBottom() {
    requestAnimationFrame(() => {
      this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    });
  }

  /**
   * Show welcome message
   */
  showWelcomeMessage() {
    if (this.conversationHistory.length === 0) {
      this.addMessage("Hi! I'm your AI assistant. I can help you explore this portfolio and answer questions about skills, projects, and experience. What would you like to know?", 'assistant');
    }
  }

  /**
   * Load conversation history
   */
  loadConversationHistory() {
    try {
      const saved = localStorage.getItem('ai-assistant-history');
      if (saved) {
        this.conversationHistory = JSON.parse(saved);
        
        // Restore recent messages
        const recentMessages = this.conversationHistory.slice(-10);
        recentMessages.forEach(msg => {
          this.addMessage(msg.content, msg.sender, msg.isError);
        });
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
      // Keep only recent messages
      if (this.conversationHistory.length > this.options.maxHistoryLength) {
        this.conversationHistory = this.conversationHistory.slice(-this.options.maxHistoryLength);
      }
      
      localStorage.setItem('ai-assistant-history', JSON.stringify(this.conversationHistory));
    } catch (error) {
      this.log('Failed to save conversation history:', error);
    }
  }

  /**
   * Setup context tracking
   */
  setupContextTracking() {
    // Track current page
    this.currentContext.page = window.location.pathname;
    this.currentContext.title = document.title;
    
    // Track user interactions
    this.currentContext.interactions = [];
    
    // Track scroll position
    this.currentContext.scrollPosition = window.scrollY;
    
    // Track time on page
    this.currentContext.timeOnPage = Date.now();
  }

  /**
   * Initialize voice capabilities
   */
  initializeVoiceCapabilities() {
    if (this.options.voiceEnabled && 'webkitSpeechRecognition' in window) {
      this.speechRecognition = new webkitSpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = this.language;

      this.speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.elements.input.value = transcript;
        this.handleInputChange();
      };

      this.speechRecognition.onend = () => {
        this.elements.voiceBtn.classList.remove('ai-assistant__voice-btn--active');
      };
    } else {
      this.elements.voiceBtn.style.display = 'none';
    }
  }

  /**
   * Toggle voice input
   */
  toggleVoiceInput() {
    if (!this.speechRecognition) return;

    if (this.elements.voiceBtn.classList.contains('ai-assistant__voice-btn--active')) {
      this.speechRecognition.stop();
    } else {
      this.speechRecognition.start();
      this.elements.voiceBtn.classList.add('ai-assistant__voice-btn--active');
    }
  }

  /**
   * Open assistant
   */
  open() {
    if (this.isOpen) return;

    this.isOpen = true;
    this.container.classList.add('ai-assistant--open');
    this.container.setAttribute('aria-hidden', 'false');
    this.triggerButton.classList.add('ai-assistant__trigger--hidden');
    
    // Focus input
    setTimeout(() => {
      this.elements.input.focus();
    }, 300);

    // Track opening
    this.trackEvent('assistant_opened');
  }

  /**
   * Close assistant
   */
  close() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.container.classList.remove('ai-assistant--open');
    this.container.setAttribute('aria-hidden', 'true');
    this.triggerButton.classList.remove('ai-assistant__trigger--hidden');
    
    this.hideSuggestions();
    this.hideTypingIndicator();

    // Track closing
    this.trackEvent('assistant_closed');
  }

  /**
   * Toggle assistant
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Minimize assistant
   */
  minimize() {
    this.container.classList.toggle('ai-assistant--minimized');
    
    // Track minimizing
    this.trackEvent('assistant_minimized');
  }

  /**
   * Adjust window size for responsive design
   */
  adjustWindowSize() {
    const window = this.elements.window;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    if (viewport.width <= 768) {
      window.style.width = '100%';
      window.style.height = '100%';
      window.style.borderRadius = '0';
    } else {
      window.style.width = '';
      window.style.height = '';
      window.style.borderRadius = '';
    }
  }

  /**
   * Track events for analytics
   */
  trackEvent(eventName, data = {}) {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        ...data,
        category: 'AI Assistant'
      });
    }
    
    this.log(`Event tracked: ${eventName}`, data);
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
    localStorage.removeItem('ai-assistant-history');
    
    // Clear messages
    this.elements.messages.innerHTML = `
      <div class="ai-assistant__welcome">
        <div class="ai-assistant__welcome-avatar">
          <div class="ai-assistant__welcome-pulse"></div>
        </div>
        <div class="ai-assistant__welcome-text">
          <h3>Hello! I'm your AI assistant</h3>
          <p>I can help you navigate this portfolio, answer questions about skills and projects, or assist with any other inquiries.</p>
        </div>
      </div>
    `;

    this.trackEvent('history_cleared');
  }

  /**
   * Get assistant status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isOpen: this.isOpen,
      isTyping: this.isTyping,
      conversationLength: this.conversationHistory.length,
      currentContext: this.currentContext
    };
  }

  /**
   * Log messages with context
   */
  log(message, ...args) {
    if (this.options.debug) {
      console.log(`[AI Assistant] ${message}`, ...args);
    }
  }

  /**
   * Destroy assistant instance
   */
  destroy() {
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
    
    this.saveConversationHistory();
    
    if (this.container) {
      this.container.remove();
    }
    
    if (this.triggerButton) {
      this.triggerButton.remove();
    }
    
    this.isInitialized = false;
    this.log('AI Assistant destroyed');
  }
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AIAssistant();
  });
} else {
  window.aiAssistant = new AIAssistant();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAssistant;
}

export default AIAssistant; 