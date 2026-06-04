import { useEffect, useState } from 'react';
import { useApiFetch } from '../../auth/use-api-fetch';
import type { ExistsFieldResponse } from './types';

type CheckState = {
  checking: boolean;
  exists: boolean | null;
  error: Error | null;
};

const INITIAL: CheckState = { checking: false, exists: null, error: null };
const DEBOUNCE_MS = 300;

export function useFieldExistsCheck(
  value: string,
  options: { ignoreValue?: string } = {},
): CheckState {
  const apiFetch = useApiFetch();
  const [state, setState] = useState<CheckState>(INITIAL);
  const ignoreValue = options.ignoreValue;

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === '') {
      setState(INITIAL);
      return;
    }
    if (ignoreValue !== undefined && trimmed === ignoreValue.trim()) {
      setState({ checking: false, exists: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, checking: true, error: null }));
    let cancelled = false;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ name: trimmed });
      apiFetch(`/fields/exists?${params.toString()}`)
        .then((res) => res.json())
        .then((data: ExistsFieldResponse) => {
          if (cancelled) return;
          setState({ checking: false, exists: data.name, error: null });
        })
        .catch((err: Error) => {
          if (cancelled) return;
          setState({ checking: false, exists: null, error: err });
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [apiFetch, value, ignoreValue]);

  return state;
}
