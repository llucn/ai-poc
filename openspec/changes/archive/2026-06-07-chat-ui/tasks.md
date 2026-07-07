## 1. 数据库准备

- [x] 1.1 在 `docs/database.sql` 中添加 `t_session` 表定义（id, name, user_name, last_activity_time, created_on, created_by, updated_on, updated_by）
- [x] 1.2 在 `docs/database.sql` 中添加 `t_message` 表定义（id, session_id, user_name, message_type, content, created_on, created_by, updated_on, updated_by）

## 2. 后端 - Session 模块

- [x] 2.1 创建 `packages/api/src/app/session/session.entity.ts`（SessionEntity）
- [x] 2.2 创建 `packages/api/src/app/session/message.entity.ts`（MessageEntity）
- [x] 2.3 创建 `packages/api/src/app/session/session.dto.ts`（CreateSessionDto 包含首条消息内容, SessionResponse, MessageDto, CreateMessageDto, DeleteSessionsDto）
- [x] 2.4 创建 `packages/api/src/app/session/session.service.ts`，实现：createSessionWithFirstMessage（创建 session + 首条消息 + echo 回复）、findAll（分页，默认页长 20）、findOne、deleteByIds、createMessage、getMessages
- [x] 2.5 创建 `packages/api/src/app/session/session.controller.ts`，实现 REST API 端点（GET /sessions?page&pageSize, POST /sessions, DELETE /sessions, GET /sessions/:id, GET /sessions/:id/messages, POST /sessions/:id/messages）
- [x] 2.6 创建 `packages/api/src/app/session/session.module.ts`，注册 entities、service、controller
- [x] 2.7 在 `packages/api/src/app/app.module.ts` 和 `database.module.ts` 中导入 SessionModule 和 entities

## 3. 后端 - Echo 模式与延迟创建

- [x] 3.1 在 `POST /sessions` 中实现延迟创建逻辑：接收首条消息内容，创建 Session（name = content 截断前 200 字符）+ 用户消息 + echo assistant 消息，在同一事务中完成
- [x] 3.2 在 `POST /sessions/:id/messages` 中，保存用户消息后立即创建 echo assistant 消息（user_name="ASSISTANT"，content 为用户输入原文），同时更新 `t_session.last_activity_time`

## 4. 前端 - 类型定义

- [x] 4.1 创建 `packages/web/src/app/pages/chat/types.ts`（Session, Message, CreateSessionDto, CreateMessageDto）

## 5. 前端 - Session 列表页面

- [x] 5.1 创建 `packages/web/src/app/pages/chat/session-list.tsx`，实现会话列表 UI（表格：Check Box, Create Time, Last Activity Time, Name；New Session 按钮；Delete 按钮）
- [x] 5.2 实现会话分页加载（GET /sessions?page=1&pageSize=20），按 Last Activity Time 倒序排列，显示 Previous/Next 分页控件
- [x] 5.3 实现 New Session 功能（跳转到空白 Chat 界面 /chat/new，不创建后端 Session）
- [x] 5.4 实现批量删除功能（DELETE /sessions，确认对话框："Delete sessions?"）
- [x] 5.5 实现点击 Name 列跳转到对话页面（/chat/:sessionId）

## 6. 前端 - 对话界面

- [x] 6.1 创建 `packages/web/src/app/pages/chat/chat-page.tsx`，实现对话 UI（消息滚动区域、输入框、Send 按钮）
- [x] 6.2 实现 New Session 空白状态（无 sessionId 时显示欢迎界面：Robot 图标 + "Assistant" + "Ready to chat"）
- [x] 6.3 实现首条消息发送逻辑：调用 POST /sessions（携带消息内容），获取 sessionId 后更新 URL 为 /chat/:sessionId
- [x] 6.4 实现后续消息发送（POST /sessions/:id/messages），支持回车键和 Send 按钮，空输入时禁用发送
- [x] 6.5 实现消息全量加载（GET /sessions/:id/messages），按创建时间升序显示，不分页
- [x] 6.6 实现消息气泡组件（用户消息蓝色，assistant 消息灰色，四周圆角，宽高自适应）
- [x] 6.7 实现头像组件（用户：姓名首字母 + 蓝色背景；assistant：Robot 图标 + 灰色背景）
- [x] 6.8 使用 `@uiw/react-markdown-preview` 渲染消息内容（支持 Markdown）
- [x] 6.9 实现自动滚动到最新消息

## 7. 前端 - 路由和菜单

- [x] 7.1 在 `packages/web/src/app/router.tsx` 中添加 `/chat` 和 `/chat/:sessionId` 路由
- [x] 7.2 在 `packages/web/src/app/app-layout.tsx` 的 Sidebar 中添加 Chat 菜单项（位于 Dashboard 和 Settings 之间）

## 8. 样式

- [x] 8.1 在 `packages/web/src/styles.css` 中添加 Chat 相关样式（消息气泡、头像、输入框、滚动区域）

## 9. 验证

- [x] 9.1 后端编译通过（`npx nx build @ai-poc/api`）
- [x] 9.2 前端编译通过（`npx nx build @ai-poc/web`）
- [x] 9.3 手动测试：创建会话 → 发送消息 → 验证 echo 回复 → 删除会话
