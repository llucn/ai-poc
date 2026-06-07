## Context

当前 Chat 模块使用 echo 模式（`SessionService.createMessage` 直接返回用户输入作为 assistant 回复），无法提供智能对话能力。前后端通过普通 HTTP POST 请求交互，前端发送消息后等待完整的 JSON 响应，体验上存在"发送 → 长时间等待 → 一次性显示结果"的延迟感。

现需要集成真实的 LLM（使用 Qwen，通过 OpenAI 兼容接口），并改用 SSE（Server-Sent Events）推送消息，让前端在 LLM 生成过程中就能实时看到"思考"和"回答"，提升响应感知速度。

Thought（`is_thought=1`）和 assistant 回复（`is_thought=0`）的内容暂时相同（都是 LLM 原始输出），后续迭代将引入 ReAct 解析逻辑从 Thought 中提取 `action` 和 `final_answer`。

## Goals / Non-Goals

**Goals:**
- 替换 echo 模式为实际的 LLM 调用（Qwen，通过 OpenAI SDK）
- 前后端改用 SSE 通信，后端流式推送 `thought_created` 和 `message_created` 事件
- Session 关联 Agent（新增 `agent_id` 字段），lazy creation 时查询默认 Agent（`is_default=1`）
- 发送 LLM 上下文时包含 Agent 的 `system_prompt` + 会话历史（最多 200 条消息，`ORDER BY created_on DESC LIMIT 200` 取最新的）
- 从 `agent.model_config` JSON 读取 LLM 连接参数（`baseUrl`、`authToken`、`modelName`）
- 前端在 LLM 思考期间显示 "Thinking..." 加载状态

**Non-Goals:**
- 不使用 LLM 的 streaming API（简化实现，LLM 一次性返回完整结果）
- 不处理 Tools 和 Skills（本次迭代专注基础对话流程）
- 不实现 ReAct 解析（`action` / `final_answer` 提取留待后续）
- 不考虑 Agent 被删除的场景（假设 Agent 始终存在，每次对话实时查询）
- 不缓存 Agent 信息到 Session 对象（每次对话都查询 `agent_id` 对应的 Agent 记录）

## Decisions

### Decision 1: 使用 OpenAI SDK + Qwen endpoint（OpenAI 兼容接口）
**选择**: 安装 `openai` npm 包，配置 `baseURL` 指向 Qwen API endpoint，复用 OpenAI SDK 的调用接口。

**理由**:
- Qwen 官方提供 OpenAI 兼容接口，无需自行封装 HTTP 请求
- OpenAI SDK 提供完善的类型定义和错误处理
- 后续切换到其他 OpenAI 兼容的 LLM（如 Ollama、vLLM）无需改动调用逻辑

**实现要点**:
```typescript
import OpenAI from 'openai';
// 从 agent.model_config JSON 解析配置
const modelConfig = JSON.parse(agent.modelConfig);
const client = new OpenAI({
  apiKey: modelConfig.authToken,
  baseURL: modelConfig.baseUrl,
});
const completion = await client.chat.completions.create({
  model: modelConfig.modelName,
  messages: [{role: 'system', content: systemPrompt}, ...history],
});
```

**替代方案（未选择）**:
- 使用环境变量存储 API key：不够灵活，每个 Agent 可能连接不同的 LLM endpoint
- 直接调用 Qwen 原生 API：需要自行封装 HTTP 请求，增加维护成本
- 使用 Anthropic SDK：Qwen 不支持 Anthropic 协议

### Decision 2: SSE 而非 WebSocket 或轮询
**选择**: 后端返回 `Content-Type: text/event-stream`，通过 SSE 推送 `thought_created` 和 `message_created` 事件；前端使用 `EventSource` 接收。

**理由**:
- SSE 单向推送（服务端 → 客户端）足够本场景使用（客户端不需要在同一连接中继续发送数据）
- 比 WebSocket 实现简单，无需处理双向消息协议
- 浏览器原生支持 `EventSource`，无需额外库
- 比轮询更高效，避免无意义的空请求

**实现要点**:
```typescript
// 后端 NestJS controller
@Post(':id/messages')
async createMessage(@Res() res: Response, @Body() dto, @Param('id') id) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 生成 thought
  res.write(`event: thought_created\ndata: ${JSON.stringify(thought)}\n\n`);
  // 生成 reply
  res.write(`event: message_created\ndata: ${JSON.stringify(reply)}\n\n`);
  res.end();
}

// 前端
const eventSource = new EventSource('/api/sessions/1/messages', {method: 'POST'});
eventSource.addEventListener('thought_created', e => setMessages(prev => [...prev, JSON.parse(e.data)]));
```

**风险缓解**: `EventSource` 仅支持 GET 请求，需要使用 `fetch` + 手动解析 SSE 流，或使用 `@microsoft/fetch-event-source` 库支持 POST。

**替代方案（未选择）**:
- WebSocket：过度设计，增加复杂度
- 轮询：低效，增加服务器负载

### Decision 3: 历史截断到最新 200 条
**选择**: 查询会话消息时 `SELECT * FROM t_message WHERE session_id = ? ORDER BY created_on DESC LIMIT 200`，反向取最新的 200 条，然后 `reverse()` 恢复时间升序后发送给 LLM。

**理由**:
- 简单有效地防止超出 LLM token 限制
- 200 条（约 100 轮对话）对大部分会话足够，同时控制在合理的 token 范围内（假设每条消息平均 50 tokens，200 条 = 10k tokens + system prompt）
- 数据库层截断比应用层更高效

