## ADDED Requirements

### Requirement: LLM service SHALL support cacheable system prompts
The LLM service SHALL accept system prompts in both string and content block array formats to enable prompt caching with cache_control headers.

#### Scenario: Accept string system prompt
- **WHEN** `callLlm()` receives a string system parameter
- **THEN** the system SHALL convert it to a content block array with cache_control headers

#### Scenario: Accept array system prompt
- **WHEN** `callLlm()` receives an array of content blocks as system parameter
- **THEN** the system SHALL use it directly in the API request

#### Scenario: Cache control headers are preserved
- **WHEN** system content blocks include cache_control metadata
- **THEN** the system SHALL pass them unchanged to the Anthropic API

### Requirement: LLM service SHALL log cache usage metrics
The LLM service SHALL extract and log cache-related token usage from Anthropic API responses.

#### Scenario: Log cache statistics on every call
- **WHEN** an LLM API call completes successfully
- **THEN** the system SHALL log cache_read_input_tokens, cache_creation_input_tokens, and input_tokens from response.usage

#### Scenario: Cache metrics include request context
- **WHEN** logging cache statistics
- **THEN** the log entry SHALL include agent ID and session ID for tracking

### Requirement: LLM service SHALL provide cache helper functions
The LLM service SHALL export helper functions for constructing cacheable system content and message history.

#### Scenario: Build cacheable system content
- **WHEN** caller invokes `buildCacheableSystem(systemText: string, toolsText?: string)`
- **THEN** the function SHALL return an array of content blocks with cache_control on the last block

#### Scenario: Mark stable history boundary
- **WHEN** caller invokes `markStableHistoryBoundary(messages: MessageParam[], stableCount: number)`
- **THEN** the function SHALL add cache_control to the last content block of the message at index stableCount-1
