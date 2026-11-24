import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Send,
  Square,
  Lock,
  Menu,
  Wrench,
  Save,
  Palette,
  Globe,
  MessageSquarePlus,
  BookOpen,
  ChevronDown,
  ChevronDown as DownArrow,
  Sparkles,
  User,
  HeartPulse,
  Brain
} from 'lucide-react';
import { AppSettings, Chat, Message, Persona } from '../types';
import { MessageItem } from './MessageItem';
import { updateChatScenario } from '../lib/supabase';
import { setMoodManually, ALL_MOOD_LEVELS, MoodLevel } from '../lib/mood';
import { streamChatCompletion } from '../lib/openrouter';
import {
  clearAllChatMessages,
  deleteMessageFromStorage,
  fetchMessages,
  generateUUID,
  readLocalMessages,
  saveMessageToStorage
} from '../lib/supabase';
import { loadChatSummary, summarizeAndCache, SUMMARY_INTERVAL } from '../lib/summarize';
import { MemoryDrawer } from './MemoryDrawer';
import { CustomizeModal } from './CustomizeModal';
import { UserPersonaModal } from './UserPersonaModal';

interface ChatScreenProps {
  persona: Persona;
  chat: Chat;
  settings: AppSettings;
  onBack: () => void;
  onEditPersona: (persona: Persona) => void;
  onOpenSettingsModal: () => void;
  onOpenCbtTracker: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  persona,
  chat,
  settings,
  onBack,
  onEditPersona,
  onOpenSettingsModal,
  onOpenCbtTracker,
  onUpdateSettings,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  /** Cached summary loaded from localStorage / Supabase on mount. */
  const [cachedSummary, setCachedSummary] = useState<string | null>(null);
  /** Counter of bot replies since last summarisation run. */
  const botReplyCountRef = useRef(0);

