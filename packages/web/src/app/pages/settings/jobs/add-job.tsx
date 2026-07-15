import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';

interface Agent { id: number; name: string; }

export function AddJobPage() {
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const [name, setName] = useState('');
  const [agentId, setAgentId] = useState<number>(0);
  const [content, setContent] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/agents');
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setAgents(list);
        if (list.length > 0) setAgentId(list[0].id);
      } catch { /* ignore */ }
    })();
  }, [apiFetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch('/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, agentId, content }),
      });
      navigate('/settings/jobs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to="/settings/jobs" />
          <h1 className="ic-page-title">Add Job</h1>
        </div>
      </header>
      {error && <p className="ic-error-block" role="alert">{error}</p>}
      <form onSubmit={handleSubmit} className="ic-form">
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
          <button type="button" className="ic-btn ic-btn-secondary" onClick={() => navigate('/settings/jobs')}>Cancel</button>
          <button type="submit" className="ic-btn ic-btn-primary" disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Create'}</button>
        </div>
      </form>
    </section>
  );
}
