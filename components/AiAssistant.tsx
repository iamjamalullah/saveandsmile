'use client';

import React, { useState } from 'react';

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Assalam-o-Alaikum! 👋 Main Save & Smile ka AI Assistant hoon. Delivery time, EasyPaisa, Faysal Bank ya bulk wholesale rates k baray mein poohein!'
    }
  ]);
  const [inputVal, setInputVal] = useState('');

  function handleSend(text?: string) {
    const query = (text || inputVal).trim();
    if (!query) return;

    const newMsgs = [...messages, { sender: 'user', text: query }];
    setMessages(newMsgs);
    setInputVal('');

    // Instant smart store response
    setTimeout(() => {
      let reply = "Shukriya! Save & Smile Pakistan ka verified online wholesale portal hai.";
      const q = query.toLowerCase();

      if (q.includes('easypaisa') || q.includes('jazzcash') || q.includes('payment') || q.includes('account')) {
        reply = "💳 Payment Methods:\n1) Cash on Delivery (COD) nationwide.\n2) EasyPaisa: 0333-7221552 (Muhammad Jamalullah).\n3) Bank Transfer: Faysal Bank, Title: Muhammad Jamalullah, A/C: 3516390000005787.";
      } else if (q.includes('delivery') || q.includes('time') || q.includes('din')) {
        reply = "🚚 Karachi & Lahore mein 24-48 ghantay, aur baqi cities mein 2-4 working days mein Leopards / PostEx COD deliver ho jata hai.";
      } else if (q.includes('wholesale') || q.includes('bulk') || q.includes('reseller')) {
        reply = "📦 Bulk Cartons & Reseller factory rates k liye hamari direct helpline par WhatsApp karein: 0316-2323616.";
      } else if (q.includes('track') || q.includes('order')) {
        reply = "📍 Track Order page par apna Order ID ya Phone number likh kar foran live status check kar sakte hain!";
      }

      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 400);
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="floating-ai-robot"
        title="Ask Save & Smile AI Assistant"
      >
        <span className="ai-robot-icon">🤖</span>
        <span className="ai-status-pulse"></span>
      </button>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="ai-chat-window active" style={{ display: 'flex' }}>
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-header-avatar">🤖</div>
              <div>
                <div className="ai-header-title">Save &amp; Smile AI Assistant</div>
                <div className="ai-header-status">● Online • 24/7 Store Support</div>
              </div>
            </div>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((m, idx) => (
              <div key={idx} className={`ai-msg ${m.sender}`}>
                <div className="ai-msg-bubble" style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
              </div>
            ))}

            <div className="ai-suggestions-quick">
              <button onClick={() => handleSend('EasyPaisa aur Bank details?')}>💳 Accounts?</button>
              <button onClick={() => handleSend('Delivery time kitna hai?')}>🚚 Delivery?</button>
              <button onClick={() => handleSend('Wholesale bulk rates?')}>📦 Wholesale?</button>
            </div>
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
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Poochiye (e.g. delivery, payments)..."
            />
            <button type="submit" className="ai-send-btn">➔</button>
          </form>
        </div>
      )}
    </>
  );
}
