import { useEffect, useState } from 'react';
import { useApiFetch } from '../../auth/use-api-fetch';
import type { ExistsResponse } from './types';

type Field = 'name' | 'displayName';

type Options = {
  // When the trimmed input value equals this string the check is skipped
  // and `exists` is reported as false. Used by the Edit page so leaving a
  // value unchanged does not flag the row's own value as a duplicate.
  ignoreValue?: string;
};

type CheckState = {
  checking: boolean;
  exists: boolean | null;
  error: Error | null;
};

const INITIAL: CheckState = { checking: false, exists: null, error: null };

const DEBOUNCE_MS = 300;

export function useExistsCheck(
  field: Field,
  value: string,
  options: Options = {},
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
      const params = new URLSearchParams({ [field]: trimmed });
      apiFetch(`/issue-categories/exists?${params.toString()}`)
        .then((res) => res.json())
        .then((data: ExistsResponse) => {
          if (cancelled) return;
          setState({ checking: false, exists: data[field], error: null });
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
  }, [apiFetch, field, value, ignoreValue]);

  return state;
}
