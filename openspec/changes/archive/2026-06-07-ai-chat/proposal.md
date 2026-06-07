## Why

当前 Chat 模块使用 echo 模式（用户输入原样返回），无法提供实际的 AI 对话能力。需要集成真实的 LLM（Qwen）来替代 echo 模式，实现可用的智能对话。同时，为了提高用户体验，采用 SSE（Server-Sent Events）实现实时消息推送，让用户在 LLM 生成过程中就能看到"思考"和"回答"的流式展示，而不是长时间等待后一次性显示结果。

## What Changes

- **后端 LLM 集成**：安装 `openai` SDK，配置 Qwen API endpoint（OpenAI 兼容接口），替换 echo 模式为实际的 LLM 调用
- **SSE 通信**：前后端改用 Server-Sent Events，后端通过事件流推送 Thought 和 assistant 回复，前端实时接收并动态渲染
- **Agent 关联**：`t_session` 表新增 `agent_id` 字段，会话创建时查询默认 Agent（`is_default=1`），后续对话使用该 Agent 的 `system_prompt` 和会话历史构建上下文
- **历史截断**：如果会话消息数超过 200 条，仅发送最近 200 条给 LLM，防止超出 token 限制
- **Thought 与回复生成**：LLM 输出作为 Thought（`is_thought=1`）保存并推送；同样的输出作为 assistant 回复（`is_thought=0`）保存并推送（暂不做 ReAct 解析，后续迭代）

## Capabilities

### New Capabilities
无新增 capability（LLM 调用是现有 message-management 的内部实现替换）

### Modified Capabilities
- `session-management`: 新增 agent_id 字段；lazy creation 时查询默认 Agent
- `message-management`: echo 模式替换为 LLM 调用；新增 SSE 流式推送；新增历史截断逻辑（最多 200 条）
- `chat-ui`: 消息发送改用 EventSource 接收 SSE 事件流，实时追加 Thought 和 assistant 回复到界面

## Impact

- **Backend**:
  - `SessionEntity`: 新增 `agentId` 字段
  - `SessionService`: `createSessionWithFirstMessage` 查询默认 Agent 并设置 `session.agent_id`；`createMessage` 调用 LLM，生成 Thought + 回复，通过 SSE 推送
  - `SessionController`: `POST /sessions/:id/messages` 返回 SSE stream（`Content-Type: text/event-stream`）
  - 新增 `LlmService`：封装 OpenAI SDK 调用 Qwen API
  - `MessageRepository`: 查询历史时限制最多 200 条（`LIMIT 200` + `ORDER BY created_on DESC`）
- **Frontend**:
  - `ChatPage`: `handleSend` 改用 `EventSource` 连接 SSE endpoint，监听 `thought_created` 和 `message_created` 事件，动态追加到 `messages` state
  - `types.ts`: `CreateMessageResponse` 不再返回（SSE 流式推送替代）
- **Database**: `t_session` 添加 `agent_id INT NULL` 字段
- **Dependencies**: 安装 `openai` npm 包；环境变量新增 `QWEN_API_KEY` 和 `QWEN_BASE_URL`
- **Configuration**: `.env` 示例文件添加 Qwen API 配置项
