import { Search, Plus, Settings, ShieldAlert, HeartHandshake, Bot, User } from 'lucide-react';
import { Persona } from '../types';

interface NavbarProps {
  currentView: 'explore' | 'chat';
  activePersona: Persona | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateExplore: () => void;
  onOpenCreateModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenCbtTracker: () => void;
  onOpenUserPersonaModal?: () => void;
  userDisplayName?: string;
  userAvatarUrl?: string;
  nsfwEnabled: boolean;
  onToggleNsfw: () => void;
  hidden?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  searchQuery,
  onSearchChange,
  onNavigateExplore,
  onOpenCreateModal,
  onOpenSettingsModal,
  onOpenCbtTracker,
  onOpenUserPersonaModal,
  userDisplayName,
  userAvatarUrl,
  nsfwEnabled,
  onToggleNsfw,
  hidden = false,
}) => {
  if (hidden) return null;
  return (
    <header className="navbar">
      <div className="nav-left">
        <div className="nav-brand" onClick={onNavigateExplore} style={{ cursor: 'pointer' }}>
          <div style={{ background: '#7c3aed', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <span className="nav-brand-title">COMPANION<span>AI</span></span>
        </div>

        <button
          className={`nav-tab-link ${currentView === 'explore' ? 'active' : ''}`}
          onClick={onNavigateExplore}
        >
          Home
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="nav-search-box">
        <Search size={16} color="var(--text-dim)" />
        <input
          type="text"
          placeholder="Search characters by name, tag, or creator..."
          className="nav-search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <span className="kbd-shortcut">Ctrl K</span>
      </div>

      <div className="nav-right">
        {/* Pure-O ERP Support Log */}
        <button
          className="nav-btn"
          onClick={onOpenCbtTracker}
          title="Exposure & Response Prevention (ERP) Tracker"
          style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}
        >
          <HeartHandshake size={15} />
          <span className="hidden-sm">ERP Tracker</span>
        </button>

        {/* 18+ Limitless / SFW Rating Toggle */}
        <button
          className={`nav-btn ${nsfwEnabled ? 'tag-pill nsfw-pill active' : ''}`}
          onClick={onToggleNsfw}
          title={nsfwEnabled ? 'Limitless Mode (18+) is ON' : 'SFW Mode'}
        >
          <ShieldAlert size={15} />
          <span>{nsfwEnabled ? '18+ Limitless' : 'SFW Only'}</span>
        </button>

        {/* Create Character Button */}
        <button
          className="nav-btn nav-btn-glow"
          onClick={onOpenCreateModal}
          title="Create New Character"
        >
          <Plus size={15} />
          <span className="hidden-sm">Create</span>
        </button>

        {/* User Persona & Profile */}
        <button
          className="nav-btn"
          onClick={onOpenUserPersonaModal}
          title="User Persona & Appearance"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <img
            src={userAvatarUrl || '/user-avatar.png'}
            alt="User avatar"
            style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }}
          />
          <span className="hidden-sm" style={{ fontWeight: 600 }}>{userDisplayName || 'User'}</span>
        </button>

        {/* Settings (API Keys) */}
        <button
          className="nav-btn"
          onClick={onOpenSettingsModal}
          title="API Keys & Settings"
          style={{ padding: '0.45rem' }}
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
};
