import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

/**
 * WARNING: This is a DEMO-ONLY authentication context.
 * User identity is stored in memory without encryption or validation.
 * DO NOT use this in production environments.
 */

export interface User {
  username: string;
  role: string | null;
  displayName: string;
  email: string;
}

interface UserContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((user: User) => {
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): User | null {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx.user;
}

export function useUserRole(): string | null {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserRole must be used within UserProvider');
  return ctx.user?.role ?? null;
}

export function useUserActions() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserActions must be used within UserProvider');
  return { login: ctx.login, logout: ctx.logout };
}
