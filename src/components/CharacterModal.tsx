import React, { useState } from 'react';
import { X, Brain, Save } from 'lucide-react';
import { Persona } from '../types';
import { AVAILABLE_MODELS } from '../lib/models';
import { generateUUID } from '../lib/supabase';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: Persona) => void;
  initialPersona?: Persona | null;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPersona,
}) => {
  const isEditing = !!initialPersona;

  const [formData, setFormData] = useState<Partial<Persona>>(
    initialPersona || {
      name: '',
      tagline: '',
      avatar_url: '',
      greeting: 'Hello. I\'m here to support you. How are you feeling today, and what brought you here?',
      description: '',
      scenario: 'A private, calm therapy session.',
      system_prompt: 'You are a professional, empathetic AI therapy companion. Use evidence-based CBT techniques, active listening, and a non-judgmental tone. Always maintain professional boundaries.',
      model_provider: 'openrouter',
      model_name: 'cognitivecomputations/dolphin-mistral-24b-venice-edition',
      temperature: 0.75,
      is_nsfw: false,
      is_cbt: true,
      tags: ['🧠 CBT', 'Wellness', 'Support'],
    }
  );

  const [tagsInput, setTagsInput] = useState((formData.tags || []).join(', '));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const saved: Persona = {
      id: formData.id || generateUUID(),
      name: formData.name.trim(),
      tagline: formData.tagline?.trim() || '',
      avatar_url: formData.avatar_url?.trim() || '',
      greeting: formData.greeting?.trim() || 'Hello. How are you feeling today?',
      description: formData.description?.trim() || '',
      scenario: formData.scenario?.trim() || '',
      system_prompt: formData.system_prompt?.trim() || '',
      is_cbt: !!formData.is_cbt,
      model_provider: formData.model_provider || 'openrouter',
      model_name: formData.model_name || 'cognitivecomputations/dolphin-mistral-24b-venice-edition',
      temperature: formData.temperature ?? 0.75,
      is_nsfw: false, // Always false — no NSFW content
      tags: tagsArray,
      chat_count: formData.chat_count || 1,
      created_at: formData.created_at || new Date().toISOString(),
    };

    onSave(saved);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Brain size={20} color="var(--accent-primary)" />
            <h2>{isEditing ? 'Edit Companion' : 'Create New Companion'}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Companion Name *</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Dr. Maya, Dr. Chen, Wellness Coach..."
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Specialty / Tagline</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. CBT specialist for anxiety and OCD..."
              value={formData.tagline || ''}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Opening Message (First Greeting)</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Hello. I'm here to support you. How are you feeling today?"
              value={formData.greeting || ''}
              onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Session Context / Scenario</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. A private, confidential therapy session..."
              value={formData.scenario || ''}
              onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>AI Model</label>
            <select
              className="form-select"
              value={formData.model_name}
              onChange={(e) => {
                const selected = AVAILABLE_MODELS.find(m => m.id === e.target.value);
                setFormData({
                  ...formData,
                  model_name: e.target.value,
                  model_provider: selected ? selected.provider : 'openrouter'
                });
              }}
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>System Prompt & Therapeutic Approach</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Define the companion's therapeutic style, techniques, and boundaries..."
              value={formData.system_prompt || ''}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input
              className="form-input"
              type="text"
              placeholder="CBT, Anxiety, Mindfulness, Burnout..."
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* CBT Mode Toggle */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '0.5rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={formData.is_cbt || false}
                onChange={(e) => setFormData({ ...formData, is_cbt: e.target.checked })}
                style={{ accentColor: '#10b981' }}
              />
              <span style={{ color: '#34d399', fontWeight: 600 }}>🛡️ CBT / ERP Mode</span>
            </label>
          </div>

          <button type="submit" className="nav-btn nav-btn-primary" style={{ padding: '0.75rem' }}>
            <Save size={16} /> {isEditing ? 'Save Changes' : 'Create Companion'}
          </button>
        </form>
      </div>
    </div>
  );
};
