## 1. 数据库 schema

- [x] 1.1 在 `docs/database.sql` 的 `t_message` 表定义中添加 `is_thought INT NOT NULL DEFAULT 0` 字段（位于 `message_type` 字段之后）

## 2. 后端 - 数据模型

- [x] 2.1 在 `packages/api/src/app/session/message.entity.ts` 中给 MessageEntity 增加 `isThought` 字段（int，默认 0，列名 `is_thought`）

## 3. 后端 - Echo 流程增加 Thought

- [x] 3.1 在 `SessionService.createSessionWithFirstMessage` 中，用户消息保存后先创建 Thought 消息（user_name = "ASSISTANT", is_thought = 1, content = 用户输入），再创建 assistant 回复，确保 created_on 递增（用户 < Thought < 回复）
- [x] 3.2 在 `SessionService.createMessage` 中应用相同的"Thought 在前、回复在后"逻辑，并保留 lastActivityTime 更新
- [x] 3.3 调整 `CreateSessionResponse` 和 `CreateMessageResponse`：返回的 messages / 回复对象中要包含 Thought 消息（service 层将 Thought 与 assistantMessage 一并返回，controller 透传）

## 4. 前端 - 类型定义

- [x] 4.1 在 `packages/web/src/app/pages/chat/types.ts` 中给 Message 接口添加 `isThought: number` 字段
- [x] 4.2 调整 `CreateSessionResponse` / `CreateMessageResponse` 类型，使前端能拿到 Thought 消息（与后端 service 返回值对应）

## 5. 前端 - ThoughtMessage 组件

- [x] 5.1 创建 `packages/web/src/app/pages/chat/thought-message.tsx`：组件接收 `content` props，内部维护 `expanded` 本地 state，默认 false
- [x] 5.2 实现折叠态 UI：灯泡图标（`faLightbulb`）+ "Thought" 文字，淡灰色（`var(--muted)`），整行可点击
- [x] 5.3 实现展开态 UI：标题行下方以纯文本渲染 content（使用 `<pre>` 或 `white-space: pre-wrap` 保留换行和空格，不解析 Markdown）
- [x] 5.4 点击图标或文字切换 expanded 状态

## 6. 前端 - ChatPage 集成

- [x] 6.1 在 ChatPage 的消息渲染循环中，根据 `msg.isThought === 1` 选择渲染 `<ThoughtMessage>`，否则按现有气泡逻辑渲染
- [x] 6.2 调整发送消息后的 state 更新逻辑：将 service 返回的 Thought + assistant 回复都追加到 messages 列表

## 7. 样式

- [x] 7.1 在 `packages/web/src/styles.css` 中添加 `.chat-thought` 系列样式：
  - `.chat-thought`：无背景、无边框、左侧无头像（去掉 avatar gap）
  - `.chat-thought-header`：灯泡图标 + "Thought"，可点击，灰色
  - `.chat-thought-content`：展开后的纯文本内容样式（`white-space: pre-wrap`，等宽或正文字体，与普通消息保持视觉区别）

## 8. 验证

- [x] 8.1 后端编译通过（`npx nx build @wo-poc/api`）
- [x] 8.2 前端编译通过（`npx nx build @wo-poc/web`）
- [ ] 8.3 手动测试：发送消息 → 看到 Thought（折叠状态，灯泡图标 + "Thought"）→ 点击展开看到内容 → 再次点击折叠 → 多条 Thought 独立控制 → 刷新页面后历史消息依然有 Thought 标识
