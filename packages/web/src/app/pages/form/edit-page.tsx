import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, useApiFetch } from '../../auth/use-api-fetch';
import { BackButton } from '../issue-category/back-button';
import type { FormConflictResponse } from './types';
import { useForm } from './use-form';
import { useFormExistsCheck } from './use-form-exists-check';

export function FormEditPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;
  const { state } = useForm(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverDup, setServerDup] = useState<string | null>(null);

  const original = state.kind === 'ready' ? state.data : null;

  useEffect(() => {
    if (!original) return;
    setName(original.name);
    setDescription(original.description ?? '');
  }, [original]);

  const nameTrimmed = name.trim();
  const nameCheck = useFormExistsCheck(name, { ignoreValue: original?.name });
  const nameDup = nameCheck.exists === true || (serverDup !== null && serverDup === nameTrimmed);

  const saveDisabled =
    submitting || original === null || nameTrimmed === '' || nameDup || nameCheck.checking;

  const doSave = async (designAfter: boolean) => {
    if (saveDisabled || id === null) return;
    setSubmitting(true);
    setSubmitError(null);
    setServerDup(null);
    try {
      await apiFetch(`/forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameTrimmed,
          description: description.trim() || null,
        }),
      });
      if (designAfter) {
        navigate(`/settings/form/${id}/design?from=detail`);
      } else {
        navigate(`/settings/form/${id}`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const body = err.body as Partial<FormConflictResponse> | undefined;
        if (body?.field === 'name') {
          setServerDup(body.value ?? nameTrimmed);
        } else {
          setSubmitError('A form with that name already exists.');
        }
      } else if (err instanceof ApiError && err.status === 404) {
        navigate('/settings/form');
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Save failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    doSave(false);
  };

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

  const data = state.data;
  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to={`/settings/form/${data.id}`} />
          <h1 className="ic-page-title">Edit Form #{data.id}</h1>
        </div>
      </header>
      <form className="ic-form" onSubmit={onSubmit} noValidate>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="f-id">ID</label>
          <input id="f-id" type="text" className="ic-input" value={`#${data.id}`} readOnly disabled />
        </div>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="f-name">Name</label>
          <input id="f-name" type="text" className={`ic-input${nameDup ? ' has-error' : ''}`}
            value={name} maxLength={255} onChange={(e) => { setName(e.target.value); if (serverDup) setServerDup(null); }}
            disabled={submitting} autoComplete="off" />
          {nameDup && <p className="ic-field-error" role="alert">Already exists</p>}
        </div>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="f-desc">Description</label>
          <textarea id="f-desc" className="ic-input" rows={3}
            value={description} onChange={(e) => setDescription(e.target.value)} disabled={submitting} />
        </div>
        {submitError && <p className="ic-error-block" role="alert">{submitError}</p>}
        <div className="ic-form-actions">
          <button type="submit" className="ic-btn ic-btn-primary" disabled={saveDisabled}>Save</button>
          <button type="button" className="ic-btn ic-btn-primary" disabled={saveDisabled}
            onClick={() => doSave(true)}>Save &amp; Design</button>
          <button type="button" className="ic-btn ic-btn-secondary"
            onClick={() => navigate(`/settings/form/${id}`)} disabled={submitting}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
