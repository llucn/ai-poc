import { useUser } from '../contexts/UserContext';

export function ProfilePage() {
  const user = useUser();

  if (!user) {
    return (
      <section className="demo-page">
        <h1 className="demo-page-title">Profile</h1>
        <p className="demo-page-subtitle">Not logged in</p>
      </section>
    );
  }

  return (
    <section className="demo-page">
      <h1 className="demo-page-title">Profile</h1>
      <p className="demo-page-subtitle">
        Current user information from demo authentication.
      </p>
      <dl className="profile-grid">
        <dt>Username</dt>
        <dd>{user.username}</dd>
        <dt>Display Name</dt>
        <dd>{user.displayName}</dd>
        <dt>Email</dt>
        <dd>{user.email}</dd>
        <dt>Role</dt>
        <dd>{user.role ?? '—'}</dd>
      </dl>
    </section>
  );
}
