import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserActions } from '../../contexts/UserContext';
import type { User } from '../../contexts/UserContext';

interface UserFromApi {
  id: number;
  name: string;
  displayName: string;
  email: string;
  role: string | null;
  skillMatrix: string | null;
  isAvailable: number;
}

function initialsOf(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

export function LoginPage() {
  const [users, setUsers] = useState<UserFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { login } = useUserActions();
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/auth/users')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load users');
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleUserClick = (user: UserFromApi) => {
    const loginUser: User = {
      username: user.name,
      role: user.role,
      displayName: user.displayName,
      email: user.email,
    };
    login(loginUser);
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-text">
            <span className="login-logo-t1">AI ASSISTANT</span>
            <span className="login-logo-t2">System</span>
          </div>
        </div>
        <h1 className="login-title">Select a user</h1>
        <p className="login-subtitle">
          Demo mode — choose an account to sign in. No password required.
        </p>

        {loading && <p className="login-status">Loading users…</p>}
        {error && (
          <p className="ic-error-block" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && (
          <div className="login-accounts">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                className="login-account-btn"
                onClick={() => handleUserClick(user)}
              >
                <span className="login-account-icon" aria-hidden="true">
                  {initialsOf(user.displayName)}
                </span>
                <span className="login-account-info">
                  <span className="login-account-label">{user.displayName}</span>
                  <span className="login-account-org">{user.email}</span>
                  <span className="login-account-desc">
                    {user.role || 'No role'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
