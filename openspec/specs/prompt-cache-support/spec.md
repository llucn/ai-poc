# prompt-cache-support Specification

## Purpose
TBD - created by archiving change prompt-cache. Update Purpose after archive.
## Requirements
### Requirement: System SHALL support Anthropic prompt caching
The system SHALL use Anthropic's prompt caching feature by adding `cache_control` headers to eligible content blocks in API requests to reduce token costs and improve response latency.

#### Scenario: System prompt is cached
- **WHEN** the LLM service constructs a request with a system prompt
- **THEN** the system prompt content SHALL be marked with `cache_control: {type: "ephemeral"}` on the last block

#### Scenario: Tool definitions are cached
- **WHEN** the LLM service includes tool definitions in a request
- **THEN** tool definitions SHALL be included in the cached system content with cache breakpoint after tools

#### Scenario: Stable message history is cached
- **WHEN** conversation history exceeds 4 messages
- **THEN** all messages except the last 4 SHALL be marked as cacheable with cache_control on the last stable message

#### Scenario: Recent messages remain uncached
- **WHEN** conversation has fewer than or equal to 4 messages
- **THEN** no message history cache breakpoints SHALL be set
- **WHEN** conversation exceeds 4 messages
- **THEN** the last 4 messages SHALL NOT have cache_control headers

### Requirement: System SHALL handle cache metrics
The system SHALL log cache usage statistics from Anthropic API responses for monitoring cache effectiveness.

#### Scenario: Cache hit metrics are logged
- **WHEN** an LLM request returns with cache statistics
- **THEN** the system SHALL log `cache_read_input_tokens`, `cache_creation_input_tokens`, and `input_tokens` from the response usage object

#### Scenario: Cache effectiveness is trackable
- **WHEN** reviewing application logs
- **THEN** cache hit rates SHALL be calculable from logged token usage metrics

### Requirement: System prompt SHALL support content block array format
The LLM service SHALL accept system prompts as either a string or an array of content blocks to support cache_control headers.

#### Scenario: String system prompt is accepted
- **WHEN** caller provides system prompt as a string
- **THEN** the system SHALL wrap it in a content block array for caching

#### Scenario: Array system prompt is accepted
- **WHEN** caller provides system prompt as content block array
- **THEN** the system SHALL use it directly with cache_control headers

### Requirement: Cache boundaries SHALL optimize for stability
The system SHALL place cache boundaries to maximize cache hit rates by caching stable content and leaving volatile content uncached.

#### Scenario: Three-tier cache boundary
- **WHEN** constructing an LLM request
- **THEN** cache boundaries SHALL be placed at: (1) end of system+tools, (2) end of stable history (all but last 4 messages), (3) no cache on recent messages

#### Scenario: Cache boundary adapts to conversation length
- **WHEN** conversation has fewer than 4 messages
- **THEN** only system+tools tier SHALL be cached
- **WHEN** conversation has 4 or more messages
- **THEN** both system+tools and stable history tiers SHALL be cached

### Requirement: System SHALL handle cache invalidation automatically
The system SHALL rely on Anthropic's automatic cache key hashing for invalidation and NOT implement manual cache management.

#### Scenario: Agent prompt change invalidates cache
- **WHEN** an agent's system prompt is modified
- **THEN** subsequent requests SHALL automatically get a cache miss due to content hash change

#### Scenario: Tool updates invalidate cache
- **WHEN** an agent's tool definitions change
- **THEN** subsequent requests SHALL automatically get a cache miss due to content hash change

#### Scenario: Cache TTL expires naturally
- **WHEN** 5 minutes elapse without requests
- **THEN** Anthropic's cache SHALL expire and next request creates a new cache

