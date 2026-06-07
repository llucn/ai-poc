## 1. 数据库 schema

- [x] 1.1 在 `docs/database.sql` 的 `t_session` 表定义中添加 `agent_id INT NULL` 字段（位于 `last_activity_time` 字段之后）

## 2. 后端 - 依赖和环境配置

- [x] 2.1 在项目根目录执行 `npm install openai` 安装 OpenAI SDK

## 3. 后端 - LLM Service

- [x] 3.1 创建 `packages/api/src/app/llm/llm.service.ts`：封装 OpenAI SDK，提供 `callLlm(agent: AgentEntity, messages)` 方法。从 `agent.model_config` JSON 解析 `{baseUrl, authToken, modelName}`，调用 Qwen API
- [x] 3.2 创建 `packages/api/src/app/llm/llm.module.ts`：注册 LlmService
- [x] 3.3 在 AppModule 中导入 LlmModule

## 4. 后端 - Session Entity & Service

- [x] 4.1 在 `SessionEntity` 中添加 `agentId` 字段（int，nullable，列名 `agent_id`）
- [x] 4.2 在 `SessionService.createSessionWithFirstMessage` 中：查询默认 Agent（`is_default=1`），设置 `session.agent_id`；如果没有默认 Agent，抛出错误
- [x] 4.3 调整 `SessionService.createMessage` 返回签名：改为 `Promise<void>`（不再返回 userMessage / thoughtMessage / assistantMessage，因为 SSE 流式推送）

## 5. 后端 - SSE 流式推送

- [x] 5.1 修改 `SessionController.createMessage`：设置响应头 `Content-Type: text/event-stream`、`Cache-Control: no-cache`、`Connection: keep-alive`
- [x] 5.2 在 `SessionService.createMessage` 中：查询 session.agent_id 对应的 Agent，获取 `system_prompt` 和 `model_config`
- [x] 5.3 查询会话历史（`ORDER BY created_on DESC LIMIT 200`，然后 `reverse()` 恢复升序）
- [x] 5.4 调用 `LlmService.callLlm()`，获取 LLM 输出
- [x] 5.5 保存 Thought 消息（`is_thought=1`，content = LLM 输出），通过 `res.write()` 发送 `event: thought_created\ndata: ${JSON.stringify(thought)}\n\n`
- [x] 5.6 保存 assistant 回复（`is_thought=0`，content = 同样的 LLM 输出），通过 `res.write()` 发送 `event: message_created\ndata: ${JSON.stringify(reply)}\n\n`
- [x] 5.7 LLM 调用失败时，通过 `res.write()` 发送 `event: error\ndata: ${JSON.stringify({message: err.message})}\n\n`
- [x] 5.8 完成后调用 `res.end()` 关闭 SSE 连接

## 6. 前端 - 依赖和类型

- [x] 6.1 在 web package 执行 `npm install @microsoft/fetch-event-source` 安装 SSE 库
- [x] 6.2 从 `types.ts` 中删除 `CreateMessageResponse` 接口（不再通过 JSON 响应返回，改用 SSE 事件）

## 7. 前端 - ChatPage SSE 集成

- [x] 7.1 在 ChatPage 导入 `fetchEventSource` from `@microsoft/fetch-event-source`
- [x] 7.2 修改 `handleSend` 函数：使用 `fetchEventSource(url, { method: 'POST', headers, body, onmessage, onerror, onclose, onopen })`
- [x] 7.3 实现 `onopen` 回调：连接建立后，在对话区域追加一个临时的 "Thinking..." 消息（带 spinner），设置 `sending` 状态为 true
- [x] 7.4 实现 `onmessage` 回调：解析 `event.event` 字段，如果是 `thought_created` 或 `message_created`，移除 "Thinking..." 临时消息，解析 `event.data` 为 JSON，追加到 `messages` state
- [x] 7.5 实现 `onerror` 回调：如果 event.event === 'error'，解析 `event.data.message` 并设置 `error` state；否则设置通用错误提示；移除 "Thinking..." 临时消息
- [x] 7.6 实现 `onclose` 回调：清理资源，移除任何残留的 "Thinking..." 临时消息，恢复 `sending` 状态为 false
- [x] 7.7 移除原有的 `POST /sessions/:id/messages` JSON 响应处理逻辑（包括 `data.thoughtMessage` / `data.assistantMessage` 的 state 更新）

## 8. 验证

- [x] 8.1 后端编译通过（`npx nx build @wo-poc/api`）
- [x] 8.2 前端编译通过（`npx nx build @wo-poc/web`）
- [ ] 8.3 手动测试：
  - 在数据库中创建一个默认 Agent（`is_default=1`，配置 `system_prompt` 和 `model_config`，格式：`{"baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1", "authToken": "sk-...", "modelName": "qwen-turbo"}`）
  - 启动后端和前端
  - 发送消息 → 实时看到 "Thinking..." + spinner → 实时看到 Thought（折叠）→ 实时看到 assistant 回复
  - 验证 LLM 调用失败时错误提示正确显示
  - 验证会话历史 > 200 条时只发送最新 200 条（可通过后端日志或 LLM API 日志确认）
