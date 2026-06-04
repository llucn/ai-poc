import { useCallback, useEffect, useState } from 'react';
import { ApiError, useApiFetch } from '../../auth/use-api-fetch';
import type { IssueCategoryDto } from './types';

type State =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: IssueCategoryDto };

export function useIssueCategory(id: number | null) {
  const apiFetch = useApiFetch();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  useEffect(() => {
    if (id === null || Number.isNaN(id)) {
      setState({ kind: 'not-found' });
      return;
    }
    let cancelled = false;
    setState({ kind: 'loading' });
    apiFetch(`/issue-categories/${id}`)
      .then((res) => res.json())
      .then((data: IssueCategoryDto) => {
        if (!cancelled) setState({ kind: 'ready', data });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setState({ kind: 'not-found' });
        } else {
          setState({ kind: 'error', message: err.message });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiFetch, id, reloadKey]);

  return { state, reload };
}
