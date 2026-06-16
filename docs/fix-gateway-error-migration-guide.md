# 修复 `gateway.upstream_unavailable` 错误 - Native Content 架构迁移

## 问题根源

当前架构的三个致命缺陷导致 Client Tool resume 后频繁出现 Anthropic API 错误：

### 1. **历史重建丢失 tool 上下文**

```typescript
// session.service.ts line 470-479
const history = await this.messageRepository.find({
  where: { sessionId, isThought: 0, messageType: 1 },
  // ...
});

const messages: MessageParam[] = history.map((msg) => ({
  role: msg.userName === ASSISTANT_USER ? 'assistant' : 'user',
  content: msg.content || '',  // ← 只有文本！
}));
```

**结果**：之前的 tool_use/tool_result blocks 全部丢失，LLM 看不到工具调用历史。

### 2. **Client Tool suspend/resume 依赖内存状态**

```typescript
// suspendForClientTool 保存到 pending 表
messageContext: messages,  // ← 内存中的完整 blocks

// resumeClientResult 从 pending 表恢复
const messages = [...pending.messageContext, ...];  // ✓ 这次有完整上下文

// 但下次用户发新消息时，pending 表的数据不会被读取
// 重新从 t_message 重建 → 又丢失了
```

**结果**：Client Tool resume 后的**第一轮**对话有完整上下文，但**第二轮**又丢失。

### 3. **`t_message` 表结构不支持存储 native blocks**

当前 `t_message.content` 是 `LONGTEXT`，只能存文本。Tool blocks 的结构信息无法持久化。

## 解决方案：扩展 `t_message` 存储 native content

### 数据库迁移

```sql
-- 已生成：docs/migration-native-content.sql
ALTER TABLE t_message
  ADD COLUMN native_content JSON NULL,
  ADD COLUMN message_role VARCHAR(16) NULL,
  ADD COLUMN turn_id INT NULL,
  ADD INDEX idx_message_session_turn (session_id, turn_id);
```

### Entity 更新

✅ 已完成：`packages/api/src/app/session/message.entity.ts`

新增字段：
- `nativeContent: ContentBlockParam[] | null` — 完整的 Anthropic content blocks
- `messageRole: 'user' | 'assistant' | null` — API 角色
- `turnId: number | null` — 分组同一轮的多条消息

### Helper 函数

✅ 已完成：`packages/api/src/app/session/message-native.helper.ts`

核心函数：
- `reconstructNativeMessages(rows)` — 从 DB 重建完整的 MessageParam[]
- `createUserMessage()` — 创建用户消息（text + native）
- `createAssistantToolUseMessage()` — 创建 assistant tool_use 消息
- `createToolResultMessage()` — 创建 tool_result 消息（role='user' for API）

## 实施步骤

### Step 1: 运行数据库迁移

```bash
mysql -u root -p ai_poc < docs/migration-native-content.sql
```

### Step 2: 修改 `session.service.ts` 的关键位置

#### 2.1 修改 `runLlmTurn` 历史重建（line 463-484）

**旧代码**：
```typescript
const history = await this.messageRepository.find({
  where: { sessionId, isThought: 0, messageType: 1 },
  order: { createdOn: 'DESC', id: 'DESC' },
  take: 200,
});
history.reverse();

const messages: MessageParam[] = history.map((msg) => ({
  role: msg.userName === ASSISTANT_USER ? ('assistant' as const) : ('user' as const),
  content: msg.content || '',
}));
```

**新代码**：
```typescript
import { reconstructNativeMessages } from './message-native.helper';

const history = await this.messageRepository.find({
  where: { sessionId, messageType: 1 },  // 移除 isThought: 0 过滤
  order: { createdOn: 'ASC', id: 'ASC' },  // 直接按升序
  take: 200,
});

// 使用 helper 重建，自动处理 native/legacy 消息
const messages: MessageParam[] = reconstructNativeMessages(history);
```

#### 2.2 修改保存用户消息（line 451-461）

**旧代码**：
```typescript
const userMessage = this.messageRepository.create({
  sessionId,
  userName,
  messageType: 1,
  isThought: 0,
  content,
  createdOn: now,
  createdBy,
});
```

**新代码**：
```typescript
import { createUserMessage } from './message-native.helper';

const userMessage = this.messageRepository.create({
  ...createUserMessage(sessionId, userName, content, createdBy),
  createdOn: now,
});
```

