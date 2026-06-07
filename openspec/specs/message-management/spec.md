## ADDED Requirements

### Requirement: Send text message
系统 MUST 允许用户在会话中发送文本消息。

#### Scenario: 发送消息（回车键）
- **WHEN** 用户在输入框输入文本并按回车键
- **THEN** 系统创建用户消息记录，显示在对话界面，并触发 assistant 回复

#### Scenario: 发送消息（Send 按钮）
- **WHEN** 用户在输入框输入文本并点击 "Send" 按钮
- **THEN** 系统创建用户消息记录，显示在对话界面，并触发 assistant 回复

#### Scenario: 空消息不发送
- **WHEN** 用户在输入框为空或仅包含空格时尝试发送
- **THEN** 系统不创建消息记录，Send 按钮保持禁用状态

### Requirement: Retrieve session messages
系统 MUST 提供获取会话历史消息的功能。

#### Scenario: 加载会话消息
- **WHEN** 用户打开一个会话
- **THEN** 系统按创建时间升序返回该会话的所有消息记录

### Requirement: Echo assistant response (mock)
系统 MUST 在用户发送消息后自动生成 assistant 回复。当前使用 echo 模式：先生成一条 Thought 消息（内容为用户输入原文），再生成普通回复（内容为用户输入原文）。

#### Scenario: 生成 Thought + 回复
- **WHEN** 用户发送消息后
- **THEN** 系统在同一事务中按时间顺序创建：
  1. 用户消息（user_name = 用户名, is_thought = 0）
  2. Thought 消息（user_name = "ASSISTANT", is_thought = 1, content = 用户输入原文）
  3. Assistant 回复（user_name = "ASSISTANT", is_thought = 0, content = 用户输入原文）

#### Scenario: 时间顺序稳定
- **WHEN** 三条消息在同一毫秒创建
- **THEN** 系统通过递增 created_on（用户 < Thought < 回复）确保排序稳定

### Requirement: Thought message support
系统 MUST 支持标识 Thought 类型的消息，区别于普通对话消息。

#### Scenario: 持久化 Thought 标识
- **WHEN** 系统创建 Thought 消息
- **THEN** 系统将该消息的 `is_thought` 字段设置为 1 并保存到 t_message 表

#### Scenario: 普通消息默认非 Thought
- **WHEN** 系统创建普通用户消息或 assistant 回复
- **THEN** 系统将该消息的 `is_thought` 字段设置为 0

#### Scenario: 检索消息含 Thought 标识
- **WHEN** 用户加载会话消息
- **THEN** 返回的每条消息包含 `is_thought` 字段，前端据此判断渲染样式

### Requirement: Markdown content support
系统 MUST 支持消息内容为 Markdown 格式。

#### Scenario: 渲染 Markdown 消息
- **WHEN** 消息内容包含 Markdown 语法（如粗体、列表、代码块）
- **THEN** 系统在对话界面中正确渲染 Markdown 格式

### Requirement: Message persistence
系统 MUST 持久化所有消息记录到数据库，包括 is_thought 标识。

#### Scenario: 消息保存
- **WHEN** 用户或 assistant 发送消息
- **THEN** 系统将消息内容、会话 ID、发送者、时间戳、is_thought 字段保存到 t_message 表
