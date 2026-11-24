import React, { useState } from 'react';
import { X, Key, Database, User, ShieldAlert, Save, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';
import { saveStoredSettings } from '../lib/supabase';
import { AVAILABLE_MODELS } from '../lib/models';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSettings(formData);
    onUpdateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Key size={20} color="var(--accent-primary)" />
            <h2>Settings & API Configuration</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* API Keys Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              1. LLM API KEYS & MODEL SELECTION
            </h3>

            <div className="form-group">
              <label>Active AI Model</label>
              <select
                className="form-input"
                value={formData.defaultModel || 'deepseek/deepseek-chat'}
                onChange={(e) => {
                  const selectedModel = AVAILABLE_MODELS.find(m => m.id === e.target.value);
                  setFormData({
                    ...formData,
                    defaultModel: e.target.value,
                    activeProvider: selectedModel?.provider || 'openrouter'
                  });
                }}
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {AVAILABLE_MODELS.find(m => m.id === formData.defaultModel)?.description || 'Select an AI model for chatting.'}
              </span>
            </div>

            <div className="form-group">
              <label>OpenRouter API Key (Primary Key)</label>
              <input
                className="form-input"
                type="password"
                placeholder="sk-or-v1-..."
                value={formData.openRouterApiKey}
                onChange={(e) => setFormData({ ...formData, openRouterApiKey: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Connected to OpenRouter. Grants access to DeepSeek V3, Claude 3.5 Sonnet, Euryale, Dolphin & more.
              </span>
            </div>

            <div className="form-group">
              <label>Backup OpenRouter API Key (Auto-Switch on 402/Quota limits)</label>
              <input
                className="form-input"
                type="password"
                placeholder="sk-or-v1-... (optional secondary key)"
                value={formData.backupOpenRouterApiKey || ''}
                onChange={(e) => setFormData({ ...formData, backupOpenRouterApiKey: e.target.value })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                If the primary key runs out of credits or hits a 402 cap, the app automatically switches to this backup key with FULL token quality preserved.
              </span>
            </div>

            <div className="form-group">
              <label>Groq API Key (Optional — 14,400 Free Chats/Day)</label>
              <input
                className="form-input"
                type="password"
                placeholder="gsk_..."
                value={formData.groqApiKey}
                onChange={(e) => setFormData({ ...formData, groqApiKey: e.target.value })}
              />
            </div>
          </div>

          {/* Supabase Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              2. SUPABASE BACKEND (Database & Memory)
            </h3>

            <div className="form-group">
              <label>Supabase Project URL</label>
              <input
                className="form-input"
                type="text"
                placeholder="https://your-project.supabase.co"
                value={formData.supabaseUrl}
                onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Supabase Anon Public Key</label>
              <input
                className="form-input"
                type="password"
                placeholder="eyJhbGciOiJIUz..."
                value={formData.supabaseAnonKey}
                onChange={(e) => setFormData({ ...formData, supabaseAnonKey: e.target.value })}
              />
            </div>
          </div>

          {/* User Profile Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              3. USER PROFILE & CONTEXT
            </h3>

            <div className="form-group">
              <label>Your Display Name ({'{{user}}'} in prompts)</label>
              <input
                className="form-input"
                type="text"
                value={formData.userDisplayName}
                onChange={(e) => setFormData({ ...formData, userDisplayName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Your Persona / Bio (Context injected into chats)</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Describe your background, personality, or interests..."
                value={formData.userPersonaBio}
                onChange={(e) => setFormData({ ...formData, userPersonaBio: e.target.value })}
              />
            </div>
          </div>

          {/* Smart Sampling & Anti-Repetition Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              4. SMART SAMPLING & ANTI-REPETITION (Advanced)
            </h3>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <label style={{ margin: 0 }}>Anti-Repetition (Frequency Penalty)</label>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {formData.frequencyPenalty ?? 0.35}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={formData.frequencyPenalty ?? 0.35}
                onChange={(e) => setFormData({ ...formData, frequencyPenalty: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Prevents repeating the same phrases, tropes, and sign-offs (Recommended: 0.25 – 0.50).
              </span>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <label style={{ margin: 0 }}>Topic Freshness (Presence Penalty)</label>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {formData.presencePenalty ?? 0.20}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={formData.presencePenalty ?? 0.20}
                onChange={(e) => setFormData({ ...formData, presencePenalty: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Encourages introducing new events and progressing dialogue (Recommended: 0.15 – 0.30).
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label style={{ margin: 0 }}>Temperature</label>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {formData.temperature ?? 0.88}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.02"
                  value={formData.temperature ?? 0.88}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <label style={{ margin: 0 }}>Top-P (Diversity)</label>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {formData.topP ?? 0.92}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.01"
                  value={formData.topP ?? 0.92}
                  onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderTop: '1px solid var(--border-subtle)' }}>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enable Unfiltered Dynamic Dialogues</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enables complete creative freedom and full conversational range</p>
            </div>
            <input
              type="checkbox"
              checked={formData.nsfwEnabled}
              onChange={(e) => setFormData({ ...formData, nsfwEnabled: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-nsfw)' }}
            />
          </div>

          <button type="submit" className="nav-btn nav-btn-primary" style={{ padding: '0.75rem' }}>
            <Save size={16} /> {savedSuccess ? 'Settings Saved!' : 'Save Configuration'}
          </button>
        </form>
      </div>
    </div>
  );
};
