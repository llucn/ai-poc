import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, useApiFetch } from '../../auth/use-api-fetch';
import { BackButton } from './back-button';
import type { ConflictResponse, IssueCategoryDto } from './types';
import { useExistsCheck } from './use-exists-check';
import { useIssueCategory } from './use-issue-category';

export function IssueCategoryEditPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;
  const { state } = useIssueCategory(id);

  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverDup, setServerDup] = useState<string | null>(null);

  const original =
    state.kind === 'ready' ? state.data : null;

  useEffect(() => {
    if (original) setDisplayName(original.displayName);
  }, [original]);

  const displayNameTrimmed = displayName.trim();
  const displayNameCheck = useExistsCheck('displayName', displayName, {
    ignoreValue: original?.displayName,
  });

  const displayNameDup =
    displayNameCheck.exists === true ||
    (serverDup !== null && serverDup === displayNameTrimmed);

  const saveDisabled =
    submitting ||
    original === null ||
    displayNameTrimmed === '' ||
    displayNameDup ||
    displayNameCheck.checking;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveDisabled || id === null) return;
    setSubmitting(true);
    setSubmitError(null);
    setServerDup(null);
    try {
      await apiFetch(`/issue-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayNameTrimmed }),
      });
      navigate(`/settings/issue-category/${id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const body = err.body as Partial<ConflictResponse> | undefined;
        if (body?.field === 'displayName') {
          setServerDup(body.value ?? displayNameTrimmed);
        } else {
          setSubmitError('That display name is already taken.');
        }
      } else if (err instanceof ApiError && err.status === 404) {
        navigate('/settings/issue-category');
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Save failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = () => {
    if (id !== null) navigate(`/settings/issue-category/${id}`);
    else navigate('/settings/issue-category');
  };

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

  const data: IssueCategoryDto = state.data;
  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to={`/settings/issue-category/${data.id}`} />
          <h1 className="ic-page-title">Edit Category #{data.id}</h1>
        </div>
      </header>
      <form className="ic-form" onSubmit={onSubmit} noValidate>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="ic-edit-id">
            ID
          </label>
          <input
            id="ic-edit-id"
            type="text"
            className="ic-input"
            value={`#${data.id}`}
            readOnly
            disabled
          />
        </div>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="ic-edit-name">
            Name
          </label>
          <input
            id="ic-edit-name"
            type="text"
            className="ic-input"
            value={data.name}
            readOnly
            disabled
          />
        </div>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="ic-edit-display-name">
            Display Name
          </label>
          <input
            id="ic-edit-display-name"
            type="text"
            className={`ic-input${displayNameDup ? ' has-error' : ''}`}
            value={displayName}
            maxLength={255}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (serverDup !== null) setServerDup(null);
            }}
            disabled={submitting}
            autoComplete="off"
          />
          {displayNameDup && (
            <p className="ic-field-error" role="alert">
              Already exists
            </p>
          )}
        </div>
        {submitError && (
          <p className="ic-error-block" role="alert">
            {submitError}
          </p>
        )}
        <div className="ic-form-actions">
          <button
            type="submit"
            className="ic-btn ic-btn-primary"
            disabled={saveDisabled}
          >
            Save
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
