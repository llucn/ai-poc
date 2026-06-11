import { FormEvent, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useNavigate } from 'react-router-dom';
import { ApiError, useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';
import { isKebabCase } from '../../../share/kebab-case';

export function AddSkillPage() {
  const navigate = useNavigate();
  const apiFetch = useApiFetch();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameDup, setNameDup] = useState(false);

  const nameTrimmed = name.trim();
  const nameValid = nameTrimmed === '' || isKebabCase(nameTrimmed);
  const saveDisabled = !nameTrimmed || !nameValid || submitting || nameDup;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveDisabled) return;
    setSubmitting(true);
    setError(null);
    setNameDup(false);
    try {
      await apiFetch('/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameTrimmed,
          description: description.trim() || null,
          content: content.trim() || null,
        }),
      });
      navigate('/settings/skills');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNameDup(true);
      } else {
        setError(err instanceof Error ? err.message : 'Save failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to="/settings/skills" />
          <h1 className="ic-page-title">Add Skill</h1>
        </div>
      </header>
      <form className="ic-form" onSubmit={onSubmit} noValidate>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="s-name">
            Name *
          </label>
          <input
            id="s-name"
            type="text"
            className={`ic-input${!nameValid || nameDup ? ' has-error' : ''}`}
            value={name}
            maxLength={255}
            onChange={(e) => {
              setName(e.target.value);
              if (nameDup) setNameDup(false);
            }}
            disabled={submitting}
            autoComplete="off"
            placeholder="e.g., write-email"
            required
          />
          {!nameValid && (
            <p className="ic-field-error" role="alert">
              Skill name must be kebab-case: lowercase letters, numbers, and
              hyphens only, not starting or ending with hyphen
            </p>
          )}
          {nameDup && (
            <p className="ic-field-error" role="alert">
              Skill name already exists
            </p>
          )}
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="s-desc">
            Description
          </label>
          <textarea
            id="s-desc"
            className="ic-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            rows={2}
          />
        </div>

        <div className="ic-field">
          <label className="ic-field-label">Content</label>
          <MDEditor
            value={content}
            onChange={(v) => setContent(v ?? '')}
            height={300}
            textareaProps={{ disabled: submitting }}
          />
        </div>

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
            {submitting ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => navigate('/settings/skills')}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
