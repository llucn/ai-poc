import { useCallback, useEffect, useState } from 'react';
import { useApiFetch } from '../../auth/use-api-fetch';
import type { FormDto } from './types';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: FormDto[] };

export function useForms() {
  const apiFetch = useApiFetch();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    apiFetch('/forms')
      .then((res) => res.json())
      .then((data: FormDto[]) => {
        if (!cancelled) setState({ kind: 'ready', data });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ kind: 'error', message: err.message });
      });
    return () => { cancelled = true; };
  }, [apiFetch, reloadKey]);

  return { state, reload };
}
