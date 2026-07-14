# Agent Switch Tool API Documentation

## Tool: agent-switch

**Type:** Server-side tool
**Purpose:** Switch the current session to a different agent based on user intent classification
**Availability:** Selector agent only
**Constraint:** Can only be called on the first turn of a conversation

## Parameters

### agent
- **Type:** `string`
- **Required:** Yes
- **Description:** Target agent name. Must be one of: `operational`, `rag`, or `general` (case-insensitive)
- **Validation:** Non-empty string, must match an existing agent name in the database

**Examples:**
```json
"operational"
"rag"
"general"
"OPERATIONAL"  // Case-insensitive, matches "operational"
```

### confidence_score
- **Type:** `number`
- **Required:** Yes
- **Description:** Classification confidence score indicating how certain the selector is about the routing decision
- **Range:** 0.0 to 1.0 (inclusive)
- **Validation:** Must be between 0.0 and 1.0

**Guidelines:**
- **High confidence (0.8-1.0):** Intent is clear and unambiguous
- **Medium confidence (0.5-0.79):** Intent leans toward one category but has some overlap
- **Low confidence (0.0-0.49):** Intent is unclear; fallback to `general` recommended

**Examples:**
```json
0.95  // Very clear operational task
0.85  // Clear but could have minor ambiguity
0.6   // Somewhat uncertain
0.3   // Very uncertain, likely general
```

### prompt_forward
- **Type:** `string`
- **Required:** Yes
- **Description:** The user's request to pass to the target agent. Can be the original message or a simplified version
- **Validation:** Non-empty string

**Guidelines:**
- **Clear request:** Pass the original message unchanged
- **Request with context:** Simplify to the core request
  - "你好，我想问一下能不能帮我创建一个工作单" → "创建一个工作单"
- **Ambiguous request:** Add clarification
  - "帮我处理一下" → "帮我处理一下（需要明确具体任务）"

**Examples:**
```json
"创建工作单"
"查询公司的管理制度"
"File an expense report"
"帮我处理一下（需要明确具体任务）"
```

## Response Schema

### Success Response
```typescript
{
  switched: true,
  targetAgent: string  // Name of the target agent (e.g., "operational")
}
```

**Example:**
```json
{
  "switched": true,
  "targetAgent": "operational"
}
```

### Error Response
```typescript
{
  switched: false,
  error: string  // Error description
}
```

**Possible Error Messages:**
- `"Agent name is required"`
- `"Confidence score must be between 0.0 and 1.0"`
- `"Prompt forward is required"`
- `"Agent not found: <agent-name>"`
- `"Session <session-id> not found"`
- `"Agent switching is only allowed on the first turn"`

**Example:**
```json
{
  "switched": false,
  "error": "Agent not found: invalid_agent"
}
```

## Usage Examples

### Example 1: Successful Switch to Operational Agent
**Input:**
```json
{
  "agent": "operational",
  "confidence_score": 0.95,
  "prompt_forward": "创建工作单"
}
```

**Output:**
```json
{
  "switched": true,
  "targetAgent": "operational"
}
```

**Effect:**
- Session's `agent_id` updated to operational agent
- Entry created in `t_agent_switch_log`
- Conversation continues with operational agent
- Operational agent receives forwarding context in system prompt

### Example 2: Successful Switch to RAG Agent
**Input:**
```json
{
  "agent": "rag",
  "confidence_score": 0.9,
  "prompt_forward": "查询公司的管理制度"
}
```

**Output:**
```json
{
  "switched": true,
  "targetAgent": "rag"
}
```

### Example 3: Fallback to General Agent (Low Confidence)
**Input:**
```json
{
  "agent": "general",
  "confidence_score": 0.3,
  "prompt_forward": "帮我处理一下（需要明确具体任务）"
}
```

**Output:**
```json
{
  "switched": true,
  "targetAgent": "general"
}
```

### Example 4: Invalid Agent Name (Error)
**Input:**
```json
{
  "agent": "invalid_agent",
  "confidence_score": 0.9,
  "prompt_forward": "test"
}
```

**Output:**
```json
{
  "switched": false,
  "error": "Agent not found: invalid_agent"
}
```

**Effect:**
- Session's `agent_id` NOT updated
- Error entry created in `t_agent_switch_log` with `error_message` populated
- Selector agent receives error in tool_result and can retry

### Example 5: Invalid Confidence Score (Error)
**Input:**
```json
{
  "agent": "operational",
  "confidence_score": 1.5,
  "prompt_forward": "test"
}
```

**Output:**
```json
{
  "switched": false,
  "error": "Confidence score must be between 0.0 and 1.0"
}
```

### Example 6: Switch After First Turn (Error)
**Input:** (called on second or later turn)
```json
{
  "agent": "operational",
  "confidence_score": 0.9,
  "prompt_forward": "test"
}
```

**Output:**
```json
{
  "switched": false,
  "error": "Agent switching is only allowed on the first turn"
}
```

## Side Effects

### Database Changes
1. **t_session:** `agent_id`, `last_activity_time`, `updated_on`, `updated_by` updated
2. **t_agent_switch_log:** New row created with switch metadata (or error if failed)

### Runtime Effects
1. **Agent reload:** SessionService reloads agent configuration from database
2. **System prompt update:** Target agent's system prompt replaces selector's
3. **Tool set update:** Target agent's tools replace selector's
4. **Context injection:** Forwarding context prepended to system prompt

## Implementation Notes

### First-Turn Constraint
The tool checks the message count in the session:
```typescript
const messageCount = await this.messageRepo.count({
  where: { sessionId, messageType: 1 },  // messageType: 1 = user messages
});
if (messageCount > 1) {
  return { switched: false, error: 'Agent switching is only allowed on the first turn' };
}
```

### Case-Insensitive Lookup
Agent names are matched case-insensitively:
```typescript
const targetAgent = await this.agentRepo
  .createQueryBuilder('agent')
  .where('LOWER(agent.name) = LOWER(:name)', { name: agent.trim() })
  .getOne();
```

### Logging Strategy
All switch attempts (success and failure) are logged:
```typescript
await this.createSwitchLog(
  sessionId,
  fromAgentId,
  toAgentId,
  confidenceScore,
  promptForward,
  createdBy,
  errorMessage  // NULL on success, error description on failure
);
```

## Testing

See `docs/agent-switching-testing-guide.md` for comprehensive test cases.

## Related Documentation

- **Architecture:** `docs/agent-switching-architecture.md`
- **Selector Prompt:** `docs/selector-agent-prompt.md`
- **Testing Guide:** `docs/agent-switching-testing-guide.md`
