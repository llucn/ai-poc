import { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';

type Props = {
  initialValue: string | null;
  busy?: boolean;
  onSave: (value: string | null) => void;
  onCancel: () => void;
};

// Modal with a WYSIWYG Markdown editor for the agent System Prompt.
export function SystemPromptEditor({
  initialValue,
  busy,
  onSave,
  onCancel,
}: Props) {
  const [value, setValue] = useState<string>(initialValue ?? '');

  return (
    <div
      className="ic-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="ic-modal ic-modal-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ic-sysprompt-title"
      >
        <h2 id="ic-sysprompt-title" className="ic-modal-title">
          Edit System Prompt
        </h2>
        <div className="ic-modal-body">
          <MDEditor
            value={value}
            onChange={(v) => setValue(v ?? '')}
            height={400}
            textareaProps={{ disabled: busy }}
          />
        </div>
        <div className="ic-modal-actions">
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={() => onSave(value.trim() ? value : null)}
            disabled={busy}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
