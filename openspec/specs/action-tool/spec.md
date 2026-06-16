## MODIFIED Requirements

### Requirement: Observation messages are recorded as Thought Messages

The system SHALL feed each tool result back to the LLM as a native Anthropic `tool_result` content block (role `user`) correlated to the originating call by `tool_use_id`. When **all** tool calls of an assistant turn have completed (all MCP tools executed and all Client Tools returned), the system SHALL persist the complete set of `tool_result` blocks as a single Thought Message (`isThought=1`, `userName='ASSISTANT'`, `message_role='user'`, `native_content=[...tool_result]`) and stream it via one `thought_created` SSE event. The persisted Thought `content` field MUST contain a summary rendering of the results for UI display; the `native_content` field stores the complete array of `tool_result` blocks for LLM context reconstruction.

#### Scenario: Multiple tool results merged into one Thought

- **WHEN** an assistant turn calls 3 tools (2 MCP, 1 Client), all complete successfully
- **THEN** the system persists **one** Thought Message with `native_content` containing 3 `tool_result` blocks (keyed by their respective `tool_use_id`s), and pushes one `thought_created` SSE event

#### Scenario: Tool result Thought participates in LLM context

- **WHEN** a subsequent user message triggers LLM context reconstruction from `t_message`
- **THEN** the reconstructed `messages` array includes a user turn with `content: [...tool_result]` derived from the Thought's `native_content`, ensuring every prior `tool_use` has a matching `tool_result`

#### Scenario: Mixed success and failure results

- **WHEN** an assistant turn calls 2 tools, one succeeds (result `"OK"`), one fails (error `"Timeout"`)
- **THEN** the merged Thought's `native_content` contains `[{type:'tool_result', tool_use_id:'A', content:'OK'}, {type:'tool_result', tool_use_id:'B', content:'Timeout', is_error:true}]`

### Requirement: Multi-turn tool calling loop until final_answer

The system SHALL enter a loop of (LLM call → tool execution → observation → repeat) until the LLM's `stop_reason` is `end_turn` or an error/limit is reached. Each iteration SHALL persist the assistant's thought (including any `tool_use` blocks) and the merged tool result Thought. The system SHALL support **multiple `tool_use` blocks per assistant turn** (parallel tool use), executing MCP tools server-side immediately and dispatching Client Tools serially (one `client_call` at a time). The loop resumes after all tool results of a turn are recorded.

#### Scenario: Parallel tool use — multiple tools in one assistant turn

- **WHEN** the LLM's assistant turn contains `tool_use` blocks for `getWeather(Beijing)` and `getTime(UTC)`
- **THEN** the system executes both MCP tools server-side, persists one assistant Thought with `native_content=[text?, tool_use(weather), tool_use(time)]`, waits for both results, then persists one user Thought with `native_content=[tool_result(weather), tool_result(time)]`, and continues the loop

#### Scenario: Mixed MCP and Client tools in one turn

- **WHEN** the LLM calls `mcp__5__getWeather` and `client__7__select-users` in one turn
- **THEN** the system executes the MCP tool immediately, persists one assistant Thought, sends one `client_call` for `select-users`, suspends the SSE; on resume, marks that client tool complete, merges both results into one user Thought, and continues the loop

#### Scenario: Serial Client Tool dispatch

- **WHEN** the LLM calls `client__7__select-users` and `client__8__pick-date` in one turn
- **THEN** the system sends `client_call` for `select-users`, ends the SSE; on resume, sends `client_call` for `pick-date`, ends the SSE; on the second resume, merges both results and continues the loop

#### Scenario: Loop continues after tool results merged

- **WHEN** a turn's 2 tool calls complete and are merged into one user Thought
- **THEN** the system calls the LLM again with the updated `messages` (including the merged `tool_result` user turn), producing the next assistant thought or final answer

## ADDED Requirements

### Requirement: LLM context reconstruction from message_role and native_content

The system SHALL reconstruct the Anthropic `messages` array for LLM calls by querying all `t_message` rows for the session (ordered by `created_on`, `id` ascending), and for each row with non-null `native_content`, appending `{ role: message_role, content: native_content }`. Rows with null `native_content` (legacy) MUST fall back to `{ role: <inferred from userName>, content: <text> }`. The reconstruction MUST NOT filter on `is_thought` — every persisted `tool_use` and `tool_result` block re-enters the context, ensuring balanced pairing.

#### Scenario: Tool blocks reconstructed regardless of is_thought

- **WHEN** a session has 1 user text (is_thought=0), 1 assistant tool_use Thought (is_thought=1, native_content=[tool_use]), 1 user tool_result Thought (is_thought=1, native_content=[tool_result]), and 1 assistant final reply (is_thought=0)
- **THEN** the reconstructed `messages` array contains 4 entries: user text, assistant [tool_use], user [tool_result], assistant text

#### Scenario: Legacy text-only rows still participate

- **WHEN** a session contains old rows with `native_content=NULL`
- **THEN** the reconstruction includes those rows as `{ role: <inferred>, content: <content text> }`

#### Scenario: Balanced tool_use and tool_result pairing

- **WHEN** a session has recorded 3 assistant tool_use turns (each with `native_content`) and 3 corresponding user tool_result Thoughts
- **THEN** the reconstructed `messages` array contains all 6 turns in alternating order (assistant tool_use, user tool_result, ...), and Anthropic accepts the request without `gateway.upstream_unavailable`

### Requirement: One assistant tool_use turn persisted as one row

When the LLM's `stop_reason` is `tool_use`, the system SHALL persist the complete assistant turn as **one** `t_message` row: `isThought=1`, `message_role='assistant'`, `native_content=<assistantContent>` (the full content array returned by Anthropic, containing any text blocks and all `tool_use` blocks). The `content` field MUST contain a UI-friendly rendering (assistant text if non-empty; otherwise a short summary like "Calling tools…"). The system SHALL push one `thought_created` SSE event for this row. No separate "observation" thought row is created for the tool_use itself.

#### Scenario: Single tool call turn

- **WHEN** the LLM produces `stop_reason: 'tool_use'` with `content: [{type:'text', text:'Let me check'}, {type:'tool_use', id:'toolu_A', name:'getWeather', input:{city:'Beijing'}}]`
- **THEN** the system persists 1 row with `native_content` containing both blocks, `content='Let me check'`, `isThought=1`, and pushes 1 `thought_created` event

#### Scenario: Multiple tool calls in one turn

- **WHEN** the LLM produces 3 `tool_use` blocks in one assistant turn
- **THEN** the system persists 1 row with `native_content=[...3 tool_use blocks]`, not 3 separate rows

#### Scenario: Text-only assistant turn (no tool_use)

- **WHEN** the LLM produces `stop_reason: 'end_turn'` with text content
- **THEN** the system persists the assistant reply as `isThought=0` (regular message bubble), not a Thought
