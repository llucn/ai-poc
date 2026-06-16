## Context

The agent loop today speaks a hand-rolled text protocol. `SYSTEM_PROMPT` (≈180 lines) instructs the model to reply with a single raw JSON object — `{"thought", "action"|"final_answer"}` — and the server (`session.service.ts:parseAssistantReply`) strips Markdown fences and brace-matches (`extract-json.ts`) before `JSON.parse`. Tool observations are fed back as a synthetic assistant message `{"observation": ...}`. The LLM is Qwen, reached through the `openai` SDK's OpenAI-compatible chat-completions endpoint (`llm.service.ts`).

This works but is fragile: any formatting slip (a stray code fence, a leading sentence, an unescaped quote) can turn into a parse error that aborts the turn, which is exactly why `extract-json.ts` and its 12-case test suite exist. The protocol also burns a large system-prompt budget teaching the model rules the platform can enforce directly.

Anthropic's Messages API provides Tool Use natively: tools are declared with a JSON Schema, the model emits validated `tool_use` blocks, results are returned as `tool_result` blocks, and the final answer is just assistant text terminated by `stop_reason: "end_turn"`. Moving the backend to Claude lets the agent loop use this directly.

Constraints:
- The multi-turn loop, suspend/resume for Client Tools, SSE event contract, and persisted `MessageEntity` rows must keep working — the frontend is not changing.
- Tool routing (`mcp__<id>__<name>` vs `client__<id>__<name>`, parsed by `parseToolName`) must be preserved.
- `t_pending_client_call.message_context` is a JSON column; we can change its shape without a migration.

## Goals / Non-Goals

**Goals:**
- Use the Anthropic Messages API as the LLM backend via `@anthropic-ai/sdk`.
- Replace the JSON-envelope ReAct protocol with native Tool Use: `tool_use` for actions, `tool_result` for observations, `end_turn` text for the final answer, and pre-tool text for the thought.
- Eliminate the JSON-parsing failure mode and remove `extract-json.ts` from the loop.
- Shrink `SYSTEM_PROMPT` to genuine guidance only.
- Keep SSE events, Thought persistence, the 20-call cap, and suspend/resume semantics behavior-compatible.

**Non-Goals:**
- Streaming responses (`messages.stream`). Stay non-streaming, matching today's `callLlm` shape; SSE keep-alive comments already cover latency.
- Frontend changes of any kind.
- Multi-provider abstraction. This is a hard swap Qwen→Claude, not a pluggable provider layer.
- Extended thinking / prompt caching / parallel tool-call fan-out. Keep one tool call per turn, as today.
- Changing tool registration, the `t_tool`/`t_agent_tool` schema, or the `available_tools` data source.

## Decisions

### D1: Map ReAct roles onto native Tool Use, not onto a new JSON envelope

| ReAct concept | Today (Qwen JSON) | After (Anthropic) |
| --- | --- | --- |
| thought | `thought` field in the JSON object | assistant `text` block preceding the `tool_use` |
| action | `action: {tool, params}` field | `tool_use` block `{ id, name, input }` |
| observation | synthetic assistant msg `{"observation": ...}` | `tool_result` block (role `user`) keyed by `tool_use_id` |
| final answer | `final_answer` field | assistant `text` when `stop_reason === "end_turn"` |

Rationale: the whole point of the change is to stop hand-rolling structure the API validates. `tool_use.input` is schema-checked by Anthropic, so no parsing or `extract-json` is needed. **Alternative considered**: keep the JSON envelope but run it on Claude — rejected, it preserves the brittleness we're removing and wastes the native capability.

### D2: `LlmService.callLlm` returns a structured result, not a raw string

Today `callLlm` returns `string` and the caller parses it. The native response is already structured, so re-serializing to a string just to re-parse is wasteful. Change the signature to return a discriminated result:

```ts
type LlmTurn =
  | { kind: 'final'; text: string }                                  // stop_reason end_turn
  | { kind: 'tool_use'; text: string; toolUseId: string;             // stop_reason tool_use
      toolName: string; input: unknown }
  | { kind: 'error'; message: string };                              // SDK/transport error
```

`callLlm(agent, messages, tools)` builds the request, calls `messages.create`, and folds the `content` blocks into this union. The Thought message persisted to the DB is the assistant's `text` (or, when text is empty on a tool call, a compact JSON rendering of the `tool_use` so the timeline still shows what the model did — preserving today's "raw output as Thought" behavior). **Alternative considered**: keep returning a string and re-parse in the session service — rejected, it reintroduces a parse step for no benefit.

### D3: Conversation context becomes native Anthropic message blocks

The internal `LlmMessage` type (`{ role: 'system'|'user'|'assistant'; content: string }`) is replaced for the request path by Anthropic's message shape: a top-level `system` string parameter plus a `messages` array of `{ role: 'user'|'assistant'; content: ContentBlock[] | string }`. The loop builds this array as it goes:
- user turn → `{ role: 'user', content: "<text>" }`
- assistant thought+action → `{ role: 'assistant', content: [ {type:'text',...}?, {type:'tool_use', id, name, input} ] }`
- observation → `{ role: 'user', content: [ {type:'tool_result', tool_use_id, content} ] }`
- assistant final → `{ role: 'assistant', content: "<text>" }`

