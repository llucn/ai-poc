## Context

The current LLM service implementation calls Anthropic's Messages API without prompt caching. Every request sends the full system prompt, tool definitions, and conversation history, resulting in:
- High prompt token costs for multi-turn conversations (system + tools + history repeated every turn)
- Increased latency from processing repeated content
- No reuse of expensive processing across turns

Anthropic's prompt caching feature allows marking content blocks as cacheable using `cache_control: {type: "ephemeral"}` headers. Cached content is reused across requests for 5 minutes (default TTL), reducing both cost and latency.

Current architecture:
- `LlmService.callLlm()` constructs the Anthropic request with system string, messages array, and tools
- `SessionService.runLoop()` builds the system prompt and message context for each turn
- Message history is reconstructed from `t_message` using `reconstructNativeMessages()`

## Goals / Non-Goals

**Goals:**
- Reduce prompt token costs by 60-90% for multi-turn conversations
- Improve response latency by 50-80% for cache hits
- Cache system prompts, tool definitions, and stable message history
- Maintain backward compatibility with existing message storage
- Support cache invalidation when agent tools/prompt change

**Non-Goals:**
- Caching assistant responses (only prompt content is cacheable)
- Persistent cache storage beyond Anthropic's 5-minute TTL
- Cache warming or pre-fetching strategies
- Fine-grained cache key management (rely on Anthropic's automatic keying)

## Decisions

### D1: Cache Boundary Strategy

**Decision**: Use 3-tier caching: system prompt + tools (tier 1), stable history (tier 2), recent messages (tier 3, uncached).

**Rationale**:
- Anthropic allows up to 4 cache breakpoints per request
- System prompt and tools change infrequently (only when agent config updates)
- Message history before the last N messages is stable (won't change)
- Last 2-4 messages are likely to be edited/retried, so leave uncached

**Alternatives considered**:
- Cache everything: Would cache unstable recent messages, causing cache misses on retries
- Cache only system: Misses opportunity to cache conversation history

**Implementation**:
```typescript
// Tier 1: system prompt with cache_control at end
system: [
  { type: "text", text: systemPrompt },
  { type: "text", text: toolContext, cache_control: { type: "ephemeral" } }
]

// Tier 2: stable history (all but last 4 messages) with cache_control on last
messages: [
  ...stableHistory,
  { role: "user", content: [...blocks, { type: "text", text: "...", cache_control: { type: "ephemeral" } }] },
  ...recentMessages // last 4, no cache_control
]
```

### D2: System Prompt as Array vs String

**Decision**: Convert system parameter from string to array of content blocks to support cache_control.

**Rationale**:
- Anthropic API accepts `system` as either `string` or `Array<TextBlockParam | ...>`
- Cache control requires the array form with `cache_control` on specific blocks
- Current system prompt construction in `SessionService.buildSystemContent()` returns a string

**Implementation**:
- Update `LlmService.callLlm()` signature: `system: string | Array<ContentBlockParam>`
- Add helper to wrap string system prompts: `buildCacheableSystem(systemText, tools)`
- Mark tool definitions section with cache_control breakpoint

### D3: Cache Invalidation on Agent/Tool Updates

**Decision**: No explicit cache invalidation - rely on Anthropic's automatic key hashing.

**Rationale**:
- Anthropic automatically keys cache by content hash (system + messages + tools)
- When agent system prompt or tools change, content hash changes → automatic miss
- 5-minute TTL naturally expires stale caches
- No need to track cache versions or manual invalidation

**Trade-off**: If an agent's tools are updated mid-conversation, next turn gets a cache miss. This is acceptable - happens rarely and cache rebuilds in one request.

### D4: Cache Metrics and Monitoring

**Decision**: Log cache hit/miss stats from Anthropic response usage object.

**Rationale**:
- Anthropic returns `usage: { cache_creation_input_tokens, cache_read_input_tokens, input_tokens }` in response
- Log these metrics per request to track cache effectiveness
- No need for persistent metrics storage in v1 - console logs sufficient for validation

**Implementation**:
```typescript
this.logger.log(
  `LLM call: cached=${response.usage.cache_read_input_tokens} ` +
  `created=${response.usage.cache_creation_input_tokens} ` +
  `uncached=${response.usage.input_tokens}`
);
```

### D5: Stable History Threshold

**Decision**: Cache all but the last 4 messages (2 turns) as stable history.

**Rationale**:
- Last 2 turns (4 messages: user → assistant → user → assistant) are most likely to be edited/retried
- Conversations beyond 2 turns benefit from caching earlier turns
- 4-message threshold balances cache hit rate vs flexibility

**Alternatives considered**:
- Last 2 messages: Too aggressive, misses caching opportunity on 3+ turn conversations
- Last 6 messages: Too conservative, caches potentially unstable recent messages

**Configuration**: Hardcode threshold at 4 for v1, promote to agent config if needed later.

## Risks / Trade-offs

**[R1] Cache miss on user message edits** → The last 4 messages are uncached, so edits to very recent messages don't break cache. Earlier message edits (rare) cause cache miss but system/tools remain cached.

**[R2] 5-minute TTL may expire between turns** → Acceptable - user conversations rarely pause >5 min. If expired, next request recreates cache (one-time cost).

**[R3] Anthropic cache billing** → Cache writes cost 25% of base prompt tokens, reads cost 10%. Net savings: 60-90% for multi-turn. Monitor with usage logs.

**[R4] Breaking change if Anthropic cache API evolves** → Minimal risk - cache_control is stable feature. Fallback: remove cache_control headers, works as non-cached request.

**[R5] Increased complexity in message construction** → Mitigated by isolating cache logic in helper functions. Core loop remains unchanged.

## Migration Plan

1. **Phase 1: Add cache support (backward compatible)**
   - Update `LlmService.callLlm()` to support array system param
   - Add `buildCacheableSystem()` helper
   - Update `SessionService.runLoop()` to mark cache boundaries
   - Deploy with feature flag OFF (cache_control not set)

2. **Phase 2: Enable and validate**
   - Turn on cache_control headers in production
   - Monitor logs for cache hit rate (target >70% after turn 3)
   - Monitor billing for expected cost reduction

3. **Rollback**: Remove cache_control headers from requests (one-line config change). No data migration needed.
