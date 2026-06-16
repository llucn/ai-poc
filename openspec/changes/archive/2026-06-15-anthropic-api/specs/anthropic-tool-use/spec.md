## ADDED Requirements

### Requirement: Anthropic Messages API as LLM backend

The system SHALL call the Anthropic Messages API (via `@anthropic-ai/sdk`) as the LLM backend for the agent loop, using the agent's `model_config` where `authToken` maps to the API key, `modelName` maps to a Claude model id, and `baseUrl` (when present) maps to the API base URL. The system MUST send requests non-streaming (`messages.create`) and MUST supply a `max_tokens` value.

#### Scenario: Agent config drives the Anthropic client

- **WHEN** the loop calls the LLM for an agent whose `model_config` is `{ authToken, modelName, baseUrl }`
- **THEN** the system constructs an Anthropic client with that API key and base URL and calls `messages.create` with the configured Claude model id and a `max_tokens` value

#### Scenario: Missing required config

- **WHEN** an agent's `model_config` lacks `authToken` or `modelName`
- **THEN** the system raises a configuration error before attempting the API call

#### Scenario: Response truncated by token limit

- **WHEN** the Anthropic response returns `stop_reason: "max_tokens"`
- **THEN** the system surfaces this as an error rather than treating the partial text as a final answer

### Requirement: System prompt and skills passed via the system parameter

The system SHALL pass instruction content through the Anthropic `system` request parameter, composed of the rewritten base system prompt, the agent's `systemPrompt`, and the agent's `available_skills` rendered as text. The base system prompt MUST NOT contain JSON-envelope protocol instructions (pure-JSON output, no-code-fence, fabricated-observation prohibitions, or action-format rules), because the Tool Use mechanism enforces structure at the API layer.

#### Scenario: System parameter composition

- **WHEN** the system builds an Anthropic request for an agent
- **THEN** the `system` parameter contains the base prompt, the agent's own system prompt, and the available skills, joined as text

#### Scenario: Protocol scaffolding removed

- **WHEN** the base system prompt is inspected
- **THEN** it contains no instructions to emit a single raw JSON object, avoid code fences, or never fabricate observations

#### Scenario: Read-skill guidance retained

- **WHEN** the agent has skills available and the base prompt is inspected
- **THEN** the rule to read a matching skill before acting and the rule to ask the user via the final answer (not via a tool) are retained

### Requirement: Agent tools declared as native Anthropic tools

The system SHALL declare the agent's available tools in the Anthropic `tools` request parameter, mapping each entry from the existing tool source to `{ name, description, input_schema }`, where `name` retains the `mcp__<id>__<name>` or `client__<id>__<name>` convention and `input_schema` is the tool's parameter JSON Schema (defaulting to an empty object schema when none is provided).

#### Scenario: Tools mapped to native format

- **WHEN** an agent has associated tools
- **THEN** each tool appears in the request `tools` array with its prefixed name, description, and `input_schema`

#### Scenario: Tool name convention preserved for routing

- **WHEN** the model returns a `tool_use` block with name `client__3__select-users`
- **THEN** the existing tool-name parser routes it as a client tool with id 3 and name `select-users`, unchanged from before

#### Scenario: Tool with no parameter schema

- **WHEN** a tool has no parameter schema
- **THEN** its `input_schema` defaults to an object schema with no required properties

### Requirement: Structured turn result from the LLM call

The system SHALL map the Anthropic response content blocks into a structured turn result distinguishing a final answer (`stop_reason: "end_turn"`, assistant text), a tool call (`stop_reason: "tool_use"`, carrying the `tool_use` block's id, name, and input), and an error (transport or SDK failure). The system MUST NOT parse a JSON envelope or strip Markdown fences from the model output.

#### Scenario: Final answer turn

- **WHEN** the response has `stop_reason: "end_turn"` with a text block
- **THEN** the turn result is a final answer carrying that text

#### Scenario: Tool-use turn

- **WHEN** the response has `stop_reason: "tool_use"` with a `tool_use` block
- **THEN** the turn result carries the block's `id`, `name`, and `input` (the validated tool parameters) directly, with no JSON parsing step

#### Scenario: Transport error

- **WHEN** the Anthropic API call fails
- **THEN** the turn result is an error carrying the failure message, and the loop surfaces it via an SSE `error` event
