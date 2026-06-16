# Anthropic API — Implementation Tasks

## 1. Dependencies & config

- [x] 1.1 Add `@anthropic-ai/sdk` to `package.json` (pinned version); run install
- [x] 1.2 Repoint default/seed agent `model_config` in `docs/database.sql` to an Anthropic endpoint + Claude model id (e.g. `claude-opus-4-8`), and note `max_tokens` handling
- [x] 1.3 Define a `max_tokens` default constant for LLM requests (v1: global constant per design D7)

## 2. LlmService rewrite (Anthropic Messages API)

- [x] 2.1 Define the structured turn result type `LlmTurn` (`final` | `tool_use` | `error`) per design D2
- [x] 2.2 Define the native message/context types (Anthropic message blocks; system as a separate string) replacing the old `LlmMessage` string-content shape per design D3
- [x] 2.3 Rewrite `callLlm(agent, system, messages, tools)` to construct the Anthropic client from `model_config` (`authToken`→apiKey, `baseUrl`→baseURL, `modelName`→model), call non-streaming `messages.create` with `max_tokens`, and map response content blocks + `stop_reason` to `LlmTurn`
- [x] 2.4 Handle `stop_reason: "max_tokens"` as an error result rather than a final answer
- [x] 2.5 Map missing/invalid `model_config` (no authToken/modelName) to a clear configuration error
- [x] 2.6 Build the native `tools` array from the agent's available tools (`{name, description, input_schema}`, default empty object schema), preserving `mcp__<id>__` / `client__<id>__` names per design D5

## 3. System prompt rewrite

- [x] 3.1 Rewrite `agent/system-prompt.ts`: remove all JSON-envelope protocol scaffolding (pure-JSON, no-code-fence, never-fabricate-observation, action-format, worked JSON examples) per design D6
- [x] 3.2 Retain role framing, the read-skill-before-acting rule, and the ask-user-via-final-answer rule
- [x] 3.3 Update `buildSystemContent` to compose the `system` string (base prompt + agent.systemPrompt + available_skills as text); skills remain text, tools move to the native `tools` param

## 4. Session loop — native Tool Use

- [x] 4.1 Remove `parseAssistantReply` / `extractJsonObject` usage from the loop; consume the `LlmTurn` from `callLlm` directly
- [x] 4.2 Update `runLoop` to: persist the assistant thought (text, or a rendering of the `tool_use` when text is empty) as a Thought Message + `thought_created`; on `final` → save assistant reply + `message_created` + finalize; on `error` → `error` event + finalize
- [x] 4.3 On `tool_use`: append the assistant `tool_use` block to the native context, route by `parseToolName(name)` (client → suspend; mcp/invalid → execute inline)
- [x] 4.4 Update `executeTool` to take the `tool_use` `input` and return a native `tool_result` block (success) or error `tool_result` (`is_error`) for invalid name / missing tool / MCP failure; persist its content as a Thought Message + `thought_created`
- [x] 4.5 Enforce the 20 `tool_use`-round cap with the same `error` event message
- [x] 4.6 Update `runLlmTurn` history rebuild to collapse prior completed turns to user/assistant text only (no replay of historical tool blocks) per design D4

## 5. Client Tool suspend/resume on native blocks

- [x] 5.1 Change `pending-client-call.entity.ts` `message_context` typing to native message blocks and ensure the suspended context includes the originating `tool_use_id`
- [x] 5.2 Update `suspendForClientTool` to persist native context (with the `tool_use` block + its id) and push the unchanged `client_call` SSE event (callId/toolName/params from `input`)
- [x] 5.3 Update `resumeClientResult` to append a native `tool_result` block correlated by the saved `tool_use_id` (error → `is_error: true`), persist the observation Thought, and re-enter `runLoop`
- [x] 5.4 Recompute the carried tool-call count from the restored native context so the 20-cap survives suspend/resume

## 6. Cleanup

- [x] 6.1 Remove `openai` from `package.json` after confirming no remaining imports
- [x] 6.2 Delete `utils/extract-json.ts` and its spec (no longer used by the loop) per design migration step 3
- [x] 6.3 Remove the now-obsolete `LlmMessage` string-content type if fully superseded

## 7. Verification

- [x] 7.1 Update/replace unit tests: turn-result mapping (`end_turn`/`tool_use`/`max_tokens`/error), tool-name routing on `tool_use.name`, observation→`tool_result` construction
- [x] 7.2 `tsc --noEmit` on api; `nx build api`
- [ ] 7.3 Manual e2e (needs live Anthropic key + MCP/client tool): single tool call → final answer; multi tool call loop; client-tool suspend → resume → final answer; 20-cap; tool-failure observation handled by the model
