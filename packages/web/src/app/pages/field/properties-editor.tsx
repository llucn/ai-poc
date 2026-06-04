import { useCallback } from 'react';
import type { FieldType } from './types';

type Props = {
  type: FieldType;
  value: Record<string, unknown> | null;
  onChange: (v: Record<string, unknown> | null) => void;
};

export function PropertiesEditor({ type, value, onChange }: Props) {
  const props = value ?? {};

  const set = useCallback(
    (key: string, val: unknown) => {
      onChange({ ...props, [key]: val });
    },
    [props, onChange],
  );

  switch (type) {
    case 'text-field':
      return (
        <div className="ic-props-editor">
          <label>Min Length
            <input type="number" min={0} value={Number(props.min_length ?? 0)}
              onChange={(e) => set('min_length', Number(e.target.value))} />
          </label>
          <label>Max Length
            <input type="number" min={0} value={Number(props.max_length ?? 200)}
              onChange={(e) => set('max_length', Number(e.target.value))} />
          </label>
        </div>
      );
    case 'text-area':
      return (
        <div className="ic-props-editor">
          <label>Rows
            <input type="number" min={1} value={Number(props.rows ?? 10)}
              onChange={(e) => set('rows', Number(e.target.value))} />
          </label>
        </div>
      );
    case 'number':
      return (
        <div className="ic-props-editor">
          <label>Precision
            <input type="number" min={0} value={Number(props.precision ?? 5)}
              onChange={(e) => set('precision', Number(e.target.value))} />
          </label>
          <label>Scale
            <input type="number" min={0} value={Number(props.scale ?? 2)}
              onChange={(e) => set('scale', Number(e.target.value))} />
          </label>
        </div>
      );
    case 'select':
    case 'radio':
      return <ValuesEditor values={(props.values ?? []) as Array<{label: string; value: string}>}
        onChange={(vals) => onChange({ values: vals })} />;
    case 'checkbox':
      return (
        <div className="ic-props-editor">
          <label>Label
            <input type="text" value={String(props.label ?? '')}
              onChange={(e) => set('label', e.target.value)} />
          </label>
        </div>
      );
    case 'date':
      return (
        <div className="ic-props-editor">
          <label>Format
            <input type="text" value={String(props.format ?? 'yyyy-MM-dd')}
              onChange={(e) => set('format', e.target.value)} />
          </label>
        </div>
      );
    case 'datetime':
      return (
        <div className="ic-props-editor">
          <label>Format
            <input type="text" value={String(props.format ?? 'yyyy-MM-dd HH:mm:ss')}
              onChange={(e) => set('format', e.target.value)} />
          </label>
        </div>
      );
    case 'file':
      return (
        <div className="ic-props-editor">
          <label>Allowed Types (comma-separated)
            <input type="text"
              value={Array.isArray(props.types) ? (props.types as string[]).join(', ') : ''}
              onChange={(e) => set('types', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </label>
        </div>
      );
    default:
      return null;
  }
}

type ValuesEditorProps = {
  values: Array<{ label: string; value: string }>;
  onChange: (vals: Array<{ label: string; value: string }>) => void;
};

function ValuesEditor({ values, onChange }: ValuesEditorProps) {
  const addRow = () => onChange([...values, { label: '', value: '' }]);
  const removeRow = (idx: number) => onChange(values.filter((_, i) => i !== idx));
  const updateRow = (idx: number, key: 'label' | 'value', val: string) => {
    const next = values.map((row, i) => (i === idx ? { ...row, [key]: val } : row));
    onChange(next);
  };

  return (
    <div className="ic-props-editor">
      <strong>Values</strong>
      {values.map((row, i) => (
        <div key={i} className="ic-props-value-row">
          <input type="text" placeholder="Label" value={row.label}
            onChange={(e) => updateRow(i, 'label', e.target.value)} />
          <input type="text" placeholder="Value" value={row.value}
            onChange={(e) => updateRow(i, 'value', e.target.value)} />
          <button type="button" className="ic-btn ic-btn-secondary" onClick={() => removeRow(i)}>×</button>
        </div>
      ))}
      <button type="button" className="ic-btn ic-btn-secondary" onClick={addRow}>+ Add Value</button>
    </div>
  );
}
