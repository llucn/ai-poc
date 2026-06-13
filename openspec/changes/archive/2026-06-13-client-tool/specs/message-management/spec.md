## MODIFIED Requirements

### Requirement: Echo assistant response (mock)
系统 MUST 在用户发送消息后调用真实 LLM 生成回复。Thought message 保存 LLM 输出原文；Assistant reply 的内容通过解析 LLM 输出的 JSON 提取得到。LLM 被要求以结构化 JSON 回复（`{"thought": "...", "final_answer": "..."}` 或 `{"thought": "...", "action": {...}}`），系统据此确定 reply 内容。

**LLM 调用所用的 system 角色内容 MUST 由四段拼装而成（按以下顺序、以空行分隔）：**
1. `packages/api/src/app/agent/system-prompt.ts` 导出的 `SYSTEM_PROMPT`
2. 该会话 Agent 的 `systemPrompt`（为空时跳过）
3. `{"available_tools": [...]}` 的 JSON 字符串，列出该 Agent 通过 `t_agent_tool` 关联的所有 Tool 的 `mcp_schema` 中的工具，**按 `t_tool.kind` 添加前缀**：kind='mcp' 的工具名格式为 `mcp__<toolId>__<actualToolName>`，kind='client' 的工具名格式为 `client__<toolId>__<actualToolName>`（toolId 是 `t_tool.id`）。无关联工具时仍输出 `{"available_tools": []}`
4. `{"available_skills": [...]}` 的 JSON 字符串，列出该 Agent 通过 `t_agent_skill` 关联的所有 Skill（每项含 `name`、`description`），无关联技能时仍输出 `{"available_skills": []}`

**LLM Loop 扩展为支持 Client Tool 挂起/恢复：**
- 当 LLM 返回 action 且 `action.tool` 以 `client__` 开头时，服务端**不执行工具**，而是**挂起 Loop**：写入 `t_pending_client_call` 表（生成 UUID 作为 callId，存储 sessionId / agentId / toolId / toolName / params / messageContext），通过 SSE 发送 `{ event: 'client_call', data: { callId, toolName, params } }`，结束本次响应。
- 浏览器接收 `client_call` 事件后执行 Client Tool，通过 `POST /sessions/:id/client-result` 回传 `{ callId, result }` 或 `{ callId, error }`。
- 服务端接收回传后，从 `t_pending_client_call` 加载 messageContext（挂起时的 messages 数组），拼接 observation 消息（role='observation'，content 为 result 或 error 的 JSON 字符串），更新 status='completed'，**恢复 Loop**（将更新后的 messages 发送给 LLM，继续循环直到 final_answer 或再次挂起）。
- 当 `action.tool` 以 `mcp__` 开头时，保持现有行为（通过 `McpClientService` 调用 MCP 服务器，同步返回 observation，继续 Loop）。

#### Scenario: 解析 final_answer 作为回复
- **WHEN** LLM 输出可成功解析为 JSON 且第一层含 `final_answer` 属性
- **THEN** Thought 保存 LLM 原文；Assistant reply 的 content 为 `final_answer` 的值（非字符串时序列化为字符串）

#### Scenario: 无 final_answer 时回退到 action
- **WHEN** LLM 输出可成功解析为 JSON，第一层不含 `final_answer` 但含 `action` 属性
- **THEN** Thought 保存 LLM 原文；Assistant reply 的 content 为 `action` 的值（字符串直接使用，对象序列化为字符串）

#### Scenario: JSON 解析失败时返回错误信息
- **WHEN** LLM 输出无法解析为合法 JSON
- **THEN** Thought 保存 LLM 原文；Assistant reply 的 content 为解析错误信息

#### Scenario: 既无 final_answer 也无 action
- **WHEN** LLM 输出可解析为 JSON，但第一层既不含 `final_answer` 也不含 `action`
- **THEN** Thought 保存 LLM 原文；Assistant reply 的 content 为提示缺少 `final_answer`/`action` 的错误信息

#### Scenario: 两个流程行为一致
- **WHEN** 用户在新会话发送第一条消息（`createSessionWithFirstMessage`）或在已有会话发送后续消息（`createMessage`）
- **THEN** 两个流程使用同一套解析逻辑确定 Assistant reply 内容，行为一致

