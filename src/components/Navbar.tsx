import { Search, Plus, Settings, HeartHandshake, Brain, User } from 'lucide-react';
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
  hidden = false,
}) => {
  if (hidden) return null;
  return (
    <header className="navbar">
      <div className="nav-left">
        <div className="nav-brand" onClick={onNavigateExplore} style={{ cursor: 'pointer' }}>
          <div style={{ background: '#0f766e', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
            <Brain size={20} color="#fff" />
          </div>
          <span className="nav-brand-title">MIND<span>SPACE</span></span>
        </div>

        <button
          className={`nav-tab-link ${currentView === 'explore' ? 'active' : ''}`}
          onClick={onNavigateExplore}
        >
          Companions
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="nav-search-box">
        <Search size={16} color="var(--text-dim)" />
        <input
          type="text"
          placeholder="Search companions by name, specialty, or approach..."
          className="nav-search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <span className="kbd-shortcut">Ctrl K</span>
      </div>

      <div className="nav-right">
        {/* CBT/ERP Tracker */}
        <button
          className="nav-btn"
          onClick={onOpenCbtTracker}
          title="Exposure & Response Prevention (ERP) Tracker"
          style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}
        >
          <HeartHandshake size={15} />
          <span className="hidden-sm">ERP Tracker</span>
        </button>

        {/* Add Companion Button */}
        <button
          className="nav-btn nav-btn-glow"
          onClick={onOpenCreateModal}
          title="Create New Companion"
        >
          <Plus size={15} />
          <span className="hidden-sm">New</span>
        </button>

        {/* User Profile */}
        <button
          className="nav-btn"
          onClick={onOpenUserPersonaModal}
          title="Your Profile"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <User size={16} />
          <span className="hidden-sm" style={{ fontWeight: 600 }}>{userDisplayName || 'Profile'}</span>
        </button>

        {/* Settings */}
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
