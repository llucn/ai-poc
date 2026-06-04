import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, useApiFetch } from '../../auth/use-api-fetch';
import { BackButton } from '../issue-category/back-button';
import { PropertiesEditor } from './properties-editor';
import type { FieldConflictResponse, FieldType } from './types';
import { FIELD_TYPES } from './types';
import { useField } from './use-field';
import { useFieldExistsCheck } from './use-field-exists-check';

function defaultPropsForType(type: FieldType): Record<string, unknown> | null {
  switch (type) {
    case 'text-field': return { min_length: 0, max_length: 200 };
    case 'text-area': return { rows: 10 };
    case 'number': return { precision: 5, scale: 2 };
    case 'select': return { values: [{ label: '', value: '' }] };
    case 'radio': return { values: [{ label: '', value: '' }] };
    case 'checkbox': return { label: '' };
    case 'date': return { format: 'yyyy-MM-dd' };
    case 'datetime': return { format: 'yyyy-MM-dd HH:mm:ss' };
    case 'file': return { types: [] };
    default: return null;
  }
}

export function FieldEditPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;
  const { state } = useField(id);

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [required, setRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');
  const [type, setType] = useState<FieldType>('text-field');
  const [properties, setProperties] = useState<Record<string, unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverDup, setServerDup] = useState<string | null>(null);

  const original = state.kind === 'ready' ? state.data : null;

  useEffect(() => {
    if (!original) return;
    setName(original.name);
    setTitle(original.title);
    setDescription(original.description ?? '');
    setRequired(original.required);
    setDefaultValue(original.defaultValue ?? '');
    setType(original.type);
    setProperties(original.properties);
  }, [original]);

  const nameTrimmed = name.trim();
  const titleTrimmed = title.trim();
  const nameCheck = useFieldExistsCheck(name, { ignoreValue: original?.name });
  const nameDup = nameCheck.exists === true || (serverDup !== null && serverDup === nameTrimmed);

  const saveDisabled =
    submitting || original === null || nameTrimmed === '' || titleTrimmed === '' || nameDup || nameCheck.checking;

  const onTypeChange = useCallback((newType: FieldType) => {
    setType(newType);
    setProperties(defaultPropsForType(newType));
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveDisabled || id === null) return;
    setSubmitting(true);
    setSubmitError(null);
    setServerDup(null);
    try {
      await apiFetch(`/fields/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameTrimmed,
          title: titleTrimmed,
          description: description.trim() || null,
          required,
          defaultValue: defaultValue.trim() || null,
          type,
          properties,
        }),
      });
      navigate(`/settings/field/${id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const body = err.body as Partial<FieldConflictResponse> | undefined;
        if (body?.field === 'name') {
          setServerDup(body.value ?? nameTrimmed);
        } else {
          setSubmitError('A field with that name already exists.');
        }
      } else if (err instanceof ApiError && err.status === 404) {
        navigate('/settings/field');
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Save failed');
      }
    } finally {
      setSubmitting(false);
    }
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
        <header className="ic-page-header"><h1 className="ic-page-title">Field not found</h1></header>
        <p><Link to="/settings/field">Back to list</Link></p>
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
          <BackButton to={`/settings/field/${data.id}`} />
          <h1 className="ic-page-title">Edit Field #{data.id}</h1>
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
          <label className="ic-field-label" htmlFor="f-title">Title</label>
          <input id="f-title" type="text" className="ic-input"
            value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} disabled={submitting} />
        </div>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="f-desc">Description</label>
          <textarea id="f-desc" className="ic-input" rows={3}
            value={description} onChange={(e) => setDescription(e.target.value)} disabled={submitting} />
        </div>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="f-required">Required</label>
          <select id="f-required" className="ic-input" value={required ? '1' : '0'}
            onChange={(e) => setRequired(e.target.value === '1')} disabled={submitting}>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
        </div>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="f-default">Default Value</label>
          <input id="f-default" type="text" className="ic-input"
            value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)} disabled={submitting} />
        </div>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="f-type">Type</label>
          <select id="f-type" className="ic-input" value={type}
            onChange={(e) => onTypeChange(e.target.value as FieldType)} disabled={submitting}>
            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="ic-field">
          <label className="ic-field-label">Properties</label>
          <PropertiesEditor type={type} value={properties} onChange={setProperties} />
        </div>
        {submitError && <p className="ic-error-block" role="alert">{submitError}</p>}
        <div className="ic-form-actions">
          <button type="submit" className="ic-btn ic-btn-primary" disabled={saveDisabled}>Save</button>
          <button type="button" className="ic-btn ic-btn-secondary"
            onClick={() => navigate(`/settings/field/${id}`)} disabled={submitting}>Cancel</button>
        </div>
      </form>
    </section>
  );
}
