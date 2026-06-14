## MODIFIED Requirements

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
