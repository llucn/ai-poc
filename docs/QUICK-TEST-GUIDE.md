# 快速测试指南 - Native Content 修复

## ✅ 代码状态
- TypeScript 编译通过
- 30/30 测试通过
- 构建成功
- turnId 溢出问题已修复

## 🚀 立即执行

### 1. 应用数据库迁移

```bash
mysql -u root -p ai_poc < docs/migration-native-content.sql
```

**验证**：
```sql
mysql -u root -p ai_poc
DESCRIBE t_message;
-- 应看到：native_content, message_role, turn_id
```

### 2. 重启 API 服务器

```bash
# 停止当前运行的 API 服务器
# 然后重新启动
npm run start:dev
# 或
npm run start:prod
```

### 3. 快速测试（修复验证）

打开浏览器访问 http://localhost:3000（或你的端口），执行以下测试：

#### 测试 A：Client Tool 后的第二轮对话（关键测试）

```
👤 User: "请用 select-users 工具选择一个用户"

🤖 Assistant: [触发 client__7__select-users]
  → 浏览器弹出选择器

[在浏览器中选择一个用户，点击确认]

🤖 Assistant: "已选择用户 Alice"（或类似回复）

👤 User: "好的，现在帮我总结一下刚才做了什么"  ← 关键！

🤖 Assistant: 应该正常回复，提到选择了用户
  → ✅ 如果正常回复 = 修复成功
  → ❌ 如果返回错误 = 检查服务端日志
```

**预期行为**：
- ✅ 第二轮对话正常返回（不再 `gateway.upstream_unavailable`）
- ✅ LLM 能理解之前的 tool 调用上下文

#### 测试 B：检查数据库

```sql
-- 查看最新 session 的消息
SELECT 
  id,
  message_role,
  is_thought,
  turn_id,
  JSON_EXTRACT(native_content, '$[0].type') as block_type,
  LEFT(content, 50) as preview
FROM t_message 
WHERE session_id = (SELECT MAX(id) FROM t_session)
ORDER BY created_on;
```

**预期结果**：
```
| id | message_role | is_thought | turn_id    | block_type | preview                        |
|----|--------------|------------|------------|------------|--------------------------------|
| 1  | user         | 0          | NULL       | "text"     | 请用 select-users 工具选择...   |
| 2  | assistant    | 1          | 12340001   | NULL       | {"tool_use": {...}}            |
| 3  | assistant    | 0          | 12340001   | "tool_use" | (空或文本)                      |
| 4  | assistant    | 1          | NULL       | NULL       | {"observation": {...}}         |
| 5  | user         | 1          | 12340001   | "tool_result" | {"observation": {...}}      |
| 6  | assistant    | 0          | NULL       | "text"     | 已选择用户 Alice                |
| 7  | user         | 0          | NULL       | "text"     | 好的，现在帮我总结...            |
| 8  | assistant    | 0          | NULL       | "text"     | 刚才你使用了 select-users...    |
```

**关键指标**：
- ✅ `native_content` 不为 NULL
- ✅ `message_role` 正确填充
- ✅ tool_use 和 tool_result 行都存在
- ✅ 第 8 行（第二轮回复）正常生成

### 4. 故障排查

#### 如果仍然出现 `gateway.upstream_unavailable`

**检查服务端日志**：
```bash
# 查找 LLM 调用日志
grep "Calling LLM for session" logs/api.log
grep "Anthropic API error" logs/api.log
```

**添加调试日志**（可选）：

在 `packages/api/src/app/llm/llm.service.ts` 的 `callLlm` 方法开头添加：

```typescript
this.logger.debug(
  `Anthropic request: messages.length=${messages.length}, ` +
  `roles=[${messages.map(m => m.role).join(',')}], ` +
  `hasToolBlocks=${messages.some(m => 
    Array.isArray(m.content) && 
    m.content.some(b => ['tool_use', 'tool_result'].includes(b.type))
  )}`
);
```

**预期日志**（第二轮对话）：
```
Anthropic request: messages.length=4, roles=[user,assistant,user,assistant], hasToolBlocks=true
```

#### 如果 `native_content` 是 NULL

- 检查数据库迁移是否成功应用
- 检查 API 服务器是否重启（需要重新加载 entity）
- 检查 TypeORM 是否同步了新字段（可能需要 `synchronize: true` 或手动迁移）

#### 如果 turnId 仍然溢出

检查生成逻辑：
```typescript
// session.service.ts line ~517
const turnIdBase = (sessionId * 1000000) + Math.floor(now.getTime() / 1000);
```

如果 `sessionId` 很大（>2000），可能仍会溢出。改为：
```typescript
const turnIdBase = (sessionId * 10000) + (Math.floor(now.getTime() / 1000) % 100000);
```

## 📊 成功指标

修复成功的标志：

1. ✅ Client Tool 调用后，第二轮对话正常返回（不报错）
2. ✅ `t_message` 表中能看到 `tool_use` 和 `tool_result` 行
3. ✅ LLM 能理解之前的工具调用上下文（回复中提到了之前的操作）
4. ✅ 服务端日志中 Anthropic API 调用成功率提高

## 🎯 如果一切正常

1. 关闭任务 #36 和 #37
2. 提交代码（建议 commit message 如下）：

```bash
git add .
git commit -m "fix: resolve gateway.upstream_unavailable by persisting native message content

Store complete Anthropic MessageParam content blocks (tool_use/tool_result) in
t_message.native_content to fix context loss after Client Tool suspend/resume.

Changes:
- Add native_content (JSON), message_role, turn_id columns to t_message
- Persist assistant tool_use turns and tool_result blocks to DB
- Reconstruct conversation history from native content (not text-only)
- Client Tool resume now rebuilds from t_message (not pending.messageContext)

Fixes: Client Tool 调用后第二轮对话的 gateway.upstream_unavailable 错误

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

**当前状态**：代码完成 ✅ | 待测试 🔴
