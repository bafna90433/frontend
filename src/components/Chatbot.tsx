import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';
import api from '../utils/api'; 

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "Namaste! Welcome to Bafna Toys B2B Support.\n\nPlease select your preferred language / Kripya apni bhasha chunein:", 
      sender: 'bot' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 👇 Isko 'boolean' se change karke 'string' kar diya, taaki pata chale kaunsi bhasha chuni hai
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // LANGUAGE OPTIONS
  const languageOptions = [
    "English", 
    "हिंदी (Hindi)", 
    "தமிழ் (Tamil)", 
    "ಕನ್ನಡ (Kannada)", 
    "తెలుగు (Telugu)", 
    "Mix Hinglish"
  ];

  // 👇 DYNAMIC FAQS (Har language ke liye alag buttons)
  const faqTranslations: Record<string, string[]> = {
    "English": ["📦 What is MOQ?", "💳 Payment options?", "🚚 Shipping details?", "🧸 Bulk discount?"],
    "हिंदी (Hindi)": ["📦 MOQ क्या है?", "💳 पेमेंट के तरीके?", "🚚 डिलीवरी की जानकारी?", "🧸 थोक (Bulk) डिस्काउंट?"],
    "தமிழ் (Tamil)": ["📦 குறைந்தபட்ச ஆர்டர் (MOQ) என்ன?", "💳 கட்டண விருப்பங்கள்?", "🚚 ஷிப்பிங் விவரங்கள்?", "🧸 மொத்த ஆர்டர் தள்ளுபடி?"],
    "ಕನ್ನಡ (Kannada)": ["📦 ಕನಿಷ್ಠ ಆರ್ಡರ್ (MOQ) ಏನು?", "💳 ಪಾವತಿ ಆಯ್ಕೆಗಳು?", "🚚 ಶಿಪ್ಪಿಂಗ್ ವಿವರಗಳು?", "🧸 ಬೃಹತ್ ರಿಯಾಯಿತಿ?"],
    "తెలుగు (Telugu)": ["📦 కనీస ఆర్డర్ (MOQ) ఎంత?", "💳 చెల్లింపు ఎంపికలు?", "🚚 షిప్పింగ్ వివరాలు?", "🧸 బల్క్ డిస్కౌంట్?"],
    "Mix Hinglish": ["📦 MOQ kya hai?", "💳 Payment options?", "🚚 Shipping details?", "🧸 Bulk discount?"]
  };

  // 👇 DYNAMIC INPUT PLACEHOLDER (Har language ke liye alag input text)
  const placeholderTranslations: Record<string, string> = {
    "English": "Type your message...",
    "हिंदी (Hindi)": "अपना संदेश लिखें...",
    "தமிழ் (Tamil)": "உங்கள் செய்தியை தட்டச்சு செய்க...",
    "ಕನ್ನಡ (Kannada)": "ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...",
    "తెలుగు (Telugu)": "మీ సందేశాన్ని టైప్ చేయండి...",
    "Mix Hinglish": "Type your message..."
  };

  // 👇 YEH NAYA EFFECT ADD KIYA HAI - Bottom Nav hide karne ke liye
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('chatbot-open');
    } else {
      document.body.classList.remove('chatbot-open');
    }
    
    // Cleanup jab component hat jaye
    return () => {
      document.body.classList.remove('chatbot-open');
    };
  }, [isOpen]);

  // Messages ko bottom par scroll karne ke liye
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessageToBot = async (textToSend: string, isHiddenMessage = false) => {
    if (!textToSend.trim()) return;

    if (!isHiddenMessage) {
      setMessages((prev) => [...prev, { text: textToSend, sender: 'user' }]);
    }
    
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/chatbot/message', {
        message: textToSend,
        chatHistory: messages 
      });

      if (response.data && response.data.success) {
        setMessages((prev) => [...prev, { text: response.data.reply, sender: 'bot' }]);
      } else {
        setMessages((prev) => [...prev, { text: "Sorry, server pe kuch issue hai. Please try again later.", sender: 'bot' }]);
      }
    } catch (error) {
      console.error("Chatbot API Error:", error);
      setMessages((prev) => [...prev, { text: "Network error. Please check your connection.", sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendMessageToBot(input);
  };

  // 👇 Jab language select ho toh state me save karo
  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setMessages((prev) => [...prev, { text: `Language Selected: ${lang}`, sender: 'user' }]);
    
    const promptContext = `I have selected ${lang}. Please say a short greeting in this language and tell me how you can help me with wholesale orders, MOQ, and payments today.`;
    sendMessageToBot(promptContext, true); 
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  useEffect(() => {
    const handleCustomTrigger = (e: any) => {
      setIsOpen(true); 
      // Agar direct product se aaya toh default Mix Hinglish set kar do (ya English)
      if (!selectedLanguage) {
          setSelectedLanguage("Mix Hinglish");
      }
      sendMessageToBot(e.detail); 
    };

    window.addEventListener('trigger-chatbot', handleCustomTrigger);
    return () => window.removeEventListener('trigger-chatbot', handleCustomTrigger);
  }, [messages, selectedLanguage]); 

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h4>Bafna Toys Assistant</h4>
            <button onClick={toggleChat} className="close-btn">&times;</button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg, index) => {
              const formattedText = msg.text
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #007bff; text-decoration: underline; font-weight: bold;">$1</a>')
                .replace(/\n/g, '<br/>');

              return (
                <div key={index} className={`message-wrapper ${msg.sender}`}>
                  <div 
                    className={`message-bubble ${msg.sender}`}
                    dangerouslySetInnerHTML={{ __html: formattedText }}
                  />
                </div>
              );
            })}
            
            {isLoading && (
              <div className="message-wrapper bot">
                <div className="message-bubble bot typing-indicator">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 👇 PEHLE LANGUAGE OPTIONS */}
          {!selectedLanguage && !isLoading && (
            <div className="faq-suggestions-container language-options" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '10px' }}>
              {languageOptions.map((lang, index) => (
                <button 
                  key={index} 
                  className="faq-chip" 
                  onClick={() => handleLanguageSelect(lang)}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}

          {/* 👇 LANGUAGE HONE KE BAAD USI LANGUAGE KE FAQ OPTIONS */}
          {selectedLanguage && messages.length < 5 && !isLoading && faqTranslations[selectedLanguage] && (
            <div className="faq-suggestions-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', padding: '10px' }}>
              {faqTranslations[selectedLanguage].map((faq, index) => (
                <button 
                  key={index} 
                  className="faq-chip" 
                  onClick={() => sendMessageToBot(faq)}
                >
                  {faq}
                </button>
              ))}
            </div>
          )}

          <div className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              // 👇 Input box ka text bhi language ke hisaab se change hoga
              placeholder={selectedLanguage ? placeholderTranslations[selectedLanguage] : "Select language first..."}
              disabled={isLoading || !selectedLanguage}
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim() || !selectedLanguage}>
              Send
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button className="chatbot-fab" onClick={toggleChat}>
          💬 Chat with us
        </button>
      )}
    </div>
  );
};

export default Chatbot;