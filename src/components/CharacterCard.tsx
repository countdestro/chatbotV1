import React from 'react';
import { MessageSquare, Bookmark, BadgeCheck, Brain, Shield } from 'lucide-react';
import { Persona } from '../types';

interface CharacterCardProps {
  persona: Persona;
  onSelect: (persona: Persona) => void;
}

// Generate a consistent color gradient based on name
const getInitialColor = (name: string) => {
  const colors = [
    ['#1e40af', '#3b82f6'],
    ['#065f46', '#10b981'],
    ['#4c1d95', '#8b5cf6'],
    ['#92400e', '#f59e0b'],
    ['#881337', '#e11d48'],
    ['#164e63', '#06b6d4'],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};

export const CharacterCard: React.FC<CharacterCardProps> = ({ persona, onSelect }) => {
  const formatCount = (n?: number) => {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  };

  const [gradFrom, gradTo] = getInitialColor(persona.name);
  const initials = persona.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="janitor-card" onClick={() => onSelect(persona)}>
      {/* Avatar area — no photo, just styled initial/icon block */}
      <div className="card-media-box" style={{ background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)` }}>
        <div className="card-initials-avatar">
          <span className="card-initials-text">{initials}</span>
          <Brain size={20} style={{ opacity: 0.4, marginTop: '0.4rem' }} />
        </div>

        {/* Top-left: CBT Badge */}
        {persona.is_cbt && (
          <span className="card-rating-badge rating-cbt">
            <Shield size={9} style={{ display: 'inline', marginRight: '3px' }} />
            CBT
          </span>
        )}

        {/* Top-right: Session count */}
        <div className="card-stats-overlay">
          <MessageSquare size={12} />
          {formatCount(persona.chat_count)}
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body">
        <div className="card-title-row">
          <span className="card-name">{persona.name}</span>
          <Bookmark size={14} color="var(--text-dim)" style={{ flexShrink: 0 }} />
        </div>

        {persona.creator_handle && (
          <div className="card-creator-handle">
            <BadgeCheck size={12} className="verified-icon" />
            @{persona.creator_handle}
          </div>
        )}

        <p className="card-description-preview">
          {persona.tagline || persona.description}
        </p>

        {/* Tags */}
        {persona.tags && persona.tags.length > 0 && (
          <div className="card-tag-pills">
            {persona.tags.slice(0, 4).map((tag, idx) => (
              <span key={idx} className="card-micro-tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Token info */}
        <div className="card-token-counter">
          <span>{persona.token_count ? `${persona.token_count.toLocaleString()} tkns` : ''}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Bookmark size={11} />
            {formatCount(persona.bookmark_count)}
          </span>
        </div>
      </div>
    </div>
  );
};
