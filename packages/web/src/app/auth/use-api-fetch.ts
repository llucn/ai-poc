import { useCallback } from 'react';
import { useUser } from '../contexts/UserContext';

export type ApiFetch = (path: string, init?: RequestInit) => Promise<Response>;

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, statusText: string, body: unknown) {
    super(`Request failed (${status} ${statusText})`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * WARNING: This is a DEMO-ONLY API fetch hook.
 * User identity is sent in plain-text headers without encryption.
 * DO NOT use this in production environments.
 */
export function useApiFetch(): ApiFetch {
  const user = useUser();

  return useCallback(
    async (path: string, init: RequestInit = {}) => {
      const url = /^https?:\/\//i.test(path)
        ? path
        : `/api${path.startsWith('/') ? '' : '/'}${path}`;

      const headers = new Headers(init.headers);

      // Add header-based user identity if logged in
      if (user) {
        headers.set('X-User-Name', user.username);
        if (user.role) {
          headers.set('X-User-Role', user.role);
        }
      }

      const response = await fetch(url, { ...init, headers });
      if (!response.ok) {
        let body: unknown = undefined;
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          try {
            body = await response.clone().json();
          } catch {
            body = undefined;
          }
        }
        throw new ApiError(response.status, response.statusText, body);
      }
      return response;
    },
    [user],
  );
}
