## MODIFIED Requirements

### Requirement: LLM action output triggers MCP tool execution

The system SHALL detect when the LLM emits a native Anthropic `tool_use` content block (response `stop_reason: "tool_use"`) and execute the referenced MCP tool, reading the tool name and parameters directly from the block's `name` and `input` fields. The system MUST NOT require a JSON envelope (`{"action": ...}`) and MUST NOT strip Markdown code fences or brace-match the model output. A final answer is the assistant's text content when `stop_reason` is `end_turn`.

#### Scenario: LLM emits a tool_use block

- **WHEN** the LLM response has `stop_reason: "tool_use"` with a block `{ id, name: "mcp__1__getWeather", input: { city: "Beijing" } }`
- **THEN** the system parses `name` to extract the tool id and tool name and executes the MCP tool call with `input` as the parameters, without any JSON-string parsing step

#### Scenario: LLM produces a final answer

- **WHEN** the LLM response has `stop_reason: "end_turn"` with text "The weather is sunny."
- **THEN** the system returns "The weather is sunny." as the assistant reply

#### Scenario: Tool name does not match the routing format

- **WHEN** a `tool_use` block's `name` does not match the `mcp__<id>__<name>` or `client__<id>__<name>` format
- **THEN** the system constructs an error observation (`tool_result`) describing the invalid tool name and continues the loop

### Requirement: Observation messages are recorded as Thought Messages

The system SHALL feed each tool result back to the LLM as a native Anthropic `tool_result` content block (role `user`) correlated to the originating call by `tool_use_id`, and SHALL also persist the result as a Thought Message (`isThought=1`, `userName='ASSISTANT'`) and stream it via a `thought_created` SSE event. The persisted Thought content MUST represent the observation result (success payload or error detail).

#### Scenario: Observation saved and streamed

- **WHEN** an MCP tool execution completes (success or failure)
- **THEN** the result is appended to the LLM context as a `tool_result` block keyed by the originating `tool_use_id`, persisted as a Thought Message with `isThought=1`, and pushed to the frontend as a `thought_created` SSE event

#### Scenario: Observation rendered in chat UI

- **WHEN** the frontend receives a `thought_created` event for an observation message
- **THEN** the message is displayed using the existing collapsible ThoughtMessage component

#### Scenario: Tool failure becomes an error tool_result

- **WHEN** the MCP server returns an error or the call fails
- **THEN** the system builds a `tool_result` block marked as an error carrying the failure detail, so the LLM can react to it on the next turn

### Requirement: Multi-turn tool calling loop until final_answer

The system SHALL loop the LLM conversation after each tool result: appending the assistant's `tool_use` block and the corresponding `tool_result` block to the native message context, calling the Anthropic API again, and inspecting the new `stop_reason`. The loop MUST continue while the response is `tool_use` and MUST end when the response is `end_turn` (final answer) or an error. Each iteration MUST persist the assistant's thought (its text content, or a rendering of the `tool_use` when text is empty) as a Thought Message and stream it via SSE.

#### Scenario: Single tool call then final answer

- **WHEN** the LLM emits one `tool_use`, the tool executes, and the next response is `end_turn`
- **THEN** the loop runs exactly one tool call, persists the observation, calls the API again, and returns the `end_turn` text as the assistant reply

#### Scenario: Multiple consecutive tool calls

- **WHEN** the LLM emits a `tool_use`, the tool executes, the `tool_result` is returned, and the next response is another `tool_use`
- **THEN** the loop continues: execute the second tool, persist the observation, call the API again, repeating until `end_turn`

#### Scenario: SSE events during multi-turn loop

- **WHEN** the loop runs N tool calls before reaching the final answer
- **THEN** the frontend receives `thought_created` events for each assistant thought and each observation (2N + 1 thought events total), followed by one `message_created` event for the final assistant reply

### Requirement: Tool call count limit of 20

The system SHALL enforce a maximum of 20 tool calls per single user message. If the loop reaches 20 `tool_use` rounds without producing an `end_turn` final answer, the system MUST terminate the loop and send an SSE `error` event indicating the tool call limit has been exceeded.

#### Scenario: Loop terminates at limit

- **WHEN** the LLM has emitted 20 consecutive `tool_use` rounds without an `end_turn`
- **THEN** the system stops the loop and sends an SSE `error` event with message "Tool call limit exceeded (max 20 calls per message)"

#### Scenario: Loop completes within limit

- **WHEN** the LLM produces an `end_turn` final answer after 5 tool calls
- **THEN** the loop completes normally with the final answer as the assistant reply

### Requirement: Tool name parsing extracts agent tool ID and tool name

The system SHALL parse the tool identifier from the native `tool_use` block's `name` field using the format `<prefix>__<id>__<toolName>`, where `prefix` is `mcp` or `client`, `id` is the numeric `t_tool` ID, and `toolName` is the tool name (which MAY itself contain underscores). The parser MUST split on exactly the first two `__` delimiters to correctly handle tool names containing underscores.

#### Scenario: Parse standard tool name

- **WHEN** the `tool_use.name` is `mcp__5__getWeatherForecastByLocation`
- **THEN** the parsed prefix is `mcp`, the tool id is `5`, and the tool name is `getWeatherForecastByLocation`

#### Scenario: Parse tool name with underscores

- **WHEN** the `tool_use.name` is `mcp__12__get_user_profile`
- **THEN** the parsed tool id is `12` and the tool name is `get_user_profile`

#### Scenario: Invalid tool name format

- **WHEN** the `tool_use.name` does not match the `<prefix>__<id>__<name>` format
- **THEN** the system treats it as a parse error and returns an error `tool_result`

### Requirement: MCP tool execution via JSON-RPC

The system SHALL execute MCP tools by looking up the `server_url` from the `t_tool` table using the parsed tool ID, then sending a JSON-RPC `tools/call` request to that server URL with the tool name and the `tool_use` block's `input` as parameters. The system MUST use the existing MCP JSON-RPC client infrastructure (HTTP POST with `Content-Type: application/json`).

#### Scenario: Successful tool execution

- **WHEN** the system calls `tools/call` on the MCP server at `server_url` with the tool name and `input`
- **THEN** the MCP server returns a result, and the system constructs a `tool_result` block carrying that result

#### Scenario: Tool execution fails

- **WHEN** the MCP server returns an error or the HTTP call fails
- **THEN** the system constructs an error `tool_result` block carrying the failure detail so the LLM can handle it

#### Scenario: Tool ID not found in database

- **WHEN** the parsed tool ID does not exist in `t_tool`
- **THEN** the system constructs an error `tool_result` indicating the tool was not found
