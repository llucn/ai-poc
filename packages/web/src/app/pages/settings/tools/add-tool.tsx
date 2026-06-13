import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';
import { isKebabCase } from '../../../share/kebab-case';
import type { McpToolSchema, ToolKind } from './types';

export function AddToolPage() {
  const navigate = useNavigate();
  const apiFetch = useApiFetch();

  const [kind, setKind] = useState<ToolKind>('mcp');
  const [serverName, setServerName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [schemaText, setSchemaText] = useState('');
  const [tools, setTools] = useState<McpToolSchema[] | null>(null);
  const [tested, setTested] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameDup, setNameDup] = useState(false);

  const nameTrimmed = serverName.trim();
  const urlTrimmed = serverUrl.trim();
  const nameValid = nameTrimmed === '' || isKebabCase(nameTrimmed);
  const isClient = kind === 'client';

  // For client tools, validate the manually-entered schema JSON.
  const schemaTrimmed = schemaText.trim();
  let schemaValid = true;
  if (isClient && schemaTrimmed !== '') {
    try {
      const parsed = JSON.parse(schemaTrimmed);
      schemaValid = Array.isArray(parsed);
    } catch {
      schemaValid = false;
    }
  }

  const onTest = async () => {
    if (!urlTrimmed) return;
    setTesting(true);
    setError(null);
    try {
      const res = await apiFetch('/tools/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl: urlTrimmed }),
      });
      const data = await res.json();
      setTools(data.tools || []);
      setTested(true);
    } catch (err) {
      setTools(null);
      setTested(false);
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const busy = testing || saving;
  // MCP tools require a successful Test; client tools require valid schema JSON.
  const saveDisabled = isClient
    ? !nameTrimmed ||
      !nameValid ||
      !schemaTrimmed ||
      !schemaValid ||
      busy ||
      nameDup
    : !nameTrimmed || !nameValid || !urlTrimmed || !tested || busy || nameDup;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveDisabled) return;
    setSaving(true);
    setError(null);
    setNameDup(false);
    try {
      const body = isClient
        ? {
            serverName: nameTrimmed,
            kind: 'client',
            serverUrl: '',
            mcpSchema: JSON.parse(schemaTrimmed),
          }
        : { serverName: nameTrimmed, kind: 'mcp', serverUrl: urlTrimmed };
      await apiFetch('/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      navigate('/settings/tools');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNameDup(true);
      } else {
        setError(err instanceof Error ? err.message : 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to="/settings/tools" />
          <h1 className="ic-page-title">Add Tool</h1>
        </div>
      </header>
      <form className="ic-form" onSubmit={onSubmit} noValidate>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="t-kind">
            Type *
          </label>
          <select
            id="t-kind"
            className="ic-input"
            value={kind}
            onChange={(e) => setKind(e.target.value as ToolKind)}
            disabled={busy}
          >
            <option value="mcp">MCP Tool (server-side)</option>
            <option value="client">Client Tool (browser)</option>
          </select>
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="t-name">
            Server Name *
          </label>
          <input
            id="t-name"
            type="text"
            className={`ic-input${!nameValid || nameDup ? ' has-error' : ''}`}
            value={serverName}
            maxLength={255}
            onChange={(e) => {
              setServerName(e.target.value);
              if (nameDup) setNameDup(false);
            }}
            disabled={busy}
            autoComplete="off"
            placeholder="e.g., weather-service"
            required
          />
          {!nameValid && (
            <p className="ic-field-error" role="alert">
              Server name must be kebab-case: lowercase letters, numbers, and
              hyphens only, not starting or ending with hyphen
            </p>
          )}
          {nameDup && (
            <p className="ic-field-error" role="alert">
              Server name already exists
            </p>
          )}
        </div>

        {isClient ? (
          <div className="ic-field">
            <label className="ic-field-label" htmlFor="t-schema">
              Schema (JSON) *
            </label>
            <textarea
              id="t-schema"
              className={`ic-input ic-textarea${
                !schemaValid ? ' has-error' : ''
              }`}
              value={schemaText}
              onChange={(e) => setSchemaText(e.target.value)}
              disabled={busy}
              rows={10}
              placeholder={
                '[{"name":"my-tool","description":"...","parameters":{"type":"object","properties":{}}}]'
              }
            />
            <p className="ic-field-hint">
              Client Tools run in the browser and require no server connectivity
              test. Paste a JSON array of {'{ name, description, parameters }'}{' '}
              objects.
            </p>
            {!schemaValid && (
              <p className="ic-field-error" role="alert">
                Schema must be a valid JSON array
              </p>
            )}
          </div>
        ) : (
          <div className="ic-field">
            <label className="ic-field-label" htmlFor="t-url">
              URL *
            </label>
            <div className="ic-input-group">
              <input
                id="t-url"
                type="url"
                className="ic-input"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  setTested(false);
                }}
                disabled={busy}
                autoComplete="off"
                placeholder="https://mcp.example.com"
              />
              <button
                type="button"
                className="ic-btn ic-btn-secondary"
                onClick={onTest}
                disabled={!urlTrimmed || busy}
              >
                {testing ? 'Testing…' : 'Test'}
              </button>
            </div>
          </div>
        )}

        {!isClient && tested && tools && (
          <div className="ic-field">
            <label className="ic-field-label">Tools ({tools.length})</label>
            {tools.length === 0 ? (
              <p className="ic-field-hint">No tools found on this server.</p>
            ) : (
              <div className="ic-tag-list">
                {tools.map((t, idx) => (
                  <span className="ic-tag" key={`${t.name}-${idx}`}>
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="ic-error-block" role="alert">
            {error}
          </p>
        )}

        <div className="ic-form-actions">
          <button
            type="submit"
            className="ic-btn ic-btn-primary"
            disabled={saveDisabled}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => navigate('/settings/tools')}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
