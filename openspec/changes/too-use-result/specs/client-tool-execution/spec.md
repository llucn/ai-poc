## MODIFIED Requirements

### Requirement: 服务端挂起 LLM Loop

当服务端收到 LLM 返回的 native `tool_use` block 且其 `name` 以 `client__` 开头时，服务端 MUST NOT 在服务端执行，而是 MUST 为该 tool_use 创建一条 `t_pending_client_call` 记录（使用本轮共享的 `callId`、该 tool_use 的 `tool_use_id`、工具参数、status='pending'、`message_context=null`），通过 SSE 发送 `{ event: 'client_call', data: { callId, toolUseId, toolName, params } }` 消息（注意新增 `toolUseId` 字段），结束本次响应。若本轮有多个 Client Tool，服务端 MUST **串行派发**：仅发送第一个 Client Tool 的 `client_call`，关闭 SSE；后续 Client Tool 在前一个的结果回传并恢复后再发送。

#### Scenario: 单个 Client Tool 挂起

- **WHEN** LLM 返回 `stop_reason: 'tool_use'` 包含 1 个 `client__7__select-users` tool_use
- **THEN** t_pending_client_call 表中插入 1 条记录（callId 为新生成的 UUID，toolUseId 为该 tool_use 的 id，status='pending'，message_context=null），SSE 推送 `{ event: 'client_call', data: { callId, toolUseId, toolName: 'client__7__select-users', params: {...} } }`，服务端结束响应

#### Scenario: 多个 Client Tool 串行派发

- **WHEN** LLM 返回 1 个 assistant turn 包含 2 个 Client Tool: `client__7__select-users` 和 `client__8__pick-date`
- **THEN** t_pending_client_call 表中插入 2 条记录（共享相同 callId，各自 toolUseId 不同，均 status='pending'），SSE 仅推送第一个 `client_call`（select-users），服务端结束响应；当第一个结果回传恢复时，检查该 callId 还有 1 个 pending，再推送第二个 `client_call`（pick-date）

#### Scenario: 混合 MCP 和 Client Tool

- **WHEN** LLM 返回 1 个 assistant turn 包含 1 个 MCP tool `mcp__5__getWeather` 和 1 个 Client Tool `client__7__select-users`
- **THEN** 服务端立即执行 MCP 工具，将结果写入对应 pending 行的 message_context（`{type:'tool_result', tool_use_id, content}`）和 status='completed'；为 Client Tool 创建 pending 行，推送 `client_call`，结束响应

### Requirement: 浏览器端接收并派发工具调用

浏览器端 MUST 监听 SSE 流中的 `client_call` 事件，解析 `{ callId, toolUseId, toolName, params }` 载荷（注意新增 `toolUseId` 字段），根据 `toolName` 查找并执行对应的 Client Tool 实现，获取执行结果后，通过 `POST /sessions/:id/client-result` 回传 `{ callId, toolUseId, result? , error? }`。

#### Scenario: 收到 client_call 执行工具

- **WHEN** SSE 推送 `{ event: 'client_call', data: { callId: 'uuid-123', toolUseId: 'toolu_A', toolName: 'client__7__select-users', params: {filter: 'active'} } }`
- **THEN** 浏览器找到 `select-users` 工具实现，执行后 POST `/sessions/:id/client-result` body `{ callId: 'uuid-123', toolUseId: 'toolu_A', result: {userId: 42, userName: 'Alice'} }`

#### Scenario: 工具执行失败回传错误

- **WHEN** Client Tool 执行中抛出异常 "User cancelled"
- **THEN** 浏览器 POST `{ callId, toolUseId, error: 'User cancelled' }`

### Requirement: 浏览器端回传工具结果

浏览器端在执行完 Client Tool 后 MUST 通过 `POST /sessions/:id/client-result` 将结果回传给服务端，请求体 MUST 包含 `callId`（用于定位本轮调用）、`toolUseId`（用于定位具体的 tool_use）、以及 `result`（成功时）或 `error`（失败时）。浏览器 MUST 立即建立新的 SSE 连接监听恢复后的消息流。

#### Scenario: 成功结果回传

- **WHEN** 浏览器成功执行 `select-users` 工具，返回 `{userId: 42}`
- **THEN** POST body 为 `{ callId: 'uuid-123', toolUseId: 'toolu_A', result: {userId: 42} }`

#### Scenario: 失败结果回传

- **WHEN** 用户取消工具执行
- **THEN** POST body 为 `{ callId: 'uuid-123', toolUseId: 'toolu_A', error: 'Cancelled by user' }`

### Requirement: 服务端恢复 LLM Loop

