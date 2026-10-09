import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';

export default function AiStoreRobot() {
  const { isAiChatOpen, setIsAiChatOpen, storeConfig } = useStore();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Assalam-o-Alaikum! 👋 Main Save & Smile ka AI Assistant hoon.\nAap mujh se store delivery, wholesale rates, tracking ya kisi bhi gadget k baray mein pooch sakte hain!'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const getBotReply = (query) => {
    const q = query.toLowerCase();
    if (q.includes('delivery') || q.includes('time') || q.includes('din')) {
      return `🚚 Delivery Time:\n• Karachi & Lahore: 24 to 48 hours\n• Rest of Pakistan: 2 to 4 working days\n• Delivery Fee: Rs. ${storeConfig.shippingFee || 200} (Rs. 3,000+ orders par FREE delivery!)`;
    }
    if (q.includes('wholesale') || q.includes('bulk') || q.includes('discount') || q.includes('rate')) {
      return `📦 Wholesale & Bulk Margin:\nTamam prices direct factory rates hain! Bulk quantity (50+ units) k liye aap direct hamare WhatsApp helpline (${storeConfig.phone || '0316-2323616'}) par rabta kar k mazeed concession le sakte hain.`;
    }
    if (q.includes('payment') || q.includes('jazzcash') || q.includes('easypaisa') || q.includes('cod')) {
      return `💳 Payment Methods:\n1. Cash on Delivery (COD) pore Pakistan mein available hai.\n2. JazzCash, EasyPaisa, aur direct Bank Transfer bhi accept kiye jaate hain.`;
    }
    if (q.includes('track') || q.includes('order') || q.includes('status')) {
      return `📍 Order Tracking:\nAap top menu mein "Track Order" par click kar k apna Order ID (maslan: SS-100245) enter karein aur live tracking dekh lein.`;
    }
    return `Shukriya aapke sawal ka! Hamare wholesale gadgets ki mazeed maloomat k liye aap hamari 24/7 WhatsApp helpline (${storeConfig.phone || '0316-2323616'}) par bhi direct rabta kar sakte hain.`;
  };

  const handleSend = (textToSend) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    setTimeout(() => {
      const reply = getBotReply(text);
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 450);
  };

  return (
    <>
      {/* Floating AI Robot Toggle Button */}
      <button 
        type="button" 
        className="floating-ai-robot" 
        id="aiRobotToggleBtn" 
        onClick={() => setIsAiChatOpen(!isAiChatOpen)} 
        title="Ask Save & Smile AI Assistant"
      >
        <span className="ai-robot-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="3"></rect>
            <circle cx="9" cy="16" r="1.5" fill="currentColor"></circle>
            <circle cx="15" cy="16" r="1.5" fill="currentColor"></circle>
            <path d="M8 7l4-4 4 4"></path>
            <line x1="12" y1="3" x2="12" y2="11"></line>
            <line x1="2" y1="16" x2="3" y2="16"></line>
            <line x1="21" y1="16" x2="22" y2="16"></line>
          </svg>
        </span>
        <span className="ai-status-pulse"></span>
        <div className="floating-ai-tooltip">Need Help? Ask AI Robot!</div>
      </button>

      {/* Interactive AI Assistant Modal / Popup */}
      {isAiChatOpen && (
        <div className="ai-chat-window active" id="aiChatWindow" style={{ display: 'flex' }}>
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-header-avatar">🤖</div>
              <div>
                <div className="ai-header-title">Save &amp; Smile AI Assistant</div>
                <div className="ai-header-status">● Online • 24/7 Store Support</div>
              </div>
            </div>
            <button className="ai-close-btn" onClick={() => setIsAiChatOpen(false)}>✕</button>
          </div>

          <div className="ai-chat-messages" id="aiChatMessages">
            {messages.map((m, idx) => (
              <div key={idx} className={`ai-msg ${m.sender}`}>
                <div className="ai-msg-bubble" style={{ whiteSpace: 'pre-line' }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-suggestions-quick">
            <button onClick={() => handleSend('Delivery kitne din mein aati hai?')}>🚚 Delivery time?</button>
            <button onClick={() => handleSend('Wholesale bulk discounts?')}>📦 Wholesale discounts?</button>
            <button onClick={() => handleSend('Payment methods kon se hain?')}>💳 Payment methods?</button>
            <button onClick={() => handleSend('Order track kaise karein?')}>📍 Track order?</button>
          </div>

          <form 
            className="ai-chat-input-bar" 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input 
              type="text" 
              id="aiUserInput" 
              placeholder="Poochiye (e.g. delivery, watch, discount)..." 
              autoComplete="off"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button type="submit" className="ai-send-btn" title="Send message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