#### 2.3 修改保存 assistant 回复（line 576-587）

**旧代码**：
```typescript
const assistantMessage = this.messageRepository.create({
  sessionId,
  userName: ASSISTANT_USER,
  messageType: 1,
  isThought: 0,
  content: replyContent,
  createdOn: new Date(now.getTime() + timestampOffset++),
  createdBy: `assistant/${createdBy}`,
});
```

**新代码**：
```typescript
import { createAssistantMessage } from './message-native.helper';

const assistantMessage = this.messageRepository.create({
  ...createAssistantMessage(sessionId, replyContent, `assistant/${createdBy}`),
  createdOn: new Date(now.getTime() + timestampOffset++),
});
```

#### 2.4 **关键修改**：保存完整的 assistant tool_use turn（line 589 之后）

**旧代码**：
```typescript
// turn.kind === 'tool_use': enforce the cap before doing anything else.
if (toolCallCount >= MAX_TOOL_CALLS) {
  // ...
}

// Append the assistant turn (text + tool_use) to the live context. The
// next user turn will carry the tool_result.
messages.push({ role: 'assistant', content: turn.assistantContent });
```

**新代码**：
```typescript
import { createAssistantToolUseMessage, createToolResultMessage } from './message-native.helper';

// turn.kind === 'tool_use': enforce the cap...
if (toolCallCount >= MAX_TOOL_CALLS) {
  // ...
}

// Append the assistant turn to live context
messages.push({ role: 'assistant', content: turn.assistantContent });

// ★★★ NEW: Persist the assistant tool_use turn to DB ★★★
const turnId = Date.now(); // Simple turn ID (or use a counter)
const assistantToolUseMsg = this.messageRepository.create({
  ...createAssistantToolUseMessage(
    sessionId,
    turn.assistantContent,
    `assistant/${createdBy}`,
    turnId
  ),
  createdOn: new Date(now.getTime() + timestampOffset++),
});
await this.messageRepository.save(assistantToolUseMsg);
// 不需要推送 SSE 事件 — 已经有 thought_created
```

#### 2.5 **关键修改**：保存 tool_result（MCP Tool 执行后，line 620 附近）

**在这段代码之后**：
```typescript
const observationMessage = this.messageRepository.create({
  sessionId,
  userName: ASSISTANT_USER,
  messageType: 1,
  isThought: 1,
  content: observationContent,
  createdOn: new Date(now.getTime() + timestampOffset++),
  createdBy: `assistant/${createdBy}`,
});
const savedObservationMsg = await this.messageRepository.save(observationMessage);
```

**添加**：
```typescript
// ★★★ NEW: Also persist the tool_result with native content ★★★
const toolResultMsg = this.messageRepository.create({
  ...createToolResultMessage(
    sessionId,
    toolResult,
    `assistant/${createdBy}`,
    turnId  // 使用上面保存的 turnId
  ),
  createdOn: new Date(now.getTime() + timestampOffset++),
});
await this.messageRepository.save(toolResultMsg);
// 不推送 SSE — 已经有 thought_created (observation)
```

#### 2.6 修改 Client Tool resume（line 357-360）

**旧代码**：
```typescript
const messages: PendingMessageContext = [
  ...pending.messageContext,
  { role: 'user', content: [toolResultBlock] },
];
```

**新代码**：
```typescript
// ★★★ 不再从 pending 表读取 messageContext！
// 直接从 t_message 重建完整历史（包含刚才挂起时保存的 tool_use）
const history = await this.messageRepository.find({
  where: { sessionId, messageType: 1 },
  order: { createdOn: 'ASC', id: 'ASC' },
  take: 200,
});
const messages = reconstructNativeMessages(history);

// 追加 tool_result
messages.push({ role: 'user', content: [toolResultBlock] });
```

#### 2.7 更新 `countToolUseRounds`（line 371）

**旧代码**：
```typescript
const startToolCallCount = countToolUseRounds(pending.messageContext);
```

**新代码**：
```typescript
// 从重建的 messages 数组计算
const startToolCallCount = countToolUseRounds(messages);
```

#### 2.8 清理 `t_pending_client_call.message_context`（可选）

现在不再需要在 pending 表存储 `messageContext`（总是从 t_message 重建）。

