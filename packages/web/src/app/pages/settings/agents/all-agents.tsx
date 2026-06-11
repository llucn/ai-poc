import { useCallback, useEffect, useMemo, useState } from 'react';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link, useNavigate } from 'react-router-dom';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { ConfirmDeleteDialog } from '../../../components/confirm-delete-dialog';
import type { Agent } from './types';

const PAGE_SIZE = 20;

export function AllAgentsPage() {
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ReadonlySet<number>>(
    () => new Set<number>()
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadAgents = useCallback(
    async (pageNum: number) => {
      try {
        setLoading(true);
        const response = await apiFetch(
          `/agents?page=${pageNum}&pageSize=${PAGE_SIZE}`
        );
        const data = await response.json();
        setAgents(data.data || []);
        setTotalPages(data.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    loadAgents(page);
  }, [loadAgents, page]);

  const allSelected = agents.length > 0 && selected.size === agents.length;
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
      prev.size === agents.length ? new Set() : new Set(agents.map((a) => a.id))
    );
  }, [agents]);

  const onDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch('/agents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      setDialogOpen(false);
      await loadAgents(page);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }, [apiFetch, loadAgents, selected, page]);

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={6}>
            Loading…
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={6} role="alert">
            {error}
          </td>
        </tr>
      );
    }
    if (agents.length === 0) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={6}>
            No agents yet.
          </td>
        </tr>
      );
    }
    return agents.map((agent) => (
      <tr key={agent.id}>
        <td className="ic-col-check">
          <input
            type="checkbox"
            aria-label={`Select agent ${agent.name}`}
            checked={selected.has(agent.id)}
            onChange={() => toggleRow(agent.id)}
          />
        </td>
        <td className="ic-col-id">#{agent.id}</td>
        <td>
          <Link to={`/settings/agents/${agent.id}`}>{agent.name}</Link>
        </td>
        <td>{agent.description || '—'}</td>
        <td>{agent.modelConfig?.modelName || '—'}</td>
        <td className="ic-col-icon">
          {agent.isDefault ? (
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="ic-icon-yes"
              title="Default agent"
            />
          ) : null}
        </td>
      </tr>
    ));
  }, [agents, selected, loading, error, toggleRow]);

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <h1 className="ic-page-title">All Agents</h1>
        <div className="ic-page-actions">
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={() => navigate('/settings/agents/new')}
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
                  disabled={agents.length === 0}
                />
              </th>
              <th className="ic-col-id">ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Model</th>
              <th className="ic-col-icon">Default</th>
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
          message="Delete Agents?"
          onCancel={() => {
            if (!deleting) setDialogOpen(false);
          }}
          onConfirm={onDelete}
        />
      )}
    </section>
  );
}
