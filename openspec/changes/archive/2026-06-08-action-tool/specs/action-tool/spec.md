## ADDED Requirements

### Requirement: LLM action output triggers MCP tool execution

The system SHALL parse the LLM's JSON output and, when the top-level object contains an `action` field (with `tool` and `params` sub-fields), execute the referenced MCP tool instead of returning the action as an assistant reply. The `action` field MUST NOT be treated as a `final_answer`.

#### Scenario: LLM outputs action with tool call

- **WHEN** the LLM returns `{"thought": "...", "action": {"tool": "mcp__1__getWeather", "params": {"city": "Beijing"}}}`
- **THEN** the system parses the `tool` field to extract the agent tool ID and tool name, and executes the MCP tool call instead of displaying the action JSON as an assistant reply

#### Scenario: LLM outputs final_answer

- **WHEN** the LLM returns `{"thought": "...", "final_answer": "The weather is sunny."}`
- **THEN** the system returns "The weather is sunny." as the assistant reply (existing behavior, unchanged)

#### Scenario: Action field without valid tool format

- **WHEN** the LLM returns an `action` with a `tool` value that does not match the `mcp__${id}__${toolName}` format
- **THEN** the system treats it as an error and constructs an observation message describing the invalid tool format

### Requirement: Tool name parsing extracts agent tool ID and tool name

The system SHALL parse the `tool` field from the action using the format `mcp__${id}__${toolName}`, where `id` is the numeric ID in the `t_agent_tool` table and `toolName` is the MCP tool name (which MAY itself contain underscores). The parser MUST split on exactly the first two `__` delimiters to correctly handle tool names containing underscores.

#### Scenario: Parse standard tool name

- **WHEN** the tool field is `mcp__5__getWeatherForecastByLocation`
- **THEN** the parsed agent tool ID is `5` and the tool name is `getWeatherForecastByLocation`

#### Scenario: Parse tool name with underscores

- **WHEN** the tool field is `mcp__12__get_user_profile`
- **THEN** the parsed agent tool ID is `12` and the tool name is `get_user_profile`

#### Scenario: Invalid tool name prefix

- **WHEN** the tool field does not start with `mcp__`
- **THEN** the system treats it as a parse error

### Requirement: MCP tool execution via JSON-RPC

The system SHALL execute MCP tools by looking up the `server_url` from the `t_agent_tool` table using the parsed agent tool ID, then sending a JSON-RPC `tools/call` request to that server URL with the tool name and parameters. The system MUST use the existing MCP JSON-RPC client infrastructure (HTTP POST with `Content-Type: application/json`).

#### Scenario: Successful tool execution

- **WHEN** the system calls `tools/call` on the MCP server at `server_url` with the tool name and params
- **THEN** the MCP server returns a result, and the system constructs an observation message `{"observation": <result>}`

#### Scenario: Tool execution fails

- **WHEN** the MCP server returns an error or the HTTP call fails
- **THEN** the system constructs an observation message `{"observation": <error details>}` so the LLM can handle the failure

#### Scenario: Agent tool ID not found in database

- **WHEN** the parsed agent tool ID does not exist in `t_agent_tool`
- **THEN** the system constructs an observation message indicating the tool was not found

### Requirement: Observation messages are recorded as Thought Messages

The system SHALL save each observation message as a Thought Message (`isThought=1`, `userName='ASSISTANT'`) in the database and stream it to the frontend via a `thought_created` SSE event. The observation content MUST be formatted as `{"observation": <result or error>}`.

#### Scenario: Observation saved and streamed

- **WHEN** an MCP tool execution completes (success or failure)
- **THEN** the observation message is persisted with `isThought=1` and pushed to the frontend as a `thought_created` SSE event

#### Scenario: Observation rendered in chat UI

- **WHEN** the frontend receives a `thought_created` event for an observation message
- **THEN** the message is displayed using the existing collapsible ThoughtMessage component

### Requirement: Multi-turn tool calling loop until final_answer

The system SHALL loop the LLM conversation after each observation: appending the observation to the message history, calling the LLM again, and checking whether the new output contains `final_answer` or another `action`. The loop MUST continue until the LLM produces a `final_answer`. Each iteration through the loop MUST save the LLM's thought (raw output) as a Thought Message and stream it via SSE.

#### Scenario: Single tool call then final answer

- **WHEN** the LLM outputs an action, the tool executes, and the LLM's next output contains `final_answer`
- **THEN** the loop runs exactly one tool call, saves the observation, calls LLM again, and returns the final answer as the assistant reply

#### Scenario: Multiple consecutive tool calls

- **WHEN** the LLM outputs an action, the tool executes, the observation is sent back, and the LLM outputs another action
- **THEN** the loop continues: execute the second tool, save the observation, call LLM again, repeating until `final_answer` appears

#### Scenario: SSE events during multi-turn loop

- **WHEN** the loop runs N tool calls before reaching final_answer
- **THEN** the frontend receives `thought_created` events for each LLM thought and each observation (2N + 1 thought events total), followed by one `message_created` event for the final assistant reply

### Requirement: Tool call count limit of 20

The system SHALL enforce a maximum of 20 tool calls per single user message. If the loop reaches 20 tool calls without producing a `final_answer`, the system MUST terminate the loop and send an SSE `error` event with a message indicating the tool call limit has been exceeded.

#### Scenario: Loop terminates at limit

- **WHEN** the LLM has made 20 consecutive tool calls without producing a `final_answer`
- **THEN** the system stops the loop and sends an SSE `error` event with message "Tool call limit exceeded (max 20 calls per message)"

#### Scenario: Loop completes within limit

- **WHEN** the LLM produces a `final_answer` after 5 tool calls
- **THEN** the loop completes normally with the final answer as the assistant reply
