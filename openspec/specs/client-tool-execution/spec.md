## ADDED Requirements

### Requirement: Client Tool 工具名称规范
Client Tool 的名称 MUST 使用 `client__<toolId>__<toolName>` 格式（例如 `client__1__console-log-echo`），其中 toolId 是 t_tool 表的主键 id，toolName 是工具的实际名称（与 t_tool.mcp_schema 中的 name 对应）。服务端 MUST 通过 `client__` 前缀识别 Client Tool 类型，通过嵌入的 toolId 快速查表获取工具上下文（kind / schema / agentId）。

#### Scenario: 解析 Client Tool 名称
- **GIVEN** LLM 返回 action `{ tool: "client__1__console-log-echo", params: { message: "test" } }`
- **WHEN** 服务端解析 tool 字段
- **THEN** 识别前缀为 `client__`，提取 toolId=1，toolName="console-log-echo"

#### Scenario: 区分 MCP Tool 和 Client Tool
- **GIVEN** Agent 关联了 `mcp__2__weather` 和 `client__1__console-log-echo` 两个工具
- **WHEN** 构建 LLM system content 的 available_tools 段
- **THEN** 两个工具并列在列表中，前缀分别为 `mcp__` 和 `client__`

### Requirement: 服务端挂起 LLM Loop
当服务端收到 LLM 返回的 native `tool_use` block 且其 `name` 以 `client__` 开头时，服务端 MUST NOT 在服务端执行，而是 MUST 挂起当前 LLM Loop：写入 t_pending_client_call 表（callId 为 UUID，存储 sessionId / agentId / toolId / toolName / params / messageContext / status='pending'），通过 SSE 发送 `{ event: 'client_call', data: { callId, toolName, params } }` 消息，结束本次响应（不继续 LLM 对话）。其中 `messageContext` MUST 以 Anthropic native message blocks 形式存储挂起时的对话上下文，且 MUST 包含本次挂起 `tool_use` block 的 `id`（`tool_use_id`），以便恢复时回传正确关联的 `tool_result`。`params` 取自 `tool_use` block 的 `input`。

#### Scenario: 识别 Client Tool 并挂起
- **GIVEN** LLM 返回 native `tool_use` block `{ id: "toolu_x", name: "client__1__console-log-echo", input: { message: "test" } }`
- **WHEN** 服务端发现 `name` 含 `client__` 前缀
- **THEN** 在 t_pending_client_call 表插入一条记录（callId 为新生成的 UUID，status='pending'，messageContext 以 native blocks 存储当前对话且包含该 `tool_use` 的 `id`）
- **AND** 通过 SSE 发送 `{ event: 'client_call', data: { callId: "<uuid>", toolName: "console-log-echo", params: { message: "test" } } }`
- **AND** 结束本次 SSE 响应流

#### Scenario: 挂起状态持久化
- **GIVEN** 服务端挂起了一个 Client Tool 调用
- **WHEN** 服务进程重启
- **THEN** t_pending_client_call 表中的 pending 记录仍然存在，callId 与其中存储的 `tool_use_id` 可用于后续恢复

### Requirement: 浏览器端接收并派发工具调用
浏览器 MUST 监听 SSE 消息，当接收到 `event: 'client_call'` 时，提取 `{ callId, toolName, params }`，派发到 ClientToolExecutor 模块。Executor MUST 根据 toolName 查找对应的实现函数（从注册表 `Map<toolName, executorFunction>` 中获取），执行工具并捕获结果（成功 → { result } 或失败 → { error }）。

#### Scenario: 接收 client_call 事件
- **GIVEN** 浏览器已连接 SSE 流
- **WHEN** 接收到 `{ event: 'client_call', data: { callId: "abc-123", toolName: "console-log-echo", params: { message: "test" } } }`
- **THEN** useChatSse Hook 触发 onClientCall 回调，传递 callId / toolName / params

#### Scenario: 派发到 Executor 并执行
- **GIVEN** ClientToolExecutor 注册了 `console-log-echo` 工具实现函数
- **WHEN** Executor 接收到 toolName="console-log-echo" 的调用
- **THEN** 查找并执行对应函数（执行 `console.log(params.message)`，返回 `{ echo: params.message, timestamp: Date.now() }`）

#### Scenario: 工具执行成功
- **GIVEN** 工具实现函数返回结果对象 `{ echo: "test", timestamp: 1718000000000 }`
- **THEN** Executor 包装为 `{ result: { echo: "test", timestamp: 1718000000000 } }`

#### Scenario: 工具执行失败
- **GIVEN** 工具实现函数抛出异常 `Error("Tool execution failed")`
- **THEN** Executor 捕获异常并包装为 `{ error: "Tool execution failed" }`

### Requirement: 浏览器端回传工具结果
工具执行完成后，浏览器 MUST 通过 `POST /sessions/:sessionId/client-result` 端点回传结果，请求体为 `{ callId, result }` 或 `{ callId, error }`。服务端接收到回传后，MUST 从 t_pending_client_call 表中查找对应的 pending 记录（通过 callId），验证 status='pending'（幂等性检查），提取 messageContext，调用 resumeClientResult 恢复 LLM Loop。

#### Scenario: 回传成功结果
- **GIVEN** 浏览器执行工具成功，得到 `{ result: { echo: "test", timestamp: 1718000000000 } }`
- **WHEN** POST 到 `/sessions/123/client-result`，body 为 `{ callId: "abc-123", result: { echo: "test", timestamp: 1718000000000 } }`
- **THEN** 服务端接收请求，查找 t_pending_client_call 表中 callId="abc-123" 的记录，验证 status='pending'，提取 messageContext

