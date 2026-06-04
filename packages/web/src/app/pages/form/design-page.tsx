import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApiFetch } from '../../auth/use-api-fetch';
import { BackButton } from '../issue-category/back-button';
import { SelectFieldModal } from './select-field-modal';
import { useFormFields } from './use-form-fields';

type Row = {
  fieldId: number;
  name: string;
  title: string;
  type: string;
};

export function FormDesignPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();

  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;
  const from = searchParams.get('from') ?? 'detail';
  const backTarget = from === 'list' ? '/settings/form' : `/settings/form/${id}`;

  const { state } = useFormFields(id);
  const [rows, setRows] = useState<Row[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    if (state.kind === 'ready' && !initialized) {
      const sorted = [...state.data].sort((a, b) => a.position - b.position);
      setRows(sorted.map((f) => ({
        fieldId: f.fieldId,
        name: f.field.name,
        title: f.field.title,
        type: f.field.type,
      })));
      setInitialized(true);
    }
  }, [state, initialized]);

  const onFieldSelect = useCallback((fieldId: number, name: string, title: string, type: string) => {
    setRows((prev) => {
      if (prev.some((r) => r.fieldId === fieldId)) return prev;
      return [...prev, { fieldId, name, title, type }];
    });
    setModalOpen(false);
  }, []);

  const removeRow = useCallback((index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onDragStart = useCallback((index: number) => {
    dragIndex.current = index;
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, overIndex: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === overIndex) return;
    setRows((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex.current!, 1);
      next.splice(overIndex, 0, moved);
      dragIndex.current = overIndex;
      return next;
    });
  }, []);

  const onDragEnd = useCallback(() => {
    dragIndex.current = null;
  }, []);

  const onSave = async () => {
    if (id === null) return;
    setSaving(true);
    setSaveError(null);
    try {
      await apiFetch(`/forms/${id}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: rows.map((r, i) => ({ fieldId: r.fieldId, position: i + 1 })),
        }),
      });
      navigate(backTarget);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (state.kind === 'loading') {
    return (
      <section className="ic-page" aria-busy="true">
        <header className="ic-page-header"><h1 className="ic-page-title">Loading…</h1></header>
      </section>
    );
  }

  if (state.kind === 'not-found') {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header"><h1 className="ic-page-title">Form not found</h1></header>
        <p><Link to="/settings/form">Back to list</Link></p>
      </section>
    );
  }

  if (state.kind === 'error') {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header"><h1 className="ic-page-title">Error</h1></header>
        <p className="ic-error-block">{state.message}</p>
      </section>
    );
  }

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to={backTarget} />
          <h1 className="ic-page-title">Design Form #{id}</h1>
        </div>
        <div className="ic-page-actions">
          <button type="button" className="ic-btn ic-btn-primary"
            onClick={() => setModalOpen(true)}>+ Add</button>
        </div>
      </header>
      {saveError && <p className="ic-error-block" role="alert">{saveError}</p>}
      <div className="ic-table-wrap">
        <table className="ic-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>Position</th>
              <th className="ic-col-id">Field ID</th>
              <th>Name</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="ic-table-empty" colSpan={5}>No fields added yet.</td></tr>
            ) : (
              rows.map((row, index) => (
                <tr key={row.fieldId} draggable
                  onDragStart={() => onDragStart(index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDragEnd={onDragEnd}>
                  <td style={{ cursor: 'grab', textAlign: 'center' }}>&#x2807;</td>
                  <td>{index + 1}</td>
                  <td className="ic-col-id">#{row.fieldId}</td>
                  <td>{row.name}</td>
                  <td>
                    <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      aria-label={`Remove field ${row.name}`}
                      onClick={() => removeRow(index)}>&#x1F5D1;</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="ic-form-actions" style={{ marginTop: 16 }}>
        <button type="button" className="ic-btn ic-btn-primary" onClick={onSave} disabled={saving}>Save</button>
        <button type="button" className="ic-btn ic-btn-secondary"
          onClick={() => navigate(backTarget)} disabled={saving}>Cancel</button>
      </div>
      {modalOpen && (
        <SelectFieldModal onSelect={onFieldSelect} onCancel={() => setModalOpen(false)} />
      )}
    </section>
  );
}