**实现要点**:
```typescript
const messages = await this.messageRepository.find({
  where: { sessionId },
  order: { createdOn: 'DESC' },
  take: 200,
});
const history = messages.reverse(); // 恢复升序
```

**替代方案（未选择）**:
- 按 token 数截断：需要实时计算 token（调用 tiktoken），增加延迟
- 滑动窗口（保留首尾若干条）：实现复杂，收益不明显

### Decision 4: Agent 每次实时查询，不缓存
**选择**: 每次调用 `SessionService.createMessage` 时，根据 `session.agent_id` 查询 `AgentEntity`，获取最新的 `system_prompt` 和 `model_config`。

**理由**:
- 用户明确表示"不需要在 Session 对象里缓存 Agent 信息，实际使用不会这样用的"
- Admin 可能在对话过程中修改 Agent 的 prompt，实时查询确保使用最新配置
- 代码简单，无需处理缓存失效逻辑

**风险**:
- Agent 被删除时会抛出 404 错误，但用户表示"不要考虑 Agent 被删除的情况"

**替代方案（未选择）**:
- Session 创建时缓存 `system_prompt` 和 `model_config` 到 Session 表：需要新增 2 个 LONGTEXT 字段，增加数据冗余

### Decision 5: Thought 和 reply 内容相同（暂不做 ReAct 解析）
**选择**: LLM 返回的完整文本既作为 Thought（`is_thought=1`）保存，也作为 assistant 回复（`is_thought=0`）保存，内容完全一致。

**理由**:
- 需求文档明确："现在模拟提取 `final_answer` 的过程，把 LLM 输出原样作为 `final_answer` 输出到 ASSISTANT Message"
- 简化首次集成，后续迭代再实现 ReAct parser（从 Thought 中提取 `<action>` / `<final_answer>` 标签）

**实现要点**:
```typescript
const llmOutput = completion.choices[0].message.content;
const thought = { ..., isThought: 1, content: llmOutput };
const reply = { ..., isThought: 0, content: llmOutput };
```

## Risks / Trade-offs

### Risk 1: LLM API 失败导致对话中断
**风险**: Qwen API 超时、限流或返回错误时，整个对话流程失败，用户看到错误提示但无回复。

**缓解**:
- 捕获 LLM 调用异常，通过 SSE 推送 `error` 事件，前端显示友好错误提示
- 日志记录 API 错误详情（request_id, status, message）便于排查
- 后续可添加重试逻辑（指数退避）

### Risk 2: SSE 连接在慢网络下可能超时
**风险**: 如果 LLM 响应很慢（如几十秒），SSE 连接可能被浏览器或中间代理超时断开。

**缓解**:
- 后端在 LLM 调用前立即发送一个 `ping` 事件保持连接活跃
- 前端监听 `EventSource.onerror`，连接断开时显示"网络中断，请刷新重试"

### Risk 3: 200 条历史对某些长对话仍可能超限
**风险**: 如果消息内容特别长（如大段代码），200 条可能仍超出 LLM context window。

**缓解**:
- 当前方案足够应对大部分场景，后续迭代可监控 LLM 返回的 `context_length_exceeded` 错误，动态调整截断数量
- 或在应用层基于 token 计数截断（使用 `tiktoken`）

### Risk 4: EventSource 不支持 POST，需要额外封装
**风险**: 浏览器原生 `EventSource` 仅支持 GET 请求，无法传递 `{ content }` body。

**缓解**:
- 使用 `@microsoft/fetch-event-source` 库或手动 `fetch` + 解析 SSE 流
- 实现要点：
  ```typescript
  import { fetchEventSource } from '@microsoft/fetch-event-source';
  await fetchEventSource('/api/sessions/1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
    onmessage(ev) { /* 处理 thought_created / message_created */ },
  });
  ```

## Migration Plan

### 数据库变更
执行 DDL：
```sql
ALTER TABLE t_session ADD COLUMN agent_id INT NULL AFTER last_activity_time;
```

### 依赖安装
```bash
npm install openai
npm install @microsoft/fetch-event-source  # 前端
```

### 部署步骤
1. 应用数据库 schema 变更（`ALTER TABLE t_session ADD COLUMN agent_id INT NULL`）
2. 在数据库中创建一个默认 Agent（`is_default=1`），配置 `system_prompt` 和 `model_config`（JSON 格式：`{"baseUrl": "...", "authToken": "...", "modelName": "..."}`）
3. 部署后端（包含 `LlmService` 和 SSE 流式接口）
4. 部署前端（改用 `fetchEventSource` 发送消息，显示 "Thinking..." 加载状态）
5. 验证：发送消息 → 看到 "Thinking..." → SSE 推送 Thought 和回复 → 前端实时显示

### 回滚策略
- 数据库：保留 `agent_id` 列（旧代码忽略即可）
- 后端：还原到 echo 模式的 `SessionService.createMessage`
- 前端：还原到普通 POST + JSON 响应的发送逻辑

## Open Questions

- **是否需要在 UI 上显示"正在思考..."加载状态？** ✓ 已明确：在 SSE 推送 Thought 事件前，前端显示 "Thinking..." 文字 + spinner。Thought 到达后替换为折叠的 Thought 组件。
- **model_config JSON 结构？** ✓ 已明确：`{"baseUrl": "https://...", "authToken": "sk-...", "modelName": "qwen-xxx"}`。LlmService 解析此 JSON 并传递给 OpenAI SDK。
