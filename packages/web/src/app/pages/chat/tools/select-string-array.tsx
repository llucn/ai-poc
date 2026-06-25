import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { defineClientTool } from '../client-tool-executor';
import { renderInToolArea } from '../tool-area-bridge';

// What the tool resolves with. Cancel/close -> { cancelled: true, selected: [] }.
export interface SelectStringArrayResult {
  cancelled: boolean;
  selected: string[];
}

const PAGE_SIZE = 10;

// Panel rendered inside the in-page Tool Area. It owns pagination + search +
// selection state, and calls onResolve exactly once (OK or Cancel) to settle
// the tool's Promise. Selection is tracked by string value across pages.
function SelectStringArrayPanel(props: {
  options: string[];
  title: string;
  multiple: boolean;
  searchable: boolean;
  onResolve: (result: SelectStringArrayResult) => void;
}) {
  const { options, title, multiple, searchable, onResolve } = props;

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  // Track selected options by string value in a Set for efficient lookup
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  // Filter options based on search query (case-insensitive substring match)
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return options;
    }
    const lowerQuery = searchQuery.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(lowerQuery));
  }, [options, searchQuery, searchable]);

  // Paginate the filtered options
  const totalPages = Math.max(1, Math.ceil(filteredOptions.length / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const visibleOptions = filteredOptions.slice(startIdx, endIdx);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const toggleRow = useCallback(
    (option: string) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(option)) {
          next.delete(option);
        } else {
          // Single-select: clear others first.
          if (!multiple) next.clear();
          next.add(option);
        }
        return next;
      });
    },
    [multiple]
  );

  const onOk = useCallback(() => {
    onResolve({ cancelled: false, selected: Array.from(selected) });
  }, [onResolve, selected]);

  const onCancel = useCallback(() => {
    onResolve({ cancelled: true, selected: [] });
  }, [onResolve]);

  const tableBody = useMemo(() => {
    if (options.length === 0) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={2}>
            No options
          </td>
        </tr>
      );
    }
    if (filteredOptions.length === 0) {
      return (
        <tr>
          <td className="ic-table-empty" colSpan={2}>
            No matching options
          </td>
        </tr>
      );
    }
    return visibleOptions.map((option, idx) => (
      <tr key={`${startIdx + idx}-${option}`}>
        <td className="ic-col-check">
          <input
            type={multiple ? 'checkbox' : 'radio'}
            aria-label={`Select ${option}`}
            checked={selected.has(option)}
            onChange={() => toggleRow(option)}
          />
        </td>
        <td>{option}</td>
      </tr>
    ));
  }, [visibleOptions, selected, multiple, toggleRow, options.length, filteredOptions.length, startIdx]);

  return (
    <div className="chat-tool-panel">
      <h2 className="chat-tool-title">{title}</h2>

      {searchable && (
        <div className="ic-search-wrap">
          <input
            type="text"
            className="ic-search-input"
            placeholder="Search options..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search options"
          />
        </div>
      )}

      <div className="ic-table-wrap">
        <table className="ic-table">
          <thead>
            <tr>
              <th className="ic-col-check" />
              <th>Option</th>
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
            disabled={page <= 1}
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
            disabled={page >= totalPages}
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
  name: 'select-string-array',
  description:
    'Open a picker in the chat Tool Area for the user to choose one or more options from a provided array of strings. Returns the selected options on OK, or a cancelled result on Cancel. Use this when you need the user to pick from a list of arbitrary string values (tags, file paths, config keys, categories, etc.).',
  parameters: z.object({
    options: z
      .array(z.string())
      .describe('Array of string options to display in the picker'),
    title: z
      .string()
      .optional()
      .describe('Heading shown above the picker (default "Select Options")'),
    multiple: z
      .boolean()
      .optional()
      .describe('Allow selecting multiple options (default true)'),
    searchable: z
      .boolean()
      .optional()
      .describe('Show search input to filter options (default true)'),
  }),
  handler: (params) =>
    renderInToolArea<SelectStringArrayResult>((resolve) => (
      <SelectStringArrayPanel
        options={params.options}
        title={params.title || 'Select Options'}
        multiple={params.multiple !== false}
        searchable={params.searchable !== false}
        onResolve={resolve}
      />
    )),
});
