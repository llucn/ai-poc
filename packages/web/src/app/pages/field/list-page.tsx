import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApiFetch } from '../../auth/use-api-fetch';
import { ConfirmDeleteDialog } from '../issue-category/confirm-delete-dialog';
import type { FieldDto } from './types';
import { useFields } from './use-fields';

export function FieldListPage() {
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const { state, reload } = useFields();
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const rows: FieldDto[] = state.kind === 'ready' ? state.data : [];
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const noneSelected = selected.size === 0;

  const toggleRow = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)),
    );
  }, [rows]);

  const onDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch('/fields', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      setDialogOpen(false);
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }, [apiFetch, reload, selected]);

  const tableBody = useMemo(() => {
    if (state.kind === 'loading') {
      return <tr><td className="ic-table-empty" colSpan={5}>Loading…</td></tr>;
    }
    if (state.kind === 'error') {
      return <tr><td className="ic-table-empty" colSpan={5} role="alert">{state.message}</td></tr>;
    }
    if (rows.length === 0) {
      return <tr><td className="ic-table-empty" colSpan={5}>No fields yet.</td></tr>;
    }
    return rows.map((row) => (
      <tr key={row.id}>
        <td className="ic-col-check">
          <input type="checkbox" aria-label={`Select field ${row.name}`}
            checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} />
        </td>
        <td className="ic-col-id">#{row.id}</td>
        <td><Link to={`/settings/field/${row.id}`}>{row.name}</Link></td>
        <td>{row.title}</td>
        <td>{row.required ? 'Yes' : 'No'}</td>
      </tr>
    ));
  }, [rows, selected, state, toggleRow]);

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <h1 className="ic-page-title">All Fields</h1>
        <div className="ic-page-actions">
          <button type="button" className="ic-btn ic-btn-primary"
            onClick={() => navigate('/settings/field/new')}>+ Add</button>
          <button type="button" className="ic-btn ic-btn-secondary"
            onClick={() => setDialogOpen(true)} disabled={noneSelected}>- Delete</button>
        </div>
      </header>
      {deleteError && <p className="ic-error-block" role="alert">{deleteError}</p>}
      <div className="ic-table-wrap">
        <table className="ic-table">
          <thead>
            <tr>
              <th className="ic-col-check">
                <input type="checkbox" aria-label="Select all"
                  checked={allSelected} onChange={toggleAll} disabled={rows.length === 0} />
              </th>
              <th className="ic-col-id">ID</th>
              <th>Name</th>
              <th>Title</th>
              <th>Required</th>
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </table>
      </div>
      {dialogOpen && (
        <ConfirmDeleteDialog busy={deleting} message="Delete Fields?"
          onCancel={() => { if (!deleting) setDialogOpen(false); }}
          onConfirm={onDelete} />
      )}
    </section>
  );
}
