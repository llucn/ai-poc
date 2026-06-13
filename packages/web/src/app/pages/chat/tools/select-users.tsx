import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useApiFetch } from '../../../auth/use-api-fetch';
import { defineClientTool } from '../client-tool-executor';
import { renderInToolArea } from '../tool-area-bridge';

// A user as shown in the picker (mirrors the /users/selectable projection).
interface SelectableUser {
  id: number;
  name: string;
  displayName: string;
  email: string;
}

// What the tool resolves with. Cancel/close -> { cancelled: true, users: [] }.
export interface SelectUsersResult {
  cancelled: boolean;
  users: SelectableUser[];
}

const PAGE_SIZE = 10;

// Panel rendered inside the in-page Tool Area. It owns fetch + pagination +
// selection state, and calls onResolve exactly once (OK or Cancel) to settle
// the tool's Promise. Selection is tracked by id across pages.
function SelectUsersPanel(props: {
  title: string;
  multiple: boolean;
  onResolve: (result: SelectUsersResult) => void;
}) {
  const { title, multiple, onResolve } = props;
  const apiFetch = useApiFetch();

  const [users, setUsers] = useState<SelectableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Keep the full selected user objects (keyed by id) so the OK result is
  // complete even for users on pages no longer rendered.
  const [selected, setSelected] = useState<ReadonlyMap<number, SelectableUser>>(
    () => new Map()
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch(`/users/selectable?page=${page}&pageSize=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setUsers(data.data || []);
        setTotalPages(data.totalPages || 1);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Failed to load users');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiFetch, page]);

  const toggleRow = useCallback(
    (user: SelectableUser) => {
      setSelected((prev) => {
        const next = new Map(prev);
        if (next.has(user.id)) {
          next.delete(user.id);
        } else {
          // Single-select: clear others first.
          if (!multiple) next.clear();
          next.set(user.id, user);
        }
        return next;
      });
    },
    [multiple]
  );

  const onOk = useCallback(() => {
    onResolve({ cancelled: false, users: Array.from(selected.values()) });
  }, [onResolve, selected]);

  const onCancel = useCallback(() => {
    onResolve({ cancelled: true, users: [] });
  }, [onResolve]);

  const tableBody = useMemo(() => {
    if (loading) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={4}>
            Loading…
          </td>
        </tr>
      );
    }
    if (error) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={4} role="alert">
            {error}
          </td>
        </tr>
      );
    }
    if (users.length === 0) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={4}>
            No users.
          </td>
        </tr>
      );
    }
    return users.map((user) => (
      <tr key={user.id}>
        <td className="ic-col-check">
          <input
            type={multiple ? 'checkbox' : 'radio'}
            aria-label={`Select ${user.name}`}
            checked={selected.has(user.id)}
            onChange={() => toggleRow(user)}
          />
        </td>
        <td>{user.name}</td>
        <td>{user.displayName}</td>
        <td>{user.email}</td>
      </tr>
    ));
  }, [users, selected, loading, error, multiple, toggleRow]);

  return (
    <div className="chat-tool-panel">
      <h2 className="chat-tool-title">{title}</h2>

      <div className="ic-table-wrap">
        <table className="ic-table">
          <thead>
            <tr>
              <th className="ic-col-check" />
              <th>Name</th>
              <th>Display Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>{tableBody}</tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="ic-pagination">
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
          >
            Previous
          </button>
          <span className="ic-pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            Next
          </button>
        </div>
      )}

      <div className="chat-tool-actions">
        <span className="ic-pagination-info">{selected.size} selected</span>
        <div className="chat-tool-actions-btns">
          <button
            type="button"
            className="ic-btn ic-btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="ic-btn ic-btn-primary"
            onClick={onOk}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// Long-running Client Tool: opens the picker in the Tool Area and resolves only
// when the user clicks OK or Cancel. The handler returns the Promise from
// renderInToolArea; executeClientTool awaits it and the agent loop resumes with
// the result. No server-side change — this rides the existing suspend/resume.
defineClientTool({
  name: 'select-users',
  description:
    'Open a picker in the chat Tool Area for the user to choose one or more system users from a paginated list (Name, Display Name, Email). Returns the selected users on OK, or a cancelled result on Cancel. Use this when you need the user to pick specific people.',
  parameters: z.object({
    title: z
      .string()
      .optional()
      .describe('Heading shown above the picker (default "Select Users")'),
    multiple: z
      .boolean()
      .optional()
      .describe('Allow selecting multiple users (default true)'),
  }),
  handler: (params) =>
    renderInToolArea<SelectUsersResult>((resolve) => (
      <SelectUsersPanel
        title={params.title || 'Select Users'}
        multiple={params.multiple !== false}
        onResolve={resolve}
      />
    )),
});
