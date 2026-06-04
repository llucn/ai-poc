import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useUserActions } from '../contexts/UserContext';

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function AvatarMenu() {
  const user = useUser();
  const { logout } = useUserActions();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const displayName = user?.displayName || 'Guest';
  const email = user?.email || '';
  const initials = getInitials(displayName);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const handleProfile = () => {
    setOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="topbar-avatar-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="topbar-avatar"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {initials}
      </button>
      {open && (
        <div className="avatar-dropdown" role="menu">
          <div className="avatar-dropdown-info">
            <strong>{displayName}</strong>
            {email}
          </div>
          <button
            type="button"
            className="avatar-dropdown-item"
            role="menuitem"
            onClick={handleProfile}
          >
            Profile
          </button>
          <button
            type="button"
            className="avatar-dropdown-item"
            role="menuitem"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
