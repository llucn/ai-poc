export const ROLES = [
  'SUPERVISOR',
  'TECHNICIAN',
  'SYSTEM_ADMIN',
  'CUSTOMER',
  'PURCHASING_AGENT',
] as const;

export type Role = (typeof ROLES)[number];
