import { useEffect, useState } from 'react';
import { useApiFetch } from '../../auth/use-api-fetch';

type FieldOption = {
  id: number;
  name: string;
  title: string;
  type: string;
  description: string | null;
};

type Props = {
  onSelect: (fieldId: number, name: string, title: string, type: string) => void;
  onCancel: () => void;
};

export function SelectFieldModal({ onSelect, onCancel }: Props) {
  const apiFetch = useApiFetch();
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | ''>('');

  useEffect(() => {
    let cancelled = false;
    apiFetch('/fields')
      .then((res) => res.json())
      .then((data: FieldOption[]) => {
        if (!cancelled) {
          const sorted = [...data].sort((a, b) => a.id - b.id);
          setFields(sorted);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [apiFetch]);

  const selectedField = fields.find((f) => f.id === selectedId) ?? null;

  return (
    <div className="ic-modal-overlay" role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="ic-modal" role="dialog" aria-modal="true" aria-labelledby="select-field-title">
        <h2 id="select-field-title" className="ic-modal-title">Select Field</h2>
        {loading && <p>Loading fields…</p>}
        {error && <p className="ic-error-block" role="alert">{error}</p>}
        {!loading && !error && (
          <>
            <div className="ic-field">
              <label className="ic-field-label" htmlFor="sf-select">Field</label>
              <select id="sf-select" className="ic-input" value={selectedId}
                onChange={(e) => setSelectedId(e.target.value === '' ? '' : Number(e.target.value))}>
                <option value="">-- Select a field --</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>#{f.id} - {f.name}</option>
                ))}
              </select>
            </div>
            {selectedField && (
              <p style={{ marginTop: 8, fontSize: 13 }}>{selectedField.description ?? 'No description'}</p>
            )}
          </>
        )}
        <div className="ic-modal-actions">
          <button type="button" className="ic-btn ic-btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="ic-btn ic-btn-primary"
            disabled={selectedField === null}
            onClick={() => {
              if (selectedField) onSelect(selectedField.id, selectedField.name, selectedField.title, selectedField.type);
            }}>Select</button>
        </div>
      </div>
    </div>
  );
}
