import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Edit2,
  Trash2,
  RotateCw,
  Star,
  MoreHorizontal,
  FastForward
} from 'lucide-react';
import { Message, Persona } from '../types';

interface MessageItemProps {
  message: Message;
  persona: Persona;
  userDisplayName: string;
  userAvatarUrl?: string;
  isStreaming?: boolean;
  onSwipe?: (messageId: string, newSwipeIndex: number) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
}

const MessageItemInner: React.FC<MessageItemProps> = ({
  message,
  persona,
  userDisplayName,
  userAvatarUrl,
  isStreaming,
  onSwipe,
  onEdit,
  onDelete,
  onRegenerate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';
  const swipes = message.swipes && message.swipes.length > 0 ? message.swipes : [message.content];
  const currentSwipe = message.current_swipe ?? 0;
  const displayContent = swipes[currentSwipe] ?? message.content;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEdit = () => {
    setEditContent(displayContent);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim()) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const renderFormattedInline = (inlineText: string, paraKey: number) => {
    const nodes: React.ReactNode[] = [];
    let key = 0;

    // Check if line starts with character prefix like "User:" or "Alice:"
    const prefixMatch = inlineText.match(/^([A-Za-z0-9_]+:)\s*(.*)$/s);
    if (prefixMatch) {
      const prefix = prefixMatch[1];
      const rest = prefixMatch[2];
      const isUser = prefix.toLowerCase().includes('user') || prefix.toLowerCase().includes('you');
      nodes.push(
        <strong
          key={`pref-${paraKey}`}
          className={isUser ? 'janitor-user-prefix' : 'janitor-character-prefix'}
          style={{
            display: 'inline-block',
            marginRight: '6px',
            color: isUser ? '#60a5fa' : '#c084fc',
            fontWeight: 800
          }}
        >
          {prefix}
        </strong>
      );
      inlineText = rest;
    }

    /**
     * Regex-based tokenizer — processes text in one pass, left-to-right.
     * Token priority (order matters):
     *   1. **bold**
     *   2. *action/italic*  — non-greedy, will not cross newlines or span > 300 chars
     *   3. "straight double-quote dialogue"
     *   4. \u201ccurly double-quote dialogue\u201d
     *   5. \u2018curly single-quote dialogue\u2019
     *
     * Unclosed patterns fall through to the literal-text case so nothing is
     * swallowed silently.
     */
    const TOKEN_RE = /(\*\*(.+?)\*\*)|(\*([^*\n]{1,300}?)\*)|("([^"\n]*)")|(\u201c([^\u201d\n]*)\u201d)|(\u2018([^\u2019\n]*)\u2019)/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    const pushPlain = (text: string) => {
      if (!text) return;
      nodes.push(
        <span
          key={`${paraKey}-${key++}`}
          className={isAssistant ? 'janitor-narration-text' : 'janitor-dialogue-text'}
          style={isAssistant ? undefined : { color: '#ffffff' }}
        >
          {text}
        </span>
      );
    };

    while ((match = TOKEN_RE.exec(inlineText)) !== null) {
      // Emit any plain text before this match
      if (match.index > lastIndex) {
        pushPlain(inlineText.slice(lastIndex, match.index));
      }
      lastIndex = TOKEN_RE.lastIndex;

      if (match[1]) {
        // **bold**
        nodes.push(
          <strong key={`${paraKey}-${key++}`} style={{ color: '#ffffff', fontWeight: 700 }}>
            {match[2]}
          </strong>
        );
      } else if (match[3]) {
        // *action / italic*
        nodes.push(
          <em key={`${paraKey}-${key++}`} className="janitor-narration-text">
            {match[4]}
          </em>
        );
      } else if (match[5]) {
        // "straight double-quote dialogue"
        nodes.push(
          <span key={`${paraKey}-${key++}`} className="janitor-dialogue-text" style={{ color: '#ffffff' }}>
            {match[6]}
          </span>
        );
      } else if (match[7]) {
        // \u201ccurly double-quote\u201d dialogue
        nodes.push(
          <span key={`${paraKey}-${key++}`} className="janitor-dialogue-text" style={{ color: '#ffffff' }}>
            {match[8]}
          </span>
        );
      } else if (match[9]) {
        // \u2018curly single-quote\u2019 dialogue
        nodes.push(
          <span key={`${paraKey}-${key++}`} className="janitor-dialogue-text" style={{ color: '#ffffff' }}>
            {match[10]}
          </span>
        );
      }
    }

    // Emit any trailing plain text after the last match
    if (lastIndex < inlineText.length) {
      pushPlain(inlineText.slice(lastIndex));
    }

    return nodes;
  };

  /**
   * Split text into paragraphs (double newline) then lines (single newline),
   * render each line with the inline tokenizer, and join lines with <br />.
   */
  const renderFormattedText = (text: string) => {
    // Normalise line endings
    let normalised = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Clean up asterisks inside quotation marks so "*words*" inside quotes becomes clean "words"
    normalised = normalised.replace(/"([^"]*)"/g, (_, inner) => `"${inner.replace(/\*/g, '')}"`);
    normalised = normalised.replace(/\u201c([^\u201d]*)\u201d/g, (_, inner) => `\u201c${inner.replace(/\*/g, '')}\u201d`);

    // Merge adjacent fragmented asterisks: *word1* *word2* -> *word1 word2*
    let prev = '';
    while (prev !== normalised) {
      prev = normalised;
      normalised = normalised.replace(/\*([^*\n]+)\*\s*\*([^*\n]+)\*/g, '*$1 $2*');
    }

    const paragraphs = normalised.split(/\n{2,}/);

    return (
      <div className="janitor-message-body">
        {paragraphs.map((para, pIdx) => {
          const lines = para.split('\n');
          return (
            <p
              key={pIdx}
              className="janitor-message-paragraph"
              style={{ marginBottom: pIdx === paragraphs.length - 1 ? 0 : '0.85rem', lineHeight: 1.7 }}
            >
              {lines.map((line, lIdx) => (
                <React.Fragment key={lIdx}>
                  {renderFormattedInline(line.trim(), pIdx * 1000 + lIdx)}
                  {lIdx < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          );
        })}
      </div>
    );
  };

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', margin: '0.5rem auto', maxWidth: '85%' }}>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic', background: 'rgba(0,0,0,0.3)', padding: '4px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`janitor-message-row ${message.role}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: '0.75rem',
        maxWidth: '880px',
        width: '100%',
        margin: '0.35rem auto',
        position: 'relative'
      }}
    >
      {/* Avatar Thumbnail */}
      <img
        src={
          isAssistant
            ? (persona.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300')
            : (userAvatarUrl || '/user-avatar.png')
        }
        alt={isAssistant ? persona.name : userDisplayName}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          objectFit: 'cover',
          flexShrink: 0,
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
        {/* Author header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
              {isAssistant ? persona.name : userDisplayName}
            </span>
          </div>

          {/* Quick Action Icons (Edit / Delete) right side on mobile/desktop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {onEdit && (
              <button
                onClick={handleStartEdit}
                title="Edit message"
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
              >
                <Edit2 size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                title="Delete message"
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Message Content Area */}
        <div
          className="janitor-message-text-area"
          style={{
            fontSize: '0.95rem',
            color: '#e2e8f0',
            wordBreak: 'break-word',
            background: isAssistant ? 'transparent' : 'rgba(255, 255, 255, 0.04)',
            borderRadius: '10px',
            padding: isAssistant ? '0' : '0.6rem 0.85rem',
            border: isAssistant ? 'none' : '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
              <textarea
                className="form-textarea"
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{ width: '100%', fontSize: '0.9rem', background: '#12141a', color: '#fff', border: '1px solid #7c3aed' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="nav-btn" onClick={() => setIsEditing(false)} style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}>Cancel</button>
                <button className="nav-btn nav-btn-glow" onClick={handleSaveEdit} style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}>Save</button>
              </div>
            </div>
          ) : (
            renderFormattedText(displayContent)
          )}

          {isStreaming && (
            <span style={{ display: 'inline-block', width: '2px', height: '1.1em', background: '#a855f7', marginLeft: '3px', verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite' }} />
          )}
        </div>

        {/* Assistant Footer Controls: 5-Star rating, swipe, regenerate (matching Screenshot 1) */}
        {isAssistant && !isEditing && !isStreaming && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.45rem', opacity: hovered ? 1 : 0.85, transition: 'opacity 0.2s' }}>
            {/* Star Rating Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star === rating ? 0 : star)}
                  style={{ background: 'transparent', border: 'none', padding: '1px', cursor: 'pointer', color: star <= rating ? '#fbbf24' : '#64748b' }}
                >
                  <Star size={13} fill={star <= rating ? '#fbbf24' : 'none'} />
                </button>
              ))}
            </div>

            <span style={{ color: '#475569', fontSize: '0.75rem' }}>|</span>

            {/* Swipe Controls */}
            {swipes.length > 1 && onSwipe && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                <button
                  style={{ background: 'transparent', border: 'none', color: currentSwipe === 0 ? '#475569' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  disabled={currentSwipe === 0}
                  onClick={() => onSwipe(message.id, currentSwipe - 1)}
                >
                  <ChevronLeft size={13} />
                </button>
                <span>{currentSwipe + 1}/{swipes.length}</span>
                <button
                  style={{ background: 'transparent', border: 'none', color: currentSwipe === swipes.length - 1 ? '#475569' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  disabled={currentSwipe === swipes.length - 1}
                  onClick={() => onSwipe(message.id, currentSwipe + 1)}
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* Overflow menu */}
            <button
              onClick={() => setShowMoreActions(!showMoreActions)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Message options"
            >
              <MoreHorizontal size={14} />
            </button>

            {/* Regenerate Swipe Button (>> icon matching screenshot) */}
            {onRegenerate && (
              <button
                onClick={() => onRegenerate(message.id)}
                title="Regenerate reply"
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <FastForward size={14} />
              </button>
            )}

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              title="Copy message"
              style={{ background: 'transparent', border: 'none', color: copied ? '#10b981' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: 'auto' }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const MessageItem = React.memo(MessageItemInner);
