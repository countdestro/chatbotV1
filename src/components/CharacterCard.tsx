import React from 'react';
import { MessageSquare, Bookmark, BadgeCheck } from 'lucide-react';
import { Persona } from '../types';

interface CharacterCardProps {
  persona: Persona;
  onSelect: (persona: Persona) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ persona, onSelect }) => {
  const formatCount = (n?: number) => {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  };

  return (
    <div className="janitor-card" onClick={() => onSelect(persona)}>
      {/* Portrait image with 3:4 ratio */}
      <div className="card-media-box">
        <img
          src={persona.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'}
          alt={persona.name}
          className="card-avatar-img"
          loading="lazy"
        />
        <div className="card-media-overlay" />

        {/* Top-left: Rating Badge */}
        {persona.is_cbt && (
          <span className="card-rating-badge rating-cbt">ERP/CBT</span>
        )}

        {/* Top-right: Chat count stats */}
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

        {/* Token info (Janitor AI style) */}
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
