## 1. 数据库迁移

- [x] 1.1 t_tool 表增加 `kind VARCHAR(16) NOT NULL DEFAULT 'mcp'` 字段，添加索引 `idx_tool_kind`
- [x] 1.2 创建 t_pending_client_call 表：id (PK)、call_id (UNIQUE)、session_id、agent_id、tool_id、tool_name、params (JSON)、message_context (JSON)、status ('pending'/'completed'/'failed'/'timeout')、created_on、created_by、updated_on、updated_by
- [x] 1.3 为 t_pending_client_call 添加索引：call_id UNIQUE、session_id、status
- [x] 1.4 手动在 t_tool 表录入测试工具 console-log-echo（kind='client'，server_name='console-log-echo'，server_url=''，mcp_schema 包含工具定义 JSON）

## 2. 后端（API）- 数据模型与实体

- [x] 2.1 修改 ToolEntity：增加 `kind` 字段（枚举 'mcp' | 'client'，默认 'mcp'）
- [x] 2.2 新建 PendingClientCallEntity：映射 t_pending_client_call 表，字段包含 callId / sessionId / agentId / toolId / toolName / params / messageContext / status / timestamps
- [x] 2.3 在 DatabaseModule 注册 PendingClientCallEntity
- [x] 2.4 修改 ToolDto（CreateToolDto / UpdateToolDto / ToolResponseDto）：增加 `kind` 字段（可选，默认 'mcp'）

## 3. 后端（API）- Tool 服务扩展

- [x] 3.1 修改 ToolService.create：支持 kind 字段，kind='client' 时允许 serverUrl 为空
- [x] 3.2 修改 ToolService.update：支持更新 kind 字段
- [x] 3.3 修改 ToolService.test：kind='client' 时返回 400 错误或跳过测试（"Test endpoint is not applicable to Client Tools"）
- [x] 3.4 修改 ToolController.test：增加 kind 判断逻辑（服务层 testServer 已对空 URL 抛 400，控制器委托即可）

## 4. 后端（API）- Session 服务扩展（挂起逻辑）

- [x] 4.1 在 session.service.ts 增加 `parseToolName` 方法：解析 `client__<toolId>__<toolName>` 或 `mcp__<toolId>__<toolName>`，返回 { prefix, toolId, toolName }
- [x] 4.2 修改 `buildSystemContent` 方法：在构建 available_tools 时，根据 t_tool.kind 添加 `mcp__` 或 `client__` 前缀（`${kind}__${tool.id}__${actualToolName}`）
- [x] 4.3 修改 `runLlmTurn` 方法：解析 LLM 返回的 action.tool 字段，若前缀为 `client__`，进入挂起分支（重构为可重入 `runLoop`）
- [x] 4.4 实现挂起分支逻辑：提取 toolId / toolName / params，生成 callId（UUID），在 t_pending_client_call 插入记录（status='pending'，messageContext 存储当前 messages 数组）
- [x] 4.5 在挂起分支中通过 SSE 发送 `{ event: 'client_call', data: { callId, toolName, params } }`，结束本次响应
- [x] 4.6 保持 MCP Tool 分支不变：若前缀为 `mcp__`，通过 McpClientService 调用工具，拼接 observation，继续 Loop

## 5. 后端（API）- Session 服务扩展（恢复逻辑）

- [x] 5.1 新增 `resumeClientResult` 方法：接收 callId 和 clientResult（{ result } 或 { error }），从 t_pending_client_call 加载 messageContext
- [x] 5.2 在 `resumeClientResult` 中拼接 observation 消息（content 为 clientResult 的 JSON 字符串，复用 buildObservationContent / buildErrorObservationContent）
- [x] 5.3 更新 t_pending_client_call 的 status='completed'
- [x] 5.4 将更新后的 messages 发送给 LLM，继续 Loop（可能返回 final_answer 或新 action）
- [x] 5.5 处理恢复后的 LLM 响应：若返回 final_answer 则结束；若返回新 action 则再次分发（可能再次挂起或调用 MCP Tool）

## 6. 后端（API）- Session 控制器新增端点

- [x] 6.1 新增 `POST /sessions/:id/client-result` 端点：接收 body `{ callId, result?, error? }`（SSE 响应流）
- [x] 6.2 在端点中查询 t_pending_client_call 表（通过 callId），验证 status='pending'（幂等性检查：若已 completed 则发送 done 事件返回）
- [x] 6.3 调用 `SessionService.resumeClientResult(...)`
- [x] 6.4 处理异常：callId 不存在/不属于会话抛 NotFound，status 非 pending 发送 done 事件（幂等），其他错误发送 error 事件

## 7. 后端（API）- SSE 消息扩展

