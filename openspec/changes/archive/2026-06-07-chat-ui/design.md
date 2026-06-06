## Context

目前系统缺少对话界面。此次变更引入完整的 Chat 功能，包括会话管理、消息收发和 UI 展示。暂时不连接真实的 LLM 服务，使用 echo 模式模拟 assistant 回复（原样返回用户输入），为后续集成 LLM 打下基础。

现有系统已有用户认证（CurrentUser 标签）和权限控制，Chat 功能将复用这些机制，确保用户只能访问自己的会话。

## Goals / Non-Goals

**Goals:**
- 实现会话列表和对话界面的完整 UI 流程
- 提供会话的 CRUD 操作（创建、查看、删除）
- 支持文本消息的收发和持久化
- 使用 echo 模式模拟 assistant 回复（LLM 占位符）
- 支持 Markdown 格式的消息渲染
- 用户头像使用姓名首字母，assistant 使用 Robot 图标

**Non-Goals:**
- 不集成真实的 LLM 服务（后续迭代）
- 不支持图片、音频等多媒体消息（暂时仅文本）
- 不实现流式响应（echo 模式为同步返回）
- 不实现会话重命名功能（使用默认名称）

## Decisions

### Decision 1: Echo 模式实现
**选择**: 用户发送消息后，后端立即创建一条 assistant 消息，内容为用户输入的原文，`user_name` 字段为 `"ASSISTANT"`。

**理由**: 
- 简化开发，无需集成 LLM SDK
- 验证消息流、UI 渲染、数据持久化的完整链路
- 为后续 LLM 集成预留接口（替换 echo 逻辑即可）

**替代方案（未选择）**: 
- 使用第三方 mock API：增加外部依赖，不利于本地开发和测试
- 直接集成 LLM：超出本次变更范围，增加复杂度

### Decision 2: 数据库表设计
**选择**: 创建 `t_session` 和 `t_message` 两张表，`t_message.user_name` 字段区分用户消息（用户名）和 assistant 消息（`"ASSISTANT"`）。

**理由**: 
- 简单明了，符合传统聊天系统的设计
- `user_name` 字段复用现有用户名，减少 JOIN 查询
- `session_id` 外键关联（应用层维护，无 DB 外键约束）

**字段说明**:
- `t_session.last_activity_time`: 冗余字段，便于会话列表排序（避免子查询 `t_message`）
- `t_message.message_type`: 预留扩展（1: Text, 2: Image），当前仅支持 Text

**替代方案（未选择）**: 
- 使用 `role` 字段（`user`/`assistant`）：与现有的 `user_name` 字段语义重复，不如直接用 `"ASSISTANT"` 标识
- 分别创建 `t_user_message` 和 `t_assistant_message`：拆分表增加查询复杂度，不适合当前规模

### Decision 3: 前端 Markdown 渲染
**选择**: 使用 `@uiw/react-markdown-preview` 渲染消息内容（与 Agent Detail 的 System Prompt 编辑器一致）。

**理由**: 
- 项目已引入该库，零额外成本
- 支持代码高亮、表格、列表等常见格式
- 渲染性能良好，适合聊天场景

**替代方案（未选择）**: 
- `react-markdown`: 功能类似，但需额外安装依赖
- 纯文本显示：丧失 Markdown 能力，assistant 回复的代码块无法格式化

### Decision 4: 会话创建时机与命名
**选择**: 点击 "New Session" 时进入空白 Chat 界面（不创建 Session 对象）。用户发出第一条消息时，以消息内容为 Session Name（截断前 200 个字符），同时创建 Session 对象和首条消息。

**理由**: 
- 避免产生空会话（用户打开后未发言就离开不会留下垃圾数据）
- Session 名称来自首条消息内容，对用户更有意义，便于在列表中辨识
- 类似 ChatGPT 的交互模式，用户体验自然

**实现要点**:
- 前端 "New Session" 页面为纯 UI 状态，不调用后端创建 API
- 用户发出第一条消息时调用 `POST /sessions`（携带首条消息内容），后端在事务中：创建 Session（name = content.substring(0, 200)）→ 创建用户消息 → 创建 echo assistant 消息
- 后续消息通过 `POST /sessions/:id/messages` 正常发送

**替代方案（未选择）**: 
- 打开页面即创建 Session：会产生大量空会话，需要后台清理逻辑
- 使用时间戳命名 `"Chat YYYY-MM-DD HH:MM"`：对用户辨识价值低

### Decision 5: 头像实现
**选择**: 用户头像显示 First Name + Last Name 首字母（如 "JD"），蓝色圆形背景；assistant 使用 FontAwesome 的 Robot 图标，灰色圆形背景。

**理由**: 
- 简洁美观，无需上传头像图片
- 首字母头像在 SaaS 应用中常见（如 GitHub、Slack）
- FontAwesome 图标库已在项目中使用，零成本

**替代方案（未选择）**: 
- 允许用户上传头像：增加文件存储逻辑，本次变更范围外
- 使用 Gravatar：依赖外部服务，可能被防火墙拦截

## Risks / Trade-offs

### Risk 1: Echo 模式与真实 LLM 的接口差异
**风险**: 当前 echo 模式为同步返回，真实 LLM 可能需要流式响应（SSE 或 WebSocket）。

**缓解**: 
- 后端 API 设计时预留扩展点：`POST /sessions/:id/messages` 返回 assistant 消息 ID，前端轮询或监听 SSE 获取完整回复
- 前端 UI 预留 "正在输入..." 状态占位符

### Risk 2: `last_activity_time` 冗余字段可能不一致
**风险**: `t_session.last_activity_time` 需要在每次消息创建时手动更新，可能因事务失败导致不一致。

**缓解**: 
- 在 `createMessage` 事务中同时更新 `t_session.last_activity_time`
- 后续可添加定时任务校验并修复不一致数据

### Risk 3: Markdown XSS 攻击
**风险**: 用户输入恶意 Markdown（如内嵌 `<script>` 标签）可能导致 XSS。

**缓解**: 
- `@uiw/react-markdown-preview` 默认启用 sanitize，过滤危险标签
- 后端不对消息内容做额外校验（仅存储原文），由前端负责安全渲染

## Migration Plan

### 数据库迁移
1. 创建 `t_session` 和 `t_message` 表（执行 `docs/database.sql` 中的 DDL）
2. 无需数据迁移（新功能，无历史数据）

### 部署步骤
1. 部署后端 API（`/sessions`, `/messages` 接口）
2. 部署前端静态资源（Chat 页面和路由）
3. 验证：创建会话 → 发送消息 → 检查 echo 回复 → 删除会话

### 回滚策略
- 后端：删除 `session` 模块代码，移除路由
- 前端：隐藏 Chat 菜单项，移除 `/chat` 路由
- 数据库：保留表结构（`DROP TABLE` 仅在确认无需回滚时执行）

## Open Questions

1. ~~**会话分页**~~: ✅ 已确认 — Sessions 列表分页，默认页长 20 条。

2. ~~**消息分页**~~: ✅ 已确认 — Chat 界面消息不分页，全量加载。

3. **会话删除是否软删除**: 当前为硬删除（直接 DELETE），是否需要改为软删除（`deleted_at` 字段）？
   - **建议**: 首版硬删除，后续根据业务需求（如数据审计、恢复）决定是否软删除

4. **assistant 消息的 `created_by` 字段**: 当前设置为 `assistant/{username}`，是否需要记录触发该回复的用户？
   - **建议**: 保持当前设计，便于审计日志追踪（哪个用户触发了 assistant 回复）
