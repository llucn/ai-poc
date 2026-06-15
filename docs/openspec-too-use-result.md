# OpenSpec Change: too-use-result

## 状态

✅ **已完成 OpenSpec 设计** — 0/66 tasks 待实施

## 位置

`openspec/changes/too-use-result/`

## 包含文件

- **proposal.md** — 提案：为什么要做这个修改，修改什么，影响范围
- **design.md** — 详细设计：9 个关键决策（D1-D9），包括你提出的 4 个补齐点
- **tasks.md** — 66 个实施任务，分 14 个组
- **specs/** — 3 个能力的 spec 增量：
  - `action-tool/spec.md` — 修改 2 个需求，新增 3 个需求
  - `client-tool-execution/spec.md` — 修改 5 个需求
  - `chat-ui/spec.md` — 修改 2 个需求，新增 2 个需求

## 核心修复

**根本原因**（已在设计中明确）：
```typescript
// message-native.helper.ts:28
if (row.isThought === 1) continue;  // ← 跳过所有 thought 行

// message-native.helper.ts:176
createToolResultMessage(...) {
  return { ..., isThought: 1, ... };  // ← tool_result 行是 thought
}

// message-native.helper.ts:149
createAssistantToolUseMessage(...) {
  return { ..., isThought: 0, ... };  // ← tool_use 行不是 thought
}
```

→ 重建上下文时 tool_use 进入，tool_result 被跳过 → 不平衡 → `gateway.upstream_unavailable`

**修复（设计决策 D1）**：
```typescript
// 上下文重建不再看 is_thought，只看 message_role + native_content
for (const row of rows) {
  if (row.nativeContent) {
    messages.push({ role: row.messageRole, content: row.nativeContent });
  }
}
// is_thought 退化为纯 UI 折叠标志
```

## 4 个补齐点的落地

| 补齐点 | 对应设计决策 | 关键变化 |
|--------|-------------|---------|
| **1. call_id 从唯一变分组键** | D4 | `(call_id, tool_use_id)` 复合唯一；一个 assistant 轮次多个 tool_use 共享 call_id |
| **2. 浏览器回传带 tool_use_id** | D5 | `client_call` SSE 和 `ClientResultDto` 都增加 `toolUseId` 字段 |
| **3. 并行工具串行派发** | D6 | Client tools 一次发一个，收到结果再发下一个；无 pending 时才合并，天然避免竞态 |
| **4. 错误映射 + tool_use_id 字段名** | D7 | 失败存 `{error}`，合并时映射为 `{type:'tool_result', tool_use_id, content, is_error:true}` |

## 设计的关键决策（9 个）

1. **D1** — 上下文重建读 `message_role` + `native_content`，不看 `is_thought`（根本修复）
2. **D2** — 一轮 tool_use = 1 行；一轮所有 tool_result = 1 行
3. **D3** — `LlmTurn.tool_use` 携带所有 tool_use 块（`toolUses: []`）
4. **D4** — `call_id` 是分组键，复合唯一 `(call_id, tool_use_id)`
5. **D5** — Tool 结果端到端携带 `tool_use_id`
6. **D6** — Client tools 串行派发（避免竞态）
7. **D7** — 错误映射规则
8. **D8** — `message_context` 缩小为单个对象；`turn_id` 删除
9. **D9** — Chat UI 渲染 native blocks

## 影响范围

**后端**（11 个文件）：
- `message-native.helper.ts` — 核心重写
- `session.service.ts` — runLoop / resume / suspend 重写
- `llm.service.ts` — LlmTurn 改为数组
- `pending-client-call.entity.ts` — 索引 + message_context 类型
- `message.entity.ts` — 删 turn_id
- `session.dto.ts` — 加 toolUseId
- `session.service.spec.ts` — 测试更新
- `database.sql` + 迁移脚本

**前端**（5 个文件）：
- `types.ts` — Message 加字段
- `native-content.tsx` — 新建渲染组件
- `thought-message.tsx` — 显示 content + 展开 native_content
- `chat-page.tsx` — 气泡折叠控件 + toolUseId 传递
- `client-tool-executor.ts` / `tool-area-bridge.ts` — toolUseId 透传

## 兼容性

- **旧消息**：`native_content=NULL` 回退为文本（向后兼容）
- **旧 session**：pre-change 的 session 不保证可续聊（pending 行是临时的）
- **迁移**：单次 ALTER（drop turn_id + rebuild index），可逆

## 下一步

按照 `tasks.md` 的 14 个组、66 个任务逐步实施：

1. **数据库迁移**（4 tasks）
2. **Entity 修改**（3 tasks）
3. **LLM Service**（3 tasks）
4. **Message Helper**（5 tasks）
5. **Session Service**（13 tasks）— 最大改动
6. **前端类型**（1 task）
7. **Native Content 组件**（5 tasks）
8. **Thought Message**（4 tasks）
9. **Chat Page**（6 tasks）
10. **Client Tool Executor**（1 task）
11. **单元测试**（3 tasks）
12. **编译构建**（4 tasks）
13. **集成测试**（11 tasks）— 手动验证所有场景
14. **文档更新**（3 tasks）

## 命令

```bash
# 查看 change 状态
openspec list

# 查看某个 task group
cat openspec/changes/too-use-result/tasks.md

# 应用这个 change（待 OpenSpec CLI 支持）
# openspec apply too-use-result
```

---

这个 OpenSpec change 是对前两次修改的完整重构，明确了根本原因，补齐了所有设计漏洞，并提供了 66 个可追踪的实施任务。现在可以进入实施阶段了。
