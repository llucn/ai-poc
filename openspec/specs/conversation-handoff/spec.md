## ADDED Requirements

### Requirement: Reload agent configuration on switch
The system MUST reload agent configuration (system prompt, tools, model config) after an agent switch before continuing the conversation loop.

#### Scenario: Agent reload on successful switch
- **WHEN** agent-switch tool returns `{ switched: true }`
- **THEN** system reloads the target agent's configuration from the database before the next LLM call

#### Scenario: System prompt replacement
- **WHEN** agent is reloaded after switch
- **THEN** system replaces the selector's system prompt with the target agent's system prompt

#### Scenario: Tool set replacement
- **WHEN** agent is reloaded after switch
- **THEN** system replaces the selector's available tools with the target agent's tools

### Requirement: Preserve conversation history
The system MUST preserve the complete conversation history when switching agents, including the selector's initial turn.

#### Scenario: History continuity
- **WHEN** agent switch occurs
- **THEN** target agent receives all messages from the session, including user message and selector's tool_use turn

#### Scenario: Selector turn visibility
- **WHEN** target agent processes the first turn after switch
- **THEN** conversation history includes the selector's agent-switch tool call as a thought message

### Requirement: Forward prompt to target agent context
The system MUST make the `prompt_forward` parameter available to the target agent after the switch.

#### Scenario: Prompt forwarding via system message
- **WHEN** target agent is loaded after switch
- **THEN** system prepends a system-level context message containing the forwarded prompt and routing metadata

#### Scenario: Metadata visibility
- **WHEN** target agent receives forwarded context
- **THEN** context includes `prompt_forward`, `confidence_score`, and source agent name

### Requirement: Continue conversation loop after switch
The system MUST continue the agent loop with the target agent after the switch, processing the original user message.

#### Scenario: Loop continuation
- **WHEN** agent switch completes and agent is reloaded
- **THEN** system continues the loop, calling the target agent's LLM with the current message context

#### Scenario: No duplicate user messages
- **WHEN** loop continues after switch
- **THEN** system does not create a duplicate user message (the original user message is already in history)

### Requirement: Switch only on first turn
The system MUST only allow agent switching on the first turn of a session (when selector is active).

#### Scenario: First turn switch allowed
- **WHEN** session's current agent is the selector and message count is 1 (user message only)
- **THEN** agent-switch tool executes successfully

#### Scenario: Subsequent turn switch blocked
- **WHEN** agent-switch tool is called after the first turn
- **THEN** tool returns error indicating switching is only allowed on first turn