The DB still stores flat `MessageEntity` rows (unchanged). When rebuilding context from history (`runLlmTurn` reads the last 200 messages), we reconstruct native blocks from the stored rows. To do that reliably we persist enough on each Thought/observation row to reconstruct its block — see D4.

### D4: Reconstructing native context from stored message rows

The loop’s in-memory `messages` array is authoritative within a single turn. The reconstruction-from-history path (start of a fresh user turn) and the suspend/resume path (rebuild after a Client Tool) both need to turn stored rows back into native blocks. Approach:
- For the **in-turn** and **resume** paths, carry the native `messages` array directly (resume reads it from `t_pending_client_call.message_context`, which now stores native blocks including the pending `tool_use_id`). This is the correctness-critical path and never round-trips through flat rows.
- For the **new-user-turn** history rebuild, prior completed turns are collapsed to their user/assistant text only (`messageType=1, isThought=0`), and intermediate thoughts/observations from *previous* turns are **not** replayed as tool blocks. Rationale: Anthropic requires every `tool_use` in an assistant turn to be answered by a `tool_result` in the next user turn; partially-reconstructed tool exchanges from history risk an unbalanced sequence and an API 400. Collapsing history to plain text avoids that and matches how a new turn only needs the *conversational* history, not the prior turn's internal tool scaffolding. The active turn's tool exchanges always stay balanced because they live in the live `messages` array.

**Alternative considered**: faithfully replay every historical tool_use/tool_result from stored rows. Rejected for v1 — it requires persisting `tool_use_id` correlation on every row and guarantees balanced reconstruction across truncation at 200 messages; high complexity for no behavioral gain, since the model doesn't need prior turns' tool mechanics to continue the conversation.

### D5: Build the `tools` array from existing `available_tools`

`getAvailableTools` already yields `{ name, description, parameters }` with names prefixed `mcp__<id>__` / `client__<id>__`. Map each to an Anthropic tool: `{ name, description, input_schema: parameters ?? {type:'object', properties:{}} }`. `parseToolName` on the returned `tool_use.name` keeps server/client routing exactly as today. No change to tool storage or the registry. `available_skills` continues to be injected as system-prompt text (skills are read via the `read_skill` tool, not a native concept).

### D6: Rewrite SYSTEM_PROMPT

Remove everything that exists only to enforce the JSON envelope: "output pure JSON", "no code fences", "never fabricate observation", "action format", the worked JSON examples. The API enforces all of it. Keep: role/persona framing, the **read-skill-before-acting** rule (Rule 6), and **how to ask the user for missing info** (Rule 5 → "use your final text answer to ask; don't invent tool inputs"). Net effect: a short prompt of real instructions, with agent-specific `systemPrompt` and `available_skills` appended as today, passed via the `system` parameter.

### D7: model_config maps to Anthropic

`{ baseUrl, authToken, modelName }` is reused: `authToken` → `apiKey`, `baseUrl` → `baseURL` (optional; omit to use the default Anthropic endpoint), `modelName` → a Claude model id (e.g. `claude-opus-4-8`). `max_tokens` is required by the API — add a sensible default (e.g. 4096) configurable later. Default-agent seed data is repointed.

## Risks / Trade-offs

- **Unbalanced tool_use/tool_result → API 400.** → The live `messages` array always appends a `tool_result` immediately after a `tool_use` before the next `messages.create`; history rebuild collapses prior turns to text (D4) so no dangling tool_use is ever sent.
- **History collapse loses prior tool detail from the model's view.** → Acceptable: the conversational text of past turns is retained; only the internal tool scaffolding of *completed* prior turns is omitted, which the model doesn't need to continue.
- **`max_tokens` truncation cutting off a final answer.** → Default 4096; surface `stop_reason: "max_tokens"` as an error observation/event rather than silently treating partial text as final.
- **Client Tool resume correlation.** → `message_context` now stores the originating `tool_use_id`; resume emits a `tool_result` with that exact id. Old in-flight pending rows from before the change would be incompatible, but pending rows are transient (a suspended turn) — acceptable at deploy.
- **Vendor lock-in to Anthropic.** → Explicit and intended (Non-Goal: no provider abstraction). Revisit only if multi-provider becomes a requirement.
- **`openai` dep removal.** → Confirm no other module imports it before removing from package.json.

## Migration Plan

1. Add `@anthropic-ai/sdk`; keep `openai` until the swap compiles, then remove.
2. Rewrite `LlmService` (D2/D3/D5/D7), `SYSTEM_PROMPT` (D6), `session.service.ts` loop + context (D1/D3/D4), `pending-client-call.entity.ts` `message_context` shape (D3).
3. Drop `extract-json` usage from the loop; keep the file only if referenced elsewhere (it isn't — remove it and its spec test).
4. Repoint default/seed agent `model_config` to an Anthropic endpoint + Claude model (`docs/database.sql` and any live agent rows).
5. Verify: `tsc --noEmit`, `nx build api`, unit tests for the new parse/loop mapping.
- **Rollback**: revert the commit and restore the Qwen `model_config`; no schema change to undo (`message_context` is JSON).

## Open Questions

- Should `max_tokens` be per-agent (added to `model_config`) or a global constant? Default to a constant for v1; promote to config if needed.
- Do we keep `extract-json.ts` as a dead utility for any future non-native provider, or delete outright? Plan: delete (D-Migration step 3); it lives in git history if needed.
