import type { AuthContextProps } from 'react-oidc-context';
import { buildLogoutUrl } from './oidc-config';

let signingOut = false;

export function isSigningOut(): boolean {
  return signingOut;
}

export async function signOut(auth: AuthContextProps): Promise<void> {
  // Mark logout in-flight BEFORE any state change. removeUser() fires
  // userUnloaded in a microtask, which flips isAuthenticated to false
  // and makes RequireAuth's effect call signinRedirect() — whose own
  // location.assign(authorize_url) preempts ours to Cognito /logout
  // (that is the "canceled" /logout request seen in DevTools). The flag
  // is read by RequireAuth to skip the auto-redirect during this window.
  // location.assign() only queues navigation for end-of-task, so the
  // microtask chain from removeUser() runs before the browser actually
  // commits — ordering alone can't win this race; the guard must.
  signingOut = true;
  try {
    const logoutUrl = await buildLogoutUrl();
    void auth.removeUser();
    window.location.assign(logoutUrl);
  } catch (err) {
    signingOut = false;
    throw err;
  }
}
