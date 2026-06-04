import { useMemo } from 'react';
import { useAuth } from 'react-oidc-context';
import { decodeJwtPayload } from './decode-jwt';

export function useUserGroups(): string[] {
  const auth = useAuth();
  const accessToken = auth.user?.access_token;
  return useMemo(() => {
    if (!accessToken) return [];
    try {
      const claims = decodeJwtPayload<{ 'cognito:groups'?: string[] }>(
        accessToken,
      );
      return claims['cognito:groups'] ?? [];
    } catch {
      return [];
    }
  }, [accessToken]);
}
