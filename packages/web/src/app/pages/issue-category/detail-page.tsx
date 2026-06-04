import { useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BackButton } from './back-button';
import { useIssueCategory } from './use-issue-category';

export function IssueCategoryDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;
  const { state } = useIssueCategory(id);

  const onEdit = useCallback(() => {
    if (id !== null) navigate(`/settings/issue-category/${id}/edit`);
  }, [id, navigate]);

  if (state.kind === 'loading') {
    return (
      <section className="ic-page" aria-busy="true">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Loading…</h1>
        </header>
      </section>
    );
  }

  if (state.kind === 'not-found') {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Category not found</h1>
        </header>
        <p>
          <Link to="/settings/issue-category">Back to list</Link>
        </p>
      </section>
    );
  }

  if (state.kind === 'error') {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Error</h1>
        </header>
        <p className="ic-error-block">{state.message}</p>
      </section>
    );
  }

  const { data } = state;
  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to="/settings/issue-category" />
          <h1 className="ic-page-title">Issue Category #{data.id}</h1>
        </div>
        <div className="ic-page-actions">
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={onEdit}
          >
            Edit
          </button>
        </div>
      </header>
      <dl className="profile-grid">
        <dt>ID</dt>
        <dd>#{data.id}</dd>
        <dt>Name</dt>
        <dd>{data.name}</dd>
        <dt>Display Name</dt>
        <dd>{data.displayName}</dd>
      </dl>
    </section>
  );
}
