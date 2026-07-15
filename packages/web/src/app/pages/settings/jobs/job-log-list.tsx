import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';
import type { JobLog } from './types';

export function JobLogListPage() {
  const { id } = useParams<{ id: string }>();
  const apiFetch = useApiFetch();
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/jobs/${id}/logs`);
        setLogs(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load logs');
      } finally {
        setLoading(false);
      }
    })();
  }, [apiFetch, id]);

  const statusIcon = (status: number | null) => {
    if (status === 0) return '✓';
    if (status === -1) return '✗';
    if (status === 1) return '⟳';
    return '—';
  };

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to={`/settings/jobs/${id}`} />
          <h1 className="ic-page-title">All Job Logs</h1>
        </div>
      </header>
      <div className="ic-table-wrap">
        <table className="ic-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="ic-table-empty" colSpan={3}>Loading...</td></tr>}
            {error && <tr><td className="ic-table-empty" colSpan={3} role="alert">{error}</td></tr>}
            {!loading && !error && logs.length === 0 && (
              <tr><td className="ic-table-empty" colSpan={3}>No logs.</td></tr>
            )}
            {!loading && !error && logs.map(log => (
              <tr key={log.id}>
                <td><Link to={`/settings/jobs/${id}/logs/${log.id}`}>#{log.id}</Link></td>
                <td>{new Date(log.createdOn).toLocaleString()}</td>
                <td>{statusIcon(log.jobStatus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
