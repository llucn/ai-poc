import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError, useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';
import type { Agent, UpdateAgentDto } from './types';

export function EditAgentPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modelName, setModelName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isDefault, setIsDefault] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverNameDup, setServerNameDup] = useState(false);

  useEffect(() => {
    if (id === null) {
      setLoadError('Invalid agent id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch(`/agents/${id}`)
      .then((res) => res.json())
      .then((data: Agent) => {
        if (!cancelled) {
          setAgent(data);
          setName(data.name);
          setDescription(data.description || '');
          setModelName(data.modelConfig?.modelName || '');
          setBaseUrl(data.modelConfig?.baseUrl || '');
          setIsDefault(data.isDefault ?? 0);
          setLoadError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, apiFetch]);

  const nameTrimmed = name.trim();
  const saveDisabled =
    submitting || nameTrimmed === '' || serverNameDup || loading;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveDisabled || id === null) return;
    setSubmitting(true);
    setSubmitError(null);
    setServerNameDup(false);
    try {
      const dto: UpdateAgentDto = {
        name: nameTrimmed,
        description: description.trim() || null,
        modelConfig: {
          modelName: modelName.trim() || null,
          baseUrl: baseUrl.trim() || null,
          // Blank keeps the existing token (server preserves it); a typed
          // value replaces it.
          authToken: apiKey.trim() || null,
        },
        isDefault,
      };
      await apiFetch(`/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      navigate(`/settings/agents/${id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setServerNameDup(true);
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Save failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="ic-page" aria-busy="true">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Loading…</h1>
        </header>
      </section>
    );
  }

  if (loadError || !agent) {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Agent not found</h1>
        </header>
        <p>
          <button
            type="button"
            onClick={() => navigate('/settings/agents')}
            className="ic-btn"
          >
            Back to list
          </button>
        </p>
      </section>
    );
  }

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to={`/settings/agents/${id}`} />
          <h1 className="ic-page-title">Edit Agent #{id}</h1>
        </div>
      </header>
      <form className="ic-form" onSubmit={onSubmit} noValidate>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="a-name">
            Name *
          </label>
          <input
            id="a-name"
            type="text"
            className={`ic-input${serverNameDup ? ' has-error' : ''}`}
            value={name}
            maxLength={255}
            onChange={(e) => {
              setName(e.target.value);
              if (serverNameDup) setServerNameDup(false);
            }}
            disabled={submitting}
            autoComplete="off"
            required
          />
          {serverNameDup && (
            <p className="ic-field-error" role="alert">
              Already exists
            </p>
          )}
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="a-desc">
            Description
          </label>
          <textarea
            id="a-desc"
            className="ic-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            rows={3}
          />
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="a-model">
            Model Name
          </label>
          <input
            id="a-model"
            type="text"
            className="ic-input"
            value={modelName}
            maxLength={255}
            onChange={(e) => setModelName(e.target.value)}
            disabled={submitting}
            placeholder="e.g., gpt-4, claude-3-opus"
          />
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="a-baseurl">
            Base URL
          </label>
          <input
            id="a-baseurl"
            type="url"
            className="ic-input"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            disabled={submitting}
            placeholder="https://api.example.com/v1"
          />
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="a-apikey">
            API Key
          </label>
          <input
            id="a-apikey"
            type="password"
            className="ic-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={submitting}
            autoComplete="new-password"
            placeholder={
              agent.hasApiKey
                ? 'Leave blank to keep current key'
                : 'sk-...'
            }
          />
          <p className="ic-field-hint">
            {agent.hasApiKey
              ? 'An API key is set. Enter a new value to replace it, or leave blank to keep it.'
              : 'No API key set.'}
          </p>
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="a-default">
            Default
          </label>
          <select
            id="a-default"
            className="ic-input"
            value={isDefault ? '1' : '0'}
            onChange={(e) => setIsDefault(e.target.value === '1' ? 1 : 0)}
            disabled={submitting}
          >
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
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
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => navigate(`/settings/agents/${id}`)}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
