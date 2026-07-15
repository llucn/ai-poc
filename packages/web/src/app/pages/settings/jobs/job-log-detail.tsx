import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';
import type { JobLog } from './types';

export function JobLogDetailPage() {
  const { id, logId } = useParams<{ id: string; logId: string }>();
  const apiFetch = useApiFetch();
  const [log, setLog] = useState<JobLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`/jobs/${id}/logs/${logId}`);
        setLog(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load log');
      } finally {
        setLoading(false);
      }
    })();
  }, [apiFetch, id, logId]);

  const statusLabel = (status: number | null) => {
    if (status === 0) return 'Success';
    if (status === -1) return 'Failed';
    if (status === 1) return 'Running';
    return 'Unknown';
  };

  if (loading) return <section className="ic-page"><p>Loading...</p></section>;
  if (error) return <section className="ic-page"><p className="ic-error-block">{error}</p></section>;
  if (!log) return null;

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to={`/settings/jobs/${id}/logs`} />
          <h1 className="ic-page-title">Job Log #{log.id}</h1>
        </div>
      </header>

      <dl className="profile-grid">
        <dt>ID</dt>
        <dd>#{log.id}</dd>
        <dt>Status</dt>
        <dd>{statusLabel(log.jobStatus)}</dd>
        <dt>Created On</dt>
        <dd>{new Date(log.createdOn).toLocaleString()}</dd>
        <dt>Created By</dt>
        <dd>{log.createdBy}</dd>
        <dt>Updated On</dt>
        <dd>{log.updatedOn ? new Date(log.updatedOn).toLocaleString() : '—'}</dd>
      </dl>

      <section className="ic-section">
        <div className="ic-section-header">
          <h2 className="ic-section-title">Log</h2>
        </div>
        {log.jobLog ? (
          <div className="ic-markdown-content">
            <MarkdownPreview source={log.jobLog} />
          </div>
        ) : (
          <p className="ic-field-hint">No log content.</p>
        )}
      </section>
    </section>
  );
}
