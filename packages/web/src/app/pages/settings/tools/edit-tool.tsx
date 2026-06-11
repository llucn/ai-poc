import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError, useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';
import { isKebabCase } from '../../../share/kebab-case';
import type { McpToolSchema, Tool } from './types';

export function EditToolPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [serverName, setServerName] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [tools, setTools] = useState<McpToolSchema[] | null>(null);
  // In edit mode the stored URL is already validated; a URL change requires a
  // fresh Test before saving.
  const [tested, setTested] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameDup, setNameDup] = useState(false);

  useEffect(() => {
    if (id === null) {
      setLoadError('Invalid tool id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch(`/tools/${id}`)
      .then((res) => res.json())
      .then((data: Tool) => {
        if (cancelled) return;
        setServerName(data.serverName);
        setServerUrl(data.serverUrl);
        setOriginalUrl(data.serverUrl);
        setTools(data.mcpSchema ?? null);
        setLoadError(null);
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load tool'
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiFetch, id]);

  const nameTrimmed = serverName.trim();
  const urlTrimmed = serverUrl.trim();
  const nameValid = nameTrimmed === '' || isKebabCase(nameTrimmed);
  const urlChanged = urlTrimmed !== originalUrl;

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
  // Saving is allowed when the name is valid and, if the URL changed, a fresh
  // test has succeeded.
  const saveDisabled =
    !nameTrimmed ||
    !nameValid ||
    !urlTrimmed ||
    busy ||
    nameDup ||
    (urlChanged && !tested);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveDisabled || id === null) return;
    setSaving(true);
    setError(null);
    setNameDup(false);
    try {
      await apiFetch(`/tools/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverName: nameTrimmed, serverUrl: urlTrimmed }),
      });
      navigate(`/settings/tools/${id}`);
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

  if (loading) {
    return (
      <section className="ic-page" aria-busy="true">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Loading…</h1>
        </header>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header">
          <h1 className="ic-page-title">{loadError}</h1>
        </header>
      </section>
    );
  }

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to={`/settings/tools/${id}`} />
          <h1 className="ic-page-title">Edit Tool</h1>
        </div>
      </header>
      <form className="ic-form" onSubmit={onSubmit} noValidate>
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
                if (e.target.value.trim() !== originalUrl) setTested(false);
                else setTested(true);
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
          {urlChanged && !tested && (
            <p className="ic-field-hint">
              URL changed — press Test before saving.
            </p>
          )}
        </div>

        {tools && (
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
            onClick={() => navigate(`/settings/tools/${id}`)}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
