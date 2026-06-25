## Context

The `select-users` Client Tool establishes the in-page Tool Area pattern: the
agent loop suspends on a `client__<toolId>__<toolName>` action, the browser
handler renders UI into the Tool Area via `renderInToolArea()`, and resolves with
a result that resumes the loop. This works well for system users but is
specialized to that domain.

`select-string-array` generalizes this pattern to arbitrary string options. The
agent passes an array of strings (e.g., `["option-a", "option-b", "option-c"]`)
and optional parameters (title, multiple-selection mode) at runtime. The tool
renders a picker UI similar to `select-users`, but with client-side pagination
and optional search filtering instead of server-side data fetching.

The Tool Area bridge (`tool-area-bridge.ts`) and single-active-tool semantics are
reused as-is. No server-side changes are needed because the tool operates entirely
on data passed in the tool_use parameters.

## Goals / Non-Goals

**Goals:**
- A declared `select-string-array` Client Tool that accepts an array of strings
  and returns the selected options on OK, or a cancelled outcome on Cancel/close.
- Reuse the existing Tool Area UI host and layout reflow from `client-tool-ui-host`.
- Client-side pagination for large option lists (chunking the array into pages).
- Optional search/filter to quickly narrow the list when many options are present.

**Non-Goals:**
- No change to the Tool Area bridge protocol, SSE events, or suspend/resume logic.
- No server-side state or persistence; all selection state lives in the browser.
- No replacement of `select-users`; this is a complementary generic tool.
- No complex data structures (objects with IDs, nested data); this tool handles
  only flat string arrays. The agent can pre-format complex data into display
  strings if needed.

## Decisions

### Decision 1: Tool operates entirely on client-side data
The `select-string-array` tool accepts `options: string[]` as a required
parameter in the tool_use call. The handler renders a panel that paginates and
filters this array in-memory, with no API calls.

- **Why**: keeps the tool generic and zero-latency — no backend endpoint needed
  for arbitrary agent-provided lists. The agent owns formatting the strings to be
  meaningful display values (e.g., file paths, config keys, tags).
- **Alternative rejected**: require the agent to specify an API endpoint to fetch
  options from. Adds complexity, latency, and couples the tool to backend routes;
  contradicts the "generic" goal.

### Decision 2: Client-side pagination, fixed page size
The panel breaks the `options` array into pages of 10 items (consistent with
`select-users` PAGE_SIZE). State tracks current page number; navigation buttons
recompute the visible slice.

- **Why**: reuses the same pagination UX as `select-users`; 10 items fit
  comfortably in the Tool Area without scrolling. For very large arrays (100+),
  the search filter narrows the list before pagination.
- **Alternative rejected**: virtual scrolling for a single long list. More complex
  implementation; pagination is simpler and familiar.

### Decision 3: Optional search filter applies before pagination
If the tool parameter includes `searchable: true` (default true), show a search
input above the table. The filter runs case-insensitive substring matching on the
options array, then pagination slices the filtered result.

- **Why**: large option lists (50+) benefit from quick filtering; substring match
  is intuitive and sufficient for most cases. Making it optional allows the agent
  to disable search for short lists where it adds no value.
- **Alternative rejected**: regex or fuzzy search. Overkill for string options;
  substring match is fast and predictable.

### Decision 4: Selection state keyed by option string value
Selection is tracked in a `Set<string>` (or Map if we need order). Single-select
mode clears the set before adding the new selection; multi-select toggles
membership.

- **Why**: simple and correct when options are unique strings (agent's
  responsibility). If the agent passes duplicate strings, only one will be
  selectable — but that's the agent's formatting problem, not the tool's.
- **Risk**: if options are very long strings (e.g., JSON blobs), the Set may be
  inefficient. Mitigation: document that options should be concise display values;
  the agent can use an ID→label pattern if needed (e.g., "item-123: Long
  Description" and parse the result).

### Decision 5: Tool schema and result contract mirror `select-users`
Parameters: `{ options: string[], title?: string, multiple?: boolean, searchable?: boolean }`.
Result: `{ cancelled: boolean, selected: string[] }` (empty array on cancel).

- **Why**: consistent with `select-users` API shape; agents can switch between
  tools with minimal prompt changes. The `searchable` flag is the only addition.
- **Alternative rejected**: return `{ ok: boolean, values: string[] }`. Less
  descriptive than explicit `cancelled` field.

## Risks / Trade-offs

- **[Agent passes non-unique strings]** → only one copy will render/be selectable.
  Mitigation: document that options should be unique; agent can prefix with IDs if
  needed (e.g., "1: foo", "2: foo").
- **[Very large arrays (1000+ options)]** → client-side filtering may be slow.
  Mitigation: reasonable for this use case (agent-provided lists are typically
  tens to low hundreds); if needed, agent can pre-filter server-side and call the
  tool with a smaller set. Document recommended max array size (~500).
- **[Search narrows to zero results]** → show "No matching options" in the table
  body, similar to the "No users" case in `select-users`.
- **[Tool Area CSS already defined]** → reuse `.chat-tool-panel`, `.chat-tool-title`,
  `.chat-tool-actions` classes. Only add search-specific input styling if needed.

## Migration Plan

1. Web: add `tools/select-string-array.tsx` with the panel component and
   `defineClientTool` declaration.
2. Web: register the tool in `tools/index.ts` (imports the `.tsx` file).
3. Test with a sample agent prompt: provide a fixed array of strings, verify
   pagination, search, and OK/Cancel flows.
4. Sync automatically registers `select-string-array` into `t_tool` on next login
   (source='registry'); no DB migration needed.
- **Rollback**: remove the tool file + registration; no persisted state beyond the
  auto-synced `t_tool` row (deleted on next sync).

## Open Questions

- Should `searchable` default to true or false? Assume true for v1 (always show
  search input) and let the agent opt out if desired.
- Should the tool support ordering options (sort alphabetically)? Out of scope for
  v1; agent can pre-sort the array if needed.
