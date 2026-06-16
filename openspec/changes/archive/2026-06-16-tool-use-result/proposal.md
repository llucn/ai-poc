## Why

The agent tool-use loop has been rewritten twice and is now inconsistent: whether a message participates in the **LLM context** is wrongly bound to whether it is **folded in the UI** (`is_thought`). `reconstructNativeMessages` skips every `is_thought=1` row, but `tool_result` rows are saved as `is_thought=1` while their paired assistant `tool_use` rows are saved as `is_thought=0`. On any multi-turn session this drops the `tool_result` while keeping the `tool_use`, producing an unbalanced `messages` array (a `tool_use` with no matching `tool_result`). Anthropic rejects it and the gateway surfaces `gateway.upstream_unavailable`.

This is the root cause behind the recurring Client Tool failures (and a latent MCP failure on the second user message). It also left two pieces of accidental complexity: a `turn_id` column (already a source of an INT-overflow bug) and `t_pending_client_call.message_context` storing the entire conversation rather than just the tool result.

## What Changes

- **Context reconstruction stops looking at `is_thought`.** LLM context is rebuilt purely from `message_role` + `native_content`. `is_thought` becomes a UI-fold flag only. Every persisted `tool_use` / `tool_result` block re-enters the context, so the sequence is always balanced. **(root-cause fix)**
- **One assistant `tool_use` turn is persisted as one row** (`is_thought=1`, `native_content=[text?, ...tool_use]`), replacing the current "separate thought row + tool_use row" split. The observation/`{"observation": ...}` thought row is removed.
- **All tool results of one assistant turn are merged into one `tool_result` row** (`is_thought=1`, `message_role=user`, `native_content=[...tool_result]`), matching Anthropic's rule that every `tool_use` in a turn is answered in the next single user turn.
- **Parallel tool calls are supported.** `LlmService` returns *all* `tool_use` blocks of a turn, not just the last. Each becomes a `t_pending_client_call` row under a shared `call_id`, distinguished by `tool_use_id`. **(补齐点 1)**
- **`t_pending_client_call.call_id` becomes a grouping key**, not unique. Uniqueness moves to the composite `(call_id, tool_use_id)`. **(补齐点 1)**
- **Client Tool results carry `tool_use_id` end to end.** The `client_call` SSE event and `ClientResultDto` both gain `toolUseId` so the browser can target the exact pending row. **(补齐点 2)**
- **Client Tools are dispatched serially** within a turn (one `client_call` at a time; the next is sent only after the previous result returns), which makes the "are all results in?" check race-free without locks. **(补齐点 3)**
- **Error tool results are mapped correctly**: a failed call merges into `{type:'tool_result', tool_use_id, content:<error>, is_error:true}` (not a bare `{error}` blob); the merged block uses `tool_use_id` (not `id`). **(补齐点 4)**
- **`t_pending_client_call.message_context` shrinks** to a single tool-result object (`{type:'tool_result', tool_use_id, content}` or `{error}`), `null` while pending — no longer the whole conversation.
- **`turn_id` is removed** from `t_message` (grouping is `call_id`-based now), eliminating the prior overflow bug.
- **Chat UI** renders native blocks: `is_thought=1` rows show `content` and expand to `native_content` on click (no "Thought" label); `is_thought=0` bubbles get a fold/expand affordance for `native_content`.

## Capabilities

### New Capabilities

(none — this corrects existing tool-use behavior; no new capability surface)

### Modified Capabilities

- `action-tool`: LLM context reconstruction is driven by `message_role` + `native_content` (not `is_thought`); one assistant tool_use turn and one merged tool_result row per turn; multiple `tool_use` blocks per turn supported; observation thought row removed.
- `client-tool-execution`: `call_id` is a grouping key with composite `(call_id, tool_use_id)` uniqueness; `message_context` stores only the tool-result content object; the `client_call` event and result POST carry `tool_use_id`; client tools dispatched serially; the loop resumes only after all of a turn's tool results are recorded.
- `chat-ui`: thought rows render `content` with expandable `native_content` (no "Thought" label); regular bubbles gain a fold/expand control for `native_content`.

## Impact

- **Backend**: `message-native.helper.ts` (context rebuild, row builders), `session.service.ts` (runLoop / resumeClientResult / suspendForClientTool / executeTool), `llm.service.ts` (`LlmTurn` tool_use → array), `pending-client-call.entity.ts` (`call_id` index, `message_context` type), `message.entity.ts` (drop `turn_id`), `session.dto.ts` (`ClientResultDto.toolUseId`), `session.service.spec.ts`.
- **Frontend**: `chat/types.ts` (Message gains `nativeContent`, `messageRole`), new `chat/native-content.tsx` renderer, `thought-message.tsx`, `chat-page.tsx` (fold control + `toolUseId` passthrough on `client_call`/result), `client-tool-executor.ts` / `tool-area-bridge.ts` (`toolUseId` passthrough).
- **Data**: `docs/database.sql` (drop `t_message.turn_id`; change `t_pending_client_call` `call_id` index to composite unique; `message_context` comment) + a migration script.
- **Compatibility**: pre-change sessions whose rows used the old `is_thought`-as-context convention are not guaranteed re-chattable; pending rows are transient. Migration drops `turn_id` and rebuilds the `call_id` index. Legacy rows with `native_content=NULL` still fall back to text.
