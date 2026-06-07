import { faPaperPlane, faRobot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApiFetch } from '../../auth/use-api-fetch';
import { useUser } from '../../contexts/UserContext';
import { ThoughtMessage } from './thought-message';
import type {
  CreateMessageResponse,
  CreateSessionResponse,
  Message,
} from './types';

export function ChatPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const user = useUser();

  const isNew = !idParam || idParam === 'new';
  const sessionId = isNew ? null : Number(idParam);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages for existing session
  useEffect(() => {
    // Clear previous session state when route changes
    setMessages([]);
    setError(null);

    // New session: no messages to load
    if (sessionId === null || !Number.isFinite(sessionId)) {
      setLoading(false);
      return;
    }

    // Existing session: load messages
    let cancelled = false;
    setLoading(true);
    apiFetch(`/sessions/${sessionId}/messages`)
      .then((res) => res.json())
      .then((data: Message[]) => {
        if (!cancelled) {
          setMessages(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, apiFetch]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput('');
    setError(null);

    try {
      if (sessionId === null) {
        // First message: create session
        const res = await apiFetch('/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        const data: CreateSessionResponse = await res.json();
        setMessages(data.messages);
        navigate(`/chat/${data.session.id}`, { replace: true });
      } else {
        // Subsequent messages
        const res = await apiFetch(`/sessions/${sessionId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        const data: CreateMessageResponse = await res.json();
        setMessages((prev) => [
          ...prev,
          data.userMessage,
          data.thoughtMessage,
          data.assistantMessage,
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Restore the input so the user doesn't lose their text
      setInput(content);
    } finally {
      setSending(false);
    }
  }, [input, sending, sessionId, apiFetch, navigate]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (): string => {
    const name = user?.displayName || user?.username || '';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <section className="chat-container" aria-busy="true">
        <div className="chat-loading">Loading…</div>
      </section>
    );
  }

  return (
    <section className="chat-container">
      <div className="chat-messages">
        {isNew && messages.length === 0 && (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <FontAwesomeIcon icon={faRobot} size="2x" />
            </div>
            <h2 className="chat-welcome-title">Assistant</h2>
            <p className="chat-welcome-subtitle">Ready to chat</p>
          </div>
        )}

        {messages.map((msg) => {
          // Thought messages render as a collapsible note: no avatar, no bubble.
          if (msg.isThought === 1) {
            return (
              <ThoughtMessage
                key={msg.id}
                content={msg.content}
              />
            );
          }
          const isAssistant = msg.userName === 'ASSISTANT';
          return (
            <div
              key={msg.id}
              className={`chat-message ${isAssistant ? 'chat-message-assistant' : 'chat-message-user'}`}
            >
              <div
                className={`chat-avatar ${isAssistant ? 'chat-avatar-assistant' : 'chat-avatar-user'}`}
              >
                {isAssistant ? (
                  <FontAwesomeIcon icon={faRobot} />
                ) : (
                  <span>{getInitials()}</span>
                )}
              </div>
              <div
                className={`chat-bubble ${isAssistant ? 'chat-bubble-assistant' : 'chat-bubble-user'}`}
                data-color-mode="light"
              >
                <MarkdownPreview
                  source={msg.content || ''}
                  style={{ background: 'transparent', padding: 0 }}
                />
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <p className="ic-error-block chat-error" role="alert">
          {error}
        </p>
      )}

      <div className="chat-input-bar">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          rows={3}
        />
        <button
          type="button"
          className="ic-btn ic-btn-primary chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || sending}
        >
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </div>
    </section>
  );
}
