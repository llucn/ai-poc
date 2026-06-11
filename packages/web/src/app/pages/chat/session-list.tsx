import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApiFetch } from '../../auth/use-api-fetch';
import { ConfirmDeleteDialog } from '../../components/confirm-delete-dialog';
import type { Session } from './types';

const PAGE_SIZE = 20;

export function SessionListPage() {
  const apiFetch = useApiFetch();
  const [sessions, setSessions] = useState<Session[]>([]);
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

  const loadSessions = useCallback(
    async (pageNum: number) => {
      try {
        setLoading(true);
        const response = await apiFetch(
          `/sessions?page=${pageNum}&pageSize=${PAGE_SIZE}`
        );
        const data = await response.json();
        setSessions(data.data || []);
        setTotalPages(data.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load sessions'
        );
      } finally {
        setLoading(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    loadSessions(page);
  }, [loadSessions, page]);

  const allSelected = sessions.length > 0 && selected.size === sessions.length;
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
      prev.size === sessions.length
        ? new Set()
        : new Set(sessions.map((s) => s.id))
    );
  }, [sessions]);

  const onDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch('/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      setDialogOpen(false);
      await loadSessions(page);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }, [apiFetch, loadSessions, selected, page]);

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={5}>
            Loading…
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={5} role="alert">
            {error}
          </td>
        </tr>
      );
    }
    if (sessions.length === 0) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={5}>
            No sessions yet.
          </td>
        </tr>
      );
    }
    return sessions.map((session) => (
      <tr key={session.id}>
        <td className="ic-col-check">
          <input
            type="checkbox"
            aria-label={`Select session ${session.name}`}
            checked={selected.has(session.id)}
            onChange={() => toggleRow(session.id)}
          />
        </td>
        <td>{formatTime(session.lastActivityTime)}</td>
        <td>{formatTime(session.createdOn)}</td>
        <td>
          <Link to={`/chat/${session.id}`}>{session.name}</Link>
        </td>
      </tr>
    ));
  }, [sessions, selected, loading, error, toggleRow]);

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <h1 className="ic-page-title">Sessions</h1>
        <div className="ic-page-actions">
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
                  disabled={sessions.length === 0}
                />
              </th>
              <th>Last Activity Time</th>
              <th>Create Time</th>
              <th>Name</th>
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
          message="Delete sessions?"
          onCancel={() => {
            if (!deleting) setDialogOpen(false);
          }}
          onConfirm={onDelete}
        />
      )}
    </section>
  );
}
