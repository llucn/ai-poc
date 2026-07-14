## Context

The system currently binds each chat session to a single agent for its entire lifecycle. New sessions default to the `is_default=true` agent, which is not specialized for different request types. The existing architecture has:

- `SessionEntity` with an `agentId` column (immutable after creation)
- `SessionService` that queries the agent once at session start
- Three specialized agents in production: `operational` (business tasks), `rag` (knowledge retrieval), `general` (fallback)
- No mechanism for routing or switching agents mid-conversation

The goal is to introduce a `selector` agent that acts as a router, classifying user intent on the first message and delegating to the appropriate specialized agent.

## Goals / Non-Goals

**Goals:**
- Enable intelligent agent selection based on user intent for new chat sessions
- Support seamless agent switching with context forwarding (original message + routing metadata)
- Maintain conversation continuity when transitioning from selector to target agent
- Provide a system prompt for the `selector` agent that defines classification rules and tool usage patterns
- Create a server-side tool (`agent-switch`) that performs the transition

**Non-Goals:**
- Multi-agent orchestration or parallel agent collaboration within a single session
- Agent switching initiated by target agents (only selector can switch)
- User-visible agent selection UI changes (frontend remains unchanged)
- Agent switching after the first turn (selector only routes on initial message)

## Decisions

### 1. Single-use selector pattern

**Decision:** The `selector` agent only operates on the first user message, then transitions to a target agent. The target agent takes over and completes the conversation.

**Alternatives considered:**
- **Multi-agent orchestration:** Allow any agent to invoke other agents as sub-tasks. Rejected because it adds complexity (result aggregation, failure handling, nested tool loops) and no current use case requires it.
- **Persistent selector:** Keep selector active and proxy all messages through it. Rejected because it doubles LLM calls and adds latency for every turn.

**Rationale:** Single-use routing is simple, fast, and sufficient for the current use case. The selector's job is classification, not conversation.

### 2. Agent switching via session mutation

**Decision:** The `agent-switch` server tool updates `SessionEntity.agentId` mid-conversation and returns a special response that signals the loop to reload the agent and continue.

**Implementation:**
- Add `agentId` as a mutable field (currently immutable after creation)
- `agent-switch` tool updates the session row and returns `{ switched: true, targetAgent: '...' }`
- `SessionService.runLoop` detects this response, reloads agent config, rebuilds system prompt and tools, and continues the loop with the same message context

**Alternatives considered:**
- **New session with history copy:** Create a new session for the target agent and copy message history. Rejected because it breaks session continuity (different session ID) and complicates history reconstruction.
- **Agent routing table:** Introduce a separate `t_session_agent_history` table to track agent transitions. Rejected as premature; a single `agentId` field is sufficient for single-switch scenarios.

**Rationale:** Mutating `agentId` is the simplest approach that preserves session identity and requires minimal schema changes.

### 3. Context forwarding via tool parameters

**Decision:** The `agent-switch` tool accepts three parameters:
- `agent`: Target agent name (string, must match `t_agent.name`)
- `confidence_score`: Confidence score between 0.0 and 1.0 (float)
- `prompt_forward`: Simplified or rephrased user request to pass to the target agent (string)

These parameters are logged in a new `t_agent_switch_log` table for analytics and debugging.

**Alternatives considered:**
- **Implicit context forwarding:** Let the target agent read the original user message from conversation history. Rejected because the selector may need to clarify or simplify the request (e.g., "Help me file an expense report" → "Create an expense report for a business trip").
- **Rich metadata object:** Pass additional fields like `reasoning`, `fallback_agent`, `urgency`. Rejected as over-engineering; start simple and extend if needed.

**Rationale:** Explicit parameters give the selector control over what context is passed, and `prompt_forward` allows the selector to refine the user's intent before handing off.

### 4. System prompt as external documentation

**Decision:** Write the `selector` agent's system prompt to `docs/selector-agent-prompt.md` and manually copy it into the `t_agent.system_prompt` column via SQL or admin UI.

**Alternatives considered:**
- **Seed migration:** Add a migration that inserts the selector agent with the prompt. Rejected because prompt tuning is iterative, and migrations are not suitable for frequently changing text.
- **Prompt file loader:** Read prompts from `docs/` at runtime. Rejected because it adds filesystem dependencies and breaks the existing `t_agent.system_prompt` contract.

**Rationale:** Documentation-first approach allows version control and review of the prompt, while keeping the runtime data model unchanged.

### 5. Agent name resolution

**Decision:** The `agent-switch` tool looks up the target agent by `t_agent.name` (e.g., `'operational'`, `'rag'`, `'general'`). If the name does not exist, the tool returns an error and the selector can retry or fall back to `'general'`.

**Alternatives considered:**
- **Agent ID resolution:** Pass `agentId` directly. Rejected because the selector prompt references semantic names (`operational`, `rag`), not numeric IDs.
- **Fuzzy matching:** Allow partial matches (e.g., `'ops'` → `'operational'`). Rejected as error-prone; explicit names are safer.

**Rationale:** Name-based lookup is human-readable and aligns with how the selector prompt describes agents.

## Risks / Trade-offs

**[Risk] Selector misclassifies user intent** → **Mitigation:** Log all switches with confidence scores to `t_agent_switch_log`. Monitor low-confidence switches and adjust the selector prompt. Provide a `/switch <agent>` command for manual override (future work).

**[Risk] Agent switching breaks conversation context** → **Mitigation:** The target agent receives the full conversation history (including the selector's initial turn) via `reconstructNativeMessages`. The `prompt_forward` parameter provides a clean entry point for the target agent.

**[Risk] Selector becomes a bottleneck for all new sessions** → **Mitigation:** The selector only runs for one turn. Latency impact is limited to the first message. If this becomes an issue, consider caching classification results or using a lightweight classification model (future work).

**[Risk] Tool execution fails mid-switch** → **Mitigation:** If `agent-switch` fails (e.g., target agent not found), the tool returns an error. The selector receives the error as a `tool_result` and can retry with a fallback agent (e.g., `'general'`).

**[Risk] Selector prompt drift** → **Mitigation:** Version control `docs/selector-agent-prompt.md` alongside code. Treat prompt changes as code changes (review, test, deploy).

**[Trade-off] Single switch limit** → The current design only supports one switch per session (selector → target). If a use case requires multi-hop routing (e.g., `selector` → `rag` → `operational`), the architecture would need to support multiple switches. For now, accept this limitation and extend later if needed.

**[Trade-off] No switch history in UI** → The frontend does not display which agent is currently active or that a switch occurred. Users see a seamless conversation. This is acceptable for v1 but may need UI updates if users want visibility into agent routing.
