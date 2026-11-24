import React, { useState } from 'react';
import { X, Image } from 'lucide-react';
import { AppSettings, Persona } from '../types';

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  persona: Persona;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onOpenSettings?: () => void;
  onOpenMemory?: () => void;
}

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  isOpen,
  onClose,
  settings,
  persona,
  onUpdateSettings,
  onOpenSettings,
  onOpenMemory,
}) => {
  const [autoScroll, setAutoScroll] = useState<boolean>(settings.autoScroll ?? true);
  const [textStreaming, setTextStreaming] = useState<boolean>(settings.textStreaming ?? true);
  const [bgOpacity, setBgOpacity] = useState<number>(settings.bgOpacity ?? 15);
  const [bgBlur, setBgBlur] = useState<number>(settings.bgBlur ?? 0);
  const [customBgUrl, setCustomBgUrl] = useState<string>(settings.customBgUrl || '');
  const [showUrlInput, setShowUrlInput] = useState(false);

  if (!isOpen) return null;

  // Show the actual background image (background_url), not avatar
  const activeBgImage = customBgUrl || (persona as any).background_url || persona.avatar_url;

  const handleSave = () => {
    const updated: AppSettings = {
      ...settings,
      autoScroll,
      textStreaming,
      bgOpacity,
      bgBlur,
      customBgUrl,
    };
    onUpdateSettings(updated);
    onClose();
  };

  const handleResetImage = () => {
    setCustomBgUrl('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card janitor-customize-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', borderRadius: '16px', background: '#1c1e26', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', background: '#13141a', padding: '3px', borderRadius: '10px' }}>
            {onOpenSettings && (
              <button
                className="filter-group-btn"
                onClick={() => { onClose(); onOpenSettings(); }}
                style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}
              >
                Settings
              </button>
            )}
            {onOpenMemory && (
              <button
                className="filter-group-btn"
                onClick={() => { onClose(); onOpenMemory(); }}
                style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}
              >
                Memory
              </button>
            )}
            <button
              className="filter-group-btn active"
              style={{ background: '#2d3142', color: '#fff', fontSize: '0.85rem', padding: '0.35rem 0.85rem', borderRadius: '8px', fontWeight: 600 }}
            >
              Customize
            </button>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
          {/* Enable Autoscroll Switch */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>Enable autoscroll</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                When off, the chat won't follow replies as they're being generated.
              </div>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          {/* Text Streaming Switch */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>Text streaming</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                Determines if text comes all at once or bit-by-bit. Turning this off may improve performance.
              </div>
            </div>
            <label className="switch-toggle">
              <input
                type="checkbox"
                checked={textStreaming}
                onChange={(e) => setTextStreaming(e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          </div>

          {/* Background Image Box */}
          <div style={{ background: '#13141a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Background image</span>
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                style={{ background: 'transparent', border: 'none', color: '#a855f7', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Image size={13} /> {showUrlInput ? 'Hide URL' : 'Change Image'}
              </button>
            </div>

            {/* Thumbnail preview */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img
                  src={activeBgImage}
                  alt="Background preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  onClick={handleResetImage}
                  title="Remove custom background"
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: '#a855f7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {showUrlInput && (
              <div className="form-group" style={{ marginTop: '0.2rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Paste image URL..."
                  value={customBgUrl}
                  onChange={(e) => setCustomBgUrl(e.target.value)}
                  style={{ fontSize: '0.825rem', padding: '0.45rem 0.65rem' }}
                />
              </div>
            )}

            {/* Background Opacity Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', color: '#94a3b8' }}>
                <span>Background opacity</span>
                <span style={{ background: '#1c1e26', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 10px', borderRadius: '4px', color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {bgOpacity}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={bgOpacity}
                onChange={(e) => setBgOpacity(Number(e.target.value))}
                className="janitor-slider"
              />
            </div>

            {/* Background Blur Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', color: '#94a3b8' }}>
                <span>Background blur</span>
                <span style={{ background: '#1c1e26', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 10px', borderRadius: '4px', color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {bgBlur}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={bgBlur}
                onChange={(e) => setBgBlur(Number(e.target.value))}
                className="janitor-slider"
              />
            </div>
          </div>

          {/* Text Settings Preview */}
          <div style={{ background: '#13141a', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.85rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff', marginBottom: '0.35rem' }}>Text settings</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>PREVIEW</div>
            <div style={{ fontSize: '0.85rem', color: '#c0a9e4', fontStyle: 'italic' }}>
              <em>*Alice shifts slightly, turning onto her side to face you...*</em>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'linear-gradient(90deg, #d946ef 0%, #ec4899 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(236,72,153,0.4)',
              transition: 'all 0.2s ease',
              marginTop: '0.25rem'
            }}
          >
            • Save
          </button>
        </div>
      </div>
    </div>
  );
};
