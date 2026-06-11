import type { ReactNode } from 'react';

export type MenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  to?: string;
  children?: MenuItem[];
  roles?: string[];
  end?: boolean;
};

export const DEMO_MENU: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    children: [
      { id: 'dashboard-overview', label: 'Overview', to: '/dashboard/overview' },
      { id: 'dashboard-activity', label: 'Activity', to: '/dashboard/activity' },
    ],
  },
  {
    id: 'chat',
    label: 'Chat',
    children: [
      { id: 'chat-new-session', label: 'New Session', to: '/chat/new' },
      { id: 'chat-sessions', label: 'Sessions', to: '/chat', end: true },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    children: [
      { id: 'settings-users', label: 'Users', to: '/settings/users', roles: ['SYSTEM_ADMIN'] },
      { id: 'settings-agents', label: 'Agents', to: '/settings/agents', roles: ['SYSTEM_ADMIN'] },
      { id: 'settings-tools', label: 'Tools', to: '/settings/tools', roles: ['SYSTEM_ADMIN'] },
      { id: 'settings-skills', label: 'Skills', to: '/settings/skills', roles: ['SYSTEM_ADMIN'] },
      { id: 'settings-knowledge', label: 'Knowledge', to: '/dashboard/overview', roles: ['SYSTEM_ADMIN'] },
      { id: 'settings-memory', label: 'Memory', to: '/dashboard/overview', roles: ['SYSTEM_ADMIN'] },
    ],
  },
];

// Filter a menu tree by the current user's role. An item with a non-empty
// `roles` list is kept only when the user's role is in it; groups whose
// children all get filtered out are dropped. Shared by the sidebar (narrow
// viewport) and the topbar primary menu (wide viewport).
export function filterMenuByRoles(
  items: MenuItem[],
  userRole: string | null
): MenuItem[] {
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
