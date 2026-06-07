## Context

Chat 模块当前实现 echo 模式：用户发送消息后，后端生成一条 assistant 回复（内容为用户输入原文）。现在需要扩展该模式，让 assistant 在回复前先输出一条 Thought 消息，模拟 LLM 的"思考-回答"流程。前端需要相应支持 Thought 的折叠/展开 UI。

由于尚未连接真实 LLM，本次变更专注于数据模型、API 流程和 UI 组件三个层面，确保未来切换到真实 LLM 时只需替换 echo 逻辑。

## Goals / Non-Goals

**Goals:**
- 支持 Thought 消息的存储和检索（`t_message.is_thought`）
- 后端 echo 流程在每个 assistant 回复前插入一条 Thought 消息
- 前端对话界面区分 Thought 与普通消息的渲染：折叠交互、无头像、无气泡
- Thought 内容使用纯文本渲染（保留换行/空格但不解析 Markdown 语法）

**Non-Goals:**
- 不集成真实 LLM（沿用 echo 模式）
- 不支持流式 Thought（一次性返回完整文本）
- 不实现 Thought 内容的编辑或删除（与普通消息走相同的删除路径，跟随会话删除）
- 不为 Thought 提供独立的 API 端点（嵌入到现有 message API 中返回）

## Decisions

### Decision 1: 数据模型 — 单表新增标志位
**选择**: `t_message` 表增加 `is_thought INT NOT NULL DEFAULT 0` 字段。

**理由**:
- Thought 在对话时间线上与普通消息地位平等（都需要按 created_on 排序），单表便于查询和分页
- `int` 类型与现有 `message_type` 字段风格一致（项目惯例使用 int 而非 boolean）
- 默认值 0 保证向后兼容，已有数据不受影响

**替代方案（未选择）**:
- 使用 `message_type = 3` 标识 Thought：会与 type 字段（1=Text, 2=Image）的语义混淆
- 单独建 `t_thought` 表：拆分查询变复杂，跨表 JOIN 影响性能

### Decision 2: Echo 流程 — 三条消息（用户 + Thought + 回复）
**选择**: 用户发送消息后，后端在同一事务内创建三条消息：
1. 用户消息（user_name = 用户名, is_thought = 0）
2. Thought 消息（user_name = "ASSISTANT", is_thought = 1, content 为用户输入）
3. Assistant 回复（user_name = "ASSISTANT", is_thought = 0, content 为用户输入）

**理由**:
- 三条消息按 `created_on` 顺序展示，与真实 LLM 的"用户提问 → 思考 → 回答"流程一致
- 复用现有事务和 `lastActivityTime` 更新逻辑，改动最小
- 通过 `created_on` 加 1ms / 2ms 的递增确保排序稳定

**替代方案（未选择）**:
- 仅返回 Thought（不返回回复）：UI 上没有最终答案，体验不完整
- 同步返回 Thought 后异步返回回复：当前是同步 echo，引入异步会增加复杂度

### Decision 3: 前端折叠组件 — 本地 state 控制
**选择**: Thought 消息使用独立的 `<ThoughtMessage>` 组件，组件内部维护 `expanded` 本地 state，默认 `false`。点击灯泡图标或 "Thought" 文字切换展开状态。

**理由**:
- 折叠状态是 UI 偶发状态，不需要持久化或上报到后端
- 每个 Thought 独立控制，避免一处展开导致全部展开
- 组件封装清晰，便于复用和测试

**实现要点**:
- 折叠态：仅显示一行 — 灯泡图标 + "Thought"（灰色文字）
- 展开态：在标题行下方显示完整内容（纯文本渲染）
- 整行可点击，光标显示 pointer

**替代方案（未选择）**:
- 全局 state 管理所有 Thought 的展开状态：过度设计
- 折叠状态保存到 localStorage：用户重新打开会话希望统一从折叠态开始

### Decision 4: Thought 样式 — 无头像、无气泡
**选择**: Thought 消息：
- 不渲染头像（左侧无 Robot 图标）
- 不渲染气泡背景（无边框、无背景色）
- 灯泡图标 + "Thought" 标题使用淡灰色（`var(--muted)`）
- 展开后的内容使用普通文本样式，与气泡内消息保持视觉差异

**理由**:
- Thought 不是说话方，不需要"发言人"概念
- 视觉上与气泡内的消息明显区分，让用户一眼识别"这是思考过程而不是回答"
- 与设计文档要求一致："无边框的文本，不需要气泡框"

## Risks / Trade-offs

### Risk 1: 时间戳精度冲突
**风险**: 三条消息在同一毫秒内创建可能导致 `created_on` 相同，排序不稳定。

**缓解**:
- 已有方案：手动加 1ms / 2ms 偏移（`new Date(now.getTime() + 1)`）
- 排序时使用 `created_on ASC, id ASC` 双字段，id 作为稳定 tie-breaker

### Risk 2: 真实 LLM 集成时数据模型不匹配
**风险**: 真实 LLM 的 Thought 可能有更多元数据（推理步骤编号、置信度等）。

**缓解**:
- 当前只标识 is_thought 和 content，元数据如有需要可后续扩展（添加新列或 JSON 字段）
- echo 流程本就是占位符，集成真实 LLM 时无论如何都要重写

### Risk 3: 旧消息没有 is_thought 字段
**风险**: 数据库已有的消息行 `is_thought` 为 NULL（如果改 schema 但未给默认值）。

**缓解**:
- DDL 使用 `NOT NULL DEFAULT 0`，确保旧行自动填充为 0
- 实体的 isThought 字段类型为 `number`，不会触发 null 处理

## Migration Plan

### 数据库变更
执行 `ALTER TABLE t_message ADD COLUMN is_thought INT NOT NULL DEFAULT 0;` 或者重新创建表（开发环境）。

### 部署步骤
1. 应用数据库 schema 变更
2. 部署后端（`SessionService` 含 Thought 生成逻辑）
3. 部署前端（含 ThoughtMessage 组件和样式）
4. 验证：发送消息 → 看到 Thought（折叠）→ 点击展开 → 看到回复

### 回滚策略
- 数据库：保留 `is_thought` 列（无害，旧代码忽略即可）
- 后端：还原到无 Thought 生成的 echo 逻辑
- 前端：还原 ChatPage 的 Thought 渲染分支

## Open Questions

无重大未决项。所有需求点均明确：
- 字段类型 → int
- 标识发言人 → user_name = "ASSISTANT"
- 折叠/展开交互 → 已明确点击图标 + 文字切换
- 是否显示头像 → 不显示
