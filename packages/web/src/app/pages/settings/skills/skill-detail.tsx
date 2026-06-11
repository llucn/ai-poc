import { useCallback, useEffect, useState } from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';
import { ConfirmDeleteDialog } from '../../../components/confirm-delete-dialog';
import type { Skill } from './types';

export function SkillDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;

  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadSkill = useCallback(async () => {
    if (id === null) {
      setError('Invalid skill id');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch(`/skills/${id}`);
      const data: Skill = await res.json();
      setSkill(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skill');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, id]);

  useEffect(() => {
    loadSkill();
  }, [loadSkill]);

  const onDelete = useCallback(async () => {
    if (id === null) return;
    setBusy(true);
    try {
      await apiFetch('/skills', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      navigate('/settings/skills');
    } finally {
      setBusy(false);
    }
  }, [apiFetch, id, navigate]);

  if (loading) {
    return (
      <section className="ic-page" aria-busy="true">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Loading…</h1>
        </header>
      </section>
    );
  }

  if (error || !skill) {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Skill not found</h1>
        </header>
        <p>
          <Link to="/settings/skills">Back to list</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to="/settings/skills" />
          <h1 className="ic-page-title">Skill #{skill.id}</h1>
        </div>
        <div className="ic-page-actions">
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={() => navigate(`/settings/skills/${skill.id}/edit`)}
          >
            Edit
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => setDialogOpen(true)}
          >
            - Delete
          </button>
        </div>
      </header>

      <dl className="profile-grid">
        <dt>ID</dt>
        <dd>#{skill.id}</dd>
        <dt>Name</dt>
        <dd>{skill.name}</dd>
        <dt>Description</dt>
        <dd>{skill.description || '—'}</dd>
        <dt>Used By</dt>
        <dd>{skill.agentCount} agent(s)</dd>
      </dl>

      <section className="ic-section">
        <div className="ic-section-header">
          <h2 className="ic-section-title">Content</h2>
        </div>
        {skill.content ? (
          <div className="ic-markdown-content" data-color-mode="light">
            <MarkdownPreview source={skill.content} />
          </div>
        ) : (
          <p className="ic-field-hint">No content.</p>
        )}
      </section>

      {dialogOpen && (
        <ConfirmDeleteDialog
          busy={busy}
          message={
            skill.agentCount > 0
              ? `Delete skill? Used by ${skill.agentCount} agent(s); they will lose this skill.`
              : 'Delete skill?'
          }
          onCancel={() => {
            if (!busy) setDialogOpen(false);
          }}
          onConfirm={onDelete}
        />
      )}
    </section>
  );
}
