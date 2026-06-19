// GreenTrack AI Advisor - Conversational Chat Widget

class GreenTrackChat {
    constructor() {
        this.history = [];
        this.isOpen = false;
        this.isTyping = false;
        this.init();
    }

    init() {
        // Create widget wrapper
        const widget = document.createElement('div');
        widget.className = 'chat-widget-container';
        widget.id = 'chat-advisor-widget';
        widget.innerHTML = `
            <button class="chat-toggle-btn" id="chat-toggle-btn" aria-label="Open Carbon Advisor">
                💬
            </button>
            <div class="chat-window" id="chat-window">
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-header-avatar">🤖</div>
                        <div>
                            <div class="chat-header-title">GreenTrack AI Coach</div>
                            <div class="chat-header-status">Online</div>
                        </div>
                    </div>
                    <button class="chat-close-btn" id="chat-close-btn" aria-label="Close Chat">&times;</button>
                </div>
                <div class="chat-messages" id="chat-messages">
                    <div class="chat-bubble assistant">
                        Hi there! I am your <strong>GreenTrack AI Advisor</strong>. Ask me anything about your carbon footprint, your logs, or how to reach zero net emissions!
                    </div>
                </div>
                <div class="chat-suggestion-container">
                    <div class="chat-suggestion-chip" data-text="How do I reduce my carbon footprint?">Reduce Footprint 🚗</div>
                    <div class="chat-suggestion-chip" data-text="Analyze my logged carbon sources">My Sources 📊</div>
                    <div class="chat-suggestion-chip" data-text="Explain the carbon offsetting projects">About Offsets 🌳</div>
                </div>
                <div class="chat-input-container">
                    <input type="text" class="chat-input" id="chat-input" placeholder="Type a message..." autocomplete="off">
                    <button class="chat-send-btn" id="chat-send-btn" aria-label="Send Message">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(widget);

        // Bind events
        this.toggleBtn = document.getElementById('chat-toggle-btn');
        this.window = document.getElementById('chat-window');
        this.closeBtn = document.getElementById('chat-close-btn');
        this.messagesContainer = document.getElementById('chat-messages');
        this.inputField = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('chat-send-btn');

        this.toggleBtn.addEventListener('click', () => this.toggleChat());
        this.closeBtn.addEventListener('click', () => this.toggleChat(false));

        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // Suggestion Chips
        document.querySelectorAll('.chat-suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const text = chip.getAttribute('data-text');
                this.inputField.value = text;
                this.sendMessage();
            });
        });

        // Listen for user state changes to show/hide chat widget
        window.EcoState.subscribe((state) => {
            if (state.token) {
                widget.style.display = 'block';
            } else {
                widget.style.display = 'none';
                this.toggleChat(false);
            }
        });
    }

    toggleChat(forceState) {
        this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
        if (this.isOpen) {
            this.window.classList.add('open');
            this.toggleBtn.innerHTML = '⚡';
            this.inputField.focus();
            this.scrollToBottom();
        } else {
            this.window.classList.remove('open');
            this.toggleBtn.innerHTML = '💬';
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    formatMarkdown(text) {
        // Convert simple markdown elements (bold, lists, etc) for safe UI rendering
        let formatted = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br/>')
            .replace(/^- (.*)/gm, '<li>$1</li>');

        if (formatted.includes('<li>')) {
            // Wrap loose list items in a list container
            formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        }
        return `<p>${formatted}</p>`;
    }

    async sendMessage() {
        const text = this.inputField.value.trim();
        if (!text || this.isTyping) return;

        this.inputField.value = '';
        this.appendMessage('user', text);

        // Add to history
        this.history.push({ role: 'user', content: text });

        // Add typing indicator
        this.isTyping = true;
        const typingBubble = this.showTypingIndicator();
        this.scrollToBottom();

        // Create container for incoming streamed response
        const responseBubble = document.createElement('div');
        responseBubble.className = 'chat-bubble assistant';
        responseBubble.innerHTML = '';
        
        let responseText = "";

        await window.EcoApi.chatWithAdvisorStream(
            text,
            this.history,
            (chunk) => {
                // On chunk received
                if (typingBubble) {
                    typingBubble.remove();
                }
                if (!responseBubble.parentNode) {
                    this.messagesContainer.appendChild(responseBubble);
                }
                responseText += chunk;
                responseBubble.innerHTML = this.formatMarkdown(responseText);
                this.scrollToBottom();
            },
            () => {
                // On stream done
                this.isTyping = false;
                this.history.push({ role: 'assistant', content: responseText });
                this.scrollToBottom();
            },
            (err) => {
                // On error
                this.isTyping = false;
                if (typingBubble) typingBubble.remove();
                this.appendMessage('assistant', `⚠️ Sorry, I encountered an error: ${err.message || 'Could not stream response'}`);
                this.scrollToBottom();
            }
        );
    }

    appendMessage(role, text) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role}`;
        bubble.innerHTML = this.formatMarkdown(text);
        this.messagesContainer.appendChild(bubble);
        this.scrollToBottom();
        return bubble;
    }

    showTypingIndicator() {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble assistant typing-bubble';
        bubble.id = 'typing-indicator';
        bubble.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        this.messagesContainer.appendChild(bubble);
        return bubble;
    }
}

// Instantiate on load
document.addEventListener('DOMContentLoaded', () => {
    window.GreenTrackChatWidget = new GreenTrackChat();
});
