'use client';

import React, { useState } from 'react';

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! 👋 I am your AI Store Assistant. Feel free to ask about Delivery Times, EasyPaisa / Bank details, Wholesale rates, or any product!'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  async function handleSend(text?: string) {
    const query = (text || inputVal).trim();
    if (!query) return;

    const newMsgs = [...messages, { sender: 'user', text: query }];
    setMessages(newMsgs);
    setInputVal('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      const data = await res.json();
      const reply = data?.reply || "Thank you! For wholesale inquiries, feel free to chat with us on WhatsApp at 0316-2323616.";
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Our AI Assistant is currently connecting. You can also chat directly with our team on WhatsApp at 0316-2323616.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <>
      {/* Floating Toggle Button with Stylish 2-word Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="floating-ai-robot"
        title="Ask Save & Smile AI Assistant"
      >
        <span className="floating-ai-badge">Need Help?</span>
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
                <div
                  className="ai-msg-bubble"
                  dangerouslySetInnerHTML={{ __html: m.text }}
                />
              </div>
            ))}

            {isTyping && (
              <div className="ai-msg bot">
                <div className="ai-msg-bubble text-xs italic text-slate-500">
                  AI is thinking...
                </div>
              </div>
            )}

            <div className="ai-suggestions-quick">
              <button type="button" onClick={() => handleSend('What are your payment methods?')}>💳 Payments?</button>
              <button type="button" onClick={() => handleSend('What is the delivery time and cost?')}>🚚 Delivery?</button>
              <button type="button" onClick={() => handleSend('How can I order wholesale cartons?')}>📦 Wholesale?</button>
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
              placeholder="Ask anything (e.g. delivery, payments)..."
            />
            <button type="submit" className="ai-send-btn">➔</button>
          </form>
        </div>
      )}
    </>
  );
}
