## Why

The current ReAct loop relies on a fragile contract: the LLM is told (in a ~180-line system prompt) to emit a single raw JSON object `{"thought": ..., "action"|"final_answer": ...}`, which the server then parses by stripping Markdown fences and brace-matching (`extract-json.ts`). This is brittle — every formatting slip risks aborting a turn — and it reimplements, by prompt engineering, what Anthropic's Messages API provides natively. Switching the backend LLM to Claude lets us use **Tool Use**, where tool calls are first-class `tool_use` content blocks validated against a JSON Schema at the API layer, and the final answer is just the model's text. This removes the JSON-parsing failure mode, shrinks the system prompt to its real content, and aligns the agent with standard Anthropic conventions.

## What Changes

- **BREAKING**: Replace the LLM provider. `LlmService` swaps the `openai` SDK (Qwen via OpenAI-compatible endpoint) for `@anthropic-ai/sdk`. Agent `model_config` (`baseUrl`/`authToken`/`modelName`) now targets the Anthropic Messages API and a Claude model.
- **BREAKING**: Replace the ReAct interaction format. The LLM no longer returns a JSON envelope. Instead:
  - **action** → a native `tool_use` block (`{ id, name, input }`); the server reads `name`/`input` directly, no JSON parsing.
  - **observation** → a native `tool_result` block (role `user`), correlated to the call via `tool_use_id`.
  - **final_answer** → the assistant's `text` content when `stop_reason` is `end_turn`; no `final_answer` field.
  - **thought** → the assistant's `text` block emitted alongside/before a `tool_use` (Claude's visible reasoning).
- Register the agent's tools as the native `tools` array (`name`, `description`, `input_schema`) built from the existing `available_tools` data. Tool names keep the `mcp__<id>__<name>` / `client__<id>__<name>` convention so server-side routing (`parseToolName`) is unchanged.
- Rewrite `SYSTEM_PROMPT`: drop the entire "output pure JSON / never fabricate observation / action format" protocol scaffolding (the API enforces it now). Keep only genuine guidance: role framing, the read-skill-before-acting rule, and how to ask the user for missing info.
- Update the suspended-context storage for Client Tools (`t_pending_client_call.message_context`) to hold native message blocks including the pending `tool_use_id`, so the resumed loop can emit a correctly-correlated `tool_result`.
- Retain unchanged: the multi-turn loop, the 20-call cap, observation-as-Thought persistence, all SSE event shapes (`thought_created`, `message_created`, `client_call`, `error`, `done`), and the frontend (it still consumes `MessageEntity` rows).
- Remove `extract-json.ts` from the main loop (native parsing makes it unnecessary).

## Capabilities

### New Capabilities
- `anthropic-tool-use`: Integration with the Anthropic Messages API as the LLM backend and the native Tool Use ReAct loop — building the `tools` array and request from agent config, non-streaming `messages.create`, mapping `text` / `tool_use` / `end_turn` responses to Thought / action / final-answer, the reworked system prompt, and tool-result feedback.

### Modified Capabilities
- `action-tool`: The action mechanism changes from a parsed JSON `{"action": {"tool", "params"}}` envelope to a native `tool_use` block; observations change from a JSON `{"observation": ...}` assistant message to a native `tool_result` block; the final answer changes from a `final_answer` field to `end_turn` text. The multi-turn loop, 20-call cap, and observation-as-Thought behaviors are retained but restated against the native mechanism.
- `client-tool-execution`: The suspended LLM context stores native message content (including the originating `tool_use_id`); on resume the server injects a `tool_result` block correlated by that id, replacing the prior `{role, content}` string-context model.

## Impact

- **Dependencies**: add `@anthropic-ai/sdk`; `openai` becomes unused (remove).
- **API code**: `packages/api/src/app/llm/llm.service.ts` (rewrite), `packages/api/src/app/session/session.service.ts` (parse + loop + context typing), `packages/api/src/app/agent/system-prompt.ts` (rewrite), `packages/api/src/app/session/pending-client-call.entity.ts` (`message_context` shape), `packages/api/src/app/utils/extract-json.ts` (removed from the loop).
- **Data**: seed/default agent `model_config` must be repointed to an Anthropic endpoint + Claude model (e.g. in `docs/database.sql` and any configured agent rows). No schema migration — `message_context` stays a JSON column.
- **Frontend**: none. Event shapes and persisted message rows are unchanged.
- **Behavioral**: the JSON envelope protocol and its `extract-json` hardening are retired; the brittle parse-error turn-abort path disappears.
