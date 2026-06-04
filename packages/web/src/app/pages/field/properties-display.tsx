import type { FieldType } from './types';

type Props = {
  type: FieldType;
  properties: Record<string, unknown> | null;
};

export function PropertiesDisplay({ type, properties }: Props) {
  if (!properties) return <span className="ic-muted">—</span>;

  switch (type) {
    case 'text-field':
      return (
        <dl className="ic-props-grid">
          <dt>Min Length</dt><dd>{String(properties.min_length ?? '—')}</dd>
          <dt>Max Length</dt><dd>{String(properties.max_length ?? '—')}</dd>
        </dl>
      );
    case 'text-area':
      return (
        <dl className="ic-props-grid">
          <dt>Rows</dt><dd>{String(properties.rows ?? '—')}</dd>
        </dl>
      );
    case 'number':
      return (
        <dl className="ic-props-grid">
          <dt>Precision</dt><dd>{String(properties.precision ?? '—')}</dd>
          <dt>Scale</dt><dd>{String(properties.scale ?? '—')}</dd>
        </dl>
      );
    case 'select':
    case 'radio': {
      const values = (properties.values ?? []) as Array<{ label: string; value: string }>;
      return (
        <div>
          <strong>Values:</strong>
          <ul className="ic-props-list">
            {values.map((v, i) => (
              <li key={i}>{v.label} = {v.value}</li>
            ))}
          </ul>
        </div>
      );
    }
    case 'checkbox':
      return (
        <dl className="ic-props-grid">
          <dt>Label</dt><dd>{String(properties.label ?? '—')}</dd>
        </dl>
      );
    case 'date':
    case 'datetime':
      return (
        <dl className="ic-props-grid">
          <dt>Format</dt><dd>{String(properties.format ?? '—')}</dd>
        </dl>
      );
    case 'file': {
      const types = (properties.types ?? []) as string[];
      return (
        <dl className="ic-props-grid">
          <dt>Allowed Types</dt><dd>{types.length > 0 ? types.join(', ') : '—'}</dd>
        </dl>
      );
    }
    default:
      return <span className="ic-muted">—</span>;
  }
}
