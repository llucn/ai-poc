import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError, useApiFetch } from '../../../auth/use-api-fetch';
import { ROLES } from '../../../share/role';
import { BackButton } from '../../../components/back-button';
import { useUserExistsCheck } from './use-user-exists-check';

interface User {
  id: number;
  name: string;
  displayName: string;
  email: string;
  role: string | null;
  skillMatrix: string | null;
  isAvailable: number;
}

export function EditUserPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [skillMatrix, setSkillMatrix] = useState('');
  const [isAvailable, setIsAvailable] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverNameDup, setServerNameDup] = useState(false);

  useEffect(() => {
    if (id === null) {
      setLoadError('Invalid user id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch(`/users/${id}`)
      .then((res) => res.json())
      .then((user: User) => {
        if (cancelled) return;
        setOriginalName(user.name);
        setName(user.name);
        setDisplayName(user.displayName);
        setEmail(user.email);
        setRole(user.role || '');
        setSkillMatrix(user.skillMatrix || '');
        setIsAvailable(user.isAvailable);
        setLoadError(null);
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
  const displayNameTrimmed = displayName.trim();
  const emailTrimmed = email.trim();

  const nameCheck = useUserExistsCheck(name, { ignoreValue: originalName });
  const nameDup = nameCheck.exists === true || serverNameDup;

  const saveDisabled =
    submitting ||
    nameTrimmed === '' ||
    displayNameTrimmed === '' ||
    emailTrimmed === '' ||
    nameDup ||
    nameCheck.checking;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveDisabled || id === null) return;
    setSubmitting(true);
    setSubmitError(null);
    setServerNameDup(false);
    try {
      await apiFetch(`/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameTrimmed,
          displayName: displayNameTrimmed,
          email: emailTrimmed,
          role: role || null,
          skillMatrix: skillMatrix.trim() || null,
          isAvailable,
        }),
      });
      navigate(`/settings/users/${id}`);
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

  if (loadError) {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header">
          <div className="ic-page-title-group">
            <BackButton to="/settings/users" />
            <h1 className="ic-page-title">Error</h1>
          </div>
        </header>
        <p className="ic-error-block">{loadError}</p>
      </section>
    );
  }

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to={`/settings/users/${id}`} />
          <h1 className="ic-page-title">Edit User #{id}</h1>
        </div>
      </header>
      <form className="ic-form" onSubmit={onSubmit} noValidate>
        <div className="ic-field">
          <label className="ic-field-label" htmlFor="u-id">
            ID
          </label>
          <input
            id="u-id"
            type="text"
            className="ic-input"
            value={`#${id}`}
            disabled
            readOnly
          />
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="u-name">
            Name
          </label>
          <input
            id="u-name"
            type="text"
            className={`ic-input${nameDup ? ' has-error' : ''}`}
            value={name}
            maxLength={255}
            onChange={(e) => {
              setName(e.target.value);
              if (serverNameDup) setServerNameDup(false);
            }}
            disabled={submitting}
            autoComplete="off"
          />
          {nameDup && (
            <p className="ic-field-error" role="alert">
              Already exists
            </p>
          )}
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="u-display-name">
            Display Name
          </label>
          <input
            id="u-display-name"
            type="text"
            className="ic-input"
            value={displayName}
            maxLength={255}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={submitting}
            autoComplete="off"
          />
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="u-email">
            Email
          </label>
          <input
            id="u-email"
            type="email"
            className="ic-input"
            value={email}
            maxLength={255}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            autoComplete="off"
          />
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="u-role">
            Role
          </label>
          <select
            id="u-role"
            className="ic-input"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={submitting}
          >
            <option value="">—</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="u-skill">
            Skill Matrix
          </label>
          <textarea
            id="u-skill"
            className="ic-input"
            rows={4}
            value={skillMatrix}
            onChange={(e) => setSkillMatrix(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div className="ic-field">
          <label className="ic-field-label" htmlFor="u-available">
            Available
          </label>
          <select
            id="u-available"
            className="ic-input"
            value={isAvailable ? '1' : '0'}
            onChange={(e) => setIsAvailable(e.target.value === '1' ? 1 : 0)}
            disabled={submitting}
          >
            <option value="1">Yes</option>
            <option value="0">No</option>
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
            Save
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => navigate(`/settings/users/${id}`)}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
