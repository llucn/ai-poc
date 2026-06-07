## MODIFIED Requirements

### Requirement: Echo assistant response (mock)
系统 MUST 在用户发送消息后调用真实 LLM 生成回复，不再使用 echo 模式。

#### Scenario: LLM 生成 Thought 和回复
- **WHEN** 用户发送消息后
- **THEN** 系统根据 `session.agent_id` 查询 Agent，获取 `system_prompt` 和 `model_config`；查询会话历史（最多 200 条消息，按 `created_on DESC LIMIT 200` 后 reverse）；调用 Qwen API（通过 OpenAI SDK）；将 LLM 输出作为 Thought（`is_thought=1`）和 assistant 回复（`is_thought=0`）保存并推送（内容相同，暂不做 ReAct 解析）

#### Scenario: 历史截断到最新 200 条
- **WHEN** 会话消息数 > 200
- **THEN** 系统仅取最新 200 条消息发送给 LLM，防止超出 context window

#### Scenario: LLM API 失败时返回错误
- **WHEN** Qwen API 调用超时或返回错误
- **THEN** 系统通过 SSE 推送 `error` 事件，前端显示错误提示，不保存任何消息

## ADDED Requirements

### Requirement: SSE message streaming
系统 MUST 通过 Server-Sent Events 流式推送 Thought 和 assistant 回复，前端实时接收并渲染。

#### Scenario: 建立 SSE 连接
- **WHEN** 前端发送消息请求（POST /sessions/:id/messages）
- **THEN** 后端返回 `Content-Type: text/event-stream`，保持连接打开

#### Scenario: 推送 Thought 事件
- **WHEN** LLM 返回结果并保存 Thought 消息后
- **THEN** 后端发送 `event: thought_created\ndata: {JSON}\n\n`，JSON 包含完整的 Thought 消息对象（id, sessionId, userName, isThought, content, createdOn 等）

#### Scenario: 推送 reply 事件
- **WHEN** assistant 回复消息保存后
- **THEN** 后端发送 `event: message_created\ndata: {JSON}\n\n`，JSON 包含完整的回复消息对象

#### Scenario: 推送错误事件
- **WHEN** LLM 调用失败
- **THEN** 后端发送 `event: error\ndata: {message: "..."}\n\n`，然后关闭连接

#### Scenario: 连接完成
- **WHEN** Thought 和 reply 都推送完毕
- **THEN** 后端关闭 SSE 连接（`res.end()`）

### Requirement: History truncation
系统 MUST 限制发送给 LLM 的会话历史最多为 200 条消息，防止超出 token 限制。

#### Scenario: 查询最新 200 条消息
- **WHEN** 构建 LLM 请求上下文时
- **THEN** 系统执行 `SELECT * FROM t_message WHERE session_id = ? ORDER BY created_on DESC LIMIT 200`，然后 `reverse()` 恢复升序，作为 `messages` 数组传递给 LLM

#### Scenario: 消息数 ≤ 200 时全部发送
- **WHEN** 会话消息数 ≤ 200
- **THEN** 系统发送所有消息给 LLM，无截断
