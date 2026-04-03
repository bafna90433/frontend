import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import api from '../utils/api';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp?: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Namaste! 🙏 Welcome to Bafna Toys B2B Support.\n\nPlease select your preferred language:",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const languageOptions = [
    { label: "English", short: "EN" },
    { label: "हिंदी (Hindi)", short: "हि" },
    { label: "தமிழ் (Tamil)", short: "த" },
    { label: "ಕನ್ನಡ (Kannada)", short: "ಕ" },
    { label: "తెలుగు (Telugu)", short: "తె" },
    { label: "Mix Hinglish", short: "Hi" }
  ];

  const faqTranslations: Record<string, string[]> = {
    "English": ["📦 What is MOQ?", "💳 Payment options?", "🚚 Shipping details?", "🧸 Bulk discount?"],
    "हिंदी (Hindi)": ["📦 MOQ क्या है?", "💳 पेमेंट के तरीके?", "🚚 डिलीवरी की जानकारी?", "🧸 थोक डिस्काउंट?"],
    "தமிழ் (Tamil)": ["📦 MOQ என்ன?", "💳 கட்டண விருப்பங்கள்?", "🚚 ஷிப்பிங் விவரங்கள்?", "🧸 மொத்த தள்ளுபடி?"],
    "ಕನ್ನಡ (Kannada)": ["📦 MOQ ಏನು?", "💳 ಪಾವತಿ ಆಯ್ಕೆಗಳು?", "🚚 ಶಿಪ್ಪಿಂಗ್ ವಿವರಗಳು?", "🧸 ಬೃಹತ್ ರಿಯಾಯಿತಿ?"],
    "తెలుగు (Telugu)": ["📦 MOQ ఎంత?", "💳 చెల్లింపు ఎంపికలు?", "🚚 షిప్పింగ్ వివరాలు?", "🧸 బల్క్ డిస్కౌంట్?"],
    "Mix Hinglish": ["📦 MOQ kya hai?", "💳 Payment options?", "🚚 Shipping details?", "🧸 Bulk discount?"]
  };

  const placeholderTranslations: Record<string, string> = {
    "English": "Type your message...",
    "हिंदी (Hindi)": "अपना संदेश लिखें...",
    "தமிழ் (Tamil)": "உங்கள் செய்தியை தட்டச்சு செய்க...",
    "ಕನ್ನಡ (Kannada)": "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
    "తెలుగు (Telugu)": "మీ సందేశాన్ని టైప్ చేయండి...",
    "Mix Hinglish": "Apna message type karein..."
  };

  // Body scroll lock on mobile when chat is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chatbot-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('chatbot-open');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('chatbot-open');
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const getTimestamp = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessageToBot = async (textToSend: string, isHiddenMessage = false) => {
    if (!textToSend.trim()) return;

    if (!isHiddenMessage) {
      setMessages(prev => [...prev, { text: textToSend, sender: 'user', timestamp: getTimestamp() }]);
    }
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/chatbot/message', {
        message: textToSend,
        chatHistory: messages
      });

      if (response.data?.success) {
        setMessages(prev => [...prev, { text: response.data.reply, sender: 'bot', timestamp: getTimestamp() }]);
      } else {
        setMessages(prev => [...prev, { text: "Sorry, something went wrong. Please try again.", sender: 'bot', timestamp: getTimestamp() }]);
      }
    } catch (error) {
      console.error("Chatbot API Error:", error);
      setMessages(prev => [...prev, { text: "Network error. Please check your connection.", sender: 'bot', timestamp: getTimestamp() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (input.trim()) sendMessageToBot(input);
  };

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setMessages(prev => [...prev, { text: lang, sender: 'user', timestamp: getTimestamp() }]);
    const prompt = `I have selected ${lang}. Please say a short greeting in this language and tell me how you can help me with wholesale orders, MOQ, and payments today.`;
    sendMessageToBot(prompt, true);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const resetChat = () => {
    setSelectedLanguage(null);
    setMessages([{
      text: "Namaste! 🙏 Welcome to Bafna Toys B2B Support.\n\nPlease select your preferred language:",
      sender: 'bot',
      timestamp: getTimestamp()
    }]);
  };

  // Custom event trigger
  useEffect(() => {
    const handleCustomTrigger = (e: any) => {
      setIsOpen(true);
      if (!selectedLanguage) setSelectedLanguage("Mix Hinglish");
      sendMessageToBot(e.detail);
    };
    window.addEventListener('trigger-chatbot', handleCustomTrigger);
    return () => window.removeEventListener('trigger-chatbot', handleCustomTrigger);
  }, [messages, selectedLanguage]);

  return (
    <div className="cb-container">
      {/* ===== CHAT WINDOW ===== */}
      {isOpen && (
        <div className="cb-overlay" onClick={toggleChat}>
          <div className="cb-window" onClick={(e) => e.stopPropagation()}>
            
            {/* HEADER */}
            <div className="cb-header">
              <div className="cb-header-left">
                <div className="cb-avatar">
                  <span>🧸</span>
                  <div className="cb-online-dot" />
                </div>
                <div className="cb-header-info">
                  <span className="cb-header-title">Bafna Toys Support</span>
                  <span className="cb-header-status">
                    {isLoading ? 'Typing...' : 'Online'}
                  </span>
                </div>
              </div>
              <div className="cb-header-right">
                {selectedLanguage && (
                  <button className="cb-header-btn" onClick={resetChat} title="Reset">
                    ↻
                  </button>
                )}
                <button className="cb-header-btn cb-close-btn" onClick={toggleChat}>
                  ✕
                </button>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="cb-messages">
              {messages.map((msg, index) => {
                const formatted = msg.text
                  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
                  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>');

                return (
                  <div key={index} className={`cb-msg-row ${msg.sender}`}>
                    {msg.sender === 'bot' && <div className="cb-msg-avatar">🧸</div>}
                    <div className={`cb-msg-group ${msg.sender}`}>
                      <div
                        className={`cb-bubble ${msg.sender}`}
                        dangerouslySetInnerHTML={{ __html: formatted }}
                      />
                      {msg.timestamp && (
                        <span className={`cb-time ${msg.sender}`}>{msg.timestamp}</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="cb-msg-row bot">
                  <div className="cb-msg-avatar">🧸</div>
                  <div className="cb-msg-group bot">
                    <div className="cb-bubble bot cb-typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* LANGUAGE SELECTION */}
            {!selectedLanguage && !isLoading && (
              <div className="cb-suggestions">
                <div className="cb-suggest-label">Choose Language</div>
                <div className="cb-lang-grid">
                  {languageOptions.map((lang, i) => (
                    <button
                      key={i}
                      className="cb-lang-btn"
                      onClick={() => handleLanguageSelect(lang.label)}
                    >
                      <span className="cb-lang-short">{lang.short}</span>
                      <span className="cb-lang-name">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ CHIPS */}
            {selectedLanguage && messages.length < 6 && !isLoading && faqTranslations[selectedLanguage] && (
              <div className="cb-suggestions">
                <div className="cb-suggest-label">Quick Questions</div>
                <div className="cb-faq-list">
                  {faqTranslations[selectedLanguage].map((faq, i) => (
                    <button
                      key={i}
                      className="cb-faq-btn"
                      onClick={() => sendMessageToBot(faq)}
                    >
                      {faq}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* INPUT */}
            <div className="cb-input-area">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  selectedLanguage
                    ? placeholderTranslations[selectedLanguage]
                    : "Select a language above..."
                }
                disabled={isLoading || !selectedLanguage}
              />
              <button
                className="cb-send-btn"
                onClick={handleSend}
                disabled={isLoading || !input.trim() || !selectedLanguage}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            {/* FOOTER */}
            <div className="cb-footer">
              Powered by <strong>Bafna Toys</strong> 🧸
            </div>
          </div>
        </div>
      )}

      {/* ===== FAB BUTTON ===== */}
      {!isOpen && (
        <button className="cb-fab" onClick={toggleChat}>
          <svg viewBox="0 0 24 24" width="26" height="26" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
            <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/>
          </svg>
          <span className="cb-fab-label">Chat</span>
          <div className="cb-fab-pulse" />
        </button>
      )}
    </div>
  );
};

export default Chatbot;