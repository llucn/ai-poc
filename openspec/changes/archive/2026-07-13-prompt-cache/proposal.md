## Why

The current implementation calls Anthropic's API for every user message without prompt caching, resulting in unnecessary latency and token costs. Anthropic's prompt caching feature allows reusing common prompt prefixes across requests, reducing costs by up to 90% and improving response times by caching system prompts, conversation history, and tool definitions.

## What Changes

- Add prompt caching support to LLM service using Anthropic's cache control headers
- Cache system prompts, tool definitions, and conversation history up to the last N messages
- Implement cache key invalidation strategy for tool/agent updates
- Add cache hit metrics and monitoring to track effectiveness
- Update message reconstruction to mark cacheable content blocks

## Capabilities

### New Capabilities
- `prompt-cache-support`: Enable prompt caching in Anthropic API calls with configurable cache boundaries and TTL management

### Modified Capabilities
- `llm-service`: Update LLM service to support cache_control headers in message content blocks and system prompts

## Impact

- **Backend**: `packages/api/src/app/llm/llm.service.ts` - add cache control logic
- **Backend**: `packages/api/src/app/session/session.service.ts` - update message reconstruction for cache boundaries
- **Backend**: `packages/api/src/app/session/message-native.helper.ts` - support cache_control in content blocks
- **Database**: No schema changes required (cache metadata is request-time only)
- **Cost**: Expected 60-90% reduction in prompt token costs for multi-turn conversations
- **Performance**: Expected 50-80% latency reduction for cache hits
