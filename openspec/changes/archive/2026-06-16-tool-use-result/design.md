## Context

The tool-use loop lives in `session.service.ts` (`runLoop`, `resumeClientResult`, `suspendForClientTool`, `executeTool`), with row builders and context reconstruction in `message-native.helper.ts`, the turn shape in `llm.service.ts` (`LlmTurn`), and the suspend record in `pending-client-call.entity.ts`. `t_message` already has `native_content`, `message_role`, `is_thought`, `turn_id`.

The defect: `reconstructNativeMessages` does `if (row.isThought === 1) continue;`. Tool results are written with `is_thought=1` (`createToolResultMessage`), assistant tool_use turns with `is_thought=0` (`createAssistantToolUseMessage`). Rebuilding history therefore keeps `tool_use` but drops the matching `tool_result`, yielding an unbalanced array that Anthropic rejects (surfaced as `gateway.upstream_unavailable`). MCP avoids it only because a single `runLoop` uses the live in-memory array; a second user message reconstructs from DB and hits the same bug.

Anthropic's contract that constrains the design:
1. `messages` must alternate user / assistant and start with user.
2. Every `tool_use` block in an assistant turn must be answered by a `tool_result` block (same `tool_use_id`) in the **immediately following single user turn** — all of a turn's results go in one user message.
3. A turn may contain multiple `tool_use` blocks (parallel tool use).

## Goals / Non-Goals

**Goals:**
- Make context reconstruction correct and balanced by construction, independent of UI flags.
- Support multiple tool calls per assistant turn (mixed MCP + client).
- Keep suspend/resume correct and race-free.
- Remove accidental complexity (`turn_id`, oversized `message_context`).
- Preserve existing SSE event contract and the chat timeline's readability.

**Non-Goals:**
- No streaming responses; stay non-streaming.
- No provider abstraction; Anthropic only.
- No retroactive repair of pre-change sessions' historical rows (best-effort fallback only).
- No new capability surface; this is a correctness change to existing capabilities.

## Decisions

### D1 — Context reconstruction reads `message_role` + `native_content`, never `is_thought`

`reconstructNativeMessages` iterates all `t_message` rows ascending; for each row with non-null `native_content`, push `{ role: message_role, content: native_content }`. Rows with null `native_content` (legacy) fall back to `{ role, content: text }`. `is_thought` is not consulted. This is the invariant that fixes the bug: every persisted `tool_use` and `tool_result` block re-enters the context, so pairing is preserved.

**Alternative considered:** replay only "text" rows and reconstruct tool blocks separately — rejected; that is exactly the fragile split that caused the imbalance.

### D2 — One assistant `tool_use` turn = one row; one merged `tool_result` per turn = one row

- Assistant turn that calls tools → a single row: `is_thought=1`, `message_role='assistant'`, `native_content=[text?, ...tool_use]`, `content` = the assistant text (or a short rendering when empty). Replaces the current two-row (thought + tool_use) split. No separate `{"observation": ...}` row.
- All tool results of that turn → a single row: `is_thought=1`, `message_role='user'`, `native_content=[...tool_result]`, written only once **all** the turn's results are in. This satisfies contract rule 2 (one user turn answers all tool_uses).

`is_thought=1` here means "folded in UI", nothing more.

### D3 — `LlmTurn.tool_use` carries all blocks (parallel tool use)

`LlmService.callLlm` collects every `tool_use` content block. The turn becomes:

```ts
type LlmTurn =
  | { kind: 'final'; text: string }
  | { kind: 'tool_use'; text: string;
      toolUses: { id: string; name: string; input: unknown }[];
      assistantContent: ContentBlockParam[] }
  | { kind: 'error'; message: string };
```

`assistantContent` is the full content array as returned (text + every tool_use), persisted verbatim per D2 and appended to the live array.

### D4 — `call_id` is a grouping key; uniqueness is `(call_id, tool_use_id)`

One assistant turn → one `call_id`. Each `tool_use` in the turn → one `t_pending_client_call` row sharing that `call_id`, keyed by its own `tool_use_id`. `call_id` loses its standalone `UNIQUE`; a composite unique `(call_id, tool_use_id)` replaces it. Lookups on resume are by `(call_id, tool_use_id)`.

### D5 — Tool results carry `tool_use_id` end to end

- `client_call` SSE payload: `{ callId, toolUseId, toolName, params }`.
- `ClientResultDto`: `{ callId, toolUseId, result? , error? }`.
- The browser echoes `toolUseId` back so the server updates the exact pending row.

### D6 — Client tools dispatched serially within a turn

When an assistant turn yields tool calls, execute MCP tools server-side immediately (sequential), then dispatch client tools **one at a time**: send one `client_call`, end the SSE, and on resume send the next pending client tool's `client_call`. Only when no `pending` rows remain for the `call_id` does the loop merge results and continue. Because at most one client result is processed at a time, the "all done?" check needs no locking (补齐点 3).

**Alternative considered:** dispatch all client_calls at once and merge when the last returns — rejected for v1; concurrent resumes race on the completeness check and could double-merge. Serial is simpler and correct; revisit if latency matters.

### D7 — Error mapping

A failed tool (MCP exception or client `error`) is stored on its pending row as `{ error: <message> }`. When merging the turn's results, each row maps to a native block: success → `{type:'tool_result', tool_use_id, content:<result>}`; failure → `{type:'tool_result', tool_use_id, content:<error>, is_error:true}`. The merged user row uses `tool_use_id` (correcting the doc's `id` typo) (补齐点 4).

### D8 — `message_context` shrinks; `turn_id` removed

`t_pending_client_call.message_context` stores only this row's tool-result object (`{type:'tool_result', tool_use_id, content}` or `{error}`), `null` while pending. The full conversation is always rebuilt from `t_message` (D1), so nothing else needs persisting. `t_message.turn_id` is dropped (grouping is `call_id`-based; also kills the prior INT-overflow bug).

### D9 — Chat UI renders native blocks

- `is_thought=1` rows: render `content` (no "Thought" label); clicking expands a `native_content` view (text / tool_use / tool_result blocks).
- `is_thought=0` bubbles: render `content`; a fold/expand control in the bubble reveals `native_content`.
- A small `native-content.tsx` renders the three block types. `Message` (web `types.ts`) gains `nativeContent` and `messageRole`.

## Risks / Trade-offs

- **[Legacy sessions] Old rows used `is_thought` as the context gate.** → New reconstruction ignores `is_thought` and relies on `native_content`; rows written before this change may form an unbalanced sequence. Mitigation: pre-change sessions are not guaranteed re-chattable; pending rows are transient. Optional one-off cleanup out of scope.
- **[Serial client tools] Higher latency for parallel client tools.** → Accepted for correctness in v1 (D6). Most turns call 0–1 client tools. Revisit with transactional completeness check if needed.
- **[Partial failure mid-turn] Some tools succeed, one client tool never returns.** → The turn stays suspended (pending rows remain); the existing pending lifecycle (`pending`/`failed`/`timeout`) governs cleanup. No partial merge is emitted until all rows are non-pending.
- **[Migration] Dropping `turn_id` and re-indexing `call_id` on a live table.** → Single ALTER; `turn_id` is unused after deploy; `call_id` composite unique is compatible with existing single-tool rows. Reversible by restoring the old index.
- **[Ordering] Merged `tool_result` block order vs `tool_use` order.** → Anthropic matches by `tool_use_id`, not position, so result ordering within the user turn is not significant; we still emit in `tool_use` order for readability.