可以：
1. 保留字段但不使用（向后兼容）
2. 迁移时删除该列（清理）

```sql
-- 可选清理
ALTER TABLE t_pending_client_call DROP COLUMN message_context;
```

并更新 `pending-client-call.entity.ts` 移除 `messageContext` 字段。

### Step 3: 测试验证

1. **简单对话** — 确保文本消息正常工作
2. **MCP Tool 单次调用** — 验证 tool_use/tool_result 被正确保存和重建
3. **MCP Tool 多次调用** — 验证历史重建包含所有 tool 交互
4. **Client Tool 调用** — 验证 suspend/resume 后历史完整
5. **Client Tool 后再次对话** — 验证第二轮对话仍能看到之前的 tool 上下文

### Step 4: 监控和回滚

如果出现问题：

```typescript
// message-native.helper.ts 中的 fallback 逻辑自动处理旧数据
if (row.nativeContent && Array.isArray(row.nativeContent)) {
  // 使用 native content
} else {
  // 回退到 text-only（兼容旧数据）
}
```

## 预期效果

### 修复前

```
User: "请用 select-users 工具选择一个用户"
Assistant: [tool_use: client__7__select-users]
  → suspend, 保存到 pending.messageContext

[User selects in browser, POST result]
  → resume, 从 pending.messageContext 恢复 ✓
Assistant: "已选择用户 Alice"
  → 保存到 t_message (只有文本)

User: "现在帮我..."
  → 从 t_message 重建历史
  → messages = [
      {role: 'user', content: "请用 select-users..."},
      {role: 'assistant', content: "已选择用户 Alice"}  // ← 丢失了 tool_use!
    ]
  → 调用 Anthropic API
  → ❌ gateway.upstream_unavailable (上下文不完整)
```

### 修复后

```
User: "请用 select-users 工具选择一个用户"
Assistant: [tool_use: client__7__select-users]
  → 保存到 t_message (nativeContent=[tool_use])
  → suspend

[User selects, POST result]
  → resume, 从 t_message 重建历史 ✓ (包含 tool_use)
  → 追加 tool_result
Assistant: "已选择用户 Alice"
  → 保存到 t_message (text + nativeContent=[text])

User: "现在帮我..."
  → 从 t_message 重建历史
  → messages = [
      {role: 'user', content: "请用 select-users..."},
      {role: 'assistant', content: [tool_use]},       // ✓ 完整的 tool_use
      {role: 'user', content: [tool_result]},         // ✓ 完整的 tool_result
      {role: 'assistant', content: "已选择用户 Alice"}
    ]
  → 调用 Anthropic API
  → ✅ 成功（完整上下文）
```

## 额外优化

### 性能优化：限制历史长度

当前 `take: 200` 可能加载过多消息。建议：

```typescript
// 只加载最近 50 条消息（约 25 轮对话）
const history = await this.messageRepository.find({
  where: { sessionId, messageType: 1 },
  order: { createdOn: 'DESC', id: 'DESC' },
  take: 50,
});
history.reverse();
```

### UI 优化：按 turn_id 分组显示

前端可以利用 `turnId` 字段，将同一轮的消息（thought + tool_use + result）折叠显示。

### 监控指标

添加日志记录：
- Native messages vs legacy messages 比例
- 平均 messages 数组长度
- API 请求成功率（按是否包含 tool blocks 分组）

## 向后兼容性

✅ **完全向后兼容**：
- 旧消息 `nativeContent = NULL` → 自动回退到 text-only
- 新消息同时存储 `content` (显示) + `nativeContent` (API)
- UI 不变（继续读取 `content` 字段）
- 渐进式迁移，无需一次性重写所有历史数据

## 总结

这个架构修复了三个关键问题：

1. ✅ **持久化完整对话**：t_message 存储 native blocks，不再丢失 tool 上下文
2. ✅ **无状态 resume**：Client Tool resume 直接从 DB 重建，不依赖 pending 表的临时状态
3. ✅ **准确的 API 请求**：每次调用 Anthropic API 都能看到完整的 tool 历史

**实施优先级**：
- 🔴 **P0**：Step 1-2（数据库 + 核心保存/加载逻辑）
- 🟡 **P1**：Step 3（测试）
- 🟢 **P2**：清理 pending.messageContext（可选）

预计工作量：**2-4 小时**（含测试）
