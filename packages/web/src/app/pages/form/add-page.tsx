import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, useApiFetch } from '../../auth/use-api-fetch';
import { BackButton } from '../issue-category/back-button';
import type { FormConflictResponse } from './types';
import { useFormExistsCheck } from './use-form-exists-check';

export function FormAddPage() {
  const navigate = useNavigate();
  const apiFetch = useApiFetch();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverDup, setServerDup] = useState<string | null>(null);

  const nameTrimmed = name.trim();
  const nameCheck = useFormExistsCheck(name);
  const nameDup = nameCheck.exists === true || (serverDup !== null && serverDup === nameTrimmed);

  const saveDisabled = submitting || nameTrimmed === '' || nameDup || nameCheck.checking;

  const doSave = async (designAfter: boolean) => {
    if (saveDisabled) return;
    setSubmitting(true);
    setSubmitError(null);
    setServerDup(null);
    try {
      const res = await apiFetch('/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameTrimmed,
          description: description.trim() || null,
        }),
      });
      const created = await res.json();
      if (designAfter) {
        navigate(`/settings/form/${created.id}/design?from=detail`);
      } else {
        navigate('/settings/form');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const body = err.body as Partial<FormConflictResponse> | undefined;
        if (body?.field === 'name') {
          setServerDup(body.value ?? nameTrimmed);
        } else {
          setSubmitError('A form with that name already exists.');
        }
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

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to="/settings/form" />
          <h1 className="ic-page-title">Add Form</h1>
        </div>
      </header>
      <form className="ic-form" onSubmit={onSubmit} noValidate>
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
            onClick={() => navigate('/settings/form')} disabled={submitting}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
