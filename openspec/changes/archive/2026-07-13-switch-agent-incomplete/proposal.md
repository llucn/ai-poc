## Why

Currently, all new chat sessions automatically use a single Default Agent, regardless of the user's intent. Different request types (operational tasks, knowledge retrieval, general inquiries) require different agent capabilities and system prompts. Without intelligent routing, users must manually select agents or accept suboptimal responses. An agent selector architecture enables the system to route requests to the most appropriate agent based on user intent, improving response quality and user experience.

## What Changes

- Create a new `selector` Agent that acts as the Default Agent for all new chat sessions
- Implement agent classification logic in the `selector` Agent's system prompt to determine the appropriate target agent based on user input
- Add an `agent-switch` server tool that enables the selector to transition a conversation to a target agent with context forwarding
- Design a conversation handoff protocol that passes the original user message and routing metadata (agent name, confidence score, forwarded prompt) to the target agent
- Update session management to support mid-conversation agent switching
- Create system prompt documentation for the `selector` Agent at `docs/selector-agent-prompt.md`

## Capabilities

### New Capabilities
- `agent-routing`: Classification logic that analyzes user input and determines the target agent (`operational`, `rag`, `general`) with confidence scoring
- `agent-switch-tool`: Server-side tool that performs agent switching with context forwarding, including parameters for target agent name, confidence score, and forwarded prompt
- `conversation-handoff`: Protocol for transferring conversation state and context when switching from selector to target agent

### Modified Capabilities
- `session-management`: Extend session entity and service to support agent switching during an active conversation (currently sessions are bound to a single agent for their entire lifecycle)

## Impact

- **Backend**:
  - New `selector` Agent configuration in `t_agent` table
  - New server tool registration in `t_tool` for `agent-switch`
  - `SessionService` extended to handle mid-conversation agent changes
  - `SessionEntity` may need to track agent transition history
- **Database**: New columns or related tables to store agent routing metadata (confidence scores, routing reasons)
- **System Prompts**: New prompt for `selector` Agent defining classification rules and tool usage patterns
- **Documentation**: New file `docs/selector-agent-prompt.md` with the complete selector agent prompt
