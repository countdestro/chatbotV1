import React, { useState } from 'react';
import { X, User, Sparkles, Check, Dumbbell, Heart } from 'lucide-react';
import { AppSettings } from '../types';
import { saveStoredSettings } from '../lib/supabase';

interface UserPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const UserPersonaModal: React.FC<UserPersonaModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [displayName, setDisplayName] = useState(settings.userDisplayName || 'User');
  const [personaBio, setPersonaBio] = useState(settings.userPersonaBio || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      userDisplayName: displayName.trim() || 'User',
      userPersonaBio: personaBio.trim()
    };
    saveStoredSettings(updated);
    onUpdateSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '92%',
          background: '#0d0f14',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(168, 85, 247, 0.15)',
          borderRadius: '16px',
          padding: '1.4rem'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ marginBottom: '1.2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '6px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
              <User size={20} color="#c084fc" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#fff' }}>User Persona Profile</h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>How characters perceive your appearance & personality</span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ color: '#94a3b8' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Avatar and Name row */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <img
              src={settings.userAvatarUrl || '/user-avatar.png'}
              alt="User Avatar"
              style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #a855f7' }}
            />
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                Persona Name ({'{{user}}'} in prompts)
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Alex"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{ width: '100%', fontSize: '0.9rem', padding: '0.5rem 0.75rem', background: '#13161f', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}
              />
            </div>
          </div>

          {/* Persona Bio Textarea */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={14} color="#a855f7" /> Persona Appearance, Background & Traits
              </label>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{personaBio.length} chars</span>
            </div>
            <textarea
              className="form-textarea"
              rows={8}
              placeholder="Describe your height, body build, hair, facial features, interests, clothing, and background..."
              value={personaBio}
              onChange={(e) => setPersonaBio(e.target.value)}
              style={{
                width: '100%',
                fontSize: '0.84rem',
                lineHeight: '1.55',
                padding: '0.75rem',
                background: '#13161f',
                color: '#e2e8f0',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                resize: 'vertical'
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
              💡 Characters will naturally incorporate your background, interests, and style into conversations.
            </span>
          </div>

          {/* Quick Info Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} /> Tech & Creative Ideas
            </span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              📚 Reading & Learning
            </span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(236, 72, 153, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Heart size={12} /> Coffee & Music
            </span>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="nav-btn"
              onClick={onClose}
              style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="nav-btn nav-btn-primary"
              style={{
                padding: '0.55rem 1.3rem',
                fontSize: '0.85rem',
                background: savedSuccess ? '#10b981' : '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {savedSuccess ? (
                <>
                  <Check size={16} /> Saved!
                </>
              ) : (
                'Save Persona'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
