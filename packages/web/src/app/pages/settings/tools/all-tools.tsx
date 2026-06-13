import { useCallback, useEffect, useMemo, useState } from 'react';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate } from 'react-router-dom';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { ConfirmDeleteDialog } from '../../../components/confirm-delete-dialog';
import type { Tool } from './types';

const PAGE_SIZE = 20;

export function AllToolsPage() {
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ReadonlySet<number>>(
    () => new Set<number>()
  );
  // Per-tool online status: undefined=checking, true=online, false=offline.
  const [onlineStatus, setOnlineStatus] = useState<Record<number, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadTools = useCallback(
    async (pageNum: number) => {
      try {
        setLoading(true);
        const response = await apiFetch(
          `/tools?page=${pageNum}&pageSize=${PAGE_SIZE}`
        );
        const data = await response.json();
        setTools(data.data || []);
        setTotalPages(data.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tools');
      } finally {
        setLoading(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    loadTools(page);
  }, [loadTools, page]);

  // Probe each MCP tool's server reachability for the Status column. Client
  // tools run in the browser and have no server to probe (shown as N/A).
  const checkOnlineStatus = useCallback(
    async (toolList: Tool[]) => {
      const mcpTools = toolList.filter((t) => t.kind !== 'client');
      const entries = await Promise.all(
        mcpTools.map(async (t) => {
          try {
            const res = await apiFetch('/tools/test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ serverUrl: t.serverUrl }),
            });
            await res.json();
            return [t.id, true] as const;
          } catch {
            return [t.id, false] as const;
          }
        })
      );
      setOnlineStatus(Object.fromEntries(entries));
    },
    [apiFetch]
  );

  // Refresh online status whenever the tool list changes.
  useEffect(() => {
    setOnlineStatus({});
    if (tools.length > 0) {
      checkOnlineStatus(tools);
    }
  }, [tools, checkOnlineStatus]);

  const allSelected = tools.length > 0 && selected.size === tools.length;
  const noneSelected = selected.size === 0;

  const toggleRow = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === tools.length ? new Set() : new Set(tools.map((t) => t.id))
    );
  }, [tools]);

  // Total agent associations affected by the current selection.
  const affectedAgents = useMemo(
    () =>
      tools
        .filter((t) => selected.has(t.id))
        .reduce((sum, t) => sum + (t.agentCount || 0), 0),
    [tools, selected]
  );

  const onDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch('/tools', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      setDialogOpen(false);
      await loadTools(page);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }, [apiFetch, loadTools, selected, page]);

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={7}>
            Loading…
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={7} role="alert">
            {error}
          </td>
        </tr>
      );
    }
    if (tools.length === 0) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={7}>
            No tools yet.
          </td>
        </tr>
      );
    }
    return tools.map((tool) => (
      <tr key={tool.id}>
        <td className="ic-col-check">
          <input
            type="checkbox"
            aria-label={`Select tool ${tool.serverName}`}
            checked={selected.has(tool.id)}
            onChange={() => toggleRow(tool.id)}
          />
        </td>
        <td className="ic-col-id">#{tool.id}</td>
        <td>
          <Link to={`/settings/tools/${tool.id}`}>{tool.serverName}</Link>
        </td>
        <td>
          <span
            className={`ic-badge ${
              tool.kind === 'client' ? 'ic-badge-green' : 'ic-badge-blue'
            }`}
          >
            {tool.kind === 'client' ? 'Client' : 'MCP'}
          </span>
        </td>
        <td className="ic-col-url">{tool.serverUrl || '—'}</td>
        <td>{tool.mcpSchema?.length ?? 0}</td>
        <td className="ic-col-icon">
          {tool.kind === 'client' ? (
            <span className="ic-field-hint" title="Browser tool — no server check">
              N/A
            </span>
          ) : onlineStatus[tool.id] === undefined ? (
            <span className="ic-field-hint">…</span>
          ) : onlineStatus[tool.id] ? (
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="ic-icon-yes"
              title="Online"
            />
          ) : (
            <FontAwesomeIcon
              icon={faCircleXmark}
              className="ic-icon-no"
              title="Offline"
            />
          )}
        </td>
      </tr>
    ));
  }, [tools, selected, loading, error, toggleRow, onlineStatus]);

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <h1 className="ic-page-title">Tools</h1>
        <div className="ic-page-actions">
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={() => navigate('/settings/tools/new')}
          >
            + Add
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => setDialogOpen(true)}
            disabled={noneSelected}
          >
            - Delete
          </button>
        </div>
      </header>

      {deleteError && (
        <p className="ic-error-block" role="alert">
          {deleteError}
        </p>
      )}

      <div className="ic-table-wrap">
        <table className="ic-table">
          <thead>
            <tr>
              <th className="ic-col-check">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={tools.length === 0}
                />
              </th>
              <th className="ic-col-id">ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>URL</th>
              <th>Tools</th>
              <th className="ic-col-icon">Status</th>
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="ic-pagination">
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span className="ic-pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      )}

      {dialogOpen && (
        <ConfirmDeleteDialog
          busy={deleting}
          message={
            affectedAgents > 0
              ? `Delete tool? Used by ${affectedAgents} agent association(s); they will lose this tool.`
              : 'Delete tool?'
          }
          onCancel={() => {
            if (!deleting) setDialogOpen(false);
          }}
          onConfirm={onDelete}
        />
      )}
    </section>
  );
}
