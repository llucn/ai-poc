import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { ConfirmDeleteDialog } from '../../../components/confirm-delete-dialog';
import type { Job } from './types';

export function AllJobsPage() {
  const apiFetch = useApiFetch();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/jobs');
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const toggleRow = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev =>
      prev.size === jobs.length ? new Set() : new Set(jobs.map(j => j.id))
    );
  };

  const onDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch('/jobs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      setDialogOpen(false);
      await loadJobs();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }, [apiFetch, loadJobs, selected]);

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <h1 className="ic-page-title">All Jobs</h1>
        <div className="ic-page-actions">
          <Link to="/settings/jobs/new" className="ic-btn ic-btn-primary">+ Add</Link>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => setDialogOpen(true)}
            disabled={selected.size === 0}
          >
            - Delete
          </button>
        </div>
      </header>

      {deleteError && <p className="ic-error-block" role="alert">{deleteError}</p>}

      <div className="ic-table-wrap">
        <table className="ic-table">
          <thead>
            <tr>
              <th className="ic-col-check">
                <input type="checkbox" aria-label="Select all" checked={jobs.length > 0 && selected.size === jobs.length} onChange={toggleAll} disabled={jobs.length === 0} />
              </th>
              <th>Name</th>
              <th>Cron Expression</th>
              <th>Agent</th>
              <th>Logs</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="ic-table-empty" colSpan={5}>Loading...</td></tr>}
            {error && <tr><td className="ic-table-empty" colSpan={5} role="alert">{error}</td></tr>}
            {!loading && !error && jobs.length === 0 && (
              <tr><td className="ic-table-empty" colSpan={5}>No jobs.</td></tr>
            )}
            {!loading && !error && jobs.map(job => (
              <tr key={job.id}>
                <td className="ic-col-check">
                  <input type="checkbox" aria-label={`Select ${job.name}`} checked={selected.has(job.id)} onChange={() => toggleRow(job.id)} />
                </td>
                <td><Link to={`/settings/jobs/${job.id}`}>{job.name}</Link></td>
                <td>{job.cronExp || '—'}</td>
                <td>{job.agentName || '—'}</td>
                <td><Link to={`/settings/jobs/${job.id}/logs`}>View Logs</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialogOpen && (
        <ConfirmDeleteDialog
          busy={deleting}
          message="Delete selected jobs?"
          onCancel={() => { if (!deleting) setDialogOpen(false); }}
          onConfirm={onDelete}
        />
      )}
    </section>
  );
}
