import { useAuth } from 'react-oidc-context';

export type AuthUser = {
  name: string;
  email: string | undefined;
  initials: string;
};

function computeInitials(name: string): string {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return '?';
  if (tokens.length === 1) return tokens[0].slice(0, 1).toUpperCase();
  return (tokens[0].slice(0, 1) + tokens[1].slice(0, 1)).toUpperCase();
}

type CognitoIdProfile = {
  name?: string;
  email?: string;
  'cognito:username'?: string;
};

export function useAuthUser(): AuthUser {
  const auth = useAuth();
  const profile = auth.user?.profile as CognitoIdProfile | undefined;

  const name =
    profile?.name ??
    profile?.['cognito:username'] ??
    profile?.email ??
    'User';

  return {
    name,
    email: profile?.email,
    initials: computeInitials(name),
  };
}