- [x] 7.1 在 session.service.ts 的 SSE 响应流中增加 `client_call` 事件类型（已有 message / thought / final_answer / error）
- [x] 7.2 确认 `client_call` 事件数据格式：`{ callId: string, toolName: string, params: object }`
- [ ] 7.3 测试 SSE 流：挂起时发送 client_call 事件，前端能正确接收（端到端手工验证）

## 8. 前端（Web）- SSE 事件扩展（chat-page 内联消费）

- [x] 8.1 在 chat-page.tsx 的 SSE 消费逻辑中增加 `client_call` 事件监听（已有 thought_created / message_created / error；项目用内联 fetchEventSource，非独立 hook）
- [x] 8.2 定义 client_call 数据类型：`{ callId: string; toolName: string; params: unknown }`
- [x] 8.3 当接收到 `event: 'client_call'` 时，捕获 callId/toolName/params 并驱动恢复循环

## 9. 前端（Web）- ClientToolExecutor 模块

- [x] 9.1 新建 `packages/web/src/app/pages/chat/client-tool-executor.ts`：导出注册/执行函数
- [x] 9.2 实现工具注册表：`Map<string, ClientToolHandler>`，key 为 toolName
- [x] 9.3 实现 `registerClientTool(toolName, handler)` 方法：注册工具实现
- [x] 9.4 实现 `executeClientTool(toolName, params): Promise<{ result } | { error }>`：查找并执行工具，捕获异常包装为 { error }
- [x] 9.5 注册测试工具 `console-log-echo`：`console.log(params.message)` 后返回 `{ echo, timestamp }`

## 10. 前端（Web）- Chat 页面集成 Client Tool

- [x] 10.1 在 chat-page.tsx 中引入 executeClientTool
- [x] 10.2 在 client_call 处理中调用 `executeClientTool(toolName, params)`
- [x] 10.3 执行完成后，POST 到 `/sessions/${sessionId}/client-result`，body 为 `{ callId, result }` 或 `{ callId, error }`，并消费恢复流
- [x] 10.4 UI 状态扩展：增加 `pendingClientTool` 状态，显示 "Executing client tool: {toolName}…"
- [x] 10.5 回传后清除 `pendingClientTool` 状态，恢复流推送新消息

## 11. 前端（Web）- Tool 管理界面扩展

- [x] 11.1 修改 add-tool.tsx / edit-tool.tsx：增加 kind 选择器（单选框或下拉菜单：MCP Tool / Client Tool）
- [x] 11.2 kind='client' 时，隐藏或置灰 Test 按钮，提示 "Client Tools do not require server connectivity test"
- [x] 11.3 kind='client' 时，serverUrl 字段可留空（前端不强制校验 URL 格式），增加 mcpSchema 文本框（多行输入，粘贴 JSON）
- [x] 11.4 修改 all-tools.tsx：增加 "Type" 列，显示 kind（MCP 显示蓝色徽章，Client 显示绿色徽章）
- [x] 11.5 修改 tool-detail.tsx：显示 kind 字段，kind='client' 时不显示在线状态检测（或显示 "N/A"）

## 12. 前端（Web）- Agent Detail 页面扩展

- [x] 12.1 修改 agent-detail.tsx 的 Tools 列表：显示每个 Tool 的 kind 徽章（MCP / Client）
- [x] 12.2 kind='client' 的 Tool 不显示在线状态图标（显示 "N/A"）

## 13. 验证与测试

- [ ] 13.1 后端单元测试：`parseToolName` 方法解析 `client__1__console-log-echo` 和 `mcp__2__weather` 正确（后端无测试运行器；由 build + typecheck 覆盖，端到端手工验证）
- [ ] 13.2 后端单元测试：`buildSystemContent` 拼接 available_tools 时，MCP 和 Client 工具前缀正确（同上）
- [ ] 13.3 后端单元测试：`resumeClientResult` 恢复逻辑（加载 messageContext、拼接 observation、更新 status）（同上）
- [x] 13.4 前端单元测试：executeClientTool 成功执行、捕获异常、未注册工具、async handler（vitest，6 用例通过）
- [ ] 13.5 端到端手工测试：创建 Agent 关联 `console-log-echo` 工具，发送消息触发 LLM 调用该工具，验证挂起 → 浏览器执行（控制台输出） → 回传结果 → 服务端恢复 → LLM 返回 final_answer 的完整流程
- [ ] 13.6 验证浏览器控制台输出 "echo test"，LLM 收到 observation `{"echo":"echo test","timestamp":...}`
- [ ] 13.7 验证幂等性：重复 POST `/client-result` 同一 callId，服务端发送 done 事件但不重复恢复
- [ ] 13.8 验证混合工具集：Agent 同时关联 MCP Tool 和 Client Tool，LLM 能正常调用两种工具
