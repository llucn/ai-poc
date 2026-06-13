## Context

Client Tools run in the browser. The agent loop suspends on a
`client__<toolId>__<toolName>` action, the server persists the suspended call to
`t_pending_client_call` and pushes a `client_call` SSE event, then `res.end()`s.
The Chat Page (`chat-page.tsx`) dispatches the event to `executeClientTool(name,
params)` in `client-tool-executor.ts`, which awaits the registered handler and
POSTs the outcome to `/sessions/:id/client-result` to resume the loop.

Existing tools render UI imperatively: `prompt-input.ts` builds DOM nodes and
appends them to `document.body`, resolving its Promise on Confirm/Cancel. That
is fine for a modal, but the new `select-users` tool wants an in-context panel
(Tool Area) docked beside the conversation. The handler is still a plain async
function with no React context, so we need a way to bridge from that function
into the React tree owned by `ChatPage`.

Server constraints: `GET /users` is decorated `@Roles('SYSTEM_ADMIN')`, so a
normal chat user can't list users. Auth is enforced by a global
`HeaderAuthGuard` reading `X-User-Name` / `X-User-Role`; `@CurrentUser()` exposes
the resolved user. `select-users` is registry-declared, so it rides the existing
`/client-tools/sync` reconcile into `t_tool` (source='registry') with no DB
schema change and no agent-loop change.

## Goals / Non-Goals

**Goals:**
- A declared `select-users` Client Tool returning the chosen users on OK and a
  cancelled outcome on Cancel/close.
- An in-page Tool Area in the Chat Page that shows only while a tool requests a
  UI, reflows the chat width, and collapses afterward.
- A reusable bridge so any Client Tool handler can render a React component into
  the Tool Area and resolve from it.
- A read-only, any-authenticated-user user-list endpoint for the picker.

**Non-Goals:**
- No change to the suspend/resume protocol, SSE events, or `t_tool` schema.
- No replacement of the existing imperative-modal tools; they keep working.
- No server-side user-selection state; selection lives entirely in the browser.
- No new RBAC role; we only relax read access for a minimal listing.

## Decisions

### Decision 1: React-portal bridge via a module-level render request store
The handler runs outside React, but the Tool Area is a React component. Use a
tiny module-level store (subscribe/emit) in the executor layer: the handler
calls `renderInToolArea(node-or-factory)` which returns a Promise; the store
notifies a subscribed `ToolArea` component mounted by `ChatPage`, which renders
the node and passes a `resolve(result)` callback down. When the component calls
`resolve`, the store settles the Promise and clears the active request (Tool
Area collapses).

- **Why**: keeps `executeClientTool`/handler contract unchanged (handler still
  returns a Promise), needs no React context inside tool files, and the
  single-slot store naturally enforces "one tool UI at a time" — which matches
  the serial suspend/resume loop.
- **Alternative rejected**: a React context + imperative handle threaded into
  the registry. More wiring, and tool files would have to import React.
- **Alternative rejected**: keep mounting to `document.body` and just style it
  as a side panel. It wouldn't reflow the chat area and would fight the app
  layout; the request explicitly wants the chat width to shrink.

### Decision 2: `select-users.tsx` renders a React component through the bridge
`tools/select-users.tsx` declares the tool with `defineClientTool` (zod params,
e.g. `{ title?, multiple? }`) and its handler calls the bridge with a
`<SelectUsersPanel onResolve={...}>` element. The panel fetches the user list,
renders the paginated table (reusing `ic-table` / `ic-pagination` classes), and
calls `onResolve({ cancelled, users })`.

- **Why**: co-locates tool declaration and its UI; the panel is a normal React
  component with hooks for fetch/pagination/selection state.
- **Note**: this is the first `.tsx` tool file; the bootstrap barrel
  `tools/index.ts` imports it like the others.

### Decision 3: Tool Area layout via flex, collapsed to zero width
`chat-container` becomes (or is wrapped by) a horizontal flex: the messages
column flexes, the Tool Area is a fixed-ish-width panel that is width:0 /
display:none when inactive and a sensible width (e.g. clamp) when active. The
chat column already has `max-width: 960px`; the Tool Area sits to its right and,
when space is tight, the chat column shrinks (flex-shrink) to free room.

- **Why**: pure-CSS reflow, no JS measurement; matches the "shrink chat until
  the tool fits" requirement.
- **Alternative rejected**: JS-measured absolute positioning — more fragile,
  needs resize observers.

### Decision 4: New read-only user-list route, not relaxing `GET /users`
Add a separate authenticated endpoint (e.g. `GET /users/selectable` or a small
controller) returning `{ data: [{ id, name, displayName, email }], total, page,
pageSize, totalPages }` with no role restriction beyond being logged in. Reuse
`UserService.findAll`, projecting to the minimal fields.

- **Why**: leaves the admin-only management endpoint's contract intact; avoids
  widening what unprivileged users can read on the management route.
- **Alternative rejected**: drop `@Roles('SYSTEM_ADMIN')` from `GET /users` —
  exposes the full management list (including role, skillMatrix) to everyone.

## Risks / Trade-offs

- **[Bridge leaks if the loop errors mid-tool]** → the executor's try/catch
  already converts handler throws into an `{ error }` outcome; the bridge MUST
  also clear the active request and collapse the Tool Area in a `finally` so a
  failed/cancelled turn never leaves the panel stuck open.
- **[Two tools racing for the Tool Area]** → can't happen with the serial loop
  (one suspension at a time), but the single-slot store will reject/queue a
  second request defensively and log it.
- **[Minimal user-list endpoint still leaks emails to any user]** → acceptable
  for this app's model (internal users); fields are limited to name/displayName/
  email, no role or skill data.
- **[First `.tsx` tool file]** → ensure Vite/test config already compiles `.tsx`
  under `pages/chat/tools` (it does for the app; confirm the vitest glob).

## Migration Plan

1. Backend: add the read-only user-list route + DTO/projection; no DB change.
2. Web: add the bridge store + `ToolArea` host component; mount it in
   `ChatPage` and add flex/reflow CSS.
3. Web: add `tools/select-users.tsx`, register in `tools/index.ts`.
4. Sync registers `select-users` into `t_tool` on next login (source='registry');
   link it to an agent to exercise end-to-end.
- **Rollback**: remove the tool registration + route; the Tool Area simply never
  activates. No persisted state to unwind beyond the auto-synced `t_tool` row
  (removed on next sync when the declaration is gone).

## Open Questions

- Should `select-users` support a `multiple` flag (single vs multi select), or
  always allow multi-select? Default assumption: multi-select with a `multiple`
  param defaulting true.
- Page size for the picker (assume 10) and whether to add a name search box
  (out of scope for v1 unless trivial).
