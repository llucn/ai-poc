import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { ConfirmDeleteDialog } from '../../issue-category/confirm-delete-dialog';

interface User {
  id: number;
  name: string;
  displayName: string;
  email: string;
  role: string | null;
  isAvailable: number;
}

export function AllUsersPage() {
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<number>>(
    () => new Set<number>(),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/users');
      const data = await response.json();
      setUsers(data.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const allSelected = users.length > 0 && selected.size === users.length;
  const noneSelected = selected.size === 0;

  const toggleRow = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === users.length ? new Set() : new Set(users.map((u) => u.id)),
    );
  }, [users]);

  const onDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await apiFetch('/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      setSelected(new Set());
      setDialogOpen(false);
      await loadUsers();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }, [apiFetch, loadUsers, selected]);

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={7}>
            Loading…
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={7} role="alert">
            {error}
          </td>
        </tr>
      );
    }
    if (users.length === 0) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={7}>
            No users yet.
          </td>
        </tr>
      );
    }
    return users.map((user) => (
      <tr key={user.id}>
        <td className="ic-col-check">
          <input
            type="checkbox"
            aria-label={`Select user ${user.name}`}
            checked={selected.has(user.id)}
            onChange={() => toggleRow(user.id)}
          />
        </td>
        <td className="ic-col-id">#{user.id}</td>
        <td>
          <Link to={`/settings/users/${user.id}`}>{user.name}</Link>
        </td>
        <td>{user.displayName}</td>
        <td>{user.email}</td>
        <td>{user.role || '—'}</td>
        <td className="ic-col-icon">
          {user.isAvailable ? (
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="ic-icon-yes"
              title="Available"
            />
          ) : (
            <FontAwesomeIcon
              icon={faCircleXmark}
              className="ic-icon-no"
              title="Unavailable"
            />
          )}
        </td>
      </tr>
    ));
  }, [users, selected, loading, error, toggleRow]);

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <h1 className="ic-page-title">All Users</h1>
        <div className="ic-page-actions">
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={() => navigate('/settings/users/new')}
          >
            + Add
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => setDialogOpen(true)}
            disabled={noneSelected}
          >
            - Delete
          </button>
        </div>
      </header>

      {deleteError && (
        <p className="ic-error-block" role="alert">
          {deleteError}
        </p>
      )}

      <div className="ic-table-wrap">
        <table className="ic-table">
          <thead>
            <tr>
              <th className="ic-col-check">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={users.length === 0}
                />
              </th>
              <th className="ic-col-id">ID</th>
              <th>Name</th>
              <th>Display Name</th>
              <th>Email</th>
              <th>Role</th>
              <th className="ic-col-icon">Available</th>
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </table>
      </div>

      {dialogOpen && (
        <ConfirmDeleteDialog
          busy={deleting}
          message="Delete Users?"
          onCancel={() => {
            if (!deleting) setDialogOpen(false);
          }}
          onConfirm={onDelete}
        />
      )}
    </section>
  );
}
