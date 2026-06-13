import { faPaperPlane, faRobot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApiFetch } from '../../auth/use-api-fetch';
import { useUser } from '../../contexts/UserContext';
import { executeClientTool } from './client-tool-executor';
import { clearToolArea } from './tool-area-bridge';
import { ToolArea } from './tool-area';
import { ThoughtMessage } from './thought-message';
import type { Message, Session } from './types';

const THINKING_ID = -1;
// Optimistic user bubbles use unique negative ids starting at -2, decrementing
// per send. The server never echoes the user message back over SSE, so these
// bubbles persist for the session's lifetime; a fixed id would collide (two
// React children with the same key) once a second message is sent. The real
// persisted user message is loaded next time the session is reopened.
const FIRST_PENDING_USER_ID = -2;

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
  // Name of the Client Tool currently executing in the browser, or null.
  // Shown as a status indicator while the agent loop is suspended.
  const [pendingClientTool, setPendingClientTool] = useState<string | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Next id to assign to an optimistic user bubble; decrements per send so each
  // bubble has a unique (negative) React key.
  const nextPendingUserIdRef = useRef(FIRST_PENDING_USER_ID);
  // Set right before navigating to /chat/{id} for a session we just created
  // in-memory. It tells the load effect to skip the clear+refetch for that one
  // navigation, so the messages already on screen (the optimistic user bubble
  // and the SSE-streamed reply) stay put — no blank/Loading flicker.
  const skipReloadRef = useRef(false);

  // Load messages for existing session
  useEffect(() => {
    // We just created this session in-memory and navigated here; the messages
    // are already on screen. Skip the clear+refetch once to avoid a flicker.
    if (skipReloadRef.current) {
      skipReloadRef.current = false;
      setLoading(false);
      return;
    }

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

  // Append the user's bubble + a "Thinking..." placeholder, then open the SSE
  // stream for one assistant turn. Used identically for the first message of a
  // new session and for every subsequent message.
  //
  // The turn may suspend on a Client Tool: the server pushes a `client_call`
  // event and ends the stream. We execute the tool in the browser, POST the
  // result to /client-result (which streams the continuation), and keep
  // consuming until the turn ends without suspending.
  const streamMessage = useCallback(
    async (sid: number, content: string) => {
      const pendingUserMsg: Message = {
        id: nextPendingUserIdRef.current--,
        sessionId: sid,
        userName: user?.username || '',
        messageType: 1,
        isThought: 0,
        content,
        createdOn: '',
        createdBy: '',
      };
      const thinkingMsg: Message = {
        id: THINKING_ID,
        sessionId: sid,
        userName: 'ASSISTANT',
        messageType: 1,
        isThought: 0,
        content: null,
        createdOn: '',
        createdBy: '',
      };
      setMessages((prev) => [...prev, pendingUserMsg, thinkingMsg]);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (user) {
        headers['X-User-Name'] = user.username;
        if (user.role) {
          headers['X-User-Role'] = user.role;
        }
      }

      // Consume one SSE stream. Resolves with the pending client_call (if the
      // turn suspended) or null (if it ended normally / errored).
      type ClientCall = { callId: string; toolName: string; params: unknown };
      const consume = (url: string, body: string): Promise<ClientCall | null> => {
        let clientCall: ClientCall | null = null;
        return fetchEventSource(url, {
          method: 'POST',
          headers,
          body,
          onmessage(ev) {
            if (
              ev.event === 'thought_created' ||
              ev.event === 'message_created'
            ) {
              try {
                const msg: Message = JSON.parse(ev.data);
                setMessages((prev) =>
                  prev.filter((m) => m.id !== THINKING_ID).concat(msg)
                );
              } catch {
                // ignore parse errors
              }
            } else if (ev.event === 'client_call') {
              try {
                clientCall = JSON.parse(ev.data) as ClientCall;
              } catch {
                setError('Malformed client_call event');
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
            // `done` (duplicate resume) carries no payload; just let it close.
          },
          onerror(err) {
            setError(err instanceof Error ? err.message : 'Connection failed');
            removeThinker();
            throw err; // stop retries
          },
        }).then(() => clientCall);
      };

      // Drive the turn, resuming across each Client Tool suspension.
      let clientCall = await consume(
        `/api/sessions/${sid}/messages`,
        JSON.stringify({ content })
      );
      while (clientCall) {
        const { callId, toolName, params } = clientCall;
        setPendingClientTool(toolName);
        // Execute the tool in the browser; never throws (errors are captured).
        const outcome = await executeClientTool(toolName, params);
        setPendingClientTool(null);
        // Show a fresh "Thinking..." placeholder while the loop resumes.
        setMessages((prev) =>
          prev.filter((m) => m.id !== THINKING_ID).concat(thinkingMsg)
        );
        clientCall = await consume(
          `/api/sessions/${sid}/client-result`,
          JSON.stringify({ callId, ...outcome })
        );
      }

      // Stream(s) ended without suspending.
      removeThinker();
    },
    [user]
  );

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput('');
    setError(null);

    try {
      let sid = sessionId;
      if (sid === null) {
        // First message: create the empty session (plain POST), then stream
        // the message through the exact same SSE path as every other message.
        const res = await apiFetch('/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
        const session: Session = await res.json();
        sid = session.id;
        // Skip the load effect's clear+refetch for this navigation so the
        // about-to-be-streamed messages aren't wiped (no flicker).
        skipReloadRef.current = true;
        navigate(`/chat/${sid}`, { replace: true });
      }

      await streamMessage(sid, content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setInput(content);
      removeThinker();
      // Safety net: if the turn errored while a Client Tool UI was open, don't
      // leave the Tool Area stuck — collapse it.
      clearToolArea();
      setPendingClientTool(null);
    } finally {
      setSending(false);
      // Refocus textarea for next message
      inputRef.current?.focus();
    }
  }, [input, sending, sessionId, apiFetch, navigate, streamMessage]);

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
      <div className="chat-layout">
        <section className="chat-container" aria-busy="true">
          <div className="chat-loading">Loading…</div>
        </section>
        <ToolArea />
      </div>
    );
  }

  return (
    <div className="chat-layout">
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

        {messages.map((msg, index) => {
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
            // A thought should only be expanded if there are NO messages after it
            // (i.e., it's the last message in the list, regardless of type)
            const isLastMessage = index === messages.length - 1;
            return (
              <ThoughtMessage
                key={msg.id}
                content={msg.content}
                defaultExpanded={isLastMessage}
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

      {pendingClientTool && (
        <p className="chat-client-tool-status" role="status">
          <span className="chat-thinking-spinner" />
          <span>Executing client tool: {pendingClientTool}…</span>
        </p>
      )}

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
      <ToolArea />
    </div>
  );
}
