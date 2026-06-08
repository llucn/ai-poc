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
    id: 'knowledge',
    label: 'Knowledge',
    children: [
      { id: 'knowledge-overview', label: 'Overview', to: '/dashboard/overview' },
    ],
  },
  {
    id: 'memory',
    label: 'Memory',
    children: [
      { id: 'memory-overview', label: 'Overview', to: '/dashboard/overview' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    children: [
      { id: 'settings-users', label: 'Users', to: '/settings/users', roles: ['SYSTEM_ADMIN'] },
      { id: 'settings-agents', label: 'Agents', to: '/settings/agents', roles: ['SYSTEM_ADMIN'] },
    ],
  },
];
