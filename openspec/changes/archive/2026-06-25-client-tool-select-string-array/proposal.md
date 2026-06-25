## Why

The `select-users` Client Tool demonstrates the in-page Tool Area pattern for
rich, interactive tool UIs. However, it's specialized for system users only.
Many agent scenarios need a similar picker experience for arbitrary string
options: choosing from a list of tags, file paths, configuration values,
categories, or any domain-specific enum the agent passes at runtime.

Without a generic string-array picker, each new selection use case would require
a new specialized tool (select-tags, select-files, etc.), duplicating the picker
UI logic and cluttering the Client Tool registry. A reusable `select-string-array`
tool lets the agent pass any array of strings and get a user-confirmed selection
back, using the same paginated, searchable UI pattern proven by `select-users`.

## What Changes

- Add a new declared Client Tool `select-string-array`: it accepts an array of
  strings (options), a title, and multiple-selection flag, then shows a
  paginated, searchable list with checkboxes/radio buttons and **OK**/**Cancel**
  actions, returning the selected options on OK (or a cancelled outcome on
  Cancel/close).
- Reuse the existing Tool Area infrastructure from `client-tool-ui-host`: the
  tool renders into the same in-page panel, with the same layout reflow and
  single-active-tool semantics already proven by `select-users`.
- No server-side changes: this is a pure client-side tool that operates on data
  passed by the agent in the tool_use parameters. No new API endpoints required.
- Add optional search/filter functionality to quickly narrow large option lists.

## Capabilities

### New Capabilities
- `client-tool-select-string-array`: the `select-string-array` Client Tool — its
  declared schema, the paginated picker UI with optional search, OK/Cancel result
  contract, and reuse of the Tool Area bridge for rendering.

### Modified Capabilities
<!-- No existing spec requirements change. This tool reuses the existing
     client-tool-ui-host and client-tool-registry infrastructure without
     modifying their contracts. -->

## Impact

- **Web**: new tool `packages/web/src/app/pages/chat/tools/select-string-array.tsx`
  and its registration in `packages/web/src/app/pages/chat/tools/index.ts`. The
  UI component is self-contained and similar to `SelectUsersPanel`, adapted for
  generic strings with client-side pagination and optional search filtering.
- **No API change**: this tool operates entirely in the browser with data passed
  by the agent. No new endpoints, no database changes.
- **No agent-loop change**: suspend/resume and `client__<id>__<name>` dispatch
  are reused as-is from the existing Client Tool execution flow.
- **Styles**: minor CSS additions for search input styling if not already covered
  by existing table/panel styles in `packages/web/src/styles.css`.
