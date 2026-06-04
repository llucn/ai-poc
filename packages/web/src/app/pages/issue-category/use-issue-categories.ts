import { useCallback, useEffect, useState } from 'react';
import { useApiFetch } from '../../auth/use-api-fetch';
import type { IssueCategoryDto } from './types';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: IssueCategoryDto[] };

export function useIssueCategories() {
  const apiFetch = useApiFetch();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    apiFetch('/issue-categories')
      .then((res) => res.json())
      .then((data: IssueCategoryDto[]) => {
        if (!cancelled) setState({ kind: 'ready', data });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ kind: 'error', message: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [apiFetch, reloadKey]);

  return { state, reload };
}
