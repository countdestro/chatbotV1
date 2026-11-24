import React, { useState, useEffect } from 'react';
import { AppSettings, Chat, Persona } from './types';
import { Navbar } from './components/Navbar';
import { ExploreHub } from './components/ExploreHub';
import { ChatScreen } from './components/ChatScreen';
import { CharacterModal } from './components/CharacterModal';
import { SettingsModal } from './components/SettingsModal';
import { CBTTrackerModal } from './components/CBTTrackerModal';
import { UserPersonaModal } from './components/UserPersonaModal';
import {
  collectLocalChats,
  fetchPersonas,
  getOrCreateActiveChat,
  getStoredSettings,
  savePersonaToStorage,
  saveStoredSettings
} from './lib/supabase';

export const App: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [currentView, setCurrentView] = useState<'explore' | 'chat'>('explore');
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUserPersonaModalOpen, setIsUserPersonaModalOpen] = useState(false);
  const [isCbtTrackerOpen, setIsCbtTrackerOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    const loaded = await fetchPersonas();
    setPersonas(loaded);
  };

  const handleSelectPersona = async (persona: Persona) => {
    setActivePersona(persona);
    // Instant optimistic navigation: use local chat immediately (0ms latency)
    const localChats = collectLocalChats(persona.id);
    if (localChats.length > 0) {
      setActiveChat(localChats[0]);
      setCurrentView('chat');
      // Background verification
      getOrCreateActiveChat(persona).then(chat => {
        if (chat && chat.id !== localChats[0].id) {
          setActiveChat(chat);
        }
      });
      return;
    }

    const chat = await getOrCreateActiveChat(persona);
    setActiveChat(chat);
    setCurrentView('chat');
  };

  const handleSavePersona = async (persona: Persona) => {
    await savePersonaToStorage(persona);
    await loadPersonas();
    if (activePersona?.id === persona.id) setActivePersona(persona);
  };

  const handleOpenCreate = () => {
    setEditingPersona(null);
    setIsCharacterModalOpen(true);
  };

  const handleOpenEdit = (persona: Persona) => {
    setEditingPersona(persona);
    setIsCharacterModalOpen(true);
  };

  const handleToggleNsfw = () => {
    const updated = { ...settings, nsfwEnabled: !settings.nsfwEnabled };
    setSettings(updated);
    saveStoredSettings(updated);
  };

  return (
    <div className={`app-container${currentView === 'chat' ? ' chat-open' : ''}`}>
      <Navbar
        currentView={currentView}
        activePersona={activePersona}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigateExplore={() => setCurrentView('explore')}
        onOpenCreateModal={handleOpenCreate}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenUserPersonaModal={() => setIsUserPersonaModalOpen(true)}
        userDisplayName={settings.userDisplayName}
        userAvatarUrl={settings.userAvatarUrl}
        onOpenCbtTracker={() => setIsCbtTrackerOpen(true)}
        nsfwEnabled={settings.nsfwEnabled}
        onToggleNsfw={handleToggleNsfw}
        hidden={currentView === 'chat'}
      />

      {currentView === 'explore' || !activePersona || !activeChat ? (
        <ExploreHub
          personas={personas}
          onSelectPersona={handleSelectPersona}
          onOpenCreateModal={handleOpenCreate}
          nsfwEnabled={settings.nsfwEnabled}
          searchQuery={searchQuery}
        />
      ) : (
        <ChatScreen
          persona={activePersona}
          chat={activeChat}
          settings={settings}
          onBack={() => setCurrentView('explore')}
          onEditPersona={handleOpenEdit}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenCbtTracker={() => setIsCbtTrackerOpen(true)}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            saveStoredSettings(newSettings);
          }}
        />
      )}

      <CharacterModal
        isOpen={isCharacterModalOpen}
        onClose={() => setIsCharacterModalOpen(false)}
        onSave={handleSavePersona}
        initialPersona={editingPersona}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <UserPersonaModal
        isOpen={isUserPersonaModalOpen}
        onClose={() => setIsUserPersonaModalOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(newSettings);
          saveStoredSettings(newSettings);
        }}
      />

      <CBTTrackerModal
        isOpen={isCbtTrackerOpen}
        onClose={() => setIsCbtTrackerOpen(false)}
      />
    </div>
  );
};
