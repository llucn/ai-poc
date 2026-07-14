## 1. Database Schema Changes

- [x] 1.1 Create migration for `t_agent_switch_log` table with columns: id, session_id, from_agent_id, to_agent_id, confidence_score, prompt_forward, switched_at, created_by, error_message
- [x] 1.2 Add index on `t_agent_switch_log.session_id` for efficient lookup
- [x] 1.3 Create `AgentSwitchLogEntity` TypeORM entity matching the new table schema

## 2. Agent Switch Server Tool

- [x] 2.1 Create `AgentSwitchToolService` class in `packages/api/src/app/tools/` directory
- [x] 2.2 Implement `execute()` method accepting parameters: agent (string), confidence_score (number), prompt_forward (string)
- [x] 2.3 Add validation: agent name required, confidence_score 0.0-1.0, prompt_forward non-empty
- [x] 2.4 Implement case-insensitive agent name lookup by querying `t_agent` table
- [x] 2.5 Return error result `{ switched: false, error: "..." }` if agent not found or validation fails
- [x] 2.6 Update session's `agentId` field in database on successful lookup
- [x] 2.7 Create log entry in `t_agent_switch_log` with all metadata (including errors)
- [x] 2.8 Return success result `{ switched: true, targetAgent: "<agent-name>" }` on completion
- [x] 2.9 Register `agent-switch` tool in `ServerToolExecutorService` tool registry

## 3. Session Management Updates

- [x] 3.1 Modify `SessionService.createSession()` to use selector agent (is_default=true) as initial agent
- [x] 3.2 Update `SessionEntity` timestamps (last_activity_time, updated_on) when agent switch occurs
- [x] 3.3 Add agent reload logic in `SessionService.runLoop()` to detect `{ switched: true }` result from tool execution
- [x] 3.4 Implement agent configuration reload: query agent from database by new agentId, rebuild system prompt and tools
- [x] 3.5 Continue loop after agent reload with same message context (no duplicate user messages)

## 4. Conversation Handoff Protocol

- [x] 4.1 Preserve full conversation history including selector's tool_use turn when reconstructing messages
- [x] 4.2 Add forwarded prompt context injection: prepend system-level message with prompt_forward, confidence_score, source agent name to target agent's context
- [x] 4.3 Implement first-turn switch guard: only allow agent-switch tool execution when session has exactly 1 user message and current agent is selector
- [x] 4.4 Return error from agent-switch tool if called after first turn

## 5. Selector Agent System Prompt

- [x] 5.1 Create `docs/selector-agent-prompt.md` file
- [x] 5.2 Write classification rules for three agent types: operational (business tasks like work orders, expenses, invoices), rag (knowledge retrieval from documentation), general (fallback)
- [x] 5.3 Define confidence scoring guidelines: >=0.8 for clear matches, <0.8 for ambiguous cases
- [x] 5.4 Document tool usage pattern: always call agent-switch with agent, confidence_score, prompt_forward parameters
- [x] 5.5 Add prompt forwarding guidelines: pass original message if clear, simplify if contains unnecessary context
- [x] 5.6 Include examples for each agent type classification with Chinese and English queries

## 6. Database Seeding

- [x] 6.1 Create SQL seed script to insert selector agent into `t_agent` table with is_default=true
- [x] 6.2 Copy system prompt from `docs/selector-agent-prompt.md` into selector agent's system_prompt column
- [x] 6.3 Register agent-switch tool in `t_tool` table with kind='server' and proper JSON schema
- [x] 6.4 Link agent-switch tool to selector agent via `t_agent_tool` table

## 7. Testing

- [x] 7.1 Write integration test: new session uses selector agent
- [x] 7.2 Write integration test: agent-switch tool updates session agentId and creates log entry
- [x] 7.3 Write integration test: agent-switch with invalid agent name returns error
- [x] 7.4 Write integration test: agent-switch with invalid confidence_score returns validation error
- [x] 7.5 Write integration test: conversation continues after agent switch with target agent's system prompt
- [x] 7.6 Write integration test: agent-switch blocked after first turn
- [x] 7.7 Write unit test: case-insensitive agent name lookup
- [x] 7.8 Manual test: verify operational agent routing for "创建工作单" query
- [x] 7.9 Manual test: verify rag agent routing for "查询管理制度" query
- [x] 7.10 Manual test: verify general agent routing for ambiguous query

## 8. Documentation

- [x] 8.1 Update API documentation with agent-switch tool parameters and response schema
- [x] 8.2 Document agent routing decision flow in architecture docs
- [x] 8.3 Add troubleshooting guide for low-confidence classifications in selector-agent-prompt.md