#### Scenario: 回传错误结果
- **GIVEN** 浏览器执行工具失败，得到 `{ error: "Tool execution failed" }`
- **WHEN** POST 到 `/sessions/123/client-result`，body 为 `{ callId: "abc-123", error: "Tool execution failed" }`
- **THEN** 服务端接收请求，提取 error 字段

#### Scenario: 幂等性检查
- **GIVEN** t_pending_client_call 表中 callId="abc-123" 的记录 status 已被标记为 'completed'
- **WHEN** 浏览器重复 POST `/sessions/123/client-result` 同一 callId
- **THEN** 服务端返回 200 但不执行恢复逻辑（已处理），避免重复恢复

### Requirement: 服务端恢复 LLM Loop
接收到浏览器回传的结果后，服务端 MUST 通过 resumeClientResult 方法恢复挂起的 LLM Loop：从 t_pending_client_call 加载 messageContext（native message blocks），追加一个 native `tool_result` block（`tool_use_id` 取自挂起记录中保存的 id，`content` 为工具返回的 result 或 error），更新 t_pending_client_call 的 status 为 'completed'，继续调用 Anthropic API（将更新后的 messages 发送给 LLM），循环直到返回 `end_turn`（final answer）或再次挂起。

#### Scenario: 恢复并拼接 tool_result
- **GIVEN** t_pending_client_call 记录中 messageContext 为包含一个 assistant `tool_use` block（id="toolu_x"）的 native message 数组
- **AND** 浏览器回传 `{ result: { echo: "test", timestamp: 1718000000000 } }`
- **WHEN** 服务端调用 resumeClientResult
- **THEN** 追加一个 `{ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_x', content: '{"echo":"test","timestamp":1718000000000}' }] }` 到 messages 数组末尾
- **AND** 将更新后的 messages 发送给 Anthropic API

#### Scenario: 回传错误结果拼接为 error tool_result
- **GIVEN** 浏览器回传 `{ error: "Tool execution failed" }`
- **WHEN** 服务端调用 resumeClientResult
- **THEN** 追加一个标记为错误（`is_error: true`）的 `tool_result` block，`tool_use_id` 关联挂起记录中的 id，`content` 携带错误信息

#### Scenario: 恢复后继续 Loop
- **GIVEN** LLM 接收到包含 `tool_result` 的 messages
- **WHEN** LLM 返回新的响应（可能是 `end_turn` 或新的 `tool_use`）
- **THEN** 服务端继续 Loop 逻辑（如 `end_turn` 则结束并输出 final answer，如新 `tool_use` 则再次分发）

#### Scenario: 标记 pending 记录为 completed
- **GIVEN** resumeClientResult 成功恢复并继续了 Loop
- **THEN** t_pending_client_call 表中对应记录的 status 更新为 'completed'
- **AND** 后续同一 callId 的回传请求被识别为重复并忽略

### Requirement: t_pending_client_call 表设计
系统 MUST 新增 t_pending_client_call 表，字段包括：
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `call_id` VARCHAR(255) NOT NULL UNIQUE（UUID，客户端回传结果时的幂等 Key）
- `session_id` INT NOT NULL（关联 t_session）
- `agent_id` INT NOT NULL（关联 t_agent）
- `tool_id` INT NOT NULL（关联 t_tool）
- `tool_name` VARCHAR(255) NOT NULL（Client Tool 的实际工具名，如 "console-log-echo"）
- `params` JSON NULL（工具参数）
- `message_context` JSON NOT NULL（挂起时的 LLM messages 数组）
- `status` VARCHAR(16) NOT NULL DEFAULT 'pending'（'pending' / 'completed' / 'failed' / 'timeout'）
- `created_on` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- `created_by` VARCHAR(255) NOT NULL
- `updated_on` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
- `updated_by` VARCHAR(255) NULL

索引：call_id UNIQUE，session_id，status。

#### Scenario: 插入挂起记录
- **WHEN** 服务端挂起一个 Client Tool 调用
- **THEN** 在 t_pending_client_call 表插入一条记录，call_id 为新生成的 UUID，status='pending'，message_context 存储当前 messages JSON 数组

#### Scenario: 通过 call_id 查找记录
- **GIVEN** 浏览器回传 callId="abc-123"
- **WHEN** 服务端查询 t_pending_client_call 表
- **THEN** 通过 call_id 索引快速定位记录（O(1)）

#### Scenario: 更新 status 为 completed
- **WHEN** resumeLlmTurn 成功恢复并处理完 observation
- **THEN** 更新对应记录的 status='completed'，updated_on=当前时间

### Requirement: 测试工具 console-log-echo 实现
系统 MUST 实现一个测试用的 Client Tool `client__1__console-log-echo`（假设 toolId=1），功能为：接收参数 `{ message: string }`，在浏览器控制台执行 `console.log(params.message)`，异步返回演示对象 `{ echo: params.message, timestamp: Date.now() }`。此工具用于验证端到端 suspend/resume 流程。

#### Scenario: 执行 console-log-echo 工具
- **GIVEN** 浏览器接收到 toolName="console-log-echo"，params=`{ message: "echo test" }`
- **WHEN** ClientToolExecutor 执行工具
- **THEN** 浏览器控制台输出 "echo test"
- **AND** 返回结果 `{ result: { echo: "echo test", timestamp: 1718000000000 } }`

#### Scenario: LLM 调用 console-log-echo 并收到结果
- **GIVEN** LLM 返回 action `{ tool: "client__1__console-log-echo", params: { message: "test message" } }`
- **WHEN** 服务端挂起 → 浏览器执行 → 回传结果 → 服务端恢复
- **THEN** LLM 收到 observation `{"echo":"test message","timestamp":1718000000000}`
- **AND** 基于此结果生成 final_answer 或后续 action
