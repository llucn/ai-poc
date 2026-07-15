import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';

interface Agent { id: number; name: string; }

export function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const [name, setName] = useState('');
  const [agentId, setAgentId] = useState<number>(0);
  const [content, setContent] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [jobRes, agentsRes] = await Promise.all([
          apiFetch(`/jobs/${id}`),
          apiFetch('/agents'),
        ]);
        const job = await jobRes.json();
        const agentData = await agentsRes.json();
        const list = Array.isArray(agentData) ? agentData : agentData.data || [];
        setAgents(list);
        setName(job.name);
        setAgentId(job.agentId);
        setContent(job.content || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [apiFetch, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, agentId, content }),
      });
      navigate(`/settings/jobs/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <section className="ic-page"><p>Loading...</p></section>;

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to={`/settings/jobs/${id}`} />
          <h1 className="ic-page-title">Edit Job #{id}</h1>
        </div>
      </header>
      {error && <p className="ic-error-block" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="ic-form">
        <div className="ic-field">
          <label className="ic-field-label">ID</label>
          <input type="text" className="ic-input" value={id} disabled />
        </div>
        <div className="ic-field">
          <label className="ic-field-label">Name</label>
          <input type="text" className="ic-input" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="ic-field">
          <label className="ic-field-label">Agent</label>
          <select className="ic-input" value={agentId} onChange={e => setAgentId(Number(e.target.value))}>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="ic-field">
          <label className="ic-field-label">Content</label>
          <textarea className="ic-input" rows={6} value={content} onChange={e => setContent(e.target.value)} />
        </div>
        <div className="ic-form-actions">
          <button type="button" className="ic-btn ic-btn-secondary" onClick={() => navigate(`/settings/jobs/${id}`)}>Cancel</button>
          <button type="submit" className="ic-btn ic-btn-primary" disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </section>
  );
}