接收到浏览器回传的结果后，服务端 MUST 通过 `(callId, toolUseId)` 定位对应的 `t_pending_client_call` 记录。若该记录 status 已非 'pending'，视为重复请求，响应幂等（推送 `done` 事件，结束 SSE）。否则将结果写入该记录的 `message_context`（成功时为 `{type:'tool_result', tool_use_id, content: result}`，失败时为 `{error}`）和 status='completed'，更新 updatedOn/updatedBy。然后查询该 `callId` 的所有 pending 记录：若还有 status='pending' 的 Client Tool，推送下一个 `client_call`，结束 SSE；若全部完成，从所有记录的 `message_context` 合并构建一个 user turn `tool_result` 消息（`native_content=[...tool_result]`，每个 tool_result 的 `tool_use_id` 来自记录、`content` 来自 message_context；错误记录映射为 `{type:'tool_result', tool_use_id, content: <error>, is_error:true}`），持久化为 `isThought=1`、`message_role='user'` 的 Thought Message，推送 `thought_created` 事件，从 `t_message` 重建完整对话上下文（调用 `reconstructNativeMessages`），继续调用 Anthropic API 进入下一轮循环，直到返回 `end_turn`（final answer）。

#### Scenario: 单个 Client Tool 结果恢复

- **WHEN** POST `/client-result` body `{ callId: 'uuid-123', toolUseId: 'toolu_A', result: {userId: 42} }`，该 callId 只有 1 条 pending 记录
- **THEN** 更新该记录 message_context=`{type:'tool_result', tool_use_id:'toolu_A', content:'{\"userId\":42}'}` 和 status='completed'，查询该 callId 无其他 pending，合并构建 1 个 user Thought（native_content=`[{type:'tool_result', tool_use_id:'toolu_A', content:'{\"userId\":42}'}]`），推送 `thought_created`，从 t_message 重建上下文，继续调用 LLM

#### Scenario: 多 Client Tool 中的第一个返回

- **WHEN** callId='uuid-456' 有 2 条 pending（toolUseId='toolu_A' 和 'toolu_B'），收到 toolu_A 的结果
- **THEN** 更新 toolu_A 记录为 completed，查询发现 toolu_B 仍 pending，推送 `{ event: 'client_call', data: { callId: 'uuid-456', toolUseId: 'toolu_B', ... } }`，结束 SSE（不合并，不继续循环）

#### Scenario: 多 Client Tool 的最后一个返回

- **WHEN** callId='uuid-456' 的 toolu_A 已 completed，收到 toolu_B 的结果
- **THEN** 更新 toolu_B 为 completed，查询无 pending，合并 2 个 tool_result 到 1 个 user Thought，推送 `thought_created`，重建上下文，继续 LLM 循环

#### Scenario: 混合 MCP 和 Client Tool 结果合并

- **WHEN** 1 个 assistant turn 调用了 mcp__5__getWeather（已在挂起时执行并写入 completed）和 client__7__select-users（pending），收到 client 结果
- **THEN** 更新 client 记录为 completed，查询该 callId 的 2 条记录（1 MCP completed、1 Client completed），合并 2 个 tool_result 到 1 个 user Thought，继续循环

#### Scenario: 错误结果合并时标记 is_error

- **WHEN** callId 有 2 个工具，1 个成功 result='OK'，1 个失败 error='Timeout'
- **THEN** 合并后的 user Thought 的 native_content=`[{type:'tool_result', tool_use_id:'A', content:'OK'}, {type:'tool_result', tool_use_id:'B', content:'Timeout', is_error:true}]`

### Requirement: t_pending_client_call 表设计

表 MUST 包含以下列：`id` (PK)、`call_id` (VARCHAR 非空，与 tool_use_id 组成复合唯一索引)、`session_id` (INT 非空)、`agent_id` (INT 非空)、`tool_id` (INT 非空)、`tool_name` (VARCHAR 非空)、`tool_use_id` (VARCHAR 非空，与 call_id 组成复合唯一索引)、`params` (JSON 可空)、`message_context` (JSON 可空，pending 时为 null；completed 时为单个 tool_result 对象 `{type:'tool_result', tool_use_id, content}` 或错误对象 `{error}`)、`status` (VARCHAR 16 非空 默认 'pending')、`created_on` / `created_by` / `updated_on` / `updated_by`。索引：`UNIQUE (call_id, tool_use_id)`、`INDEX (session_id)`、`INDEX (status)`。

#### Scenario: 复合唯一索引允许多条相同 call_id 记录

- **WHEN** 1 个 assistant turn 产生 2 个 Client Tool（callId='uuid-789'，toolUseId='toolu_X' 和 'toolu_Y'）
- **THEN** t_pending_client_call 表插入 2 条记录，均 call_id='uuid-789'，各自 tool_use_id 不同，复合唯一约束 (call_id, tool_use_id) 不冲突

#### Scenario: message_context 为单个 tool_result 对象

- **WHEN** MCP 工具执行完成，结果为 `{temp: 25}`
- **THEN** 该记录的 message_context=`{type:'tool_result', tool_use_id:'toolu_abc', content:'{\"temp\":25}'}`（非整个对话数组）

#### Scenario: 错误记录的 message_context

- **WHEN** Client Tool 执行失败，error='Network timeout'
- **THEN** 该记录的 message_context=`{error: 'Network timeout'}`，后续合并时映射为 `{type:'tool_result', tool_use_id, content:'Network timeout', is_error:true}`