#### Scenario: System 内容拼装四段
- **WHEN** 系统调用 LLM 时构建 `llmMessages`
- **THEN** 第一条消息的 `role` 为 `system`，其 `content` 依次包含 `SYSTEM_PROMPT` 文本、`agent.systemPrompt`（若非空）、`{"available_tools":[...]}` JSON 字符串、`{"available_skills":[...]}` JSON 字符串，四段之间以空行分隔

#### Scenario: available_tools 反映 MCP 和 Client 两种工具
- **WHEN** 当前会话的 Agent 通过 `t_agent_tool` 关联了 N 个 Tool（包含 kind='mcp' 和 kind='client'）
- **THEN** `available_tools` 数组的元素由这 N 个 Tool 的 `mcp_schema` 展平得到，每项至少包含 `name`、`description`、`parameters`
- **AND** kind='mcp' 的工具 `name` 格式为 `mcp__<toolId>__<actualToolName>`
- **AND** kind='client' 的工具 `name` 格式为 `client__<toolId>__<actualToolName>`
- **AND** toolId 是 `t_tool.id`

#### Scenario: available_skills 反映 Agent 关联的 Skills
- **WHEN** 当前会话的 Agent 通过 `t_agent_skill` 关联了 M 个 Skill
- **THEN** `available_skills` 数组列出这 M 个 Skill，每项含 `name` 与 `description`（`description` 缺失时为空字符串）

#### Scenario: 无关联时仍输出空数组
- **WHEN** 当前会话的 Agent 没有关联任何 Tool 或 Skill
- **THEN** system 内容仍包含 `{"available_tools": []}` 或 `{"available_skills": []}`，不省略对应段落

#### Scenario: LLM 返回 MCP Tool action（现有行为）
- **GIVEN** LLM 返回 action `{ tool: "mcp__2__get_weather", params: { city: "Beijing" } }`
- **WHEN** 服务端解析 tool 字段发现 `mcp__` 前缀
- **THEN** 通过 `McpClientService` 调用对应 MCP 服务器的 `get_weather` 工具
- **AND** 包装返回结果为 observation 消息（role='observation'，content 为工具返回的 JSON 字符串）
- **AND** 继续 LLM Loop（将更新后的 messages 发送给 LLM）

#### Scenario: LLM 返回 Client Tool action（挂起）
- **GIVEN** LLM 返回 action `{ tool: "client__1__console-log-echo", params: { message: "test" } }`
- **WHEN** 服务端解析 tool 字段发现 `client__` 前缀
- **THEN** 提取 toolId=1，toolName="console-log-echo"，不调用 MCP 服务
- **AND** 在 `t_pending_client_call` 表插入记录（callId 为新生成的 UUID，status='pending'，messageContext 存储当前 messages 数组）
- **AND** 通过 SSE 发送 `{ event: 'client_call', data: { callId: "<uuid>", toolName: "console-log-echo", params: { message: "test" } } }`
- **AND** 结束本次 SSE 响应（Loop 挂起）

#### Scenario: 浏览器回传 Client Tool 结果后恢复
- **GIVEN** 浏览器执行 Client Tool 成功，POST `/sessions/123/client-result`，body 为 `{ callId: "abc-123", result: { echo: "test", timestamp: 1718000000000 } }`
- **WHEN** 服务端接收回传请求
- **THEN** 从 `t_pending_client_call` 表查找 callId="abc-123" 的记录（验证 status='pending'）
- **AND** 提取 messageContext（挂起时的 messages 数组）
- **AND** 拼接 observation 消息 `{ role: 'observation', content: '{"echo":"test","timestamp":1718000000000}' }` 到 messages 末尾
- **AND** 更新 `t_pending_client_call` 记录的 status='completed'
- **AND** 将更新后的 messages 发送给 LLM，恢复 Loop（LLM 可能返回 final_answer 或新的 action）

#### Scenario: 回传错误结果
- **GIVEN** 浏览器执行 Client Tool 失败，POST `/sessions/123/client-result`，body 为 `{ callId: "abc-123", error: "Tool execution failed" }`
- **WHEN** 服务端接收回传请求
- **THEN** 拼接 observation 消息 `{ role: 'observation', content: '{"error":"Tool execution failed"}' }` 到 messages 末尾
- **AND** 更新 status='completed'，恢复 Loop

#### Scenario: 重复回传幂等性检查
- **GIVEN** `t_pending_client_call` 表中 callId="abc-123" 的记录 status 已为 'completed'
- **WHEN** 浏览器重复 POST `/sessions/123/client-result` 同一 callId
- **THEN** 服务端返回 200 但不执行恢复逻辑（识别为重复请求，已处理）
