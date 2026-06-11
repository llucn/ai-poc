import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { ConfirmDeleteDialog } from '../../../components/confirm-delete-dialog';
import type { Skill } from './types';

const PAGE_SIZE = 20;

export function AllSkillsPage() {
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const [skills, setSkills] = useState<Skill[]>([]);
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

  const loadSkills = useCallback(
    async (pageNum: number) => {
      try {
        setLoading(true);
        const response = await apiFetch(
          `/skills?page=${pageNum}&pageSize=${PAGE_SIZE}`
        );
        const data = await response.json();
        setSkills(data.data || []);
        setTotalPages(data.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load skills');
      } finally {
        setLoading(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    loadSkills(page);
  }, [loadSkills, page]);

  const allSelected = skills.length > 0 && selected.size === skills.length;
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
      prev.size === skills.length ? new Set() : new Set(skills.map((s) => s.id))
    );
  }, [skills]);

  const affectedAgents = useMemo(
    () =>
      skills
        .filter((s) => selected.has(s.id))
        .reduce((sum, s) => sum + (s.agentCount || 0), 0),
    [skills, selected]
  );

  const onDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch('/skills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      setDialogOpen(false);
      await loadSkills(page);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }, [apiFetch, loadSkills, selected, page]);

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={4}>
            Loading…
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={4} role="alert">
            {error}
          </td>
        </tr>
      );
    }
    if (skills.length === 0) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={4}>
            No skills yet.
          </td>
        </tr>
      );
    }
    return skills.map((skill) => (
      <tr key={skill.id}>
        <td className="ic-col-check">
          <input
            type="checkbox"
            aria-label={`Select skill ${skill.name}`}
            checked={selected.has(skill.id)}
            onChange={() => toggleRow(skill.id)}
          />
        </td>
        <td className="ic-col-id">#{skill.id}</td>
        <td>
          <Link to={`/settings/skills/${skill.id}`}>{skill.name}</Link>
        </td>
        <td>{skill.description || '—'}</td>
      </tr>
    ));
  }, [skills, selected, loading, error, toggleRow]);

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <h1 className="ic-page-title">Skills</h1>
        <div className="ic-page-actions">
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={() => navigate('/settings/skills/new')}
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
                  disabled={skills.length === 0}
                />
              </th>
              <th className="ic-col-id">ID</th>
              <th>Name</th>
              <th>Description</th>
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
              ? `Delete skill? Used by ${affectedAgents} agent association(s); they will lose this skill.`
              : 'Delete skill?'
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
