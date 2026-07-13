## 1. LLM Service Core Updates

- [x] 1.1 Update `LlmService.callLlm()` signature to accept system parameter as `string | Array<TextBlockParam>` instead of just string
- [x] 1.2 Add `buildCacheableSystem(systemText: string, toolsText?: string): TextBlockParam[]` helper function to construct system content with cache_control
- [x] 1.3 Update `callLlm()` implementation to handle both string and array system parameters
- [x] 1.4 Add cache usage logging in `callLlm()` to extract and log `cache_read_input_tokens`, `cache_creation_input_tokens`, and `input_tokens` from response.usage
- [x] 1.5 Export `buildCacheableSystem` helper from llm.service.ts for use by session service

## 2. Message History Caching

- [x] 2.1 Add `markStableHistoryBoundary(messages: MessageParam[], stableCount: number): MessageParam[]` helper to add cache_control to stable history
- [x] 2.2 Update helper to handle edge cases: empty messages, stableCount > messages.length, messages without content arrays
- [x] 2.3 Add constant `STABLE_HISTORY_THRESHOLD = 4` to define the uncached recent message count
- [x] 2.4 Export `markStableHistoryBoundary` helper from llm.service.ts

## 3. Session Service Integration

- [x] 3.1 Update `SessionService.buildSystemContent()` to return system text and tool context as separate strings (for cache boundary)
- [x] 3.2 Update `SessionService.runLoop()` to call `buildCacheableSystem()` with system text and tool context before calling LLM
- [x] 3.3 Update `SessionService.runLoop()` to call `markStableHistoryBoundary()` on messages array when length > 4
- [x] 3.4 Add logging context (sessionId, agentId) to cache metric logs

## 4. Type Definitions

- [x] 4.1 Import `TextBlockParam` type from @anthropic-ai/sdk/resources/messages in llm.service.ts
- [x] 4.2 Add TypeScript types for cache_control metadata: `{type: "ephemeral"}`
- [x] 4.3 Update existing type guards to handle array system parameters

## 5. Testing and Validation

- [ ] 5.1 Test single-turn conversation: verify system+tools are cached, no history cache
- [ ] 5.2 Test 2-3 turn conversation: verify system+tools cached, history uncached (all messages < threshold)
- [ ] 5.3 Test 5+ turn conversation: verify system+tools cached, stable history (first N-4 messages) cached, last 4 messages uncached
- [ ] 5.4 Verify cache logs show cache_read_input_tokens > 0 on subsequent turns
- [ ] 5.5 Test agent system prompt change invalidates cache (cache_creation_input_tokens > 0, cache_read_input_tokens = 0)

## 6. Documentation

- [x] 6.1 Add inline comments explaining 3-tier cache boundary strategy in buildCacheableSystem
- [x] 6.2 Add inline comments explaining STABLE_HISTORY_THRESHOLD rationale
- [x] 6.3 Document cache metrics logging format for monitoring setup
