import React, { useState } from 'react';
import { X, Send, Sparkles, Bot, User, ArrowRight } from 'lucide-react';
import { api } from '../api/client';

export default function CopilotDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! I am your **Procure-to-Pay (P2P) AI Analyst**.\n\nI have direct access to our live audited ledger of **8,500 purchase orders**, cycle times, 3-way match variances, and contract compliance data.\n\nHow can I assist your procurement audit today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'What is the spot buy rule?',
    'Show approval bottlenecks by department',
    'Audit 3-way match exceptions',
    'Who are the top spot buy vendors?',
    'How can we optimize working capital and DPO?',
  ];

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim()) return;

    const userMsg = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.queryCopilot(textToSend);
      setMessages((prev) => [...prev, { role: 'assistant', text: res.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `Sorry, could not connect to live backend analytics: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '450px',
      maxWidth: '92vw',
      zIndex: 60,
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--card-border)',
      boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.6)',
      display: 'flex',
      flexDirection: 'column',
      backdropFilter: 'blur(16px)',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 22px',
        borderBottom: '1px solid var(--card-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(139, 92, 246, 0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={17} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              P2P Procurement Copilot
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Grounded in live ledger data & rules
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--card-border)', background: 'var(--bg-tertiary)' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Suggested Inquiries
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              style={{
                fontSize: '11.5px',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--card-border)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(99, 102, 241, 0.15)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%',
            }}
          >
            {m.role === 'assistant' && (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Bot size={16} color="#818cf8" />
              </div>
            )}
            <div style={{
              background: m.role === 'user' ? 'var(--accent-indigo)' : 'var(--bg-tertiary)',
              color: m.role === 'user' ? '#ffffff' : 'var(--text-main)',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              lineHeight: '1.6',
              border: m.role === 'user' ? 'none' : '1px solid var(--card-border)',
              whiteSpace: 'pre-wrap',
            }}>
              {m.text}
            </div>
            {m.role === 'user' && (
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <User size={15} color="#cbd5e1" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
            <span className="pulsing-dot" />
            <span>Analyzing procurement ledger & computing figures...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div style={{
        padding: '14px 18px',
        borderTop: '1px solid var(--card-border)',
        background: 'var(--bg-secondary)',
      }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about spot buys, bottlenecks, OTIF..."
            style={{
              flex: 1,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: 'var(--text-main)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary"
            style={{ padding: '10px 14px' }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
