import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';
import type { Job } from './types';

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testRunning, setTestRunning] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/jobs/${id}`);
        setJob(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    })();
  }, [apiFetch, id]);

  const handleTestRun = async () => {
    setTestRunning(true);
    try {
      const res = await apiFetch(`/jobs/${id}/test-run`, { method: 'POST' });
      const data = await res.json();
      if (data.logId) {
        navigate(`/settings/jobs/${id}/logs/${data.logId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test run failed');
    } finally {
      setTestRunning(false);
    }
  };

  if (loading) return <section className="ic-page"><p>Loading...</p></section>;
  if (error) return <section className="ic-page"><p className="ic-error-block">{error}</p></section>;
  if (!job) return null;

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to="/settings/jobs" />
          <h1 className="ic-page-title">Job #{job.id}</h1>
        </div>
        <div className="ic-page-actions">
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={handleTestRun}
            disabled={testRunning}
          >
            {testRunning ? 'Running...' : 'Test Run'}
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={() => navigate(`/settings/jobs/${id}/edit`)}
          >
            Edit
          </button>
          <Link to={`/settings/jobs/${id}/logs`} className="ic-btn ic-btn-secondary">Logs</Link>
        </div>
      </header>

      <dl className="profile-grid">
        <dt>ID</dt>
        <dd>#{job.id}</dd>
        <dt>Name</dt>
        <dd>{job.name}</dd>
        <dt>Agent</dt>
        <dd>{job.agentName || '—'}</dd>
        <dt>Cron Expression</dt>
        <dd>{job.cronExp || '—'}</dd>
        <dt>Created On</dt>
        <dd>{job.createdOn ? new Date(job.createdOn).toLocaleString() : '—'}</dd>
        <dt>Created By</dt>
        <dd>{job.createdBy}</dd>
        <dt>Updated On</dt>
        <dd>{job.updatedOn ? new Date(job.updatedOn).toLocaleString() : '—'}</dd>
        <dt>Updated By</dt>
        <dd>{job.updatedBy || '—'}</dd>
      </dl>

      <section className="ic-section">
        <div className="ic-section-header">
          <h2 className="ic-section-title">Job Detail</h2>
        </div>
        {job.jobDetail ? (
          <div className="ic-markdown-content">
            <MarkdownPreview source={job.jobDetail} />
          </div>
        ) : (
          <p className="ic-field-hint">No job detail.</p>
        )}
      </section>

      <section className="ic-section">
        <div className="ic-section-header">
          <h2 className="ic-section-title">Content</h2>
        </div>
        {job.content ? (
          <div className="ic-markdown-content">
            <MarkdownPreview source={job.content} />
          </div>
        ) : (
          <p className="ic-field-hint">No content.</p>
        )}
      </section>
    </section>
  );
}
