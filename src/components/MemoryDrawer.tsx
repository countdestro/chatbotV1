import React from 'react';
import { X, Brain, Trash2, Download, ShieldCheck, Database } from 'lucide-react';
import { Message, Persona } from '../types';
import { assembleContextPrompt } from '../lib/memory';

interface MemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona;
  messages: Message[];
  userDisplayName: string;
  userBio?: string;
  onClearHistory: () => void;
}

export const MemoryDrawer: React.FC<MemoryDrawerProps> = ({
  isOpen,
  onClose,
  persona,
  messages,
  userDisplayName,
  userBio,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const contextData = assembleContextPrompt(persona, messages, userDisplayName, userBio, 20);

  const handleExport = () => {
    const exportData = {
      persona: persona.name,
      model: persona.model_name,
      timestamp: new Date().toISOString(),
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        created_at: m.created_at
      }))
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${persona.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={20} color="var(--accent-primary)" />
            <h2>Context & Memory Inspector</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '140px', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Context Messages</span>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>{contextData.messages.length - 1} / {messages.length}</p>
          </div>
          <div style={{ flex: 1, minWidth: '140px', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Est. Prompt Tokens</span>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>~{contextData.estimatedTokens.toLocaleString()}</p>
          </div>
          <div style={{ flex: 1, minWidth: '140px', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supabase Storage</span>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>Active</p>
          </div>
        </div>

        {persona.is_cbt && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <ShieldCheck size={24} color="#10b981" />
            <div>
              <h4 style={{ fontSize: '0.9rem', color: '#34d399', fontWeight: 700 }}>Pure-O ERP Anti-Reassurance Active</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                System automatically detects reassurance loops and guides uncertainty tolerance ("Maybe, maybe not").
              </p>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Active System Prompt & Grounding</label>
          <textarea
            className="form-textarea"
            rows={6}
            readOnly
            value={contextData.systemPrompt}
            style={{ fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <button className="nav-btn" onClick={handleExport} style={{ flex: 1 }}>
            <Download size={15} /> Export Chat (JSON)
          </button>
          <button
            className="nav-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear conversation history for this persona?')) {
                onClearHistory();
                onClose();
              }
            }}
            style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#f43f5e' }}
          >
            <Trash2 size={15} /> Clear History
          </button>
        </div>
      </div>
    </div>
  );
};