  // Modals & Menu Popover state
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const [showMemoryDrawer, setShowMemoryDrawer] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showUserPersonaModal, setShowUserPersonaModal] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesInnerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const streamingTextRef = useRef('');
  const stickToBottomRef = useRef(true);

  // Background: no image bg for professional look — use custom URL only if set
  const bgImageSrc = settings.customBgUrl || null;
  // Avatar shown in chat bubbles
  const chatAvatarSrc = persona.avatar_url;

  messagesRef.current = messages;
  streamingTextRef.current = streamingText;

  const scrollMessagesToBottom = useCallback((smooth = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    // Instant 0ms render from localStorage cache
    const local = readLocalMessages(chat.id);
    if (local.length > 0) {
      setMessages(local);
      stickToBottomRef.current = true;
      requestAnimationFrame(() => scrollMessagesToBottom(false));
    }
    loadChatMessages();

    // Load the cached summary for this chat (localStorage → Supabase fallback)
    loadChatSummary(chat.id).then(summary => {
      if (summary) setCachedSummary(summary);
    });
  }, [chat.id]);

  // Persist summary when the user navigates away or closes the tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Fire-and-forget; browser gives a short grace period for in-flight fetches
      summarizeAndCache(chat.id, messagesRef.current, true);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also trigger on component unmount (e.g. user navigates back)
      summarizeAndCache(chat.id, messagesRef.current, true);
    };
  }, [chat.id]);

  const loadChatMessages = async () => {
    const loaded = await fetchMessages(chat.id);
    setMessages(loaded);
    stickToBottomRef.current = true;
    requestAnimationFrame(() => scrollMessagesToBottom(false));
  };

  // Ultra-smooth frame-synced auto-scroll during streaming and new messages
  useLayoutEffect(() => {
    if (settings.autoScroll === false || !stickToBottomRef.current) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    const frameId = requestAnimationFrame(() => {
      if (stickToBottomRef.current && container) {
        container.scrollTop = container.scrollHeight;
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [messages, streamingText, settings.autoScroll]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
    setShowScrollDown(distanceFromBottom > 120);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  const getRandomEvent = (): string => {
    const events = [
      '*A gentle breeze drifts through the window*',
      '*Soft music plays faintly in the background*',
      '*The light shifts as clouds pass overhead*',
      '*Somewhere nearby, birds are chirping*',
      '*A comfortable silence settles between you*',
      '*The scent of coffee drifts into the room*',
    ];
    return events[Math.floor(Math.random() * events.length)];
  };

  const handleSendMessage = async () => {
    if (isGenerating) return;
    const trimmed = inputText.trim();
    if (!trimmed) return;

    // ==== COMMAND HANDLING ==== //
    // /scenario <text>  → set chat scenario
    if (trimmed.toLowerCase().startsWith('/scenario')) {
      const newScenario = trimmed.replace(/^\/scenario\s+/i, '').trim();
      await updateChatScenario(chat.id, newScenario || undefined);
      const sysMsg: Message = {
        id: generateUUID(),
        chat_id: chat.id,
        role: 'system',
        content: `[SCENARIO SET] ${newScenario ? newScenario : 'cleared'}`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, sysMsg]);
      setInputText('');
      return;
    }

    // /mood <level>  → manually set character mood
    if (trimmed.toLowerCase().startsWith('/mood')) {
      const moodArg = trimmed.replace(/^\/mood\s*/i, '').trim().toLowerCase() as MoodLevel;
      if (ALL_MOOD_LEVELS.includes(moodArg)) {
        setMoodManually(chat.id, moodArg);
        const moodMsg: Message = {
          id: generateUUID(),
          chat_id: chat.id,
          role: 'system',
          content: `[MOOD SET] ${moodArg.toUpperCase()} — ${persona.name}'s mood has been updated.`,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, moodMsg]);
      } else {
        const helpMsg: Message = {
          id: generateUUID(),
          chat_id: chat.id,
          role: 'system',
          content: `[MOOD HELP] Valid moods: ${ALL_MOOD_LEVELS.join(', ')}`,
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, helpMsg]);
      }
      setInputText('');
      return;
    }

    // Proceed with normal user message handling
    const userMessageText = trimmed;
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: Message = {
      id: generateUUID(),
      chat_id: chat.id,
      role: 'user',
      content: userMessageText,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    stickToBottomRef.current = true;
    setMessages(updatedMessages);
    await saveMessageToStorage(userMsg);
    await generateBotReply(updatedMessages);
  };

  const generateBotReply = async (contextMessages: Message[], existingAssistantMsgId?: string) => {
    setIsGenerating(true);
    setStreamingText('');
    stickToBottomRef.current = true;
    abortControllerRef.current = new AbortController();

    await streamChatCompletion({
      persona,
      messages: contextMessages,
      settings,
      cachedSummary,
      signal: abortControllerRef.current.signal,
      onToken: (_token, full) => {
        streamingTextRef.current = full;
        if (settings.textStreaming !== false) {
          setStreamingText(full);
        }
      },
      onComplete: (fullText) => {
        setIsGenerating(false);
        setStreamingText('');
        streamingTextRef.current = '';
        stickToBottomRef.current = true;

        if (existingAssistantMsgId) {
          const existing = messagesRef.current.find(m => m.id === existingAssistantMsgId);
          if (existing) {
            const swipes = existing.swipes ? [...existing.swipes, fullText] : [existing.content, fullText];
            const updatedMsg: Message = {
              ...existing,
              content: fullText,
              swipes,
              current_swipe: swipes.length - 1,
            };
            setMessages(prev => prev.map(m => m.id === existingAssistantMsgId ? updatedMsg : m));
            saveMessageToStorage(updatedMsg);
          }
        } else {
          const botMsg: Message = {
            id: generateUUID(),
            chat_id: chat.id,
            role: 'assistant',
            content: fullText,
            swipes: [fullText],
            current_swipe: 0,
            created_at: new Date().toISOString(),
          };
          setMessages(prev => [...prev, botMsg]);
          saveMessageToStorage(botMsg);

          // Incremental summarisation every SUMMARY_INTERVAL bot replies
          botReplyCountRef.current += 1;
          if (botReplyCountRef.current >= SUMMARY_INTERVAL) {
            botReplyCountRef.current = 0;
            summarizeAndCache(chat.id, messagesRef.current, true).then(summary => {
              // Refresh the in-memory summary so future LLM calls see it
              if (summary !== undefined) {
                loadChatSummary(chat.id).then(s => { if (s) setCachedSummary(s); });
              }
            });
          }
        }

        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        });
      },
      onError: (err) => {
        setIsGenerating(false);
        setStreamingText('');
        alert(`Notice: ${err.message}`);
      }
    });
  };

  const handleStopGenerating = async () => {
    abortControllerRef.current?.abort();
    const partial = streamingTextRef.current.trim();
    setIsGenerating(false);
    setStreamingText('');
    streamingTextRef.current = '';
    if (!partial) return;
    const botMsg: Message = {
      id: generateUUID(),
      chat_id: chat.id,
      role: 'assistant',
      content: partial,
      swipes: [partial],
      current_swipe: 0,
      created_at: new Date().toISOString(),
    };
    await saveMessageToStorage(botMsg);
    setMessages(prev => [...prev, botMsg]);
  };

  const handleSwipe = useCallback(async (messageId: string, newSwipeIndex: number) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg?.swipes || newSwipeIndex < 0 || newSwipeIndex >= msg.swipes.length) return;
    const updated: Message = { ...msg, current_swipe: newSwipeIndex, content: msg.swipes[newSwipeIndex] };
    await saveMessageToStorage(updated);
    setMessages(prev => prev.map(m => m.id === messageId ? updated : m));
  }, [messages]);

  const handleRegenerate = useCallback(async (messageId: string) => {
    if (isGenerating) return;
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;
    await generateBotReply(messages.slice(0, msgIndex), messageId);
  }, [isGenerating, messages]);

  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;
    const swipes = msg.swipes ? [...msg.swipes] : [msg.content];
    if (msg.current_swipe !== undefined) swipes[msg.current_swipe] = newContent;
    const updated: Message = { ...msg, content: newContent, swipes };
    await saveMessageToStorage(updated);
    setMessages(prev => prev.map(m => m.id === messageId ? updated : m));
  }, [messages]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    await deleteMessageFromStorage(chat.id, messageId);
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, [chat.id]);

  const handleClearHistory = async () => {
    if (confirm('Start a fresh new chat? This will clear current messages and start from the beginning.')) {
      await clearAllChatMessages(chat.id);
      if (persona.greeting) {
        const greetingMsg: Message = {
          id: generateUUID(),
          chat_id: chat.id,
          role: 'assistant',
          content: persona.greeting,
          swipes: [persona.greeting],
          current_swipe: 0,
          created_at: new Date().toISOString(),
        };
        await saveMessageToStorage(greetingMsg);
        setMessages([greetingMsg]);
      } else {
        setMessages([]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePublishChat = () => {
    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    navigator.clipboard.writeText(transcript);
    alert('Chat transcript copied to clipboard!');
  };

  return (
    <div className="janitor-chat-screen-wrap" onClick={() => setShowMenuPopover(false)}>
      {/* Background Image Layer — only shown when custom URL is set */}
      {bgImageSrc && (
        <div
          className="janitor-bg-image-layer"
          style={{
            opacity: (settings.bgOpacity ?? 15) / 100,
            filter: `blur(${settings.bgBlur ?? 0}px)`
          }}
        >
          <img src={bgImageSrc} alt="Background" />
        </div>
      )}

      {/* Janitor AI Top Header Bar */}
      <header className="janitor-chat-header" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header-left">
          <button className="janitor-back-btn" onClick={onBack} title="Back">
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        {/* Center Title with Lock icon & Persona name */}
        <div className="chat-header-center" onClick={() => onEditPersona(persona)} title="View character details">
          <Lock size={14} style={{ color: '#94a3b8' }} />
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{persona.name}</span>
        </div>

        {/* Right side Hamburger menu */}
        <div className="chat-header-right">
          <button
            className="janitor-menu-icon-btn"
            onClick={() => setShowMenuPopover(!showMenuPopover)}
            title="Menu"
          >
            <Menu size={20} />
          </button>

          {/* Hamburger Menu Popover (Matching Screenshot 3) */}
          {showMenuPopover && (
            <div className="janitor-menu-popover" onClick={(e) => e.stopPropagation()}>
              <button
                className="popover-item"
                onClick={() => { setShowMenuPopover(false); setShowUserPersonaModal(true); }}
              >
                <User size={16} /> User Persona
              </button>
              <button
                className="popover-item"
                onClick={() => { setShowMenuPopover(false); onOpenSettingsModal(); }}
              >
                <Wrench size={16} /> Settings
              </button>
              <button
                className="popover-item"
                onClick={() => { setShowMenuPopover(false); setShowMemoryDrawer(true); }}
              >
                <Save size={16} /> Chat Memory
              </button>
              <button
                className="popover-item"
                onClick={() => { setShowMenuPopover(false); setShowCustomizeModal(true); }}
              >
                <Palette size={16} /> Customize
              </button>
              <button
                className="popover-item"
                onClick={() => { setShowMenuPopover(false); handlePublishChat(); }}
              >
                <Globe size={16} /> Publish Chat
              </button>
              <button
                className="popover-item"
                onClick={() => { setShowMenuPopover(false); handleClearHistory(); }}
              >
                <MessageSquarePlus size={16} /> New Chat
              </button>
              <button
                className="popover-item"
                onClick={() => { setShowMenuPopover(false); onBack(); }}
              >
                <BookOpen size={16} /> All Chats
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Messages Stream Container */}
      <div
        className="janitor-messages-container"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        <div ref={messagesInnerRef} className="janitor-messages-inner">
        {messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            persona={persona}
            userDisplayName={settings.userDisplayName || 'User'}
            userAvatarUrl={settings.userAvatarUrl || '/user-avatar.png'}
            onSwipe={handleSwipe}
            onEdit={handleEditMessage}
            onDelete={handleDeleteMessage}
            onRegenerate={handleRegenerate}
          />
        ))}

        {isGenerating && streamingText && (
          <MessageItem
            message={{
              id: 'streaming_temp',
              chat_id: chat.id,
              role: 'assistant',
              content: streamingText,
              created_at: new Date().toISOString(),
            }}
            persona={persona}
            userDisplayName={settings.userDisplayName || 'User'}
            userAvatarUrl={settings.userAvatarUrl || '/user-avatar.png'}
            isStreaming={true}
          />
        )}

        <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Scroll-Down Button (Mobile & Desktop) */}
      {showScrollDown && (
        <button
          className="janitor-scroll-down-btn"
          onClick={() => {
            stickToBottomRef.current = true;
            scrollMessagesToBottom(true);
          }}
          title="Scroll to bottom"
        >
          <DownArrow size={16} />
        </button>
      )}

      {/* Floating Bottom Input Bar (Matching Screenshots 1 & 2) */}
      <div className="janitor-input-floating-container">
        <div className="janitor-input-box-wrapper">
          <textarea
            ref={textareaRef}
            className="janitor-textarea"
            placeholder="Share what's on your mind... (Enter to send, Shift+Enter for new line)"
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />

          {/* Input Footer Row inside box: Sparkles + User Persona badge + Send Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: '0.4rem', marginTop: '0.2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
              <button
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                title="Sparkles / Prompt generator"
              >
                <Sparkles size={16} />
              </button>

              {/* User Persona Selector Pill */}
              <button
                onClick={() => setShowUserPersonaModal(true)}
                title="Edit User Persona (Name & Appearance)"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '20px',
                  padding: '3px 8px',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <img
                  src={settings.userAvatarUrl || '/user-avatar.png'}
                  alt="User avatar"
                  style={{ width: '16px', height: '16px', borderRadius: '4px', objectFit: 'cover' }}
                />
                <span>{settings.userDisplayName || 'User'}</span>
                <ChevronDown size={12} color="#94a3b8" />
              </button>
            </div>

            <div>
              {isGenerating ? (
                <button
                  className="send-round-btn"
                  onClick={handleStopGenerating}
                  title="Stop generating"
                  style={{ background: '#f43f5e', width: '32px', height: '32px' }}
                >
                  <Square size={13} />
                </button>
              ) : (
                <button
                  className="send-round-btn"
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  title="Send"
                  style={{ width: '32px', height: '32px' }}
                >
                  <Send size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Memory Drawer */}
      <MemoryDrawer
        isOpen={showMemoryDrawer}
        onClose={() => setShowMemoryDrawer(false)}
        persona={persona}
        messages={messages}
        userDisplayName={settings.userDisplayName || 'User'}
        userBio={settings.userPersonaBio}
        onClearHistory={handleClearHistory}
      />

      {/* Customize Modal */}
      <CustomizeModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        settings={settings}
        persona={persona}
        onUpdateSettings={onUpdateSettings}
        onOpenSettings={onOpenSettingsModal}
        onOpenMemory={() => setShowMemoryDrawer(true)}
      />

      {/* User Persona Modal */}
      <UserPersonaModal
        isOpen={showUserPersonaModal}
        onClose={() => setShowUserPersonaModal(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />
    </div>
  );
};
