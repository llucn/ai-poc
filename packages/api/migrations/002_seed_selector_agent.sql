-- Seed script for selector agent and agent-switch tool
-- Description: Inserts the selector agent with system prompt and registers the agent-switch tool

-- ============================================================
-- 1. Insert Selector Agent
-- ============================================================

-- First, set any existing default agent to non-default
UPDATE t_agent SET is_default = false WHERE is_default = true;

-- Insert the selector agent as the new default
INSERT INTO t_agent (name, description, model_config, is_default, system_prompt, created_on, created_by)
VALUES (
    'selector',
    'Agent routing and classification agent. Analyzes user intent and delegates to specialized agents (operational, rag, general).',
    '{"baseUrl": null, "authToken": "YOUR_ANTHROPIC_API_KEY", "modelName": "claude-sonnet-4-6"}'::jsonb,
    true,
    '# Selector Agent System Prompt

You are a **Selector Agent** responsible for analyzing user requests and routing conversations to the appropriate specialized agent. Your role is to classify the user''s intent on the **first message only** and delegate to one of three target agents.

## Available Target Agents

### 1. `operational` - Business Operations Agent
**Purpose:** Handles transactional business tasks and workflow operations.

**Route here when the user wants to:**
- Create, update, or query work orders (工作单)
- Submit or manage expense reports (报销单)
- Process purchase orders or procurement requests (采购单)
- Generate or manage invoices (开发票)
- Execute any business process or workflow task
- Perform CRUD operations on business entities

**Examples:**
- "创建一个工作单" / "Create a work order"
- "我要报销" / "I need to file an expense report"
- "查询我的采购订单" / "Check my purchase orders"

### 2. `rag` - Knowledge Retrieval Agent
**Purpose:** Searches and retrieves information from the organization''s knowledge base.

**Route here when the user wants to:**
- Find company policies or regulations (管理制度)
- Look up work procedures or guidelines (工作规则、工作流程)
- Access equipment maintenance guides (设备运行维护知识)
- Search documentation, manuals, or knowledge articles

**Examples:**
- "查询管理制度" / "Look up company policies"
- "设备维护手册在哪" / "Where is the equipment maintenance manual"
- "工作流程是什么" / "What''s the workflow process"

### 3. `general` - General Purpose Agent
**Purpose:** Handles general inquiries, ambiguous requests, and everything else.

**Route here when:**
- The user''s intent doesn''t clearly match `operational` or `rag`
- The request is conversational, exploratory, or open-ended
- You''re uncertain which category fits best (use this as fallback)

## Classification Guidelines

### Confidence Scoring
- **High confidence (0.8-1.0):** Intent is clear and unambiguous.
- **Medium confidence (0.5-0.79):** Intent leans toward one category but could overlap.
- **Low confidence (0.0-0.49):** Intent is unclear. Default to `general`.

## Tool Usage

You MUST call the `agent-switch` tool immediately after classifying the user''s request. Do NOT engage in conversation yourself.

### Tool Parameters
- **agent** (required): One of `operational`, `rag`, or `general`
- **confidence_score** (required): Float between 0.0 and 1.0
- **prompt_forward** (required): The user''s request, simplified if needed

## Example Interactions

**User:** "创建工作单"
**Action:** agent-switch(agent="operational", confidence_score=0.95, prompt_forward="创建工作单")

**User:** "查询公司的管理制度"
**Action:** agent-switch(agent="rag", confidence_score=0.9, prompt_forward="查询公司的管理制度")

**User:** "帮我处理一下"
**Action:** agent-switch(agent="general", confidence_score=0.3, prompt_forward="帮我处理一下（需要明确具体任务）")

## Important Reminders
1. **One-time routing:** You only run on the FIRST user message.
2. **No conversation:** Always call `agent-switch` immediately.
3. **Fallback to general:** When in doubt, choose `general`.',
    NOW(),
    'system'
)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    is_default = EXCLUDED.is_default,
    system_prompt = EXCLUDED.system_prompt,
    updated_on = NOW(),
    updated_by = 'system';

-- ============================================================
-- 2. Register agent-switch Tool
-- ============================================================

-- Insert the agent-switch server tool
INSERT INTO t_tool (server_name, server_url, kind, source, mcp_schema, created_on, created_by)
VALUES (
    'agent-switch',
    '',
    'server',
    'registry',
    '[{
        "name": "agent-switch",
        "description": "Switch the session to a different agent based on user intent. Use this tool to route the conversation to the appropriate specialized agent (operational, rag, or general). Can only be called on the first turn. Returns { switched: true, targetAgent: \"...\" } on success or { switched: false, error: \"...\" } on failure.",
        "parameters": {
            "type": "object",
            "properties": {
                "agent": {
                    "type": "string",
                    "description": "Target agent name. Must be one of: operational, rag, general. Case-insensitive."
                },
                "confidence_score": {
                    "type": "number",
                    "minimum": 0.0,
                    "maximum": 1.0,
                    "description": "Classification confidence score between 0.0 and 1.0. Use >=0.8 for clear matches, <0.8 for ambiguous cases."
                },
                "prompt_forward": {
                    "type": "string",
                    "description": "User request to pass to the target agent. Pass the original message if clear, or simplify if it contains unnecessary context."
                }
            },
            "required": ["agent", "confidence_score", "prompt_forward"]
        }
    }]'::jsonb,
    NOW(),
    'system'
)
ON CONFLICT (server_name) DO UPDATE SET
    mcp_schema = EXCLUDED.mcp_schema,
    updated_on = NOW(),
    updated_by = 'system';

-- ============================================================
-- 3. Link agent-switch Tool to Selector Agent
-- ============================================================

-- Link the agent-switch tool to the selector agent
INSERT INTO t_agent_tool (agent_id, tool_id, created_on, created_by)
SELECT
    (SELECT id FROM t_agent WHERE name = 'selector'),
    (SELECT id FROM t_tool WHERE server_name = 'agent-switch'),
    NOW(),
    'system'
WHERE NOT EXISTS (
    SELECT 1 FROM t_agent_tool
    WHERE agent_id = (SELECT id FROM t_agent WHERE name = 'selector')
      AND tool_id = (SELECT id FROM t_tool WHERE server_name = 'agent-switch')
);

-- ============================================================
-- Verification Queries
-- ============================================================

-- Verify selector agent was created
SELECT id, name, is_default, LENGTH(system_prompt) as prompt_length
FROM t_agent WHERE name = 'selector';

-- Verify agent-switch tool was registered
SELECT id, server_name, kind, jsonb_array_length(mcp_schema) as schema_count
FROM t_tool WHERE server_name = 'agent-switch';

-- Verify tool is linked to selector agent
SELECT
    a.name as agent_name,
    t.server_name as tool_name
FROM t_agent_tool at
JOIN t_agent a ON at.agent_id = a.id
JOIN t_tool t ON at.tool_id = t.id
WHERE a.name = 'selector';
