import React, { useState, useMemo } from 'react';
import { Search, Plus, TrendingUp, Clock, Star, Flame, HeartPulse, Swords, Sparkles } from 'lucide-react';
import { Persona } from '../types';
import { CharacterCard } from './CharacterCard';

interface ExploreHubProps {
  personas: Persona[];
  onSelectPersona: (persona: Persona) => void;
  onOpenCreateModal: () => void;
  nsfwEnabled: boolean;
  searchQuery: string;
}

type SortMode = 'trending' | 'new' | 'top' | 'popular';
type CategoryFilter = 'all' | 'cbt' | 'nsfw' | 'rpg' | 'fantasy' | 'romance';

export const ExploreHub: React.FC<ExploreHubProps> = ({
  personas,
  onSelectPersona,
  onOpenCreateModal,
  nsfwEnabled,
  searchQuery,
}) => {
  const [sortMode, setSortMode] = useState<SortMode>('trending');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const filteredPersonas = useMemo(() => {
    let result = personas.filter(p => {
      if (!nsfwEnabled && p.is_nsfw) return false;

      if (categoryFilter === 'cbt') return p.is_cbt;
      if (categoryFilter === 'nsfw') return p.is_nsfw;
      if (categoryFilter === 'rpg') return p.tags.some(t => ['RPG', 'Cyberpunk', 'Action', '🎲 RPG', '🎮 Cyberpunk'].includes(t));
      if (categoryFilter === 'fantasy') return p.tags.some(t => ['Fantasy', 'High Fantasy', '🔮 High Fantasy', '🌙 Fantasy'].includes(t));
      if (categoryFilter === 'romance') return p.tags.some(t => ['Romance', 'Slowburn', '❤️‍🩹 Romance', '✨ Slowburn'].includes(t));

      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.creator_handle || '').toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    if (sortMode === 'trending' || sortMode === 'popular') {
      result = [...result].sort((a, b) => (b.chat_count || 0) - (a.chat_count || 0));
    } else if (sortMode === 'top') {
      result = [...result].sort((a, b) => (b.bookmark_count || 0) - (a.bookmark_count || 0));
    }

    return result;
  }, [personas, searchQuery, categoryFilter, nsfwEnabled, sortMode]);

  return (
    <div className="explore-container">
      {/* Horizontal Tags Scroll — Janitor AI style */}
      <div className="tags-scroll-wrap">
        <button
          className={`tag-pill ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} /> All
        </button>
        <button
          className={`tag-pill ${categoryFilter === 'cbt' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('cbt')}
          style={{ borderColor: 'rgba(16, 185, 129, 0.35)' }}
        >
          <HeartPulse size={13} style={{ display: 'inline', marginRight: '4px' }} /> Pure-O / ERP Support
        </button>
        <button
          className={`tag-pill ${categoryFilter === 'rpg' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('rpg')}
        >
          <Swords size={13} style={{ display: 'inline', marginRight: '4px' }} /> RPG &amp; Action
        </button>
        <button
          className={`tag-pill ${categoryFilter === 'fantasy' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('fantasy')}
        >
          <Star size={13} style={{ display: 'inline', marginRight: '4px' }} /> Fantasy
        </button>
        <button
          className={`tag-pill ${categoryFilter === 'romance' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('romance')}
        >
          Romance
        </button>
      </div>

      {/* Filter Row — Sort + Stats (Janitor AI secondary filter bar) */}
      <div className="filter-row-bar">
        <div className="filter-left-controls">
          <div className="filter-btn-group">
            {(['trending', 'new', 'top', 'popular'] as SortMode[]).map(mode => (
              <button
                key={mode}
                className={`filter-group-btn ${sortMode === mode ? 'active' : ''}`}
                onClick={() => setSortMode(mode)}
              >
                {mode === 'trending' && <TrendingUp size={12} style={{ display: 'inline', marginRight: '3px' }} />}
                {mode === 'new' && <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />}
                {mode === 'top' && <Star size={12} style={{ display: 'inline', marginRight: '3px' }} />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-right-stats">
          <span>{filteredPersonas.length} characters</span>
          <button className="nav-btn" onClick={onOpenCreateModal} style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}>
            <Plus size={13} /> Create
          </button>
        </div>
      </div>

      {/* Character Grid */}
      {filteredPersonas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>No characters found.</p>
          <button className="nav-btn nav-btn-glow" onClick={onOpenCreateModal} style={{ margin: '0 auto' }}>
            <Plus size={15} /> Create New Character
          </button>
        </div>
      ) : (
        <div className="character-grid">
          {filteredPersonas.map(p => (
            <CharacterCard key={p.id} persona={p} onSelect={onSelectPersona} />
          ))}
        </div>
      )}
    </div>
  );
};
