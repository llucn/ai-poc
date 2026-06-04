import type { ReactNode } from 'react';
import { useUserRole } from '../contexts/UserContext';
import { ForbiddenPage } from '../pages/forbidden-page';

export function RequireRole({
  role,
  children,
}: {
  role: string;
  children: ReactNode;
}) {
  const userRole = useUserRole();
  if (userRole !== role) {
    return <ForbiddenPage role={role} />;
  }
  return <>{children}</>;
}
