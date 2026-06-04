import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApiFetch } from '../../auth/use-api-fetch';
import { BackButton } from '../issue-category/back-button';
import { ConfirmDeleteDialog } from '../issue-category/confirm-delete-dialog';
import { useForm } from './use-form';

export function FormDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;
  const { state } = useForm(id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onDelete = useCallback(async () => {
    if (id === null) return;
    setDeleting(true);
    try {
      await apiFetch(`/forms/${id}`, { method: 'DELETE' });
      navigate('/settings/form');
    } catch {
      setDeleting(false);
    }
  }, [apiFetch, id, navigate]);

  if (state.kind === 'loading') {
    return (
      <section className="ic-page" aria-busy="true">
        <header className="ic-page-header"><h1 className="ic-page-title">Loading…</h1></header>
      </section>
    );
  }

  if (state.kind === 'not-found') {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header"><h1 className="ic-page-title">Form not found</h1></header>
        <p><Link to="/settings/form">Back to list</Link></p>
      </section>
    );
  }

  if (state.kind === 'error') {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header"><h1 className="ic-page-title">Error</h1></header>
        <p className="ic-error-block">{state.message}</p>
      </section>
    );
  }

  const { data } = state;
  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to="/settings/form" />
          <h1 className="ic-page-title">Form #{data.id}</h1>
        </div>
        <div className="ic-page-actions">
          <button type="button" className="ic-btn ic-btn-primary"
            onClick={() => navigate(`/settings/form/${data.id}/edit`)}>Edit</button>
          <button type="button" className="ic-btn ic-btn-secondary"
            onClick={() => setDialogOpen(true)}>- Delete</button>
          <button type="button" className="ic-btn ic-btn-primary"
            onClick={() => navigate(`/settings/form/${data.id}/design?from=detail`)}>Design</button>
        </div>
      </header>
      <dl className="profile-grid">
        <dt>ID</dt><dd>#{data.id}</dd>
        <dt>Name</dt><dd>{data.name}</dd>
        <dt>Description</dt><dd>{data.description ?? '—'}</dd>
      </dl>
      <div className="ic-audit-info" style={{ marginTop: 16, fontSize: 12, color: 'var(--text2)' }}>
        <p>Created: {new Date(data.createdOn).toLocaleString()} by {data.createdBy}</p>
        {data.updatedOn ? (
          <p>Updated: {new Date(data.updatedOn).toLocaleString()} by {data.updatedBy}</p>
        ) : (
          <p>Updated: —</p>
        )}
      </div>
      {dialogOpen && (
        <ConfirmDeleteDialog busy={deleting} message={`Delete Form #${data.id}?`}
          onCancel={() => { if (!deleting) setDialogOpen(false); }}
          onConfirm={onDelete} />
      )}
    </section>
  );
}
