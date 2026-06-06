import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';
import type { CreateAgentDto } from './types';

export function AddAgentPage() {
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modelName, setModelName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isDefault, setIsDefault] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverNameDup, setServerNameDup] = useState(false);

  const nameTrimmed = name.trim();
  const saveDisabled = submitting || nameTrimmed === '' || serverNameDup;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveDisabled) return;
    setSubmitting(true);
    setSubmitError(null);
    setServerNameDup(false);
    try {
      const dto: CreateAgentDto = {
        name: nameTrimmed,
        description: description.trim() || null,
        modelConfig: {
          modelName: modelName.trim() || null,
          baseUrl: baseUrl.trim() || null,
          authToken: apiKey.trim() || null,
        },
        isDefault,
      };
      await apiFetch('/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });
      navigate('/settings/agents');
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

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to="/settings/agents" />
          <h1 className="ic-page-title">Add Agent</h1>
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
            placeholder="sk-..."
          />
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
            onClick={() => navigate('/settings/agents')}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
