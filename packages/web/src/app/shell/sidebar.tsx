import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useUserRole } from '../contexts/UserContext';
import { DEMO_MENU, type MenuItem } from './menu-config';

type Props = {
  isNarrow: boolean;
  open: boolean;
  onNavigate: () => void;
};

function filterMenuByRoles(items: MenuItem[], userRole: string | null): MenuItem[] {
  const result: MenuItem[] = [];
  for (const item of items) {
    if (item.roles && item.roles.length > 0) {
      const allowed = userRole && item.roles.includes(userRole);
      if (!allowed) continue;
    }
    if (item.children && item.children.length > 0) {
      const filteredChildren = filterMenuByRoles(item.children, userRole);
      if (filteredChildren.length === 0) continue;
      result.push({ ...item, children: filteredChildren });
    } else {
      result.push(item);
    }
  }
  return result;
}

export function Sidebar({ isNarrow, open, onNavigate }: Props) {
  const className = `sidebar${isNarrow && open ? ' open' : ''}`;
  const userRole = useUserRole();
  const menu = useMemo(() => filterMenuByRoles(DEMO_MENU, userRole), [userRole]);
  return (
    <aside className={className} aria-label="Main navigation">
      <div className="sidebar-logo">
        <div className="logo-text">
          <span className="t1">AI ASSISTANT</span>
          <span className="t2">Operations</span>
        </div>
      </div>
      <nav className="nav">
        {menu.map((group) => (
          <SidebarGroup
            key={group.id}
            item={group}
            isNarrow={isNarrow}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}

function SidebarGroup({
  item,
  isNarrow,
  onNavigate,
}: {
  item: MenuItem;
  isNarrow: boolean;
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const className = `nav-group${expanded ? ' expanded' : ''}`;
  return (
    <div className={className}>
      <button
        type="button"
        className="nav-group-header"
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
      >
        {item.icon}
        <span>{item.label}</span>
        <ChevronIcon />
      </button>
      {expanded && item.children && (
        <div className="nav-group-children">
          {item.children.map((child) => (
            <NavLink
              key={child.id}
              to={child.to ?? '#'}
              end={child.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => {
                if (isNarrow) onNavigate();
              }}
            >
              <span>{child.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="nav-group-chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
