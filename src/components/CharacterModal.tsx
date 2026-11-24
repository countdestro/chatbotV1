import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon, ShieldAlert, HeartPulse, Save } from 'lucide-react';
import { Persona } from '../types';
import { AVAILABLE_MODELS } from '../lib/models';
import { generateUUID } from '../lib/supabase';
import { CBT_SYSTEM_GROUNDING } from '../lib/cbt-matrix';

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
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      greeting: '*Looks up with a curious expression.*\n\n"Hello! What would you like to talk about today?"',
      description: '',
      scenario: 'A quiet room with ambient lighting.',
      system_prompt: 'You are an engaging, expressive companion. Use natural narration and dialogue.',
      model_provider: 'openrouter',
      model_name: 'cognitivecomputations/dolphin-mistral-24b-venice-edition',
      temperature: 0.85,
      is_nsfw: false,
      is_cbt: false,
      tags: ['Companion', 'Custom'],
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
      avatar_url: formData.avatar_url?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      greeting: formData.greeting?.trim() || 'Hello!',
      description: formData.description?.trim() || '',
      scenario: formData.scenario?.trim() || '',
      // Never overwrite a custom system_prompt with CBT grounding — CBT is now permanently disabled
      system_prompt: formData.system_prompt?.trim() || '',
      is_cbt: false, // Always force is_cbt=false regardless of checkbox state
      model_provider: formData.model_provider || 'openrouter',
      model_name: formData.model_name || 'cognitivecomputations/dolphin-mistral-24b-venice-edition',
      temperature: formData.temperature ?? 0.85,
      is_nsfw: !!formData.is_nsfw,
      // is_cbt is already forced to false above
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
            <Sparkles size={20} color="var(--accent-primary)" />
            <h2>{isEditing ? 'Edit Character' : 'Create New Character'}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label>Character Name *</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Nyx, Dr. Maya, Cyberpunk V..."
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Short Tagline</label>
            <input
              className="form-input"
              type="text"
              placeholder="A brief summary shown on character card..."
              value={formData.tagline || ''}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Avatar Image URL</label>
            <input
              className="form-input"
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.avatar_url || ''}
              onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>First Greeting Message (Markdown & *Actions* supported)</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="*Smiles warmly.* Hello there..."
              value={formData.greeting || ''}
              onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Scenario / Background Setting</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. A neon-lit club in Neo-Veridia, or a quiet therapy room..."
              value={formData.scenario || ''}
              onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>AI Model Engine</label>
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
            <label>System Prompt & Personality Rules</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Define personality, speaking style, lore, rules..."
              value={formData.system_prompt || ''}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input
              className="form-input"
              type="text"
              placeholder="Creative, Story, Anime, Assistant..."
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '0.5rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={formData.is_nsfw || false}
                onChange={(e) => setFormData({ ...formData, is_nsfw: e.target.checked })}
                style={{ accentColor: '#a855f7' }}
              />
              <span style={{ color: '#c084fc', fontWeight: 600 }}>✨ Unfiltered Creative Freedom</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={formData.is_cbt || false}
                onChange={(e) => setFormData({ ...formData, is_cbt: e.target.checked })}
                style={{ accentColor: '#10b981' }}
              />
              <span style={{ color: '#34d399', fontWeight: 600 }}>🛡️ Pure-O CBT/ERP Mode</span>
            </label>
          </div>

          <button type="submit" className="nav-btn nav-btn-primary" style={{ padding: '0.75rem' }}>
            <Save size={16} /> {isEditing ? 'Save Changes' : 'Create Character'}
          </button>
        </form>
      </div>
    </div>
  );
};
