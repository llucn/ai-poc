import { useEffect, useState } from 'react';
import { useApiFetch } from '../../../auth/use-api-fetch';
import type { AgentTool } from './types';

type Props = {
  agentId: number;
  // IDs of tools already associated with this agent (pre-checked, disabled).
  linkedToolIds: number[];
  onSaved: () => void;
  onCancel: () => void;
};

// Modal to associate existing global Tools with an agent. Shows the full Tools
// list with checkboxes; confirming links the newly-checked tools. Already
// linked tools are pre-checked and disabled (unlink from the detail table).
export function McpServerDialog({
  agentId,
  linkedToolIds,
  onSaved,
  onCancel,
}: Props) {
  const apiFetch = useApiFetch();
  const linkedSet = new Set(linkedToolIds);

  const [tools, setTools] = useState<AgentTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checked, setChecked] = useState<ReadonlySet<number>>(
    () => new Set<number>()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch('/tools?page=1&pageSize=200')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setTools(data.data || []);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load tools'
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  const toggle = (id: number) => {
    if (linkedSet.has(id)) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSave = async () => {
    const toLink = Array.from(checked);
    if (toLink.length === 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      // Link each selected tool. The endpoint is idempotent.
      for (const toolId of toLink) {
        await apiFetch(`/agents/${agentId}/tools`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId }),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveDisabled = checked.size === 0 || saving;

  return (
    <div
      className="ic-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onCancel();
      }}
    >
      <div
        className="ic-modal ic-modal-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ic-mcp-title"
      >
        <h2 id="ic-mcp-title" className="ic-modal-title">
          Add Tools
        </h2>
        <div className="ic-modal-body">
          {loading ? (
            <p className="ic-field-hint">Loading…</p>
          ) : loadError ? (
            <p className="ic-error-block" role="alert">
              {loadError}
            </p>
          ) : tools.length === 0 ? (
            <p className="ic-field-hint">
              No tools available. Create one under the Tools menu first.
            </p>
          ) : (
            <div className="ic-table-wrap">
              <table className="ic-table">
                <thead>
                  <tr>
                    <th className="ic-col-check"></th>
                    <th className="ic-col-id">ID</th>
                    <th>Server Name</th>
                    <th>URL</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((tool) => {
                    const isLinked = linkedSet.has(tool.id);
                    return (
                      <tr key={tool.id}>
                        <td className="ic-col-check">
                          <input
                            type="checkbox"
                            aria-label={`Select ${tool.serverName}`}
                            checked={isLinked || checked.has(tool.id)}
                            disabled={isLinked || saving}
                            onChange={() => toggle(tool.id)}
                          />
                        </td>
                        <td className="ic-col-id">#{tool.id}</td>
                        <td>
                          {tool.serverName}
                          {isLinked && (
                            <span className="ic-field-hint"> (linked)</span>
                          )}
                        </td>
                        <td className="ic-col-url">{tool.serverUrl}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={onSave}
            disabled={saveDisabled}
          >
            {saving ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
