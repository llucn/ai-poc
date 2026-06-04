import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { BackButton } from '../../../components/back-button';
import { ConfirmDeleteDialog } from '../../../components/confirm-delete-dialog';

interface User {
  id: number;
  name: string;
  displayName: string;
  email: string;
  role: string | null;
  skillMatrix: string | null;
  isAvailable: number;
}

export function UserDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const apiFetch = useApiFetch();
  const parsedId = idParam !== undefined ? Number(idParam) : NaN;
  const id = Number.isFinite(parsedId) ? parsedId : null;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id === null) {
      setError('Invalid user id');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    apiFetch(`/users/${id}`)
      .then((res) => res.json())
      .then((data: User) => {
        if (!cancelled) {
          setUser(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, apiFetch]);

  const onDelete = useCallback(async () => {
    if (id === null) return;
    setDeleting(true);
    try {
      await apiFetch('/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      navigate('/settings/users');
    } catch {
      setDeleting(false);
    }
  }, [apiFetch, id, navigate]);

  if (loading) {
    return (
      <section className="ic-page" aria-busy="true">
        <header className="ic-page-header">
          <h1 className="ic-page-title">Loading…</h1>
        </header>
      </section>
    );
  }

  if (error || !user) {
    return (
      <section className="ic-page" role="alert">
        <header className="ic-page-header">
          <h1 className="ic-page-title">User not found</h1>
        </header>
        <p>
          <Link to="/settings/users">Back to list</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="ic-page">
      <header className="ic-page-header">
        <div className="ic-page-title-group">
          <BackButton to="/settings/users" />
          <h1 className="ic-page-title">User #{user.id}</h1>
        </div>
        <div className="ic-page-actions">
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={() => navigate(`/settings/users/${user.id}/edit`)}
          >
            Edit
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => setDialogOpen(true)}
          >
            - Delete
          </button>
        </div>
      </header>

      <dl className="profile-grid">
        <dt>ID</dt>
        <dd>#{user.id}</dd>
        <dt>Name</dt>
        <dd>{user.name}</dd>
        <dt>Display Name</dt>
        <dd>{user.displayName}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Role</dt>
        <dd>{user.role ?? '—'}</dd>
        <dt>Skill Matrix</dt>
        <dd>{user.skillMatrix ?? '—'}</dd>
        <dt>Available</dt>
        <dd>{user.isAvailable ? 'Yes' : 'No'}</dd>
      </dl>

      {dialogOpen && (
        <ConfirmDeleteDialog
          busy={deleting}
          message={`Delete User #${user.id}?`}
          onCancel={() => {
            if (!deleting) setDialogOpen(false);
          }}
          onConfirm={onDelete}
        />
      )}
    </section>
  );
}
