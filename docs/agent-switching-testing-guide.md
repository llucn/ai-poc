# Agent Switching Testing Guide

## Pre-requisites

1. Run database migrations:
   ```bash
   psql -U <user> -d <database> -f packages/api/migrations/001_create_agent_switch_log.sql
   psql -U <user> -d <database> -f packages/api/migrations/002_seed_selector_agent.sql
   ```

2. Ensure the following agents exist in `t_agent` table:
   - `selector` (is_default=true)
   - `operational`
   - `rag`
   - `general`

3. Update `selector` agent's `model_config.authToken` with your Anthropic API key

## Manual Test Cases

### Test 7.8: Operational Agent Routing
**Query:** "创建工作单"

**Expected Result:**
1. New session starts with selector agent
2. Selector calls `agent-switch` tool with:
   - agent: "operational"
   - confidence_score: ~0.9-0.95
   - prompt_forward: "创建工作单"
3. Session's agent_id updates to operational agent
4. Entry created in `t_agent_switch_log`
5. Operational agent responds to the work order request

**Verification:**
```sql
SELECT * FROM t_agent_switch_log ORDER BY switched_at DESC LIMIT 1;
SELECT agent_id FROM t_session WHERE id = <session_id>;
```

### Test 7.9: RAG Agent Routing
**Query:** "查询管理制度"

**Expected Result:**
1. New session starts with selector agent
2. Selector calls `agent-switch` tool with:
   - agent: "rag"
   - confidence_score: ~0.85-0.95
   - prompt_forward: "查询管理制度"
3. Session's agent_id updates to rag agent
4. RAG agent searches knowledge base

**Verification:**
```sql
SELECT to_agent_id, confidence_score, prompt_forward
FROM t_agent_switch_log
WHERE session_id = <session_id>;
```

### Test 7.10: General Agent Routing (Ambiguous)
**Query:** "你好" or "帮我处理一下"

**Expected Result:**
1. New session starts with selector agent
2. Selector calls `agent-switch` tool with:
   - agent: "general"
   - confidence_score: <0.6 (low confidence)
   - prompt_forward: original query or simplified version
3. Session's agent_id updates to general agent
4. General agent responds conversationally

## Integration Test Scenarios (To Be Implemented)

### Test 7.1: New Session Uses Selector Agent
```typescript
describe('SessionService.createSession', () => {
  it('should create new session with selector agent (is_default=true)', async () => {
    // Arrange: ensure selector agent exists with is_default=true
    // Act: call createSession
    // Assert: session.agentId === selector.id
  });
});
```

### Test 7.2: Agent Switch Updates Session and Creates Log
```typescript
describe('AgentSwitchToolService.switchAgent', () => {
  it('should update session agentId and create log entry', async () => {
    // Arrange: create session with selector agent
    // Act: call switchAgent(sessionId, 'operational', 0.9, 'test prompt')
    // Assert:
    //   - session.agentId updated
    //   - t_agent_switch_log entry created
    //   - returns { switched: true, targetAgent: 'operational' }
  });
});
```

### Test 7.3: Invalid Agent Name Returns Error
```typescript
describe('AgentSwitchToolService.switchAgent', () => {
  it('should return error for invalid agent name', async () => {
    // Act: call switchAgent with agent='invalid_agent'
    // Assert: returns { switched: false, error: 'Agent not found: invalid_agent' }
  });
});
```

### Test 7.4: Invalid Confidence Score Returns Error
```typescript
describe('AgentSwitchToolService.switchAgent', () => {
  it('should return error for out-of-range confidence score', async () => {
    // Act: call switchAgent with confidence_score=1.5
    // Assert: returns { switched: false, error: 'Confidence score must be between 0.0 and 1.0' }
  });
});
```

### Test 7.5: Conversation Continues After Switch
```typescript
describe('SessionService.runLoop', () => {
  it('should continue loop with target agent after switch', async () => {
    // Arrange: session with selector agent, mock agent-switch result
    // Act: runLoop detects switch and reloads agent
    // Assert:
    //   - agent config reloaded
    //   - system prompt updated to target agent's prompt
    //   - tools updated to target agent's tools
  });
});
```

### Test 7.6: Agent Switch Blocked After First Turn
```typescript
describe('AgentSwitchToolService.switchAgent', () => {
  it('should block agent switch after first turn', async () => {
    // Arrange: session with 2 user messages
    // Act: call switchAgent
    // Assert: returns { switched: false, error: 'Agent switching is only allowed on the first turn' }
  });
});
```

### Test 7.7: Case-Insensitive Agent Name Lookup
```typescript
describe('AgentSwitchToolService.switchAgent', () => {
  it('should match agent names case-insensitively', async () => {
    // Act: call switchAgent with agent='OPERATIONAL'
    // Assert: successfully matches 'operational' agent
  });
});
```

## Troubleshooting

### Issue: Selector agent doesn't call agent-switch
- Check selector agent's system prompt is correctly set
- Verify agent-switch tool is linked to selector agent in t_agent_tool
- Check LLM logs for errors

### Issue: Agent switch fails silently
- Check t_agent_switch_log for error_message
- Verify target agent exists (name match)
- Check session message count (must be <=1)

### Issue: Target agent doesn't receive forwarding context
- Check t_agent_switch_log.prompt_forward is populated
- Verify checkAndReloadAgent extracts metadata correctly
- Check system prompt injection in rebuildAgentConfig
