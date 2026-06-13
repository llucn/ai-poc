# Implementation Tasks

## 1. Backend: read-only user listing

- [x] 1.1 Add an authenticated (non-admin) user-list route returning `{ data: [{ id, name, displayName, email }], total, page, pageSize, totalPages }`, reusing `UserService.findAll` with a minimal projection
- [x] 1.2 Ensure the route requires login (global `HeaderAuthGuard`) but NOT `SYSTEM_ADMIN`; leave the existing `GET /users` admin route unchanged
- [x] 1.3 Verify `tsc --noEmit` + `nx build api` pass

## 2. Web: Tool Area + UI host bridge

- [x] 2.1 Add a module-level render-request store (subscribe/emit, single active slot) exposing `renderInToolArea(node|factory): Promise<result>` and a settle/clear path; place it alongside `client-tool-executor.ts`
- [x] 2.2 Create `ToolArea` host component that subscribes to the store, renders the active node, and passes a `resolve(result)` callback; collapses when no active request
- [x] 2.3 Mount `ToolArea` in `chat-page.tsx` to the right of the messages column
- [x] 2.4 Add flex/reflow CSS in `styles.css`: Tool Area collapsed (hidden/zero-width) by default, shown with a sensible width when active; chat column shrinks when space is tight and restores on collapse
- [x] 2.5 Ensure the bridge clears the active request / collapses the Tool Area in a `finally` even when the handler throws or the turn errors

## 3. Web: select-users tool

- [x] 3.1 Create `tools/select-users.tsx`: `defineClientTool` with zod params (`title?`, `multiple?` default true); handler calls `renderInToolArea` with `<SelectUsersPanel>` and returns its Promise
- [x] 3.2 Implement `SelectUsersPanel`: fetch paginated users via the new endpoint, render `ic-table` columns (Check Box, Name, Display Name, Email) + `ic-pagination`
- [x] 3.3 Implement selection state (multi-select), OK button → resolve `{ cancelled: false, users: [...] }`, Cancel/close → resolve `{ cancelled: true, users: [] }`
- [x] 3.4 Register the tool in `tools/index.ts`
- [x] 3.5 Confirm vitest config compiles/globs `.tsx` under `pages/chat/tools`

## 4. Verification

- [x] 4.1 `tsc --noEmit` clean for web; `nx build web` passes
- [x] 4.2 Unit test: `select-users` registers and `getAllClientTools()` emits its JSON schema; bridge resolves on OK and on Cancel
- [x] 4.3 Confirm `prompt-input` (imperative modal) still works unchanged (regression)

## 5. Manual end-to-end (requires running services + LLM)

- [ ] 5.1 Log in → `/client-tools/sync` registers `select-users` into `t_tool` (source='registry'); link it to an agent
- [ ] 5.2 In chat, drive the agent to call `select-users`; Tool Area slides in, chat width shrinks
- [ ] 5.3 Select users + OK → loop resumes with chosen users; Cancel → loop resumes with cancelled outcome; Tool Area collapses and chat width restores in both cases
