import React, { useState, useEffect } from 'react';
import { X, HeartHandshake, CheckCircle2, AlertTriangle, Plus, Sparkles, ShieldCheck } from 'lucide-react';
import { CompulsionLog } from '../types';
import { getCompulsionLogs, saveCompulsionLogEntry } from '../lib/supabase';

interface CBTTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CBTTrackerModal: React.FC<CBTTrackerModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<CompulsionLog[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [triggerThought, setTriggerThought] = useState('');
  const [distressLevel, setDistressLevel] = useState(6);
  const [compulsionResisted, setCompulsionResisted] = useState(true);
  const [theme, setTheme] = useState<CompulsionLog['theme']>('Harm');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLogs(getCompulsionLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerThought.trim()) return;

    const newLog: CompulsionLog = {
      id: 'log_' + Date.now().toString(36),
      trigger_thought: triggerThought.trim(),
      distress_level: Number(distressLevel),
      compulsion_resisted: compulsionResisted,
      theme,
      notes: notes.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    await saveCompulsionLogEntry(newLog);
    setLogs(getCompulsionLogs());
    setTriggerThought('');
    setNotes('');
    setShowAddForm(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <HeartHandshake size={22} color="#10b981" />
            <div>
              <h2>ERP Compulsion & Urge Tracker</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Track distress spikes and build tolerance to uncertainty
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Quick ERP Grounding Quote */}
        <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontSize: '0.85rem', color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} /> <strong>ERP Core Reminder:</strong> Intrusive thoughts are just meaningless mental spam. Refusing to figure them out breaks the loop.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Your Exposure Log ({logs.length})</h3>
          <button
            className="nav-btn nav-btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            <Plus size={14} /> {showAddForm ? 'View Logs' : 'Log Urge / Spike'}
          </button>
        </div>

        {showAddForm ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Intrusive Thought / Trigger</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g., Sudden what-if thought about losing control..."
                value={triggerThought}
                onChange={(e) => setTriggerThought(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label>Theme / Category</label>
                <select className="form-select" value={theme} onChange={(e) => setTheme(e.target.value as any)}>
                  <option value="Harm">Harm OCD</option>
                  <option value="Relationship (ROCD)">Relationship (ROCD)</option>
                  <option value="Contamination">Contamination</option>
                  <option value="Existential">Existential / Reality</option>
                  <option value="Scrupulosity">Moral / Scrupulosity</option>
                  <option value="Somatic">Somatic / Sensorimotor</option>
                  <option value="Other">Other Pure-O</option>
                </select>
              </div>

              <div className="form-group">
                <label>Distress Level (1 - 10): {distressLevel}</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={distressLevel}
                  onChange={(e) => setDistressLevel(Number(e.target.value))}
                  style={{ accentColor: 'var(--accent-primary)', marginTop: '0.5rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Did you prevent/delay the mental compulsion (neutralizing, checking)?</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className={`nav-btn ${compulsionResisted ? 'active' : ''}`}
                  onClick={() => setCompulsionResisted(true)}
                  style={{ flex: 1, borderColor: compulsionResisted ? '#10b981' : undefined }}
                >
                  <CheckCircle2 size={16} color="#10b981" /> Yes, Resisted / Tolerated
                </button>
                <button
                  type="button"
                  className={`nav-btn ${!compulsionResisted ? 'active' : ''}`}
                  onClick={() => setCompulsionResisted(false)}
                  style={{ flex: 1, borderColor: !compulsionResisted ? '#f43f5e' : undefined }}
                >
                  <AlertTriangle size={16} color="#f43f5e" /> Neutralized / Engaged
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Notes / Defusion Reflection (Optional)</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g., Sat with uncertainty for 5 mins instead of Googling"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="nav-btn nav-btn-primary" style={{ marginTop: '0.5rem' }}>
              Save Entry
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '340px', overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>
                No urge logs recorded yet. Track your first ERP moment above!
              </p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: 'var(--bg-input)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{log.trigger_thought}</span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: log.compulsion_resisted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                      color: log.compulsion_resisted ? '#34d399' : '#ff6b8b'
                    }}>
                      {log.compulsion_resisted ? 'Tolerated' : 'Compulsion'} (Distress: {log.distress_level}/10)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    <span>Theme: {log.theme} {log.notes ? `• "${log.notes}"` : ''}</span>
                    <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
