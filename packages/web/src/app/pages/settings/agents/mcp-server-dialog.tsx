import { useState } from 'react';
import { useApiFetch } from '../../../auth/use-api-fetch';
import type { McpServer, McpToolSchema } from './types';

type Props = {
  agentId: number;
  // When provided, the dialog is in edit mode for this server.
  server?: McpServer | null;
  onSaved: () => void;
  onCancel: () => void;
};

// Modal to register or edit an MCP server. The user enters a name and URL,
// presses Test to fetch the tool list, and Save persists once the test
// succeeds.
export function McpServerDialog({ agentId, server, onSaved, onCancel }: Props) {
  const apiFetch = useApiFetch();
  const isEdit = !!server;

  const [serverName, setServerName] = useState(server?.serverName ?? '');
  const [serverUrl, setServerUrl] = useState(server?.serverUrl ?? '');
  // Tools start populated in edit mode; a URL change requires a fresh Test.
  const [tools, setTools] = useState<McpToolSchema[] | null>(
    server?.mcpSchema ?? null
  );
  const [tested, setTested] = useState(isEdit);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameTrimmed = serverName.trim();
  const urlTrimmed = serverUrl.trim();

  const onTest = async () => {
    if (!urlTrimmed) return;
    setTesting(true);
    setError(null);
    try {
      const res = await apiFetch(`/agents/${agentId}/mcp-servers/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl: urlTrimmed }),
      });
      const data = await res.json();
      setTools(data.tools || []);
      setTested(true);
    } catch (err) {
      setTools(null);
      setTested(false);
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const onSave = async () => {
    if (!nameTrimmed || !urlTrimmed || !tested) return;
    setSaving(true);
    setError(null);
    try {
      const path = isEdit
        ? `/agents/${agentId}/mcp-servers/${server!.id}`
        : `/agents/${agentId}/mcp-servers`;
      await apiFetch(path, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName: nameTrimmed, serverUrl: urlTrimmed }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const busy = testing || saving;
  const saveDisabled = !nameTrimmed || !urlTrimmed || !tested || busy;

  return (
    <div
      className="ic-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="ic-modal ic-modal-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ic-mcp-title"
      >
        <h2 id="ic-mcp-title" className="ic-modal-title">
          Register MCP Server
        </h2>
        <div className="ic-modal-body">
          <div className="ic-field">
            <label className="ic-field-label" htmlFor="mcp-name">
              Server Name *
            </label>
            <input
              id="mcp-name"
              type="text"
              className="ic-input"
              value={serverName}
              maxLength={255}
              onChange={(e) => setServerName(e.target.value)}
              disabled={busy}
              autoComplete="off"
            />
          </div>

          <div className="ic-field">
            <label className="ic-field-label" htmlFor="mcp-url">
              URL *
            </label>
            <div className="ic-input-group">
              <input
                id="mcp-url"
                type="url"
                className="ic-input"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  // URL changed: require a fresh test before saving.
                  setTested(false);
                }}
                disabled={busy}
                autoComplete="off"
                placeholder="https://mcp.example.com"
              />
              <button
                type="button"
                className="ic-btn ic-btn-secondary"
                onClick={onTest}
                disabled={!urlTrimmed || busy}
              >
                {testing ? 'Testing…' : 'Test'}
              </button>
            </div>
          </div>

          {tested && tools && (
            <div className="ic-field">
              <label className="ic-field-label">
                Tools ({tools.length})
              </label>
              {tools.length === 0 ? (
                <p className="ic-field-hint">No tools found on this server.</p>
              ) : (
                <div className="ic-tag-list">
                  {tools.map((t, idx) => (
                    <span className="ic-tag" key={`${t.name}-${idx}`}>
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="ic-error-block" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="ic-modal-actions">
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={onSave}
            disabled={saveDisabled}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
