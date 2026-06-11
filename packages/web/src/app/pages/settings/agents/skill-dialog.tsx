import { useEffect, useState } from 'react';
import { useApiFetch } from '../../../auth/use-api-fetch';
import type { AgentSkill } from './types';

type Props = {
  agentId: number;
  // IDs of skills already associated with this agent (pre-checked, disabled).
  linkedSkillIds: number[];
  onSaved: () => void;
  onCancel: () => void;
};

// Modal to associate existing global Skills with an agent. Shows the full
// Skills list with checkboxes; confirming links the newly-checked skills.
// Already linked skills are pre-checked and disabled (unlink from the detail
// table).
export function SkillDialog({
  agentId,
  linkedSkillIds,
  onSaved,
  onCancel,
}: Props) {
  const apiFetch = useApiFetch();
  const linkedSet = new Set(linkedSkillIds);

  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checked, setChecked] = useState<ReadonlySet<number>>(
    () => new Set<number>()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch('/skills?page=1&pageSize=200')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setSkills(data.data || []);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load skills'
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  const toggle = (id: number) => {
    if (linkedSet.has(id)) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSave = async () => {
    const toLink = Array.from(checked);
    if (toLink.length === 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      for (const skillId of toLink) {
        await apiFetch(`/agents/${agentId}/skills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skillId }),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveDisabled = checked.size === 0 || saving;

  return (
    <div
      className="ic-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onCancel();
      }}
    >
      <div
        className="ic-modal ic-modal-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ic-skill-title"
      >
        <h2 id="ic-skill-title" className="ic-modal-title">
          Add Skills
        </h2>
        <div className="ic-modal-body">
          {loading ? (
            <p className="ic-field-hint">Loading…</p>
          ) : loadError ? (
            <p className="ic-error-block" role="alert">
              {loadError}
            </p>
          ) : skills.length === 0 ? (
            <p className="ic-field-hint">
              No skills available. Create one under the Skills menu first.
            </p>
          ) : (
            <div className="ic-table-wrap">
              <table className="ic-table">
                <thead>
                  <tr>
                    <th className="ic-col-check"></th>
                    <th className="ic-col-id">ID</th>
                    <th>Name</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map((skill) => {
                    const isLinked = linkedSet.has(skill.id);
                    return (
                      <tr key={skill.id}>
                        <td className="ic-col-check">
                          <input
                            type="checkbox"
                            aria-label={`Select ${skill.name}`}
                            checked={isLinked || checked.has(skill.id)}
                            disabled={isLinked || saving}
                            onChange={() => toggle(skill.id)}
                          />
                        </td>
                        <td className="ic-col-id">#{skill.id}</td>
                        <td>
                          {skill.name}
                          {isLinked && (
                            <span className="ic-field-hint"> (linked)</span>
                          )}
                        </td>
                        <td>{skill.description || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {error && (
            <p className="ic-error-block" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="ic-modal-actions">
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={onSave}
            disabled={saveDisabled}
          >
            {saving ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
