import type { ReactNode } from 'react';

export type MenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  to?: string;
  children?: MenuItem[];
  roles?: string[];
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
    id: 'work-orders',
    label: 'Work Orders',
    children: [
      { id: 'work-orders-all', label: 'All Orders', to: '/work-orders/all' },
      { id: 'work-orders-create', label: 'Create Order', to: '/work-orders/create' },
    ],
  },
  {
    id: 'assets',
    label: 'Assets',
    children: [
      { id: 'assets-equipment', label: 'Equipment', to: '/assets/equipment' },
      { id: 'assets-locations', label: 'Locations', to: '/assets/locations' },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    children: [
      { id: 'maintenance-schedules', label: 'Schedules', to: '/maintenance/schedules' },
      { id: 'maintenance-history', label: 'History', to: '/maintenance/history' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    children: [
      { id: 'settings-users', label: 'Users', to: '/settings/users', roles: ['SYSTEM_ADMIN'] },
      { id: 'settings-issue-category', label: 'Issue Category', to: '/settings/issue-category', roles: ['ADMIN'] },
      { id: 'settings-field', label: 'Field', to: '/settings/field', roles: ['ADMIN'] },
      { id: 'settings-form', label: 'Form', to: '/settings/form', roles: ['ADMIN'] },
      { id: 'settings-profile', label: 'Profile', to: '/settings/profile' },
      { id: 'settings-preferences', label: 'Preferences', to: '/settings/preferences' },
    ],
  },
];
