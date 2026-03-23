import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import './AISupportWidget.css';

export default function AISupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Привет! Я Служба Заботы AIStock. У вас возникли трудности с оплатой, загрузкой проекта или поиском? Напишите мне, и я помогу!' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  async function handleSend(e) {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputVal };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputVal('');
    setIsLoading(true);

    try {
      // Gather context (e.g. current URL)
      const currentContext = `User is currently on page: ${window.location.pathname}`;

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
          context: currentContext
        })
      });

      if (!res.ok) throw new Error('Support API failed');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Извините, произошла ошибка соединения. Вы можете написать нам напрямую на support@aistock.kz' }]);
    } finally {
      setIsLoading(false);
    }
  }

  // Format simple markdown (bold text and lists)
  const formatContent = (text) => {
    return text.split('\n').map((line, i) => {
      // basic bold parse **text**
      let parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={i}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j}>{part.slice(2, -2)}</strong>;
            }
            return <span key={j}>{part}</span>;
          })}
          <br/>
        </span>
      );
    });
  };

  return (
    <div className="support-widget-container">
      {/* Floating Toggle Button */}
      <button 
        className={`support-widget-toggle ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Support Chat"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && (
          <span className="support-widget-badge">
            <Sparkles size={12} fill="currentColor" />
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="support-widget-window page-enter">
          <div className="support-widget-header">
            <div className="support-header-info">
              <div className="support-avatar">
                <span role="img" aria-label="robot">🤖</span>
                <div className="online-dot" />
              </div>
              <div className="support-titles">
                <h4>Служба Заботы</h4>
                <span>ИИ-помощник AIStock</span>
              </div>
            </div>
            <button className="support-close-sm" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="support-widget-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`support-msg-wrap support-msg--${msg.role}`}>
                {msg.role === 'assistant' && <div className="support-msg-avatar">🤖</div>}
                <div className="support-msg-bubble">
                  {formatContent(msg.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="support-msg-wrap support-msg--assistant">
                <div className="support-msg-avatar">🤖</div>
                <div className="support-msg-bubble support-msg--typing">
                  <Loader2 className="animate-spin" size={16} /> Печатает...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="support-widget-input-area" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Опишите вашу проблему..." 
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="support-send-btn" 
              disabled={!inputVal.trim() || isLoading}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
