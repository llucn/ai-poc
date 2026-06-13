## Why

Client Tools today render their UI by mounting a modal imperatively onto
`document.body` (see `prompt-input.ts`). That works for a one-field prompt but
not for a richer, in-context experience: a full user picker with a paginated
list and confirm/cancel actions reads better as a panel docked beside the
conversation than as a modal that covers it. We also want a reusable, declared
`select-users` tool so the agent can ask the user to choose one or more system
users, and have the chat layout host that tool's UI in a dedicated Tool Area
that appears only while a tool is running.

## What Changes

- Add a new declared Client Tool `select-users`: it shows a paginated list of
  system users (Check Box, Name, Display Name, Email) with **OK** / **Cancel**
  buttons, and returns the selected users on OK (or a cancelled outcome on
  Cancel/close).
- Introduce an in-page **Tool Area** in the Chat Page: a right-hand panel that
  is collapsed/invisible by default, slides in when a Client Tool requests a UI,
  and collapses again when the tool resolves. The Chat (messages) area shrinks
  to make room and restores its width when the Tool Area closes.
- Add a **client-tool UI host bridge** so a Client Tool handler (a plain async
  function returning a Promise) can render a React component into the Tool Area
  and resolve its Promise from that component — without each tool reaching into
  `document.body`. The existing imperative-modal tools keep working unchanged.
- Add a **non-admin user listing endpoint** for the picker. The current
  `GET /users` is restricted to `SYSTEM_ADMIN`; chat users need a read-only,
  paginated list (name, display name, email) usable by any authenticated user.

## Capabilities

### New Capabilities
- `client-tool-ui-host`: an in-page Tool Area in the Chat Page plus a bridge
  that lets a Client Tool render a React component into it and resolve from
  there; covers show/hide behavior, layout reflow, and single-active-tool
  semantics.
- `client-tool-select-users`: the `select-users` Client Tool — its declared
  schema, the paginated picker UI, OK/Cancel result contract, and the
  supporting authenticated user-list endpoint.

### Modified Capabilities
<!-- No existing spec requirements change. The Chat Page gains a Tool Area, but
     that behavior is owned by the new client-tool-ui-host capability rather
     than altering existing chat-ui requirements. -->

## Impact

- **Web**: `packages/web/src/app/pages/chat/chat-page.tsx` (host the Tool Area,
  reflow layout); new `tool-area.tsx` host component + a render-request bridge
  in/near `client-tool-executor.ts`; new tool `tools/select-users.tsx` and its
  registration in `tools/index.ts`; styles in `packages/web/src/styles.css`.
- **API**: a read-only, authenticated user-list endpoint (new lightweight
  controller route or relaxed guard) returning `{ data, total, page, pageSize,
  totalPages }` with `name`, `displayName`, `email`.
- **No DB schema change**: `select-users` is a registry-declared Client Tool;
  it syncs into `t_tool` via the existing `/client-tools/sync` path
  (source='registry'), so no `database.sql` change is required.
- **No agent-loop change**: suspend/resume and `client__<id>__<name>` dispatch
  are reused as-is.
