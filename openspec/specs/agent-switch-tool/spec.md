## ADDED Requirements

### Requirement: Switch agent by name
The agent-switch tool MUST accept a target agent name and switch the current session to that agent.

#### Scenario: Successful agent switch
- **WHEN** tool is called with `agent` parameter set to a valid agent name (e.g., "operational", "rag", "general")
- **THEN** system updates session's `agentId` to the target agent's ID and returns success response

#### Scenario: Invalid agent name
- **WHEN** tool is called with `agent` parameter that does not match any existing agent name
- **THEN** tool returns error message indicating agent not found

#### Scenario: Agent name case sensitivity
- **WHEN** tool is called with agent name in different case (e.g., "Operational", "OPERATIONAL")
- **THEN** tool performs case-insensitive lookup and matches the correct agent

### Requirement: Accept confidence score
The agent-switch tool MUST accept a `confidence_score` parameter between 0.0 and 1.0 to track classification confidence.

#### Scenario: Valid confidence score
- **WHEN** tool is called with `confidence_score` between 0.0 and 1.0
- **THEN** system stores the confidence score in the switch log

#### Scenario: Invalid confidence score
- **WHEN** tool is called with `confidence_score` outside the 0.0-1.0 range
- **THEN** tool returns validation error

### Requirement: Forward prompt to target agent
The agent-switch tool MUST accept a `prompt_forward` parameter containing the user request to pass to the target agent.

#### Scenario: Prompt forwarding
- **WHEN** tool is called with `prompt_forward` parameter
- **THEN** system stores the forwarded prompt and makes it available to the target agent's context

#### Scenario: Empty prompt forwarding
- **WHEN** tool is called with empty or null `prompt_forward`
- **THEN** tool returns validation error requiring non-empty prompt

### Requirement: Log agent switches
The agent-switch tool MUST log all agent switch operations with metadata for analytics and debugging.

#### Scenario: Switch logging
- **WHEN** agent switch is executed
- **THEN** system creates a log entry in `t_agent_switch_log` containing session ID, source agent ID, target agent ID, confidence score, forwarded prompt, and timestamp

#### Scenario: Failed switch logging
- **WHEN** agent switch fails (e.g., invalid agent name)
- **THEN** system creates a log entry with error status and error message

### Requirement: Return switch result
The agent-switch tool MUST return a structured result indicating whether the switch succeeded and which agent was selected.

#### Scenario: Success result
- **WHEN** agent switch completes successfully
- **THEN** tool returns `{ switched: true, targetAgent: "<agent-name>" }`

#### Scenario: Error result
- **WHEN** agent switch fails
- **THEN** tool returns `{ switched: false, error: "<error-message>" }`
