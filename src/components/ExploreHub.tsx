import React, { useState, useMemo } from 'react';
import { Plus, TrendingUp, Clock, Star, HeartPulse, Brain, Sparkles } from 'lucide-react';
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
type CategoryFilter = 'all' | 'cbt' | 'anxiety' | 'stress' | 'mindfulness';

export const ExploreHub: React.FC<ExploreHubProps> = ({
  personas,
  onSelectPersona,
  onOpenCreateModal,
  searchQuery,
}) => {
  const [sortMode, setSortMode] = useState<SortMode>('trending');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const filteredPersonas = useMemo(() => {
    let result = personas.filter(p => {
      // Never show NSFW personas
      if (p.is_nsfw) return false;

      if (categoryFilter === 'cbt') return p.is_cbt;
      if (categoryFilter === 'anxiety') return p.tags.some(t => t.toLowerCase().includes('anxiety') || t.toLowerCase().includes('cbt'));
      if (categoryFilter === 'stress') return p.tags.some(t => t.toLowerCase().includes('stress') || t.toLowerCase().includes('burnout'));
      if (categoryFilter === 'mindfulness') return p.tags.some(t => t.toLowerCase().includes('mindful') || t.toLowerCase().includes('wellness'));

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
  }, [personas, searchQuery, categoryFilter, sortMode]);

  return (
    <div className="explore-container">
      {/* Hero section */}
      <div className="explore-hero">
        <Brain size={32} className="explore-hero-icon" />
        <h1 className="explore-hero-title">Mental Wellness Companions</h1>
        <p className="explore-hero-subtitle">
          Evidence-based AI therapy companions trained in CBT, mindfulness, and emotional support.
          A safe space to explore your thoughts and build resilience.
        </p>
        <p className="explore-disclaimer">
          ⚠️ These AI companions are supportive tools — not a substitute for licensed mental health care.
          If you're in crisis, please contact the <strong>988 Suicide & Crisis Lifeline</strong> or text HOME to <strong>741741</strong>.
        </p>
      </div>

      {/* Horizontal Category Filters */}
      <div className="tags-scroll-wrap">
        <button
          className={`tag-pill ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} /> All Companions
        </button>
        <button
          className={`tag-pill ${categoryFilter === 'cbt' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('cbt')}
          style={{ borderColor: 'rgba(16, 185, 129, 0.35)' }}
        >
          <HeartPulse size={13} style={{ display: 'inline', marginRight: '4px' }} /> CBT / ERP
        </button>
        <button
          className={`tag-pill ${categoryFilter === 'anxiety' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('anxiety')}
        >
          <Brain size={13} style={{ display: 'inline', marginRight: '4px' }} /> Anxiety & OCD
        </button>
        <button
          className={`tag-pill ${categoryFilter === 'stress' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('stress')}
        >
          Stress & Burnout
        </button>
        <button
          className={`tag-pill ${categoryFilter === 'mindfulness' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('mindfulness')}
        >
          Mindfulness
        </button>
      </div>

      {/* Filter Row */}
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
          <span>{filteredPersonas.length} companions</span>
          <button className="nav-btn" onClick={onOpenCreateModal} style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}>
            <Plus size={13} /> New
          </button>
        </div>
      </div>

      {/* Companion Grid */}
      {filteredPersonas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <Brain size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>No companions found.</p>
          <button className="nav-btn nav-btn-glow" onClick={onOpenCreateModal} style={{ margin: '0 auto' }}>
            <Plus size={15} /> Create New Companion
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
