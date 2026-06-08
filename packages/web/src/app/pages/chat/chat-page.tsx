import { faPaperPlane, faRobot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApiFetch } from '../../auth/use-api-fetch';
import { useUser } from '../../contexts/UserContext';
import { ThoughtMessage } from './thought-message';
import type { CreateSessionResponse, Message } from './types';

const THINKING_ID = -1;
// Temp id for the user's own bubble shown immediately on send. The real
// persisted user message is loaded next time the session is reopened.
const PENDING_USER_ID = -2;

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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load messages for existing session
  useEffect(() => {
    setMessages([]);
    setError(null);

    if (sessionId === null || !Number.isFinite(sessionId)) {
      setLoading(false);
      return;
    }

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

  const removeThinker = () => {
    setMessages((prev) => prev.filter((m) => m.id !== THINKING_ID));
  };

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput('');
    setError(null);

    try {
      if (sessionId === null) {
        // First message: create session (normal POST, not SSE).
        // Show user bubble + Thinking immediately while waiting for LLM.
        const pendingUserMsg: Message = {
          id: PENDING_USER_ID,
          sessionId: 0,
          userName: user?.username || '',
          messageType: 1,
          isThought: 0,
          content,
          createdOn: '',
          createdBy: '',
        };
        const thinkingMsg: Message = {
          id: THINKING_ID,
          sessionId: 0,
          userName: 'ASSISTANT',
          messageType: 1,
          isThought: 0,
          content: null,
          createdOn: '',
          createdBy: '',
        };
        setMessages([pendingUserMsg, thinkingMsg]);

        const res = await apiFetch('/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        const data: CreateSessionResponse = await res.json();
        // Replace temp messages with real ones from server
        setMessages(data.messages);
        navigate(`/chat/${data.session.id}`, { replace: true });
        setSending(false);
        // Refocus textarea for next message
        inputRef.current?.focus();
      } else {
        // Subsequent messages: use SSE.
        // Append the user's bubble immediately so they see their own message,
        // then a "Thinking..." placeholder while waiting for the LLM.
        const pendingUserMsg: Message = {
          id: PENDING_USER_ID,
          sessionId,
          userName: user?.username || '',
          messageType: 1,
          isThought: 0,
          content,
          createdOn: '',
          createdBy: '',
        };
        const thinkingMsg: Message = {
          id: THINKING_ID,
          sessionId,
          userName: 'ASSISTANT',
          messageType: 1,
          isThought: 0,
          content: null,
          createdOn: '',
          createdBy: '',
        };
        setMessages((prev) => [...prev, pendingUserMsg, thinkingMsg]);

        const url = `/api/sessions/${sessionId}/messages`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (user) {
          headers['X-User-Name'] = user.username;
          if (user.role) {
            headers['X-User-Role'] = user.role;
          }
        }

        await fetchEventSource(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ content }),
          onmessage(ev) {
            if (ev.event === 'thought_created' || ev.event === 'message_created') {
              try {
                const msg: Message = JSON.parse(ev.data);
                setMessages((prev) =>
                  prev.filter((m) => m.id !== THINKING_ID).concat(msg)
                );
              } catch {
                // ignore parse errors
              }
            } else if (ev.event === 'error') {
              try {
                const errData = JSON.parse(ev.data);
                setError(errData.message || 'LLM call failed');
              } catch {
                setError('LLM call failed');
              }
              removeThinker();
            }
          },
          onerror(err) {
            setError(
              err instanceof Error ? err.message : 'Connection failed'
            );
            removeThinker();
            setSending(false);
            throw err; // stop retries
          },
          onclose() {
            removeThinker();
            setSending(false);
            // Refocus textarea for next message
            inputRef.current?.focus();
          },
        });

        // fetchEventSource resolves when stream ends
        removeThinker();
        setSending(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setInput(content);
      removeThinker();
      setSending(false);
    }
  }, [input, sending, sessionId, apiFetch, navigate, user]);

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
          // "Thinking..." placeholder
          if (msg.id === THINKING_ID) {
            return (
              <div key="thinking" className="chat-thinking">
                <span className="chat-thinking-spinner" />
                <span>Thinking...</span>
              </div>
            );
          }
          // Thought messages render as a collapsible note
          if (msg.isThought === 1) {
            return <ThoughtMessage key={msg.id} content={msg.content} />;
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
                  style={{ background: 'transparent', padding: 0, fontSize: '13px' }}
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
          ref={inputRef}
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
