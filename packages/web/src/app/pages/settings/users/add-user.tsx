import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../issue-category/back-button';

const ROLES = ['SUPERVISOR', 'TECHNICIAN', 'SYSTEM_ADMIN', 'CUSTOMER'];

export function AddUserPage() {
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [skillMatrix, setSkillMatrix] = useState('');
  const [isAvailable, setIsAvailable] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [nameDup, setNameDup] = useState(false);

  const nameTrimmed = name.trim();
  const displayNameTrimmed = displayName.trim();
  const emailTrimmed = email.trim();

  const saveDisabled =
    submitting ||
    nameTrimmed === '' ||
    displayNameTrimmed === '' ||
    emailTrimmed === '' ||
    nameDup;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveDisabled) return;
    setSubmitting(true);
    setSubmitError(null);
    setNameDup(false);
    try {
      await apiFetch('/users', {
        method: 'POST',
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
      navigate('/settings/users');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNameDup(true);
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
          <BackButton to="/settings/users" />
          <h1 className="ic-page-title">Add User</h1>
        </div>
      </header>
      <form className="ic-form" onSubmit={onSubmit} noValidate>
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
              if (nameDup) setNameDup(false);
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
            onClick={() => navigate('/settings/users')}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
