import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../contexts/UserContext';
import { DEMO_MENU, filterMenuByRoles } from './menu-config';

// Wide-viewport primary navigation rendered inside the topbar. Each top-level
// menu entry is a button that toggles a dropdown of its (role-filtered)
// children. Only one dropdown is open at a time; it closes on outside click,
// Escape, re-click, or navigation.
export function TopbarMenu() {
  const navigate = useNavigate();
  const userRole = useUserRole();
  const menu = useMemo(() => filterMenuByRoles(DEMO_MENU, userRole), [userRole]);

  const [openId, setOpenId] = useState<string | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (openId === null) return;
    const onPointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenId(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openId]);

  return (
    <nav className="topbar-menu" aria-label="Primary" ref={containerRef}>
      {menu.map((group) => {
        const expanded = openId === group.id;
        return (
          <div className="topbar-menu-group" key={group.id}>
            <button
              type="button"
              className={`topbar-menu-button${expanded ? ' open' : ''}`}
              aria-haspopup="true"
              aria-expanded={expanded}
              onClick={() => setOpenId((prev) => (prev === group.id ? null : group.id))}
            >
              <span>{group.label}</span>
              <ChevronIcon />
            </button>
            {expanded && group.children && (
              <div className="topbar-menu-dropdown" role="menu">
                {group.children.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    role="menuitem"
                    className="topbar-menu-item"
                    onClick={() => {
                      setOpenId(null);
                      if (child.to) navigate(child.to);
                    }}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="topbar-menu-chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
