import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useApiFetch } from '../../../auth/use-api-fetch';
import type { AgentSkill } from './types';

type Props = {
  agentId: number;
  // When provided, the dialog edits this skill; otherwise it adds a new one.
  skill?: AgentSkill | null;
  onSaved: () => void;
  onCancel: () => void;
};

// Modal to add or edit a Skill. Content uses a WYSIWYG Markdown editor.
export function SkillDialog({ agentId, skill, onSaved, onCancel }: Props) {
  const apiFetch = useApiFetch();
  const isEdit = !!skill;

  const [name, setName] = useState(skill?.name ?? '');
  const [description, setDescription] = useState(skill?.description ?? '');
  const [content, setContent] = useState(skill?.content ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameTrimmed = name.trim();
  const saveDisabled = !nameTrimmed || saving;

  const onSave = async () => {
    if (saveDisabled) return;
    setSaving(true);
    setError(null);
    try {
      const path = isEdit
        ? `/agents/${agentId}/skills/${skill!.id}`
        : `/agents/${agentId}/skills`;
      await apiFetch(path, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameTrimmed,
          description: description.trim() || null,
          content: content.trim() || null,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

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
          {isEdit ? 'Edit Skill' : 'Add Skill'}
        </h2>
        <div className="ic-modal-body">
          <div className="ic-field">
            <label className="ic-field-label" htmlFor="skill-name">
              Name *
            </label>
            <input
              id="skill-name"
              type="text"
              className="ic-input"
              value={name}
              maxLength={255}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              autoComplete="off"
            />
          </div>

          <div className="ic-field">
            <label className="ic-field-label" htmlFor="skill-desc">
              Description
            </label>
            <textarea
              id="skill-desc"
              className="ic-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              rows={2}
            />
          </div>

          <div className="ic-field" data-color-mode="light">
            <label className="ic-field-label">Content</label>
            <MDEditor
              value={content}
              onChange={(v) => setContent(v ?? '')}
              height={300}
              textareaProps={{ disabled: saving }}
            />
          </div>

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
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
