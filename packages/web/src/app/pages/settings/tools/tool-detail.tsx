import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';
import { ConfirmDeleteDialog } from '../../../components/confirm-delete-dialog';
import type { Tool } from './types';

export function ToolDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;

  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadTool = useCallback(async () => {
    if (id === null) {
      setError('Invalid tool id');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch(`/tools/${id}`);
      const data: Tool = await res.json();
      setTool(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tool');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, id]);

  useEffect(() => {
    loadTool();
  }, [loadTool]);

  const onDelete = useCallback(async () => {
    if (id === null) return;
    setBusy(true);
    try {
      await apiFetch('/tools', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      navigate('/settings/tools');
    } finally {
      setBusy(false);
    }
  }, [apiFetch, id, navigate]);

  if (loading) {
    return (
      <section className="ic-page" aria-busy="true">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Loading…</h1>
        </header>
      </section>
    );
  }

  if (error || !tool) {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Tool not found</h1>
        </header>
        <p>
          <Link to="/settings/tools">Back to list</Link>
        </p>
      </section>
    );
  }

  const schema = tool.mcpSchema ?? [];

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to="/settings/tools" />
          <h1 className="ic-page-title">Tool #{tool.id}</h1>
        </div>
        <div className="ic-page-actions">
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={() => navigate(`/settings/tools/${tool.id}/edit`)}
          >
            Edit
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => setDialogOpen(true)}
          >
            - Delete
          </button>
        </div>
      </header>

      <dl className="profile-grid">
        <dt>ID</dt>
        <dd>#{tool.id}</dd>
        <dt>Server Name</dt>
        <dd>{tool.serverName}</dd>
        <dt>URL</dt>
        <dd>{tool.serverUrl}</dd>
        <dt>Used By</dt>
        <dd>{tool.agentCount} agent(s)</dd>
      </dl>

      <section className="ic-section">
        <div className="ic-section-header">
          <h2 className="ic-section-title">Tools ({schema.length})</h2>
        </div>
        <div className="ic-table-wrap">
          <table className="ic-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Parameters</th>
              </tr>
            </thead>
            <tbody>
              {schema.length === 0 ? (
                <tr>
                  <td className="ic-table-empty" colSpan={3}>
                    No tools found on this server.
                  </td>
                </tr>
              ) : (
                schema.map((t, idx) => (
                  <tr key={`${t.name}-${idx}`}>
                    <td>{t.name}</td>
                    <td>{t.description || '—'}</td>
                    <td>
                      {t.parameters ? (
                        <pre className="ic-code-block">
                          {JSON.stringify(t.parameters, null, 2)}
                        </pre>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {dialogOpen && (
        <ConfirmDeleteDialog
          busy={busy}
          message={
            tool.agentCount > 0
              ? `Delete tool? Used by ${tool.agentCount} agent(s); they will lose this tool.`
              : 'Delete tool?'
          }
          onCancel={() => {
            if (!busy) setDialogOpen(false);
          }}
          onConfirm={onDelete}
        />
      )}
    </section>
  );
}
