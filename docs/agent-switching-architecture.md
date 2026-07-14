# Agent Switching Architecture

## Overview

The agent switching feature enables intelligent routing of user conversations to specialized agents based on intent classification. A **selector agent** analyzes the first user message and delegates to one of three target agents: `operational`, `rag`, or `general`.

## Architecture Components

### 1. Selector Agent
- **Role:** Intent classifier and router
- **Lifecycle:** Active only on the first user message
- **Tool:** Uses `agent-switch` server tool to perform routing
- **System Prompt:** Defined in `docs/selector-agent-prompt.md`

### 2. Target Agents
- **operational:** Business transactions (work orders, expenses, invoices)
- **rag:** Knowledge retrieval (policies, documentation, maintenance guides)
- **general:** Fallback for ambiguous or general queries

### 3. Agent Switch Tool
- **Type:** Server-side tool (registered in `t_tool` with kind='server')
- **Implementation:** `AgentSwitchToolService` in `packages/api/src/app/tools/`
- **Parameters:**
  - `agent` (string): Target agent name
  - `confidence_score` (number): 0.0-1.0 classification confidence
  - `prompt_forward` (string): Simplified user request for target agent

### 4. Session Management
- **Initial State:** New sessions use selector agent (`is_default=true`)
- **Switch Mechanism:** Updates `t_session.agent_id` mid-conversation
- **Logging:** All switches recorded in `t_agent_switch_log` with metadata

## Decision Flow

```
User sends first message
    ↓
Selector agent analyzes intent
    ↓
Selector calls agent-switch tool
    ↓
Tool validates parameters & checks first-turn constraint
    ↓
Tool updates session.agent_id to target agent
    ↓
Tool logs switch to t_agent_switch_log
    ↓
SessionService detects switch via tool result { switched: true }
    ↓
SessionService reloads agent configuration
    ↓
SessionService rebuilds system prompt + tools
    ↓
SessionService injects forwarding context into system prompt
    ↓
Loop continues with target agent
    ↓
Target agent responds to user
```

## Conversation Handoff Protocol

### Context Preservation
- **Full history:** Target agent receives complete conversation history including selector's tool_use turn
- **No duplication:** User message is NOT duplicated after switch

### Forwarding Context Injection
When agent switch occurs, the target agent's system prompt is prepended with:

```
## Agent Routing Context

This conversation was routed from the "selector" agent.

**Forwarded Request:** <simplified user request>
**Classification Confidence:** <percentage>

The user's original message has been analyzed and categorized for you.
Focus on addressing the forwarded request above.
```

### First-Turn Constraint
- **Enforcement:** Agent switching is ONLY allowed when session has exactly 1 user message
- **Rationale:** Prevents mid-conversation confusion and ensures clean delegation
- **Error Handling:** Subsequent switch attempts return error via tool_result

## Database Schema

### t_agent_switch_log
Records all agent switching operations with metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| session_id | INTEGER | Foreign key to t_session |
| from_agent_id | INTEGER | Source agent (selector) |
| to_agent_id | INTEGER | Target agent (operational/rag/general) |
| confidence_score | DECIMAL(3,2) | Classification confidence (0.0-1.0) |
| prompt_forward | TEXT | Simplified user request |
| switched_at | TIMESTAMP | When the switch occurred |
| created_by | VARCHAR(255) | User who initiated the conversation |
| error_message | TEXT | NULL on success, error description on failure |

**Indexes:**
- `idx_agent_switch_log_session_id` on `session_id`
- `idx_agent_switch_log_switched_at` on `switched_at`

## API Response Format

### Successful Switch
```json
{
  "switched": true,
  "targetAgent": "operational"
}
```

### Failed Switch
```json
{
  "switched": false,
  "error": "Agent not found: invalid_agent"
}
```

## Configuration

### Selector Agent Setup
1. Insert selector agent into `t_agent` with `is_default=true`
2. Set `system_prompt` from `docs/selector-agent-prompt.md`
3. Configure `model_config` with Anthropic API key
4. Link `agent-switch` tool via `t_agent_tool`

### Target Agent Setup
Each target agent must:
- Have a unique `name` (e.g., "operational", "rag", "general")
- Be registered in `t_agent` table
- Have appropriate tools and skills linked

## Performance Considerations

### Cache Optimization
- **System prompt caching:** Selector agent's system prompt is cached (Tier 1)
- **Tool context caching:** Agent-switch tool definition is cached
- **Agent reload:** Target agent's configuration is loaded fresh on switch (no cache)

### Latency Impact
- **First message:** ~200-500ms overhead for selector classification + switch
- **Subsequent messages:** Zero overhead (target agent handles directly)

## Security & Validation

### Input Validation
- Agent name: Required, non-empty, case-insensitive lookup
- Confidence score: Required, 0.0-1.0 range check
- Prompt forward: Required, non-empty string

### Access Control
- Session ownership: Only session owner can trigger switch (via message)
- First-turn constraint: Enforced at service layer (message count check)

### Error Handling
- Invalid agent name → Error logged in t_agent_switch_log
- Invalid confidence → Validation error before DB interaction
- Switch after first turn → Error returned via tool_result

## Monitoring & Analytics

### Key Metrics
- **Switch rate:** % of sessions that switch from selector
- **Confidence distribution:** Histogram of confidence_score values
- **Agent distribution:** % routed to operational vs rag vs general
- **Error rate:** % of failed switches (by error type)

### Query Examples

**Switch rate by date:**
```sql
SELECT DATE(switched_at) as date,
       COUNT(*) as total_switches,
       COUNT(CASE WHEN error_message IS NULL THEN 1 END) as successful,
       COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END) as failed
FROM t_agent_switch_log
GROUP BY DATE(switched_at)
ORDER BY date DESC;
```

**Average confidence by target agent:**
```sql
SELECT a.name as agent,
       AVG(l.confidence_score) as avg_confidence,
       COUNT(*) as switch_count
FROM t_agent_switch_log l
JOIN t_agent a ON l.to_agent_id = a.id
WHERE l.error_message IS NULL
GROUP BY a.name;
```

**Low-confidence switches (need review):**
```sql
SELECT session_id, prompt_forward, confidence_score, switched_at
FROM t_agent_switch_log
WHERE confidence_score < 0.5 AND error_message IS NULL
ORDER BY switched_at DESC
LIMIT 20;
```

## Troubleshooting

See `docs/agent-switching-testing-guide.md` for detailed troubleshooting steps.

### Common Issues
1. **Selector doesn't switch:** Check tool linking and system prompt
2. **Switch fails silently:** Check t_agent_switch_log.error_message
3. **Target agent unaware of context:** Verify forwarding context injection
4. **Multiple switches per session:** First-turn constraint not enforced

## Future Enhancements

### Potential Improvements
- **Multi-hop routing:** Allow target agents to switch to other specialists
- **Confidence threshold tuning:** Adjust selector prompt based on metrics
- **User override:** `/switch <agent>` command for manual routing
- **Agent recommendation:** Suggest agent to user if confidence is low
- **A/B testing:** Compare routing strategies with confidence-based bucketing
