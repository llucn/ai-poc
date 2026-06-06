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
系统 MUST 在用户发送消息后自动生成 assistant 回复，暂时使用 echo 模式（原样返回用户输入）。

#### Scenario: 生成 echo 回复
- **WHEN** 用户发送消息后
- **THEN** 系统创建一条 assistant 消息，内容为用户输入的原文，user_name 为 "ASSISTANT"

### Requirement: Markdown content support
系统 MUST 支持消息内容为 Markdown 格式。

#### Scenario: 渲染 Markdown 消息
- **WHEN** 消息内容包含 Markdown 语法（如粗体、列表、代码块）
- **THEN** 系统在对话界面中正确渲染 Markdown 格式

### Requirement: Message persistence
系统 MUST 持久化所有消息记录到数据库。

#### Scenario: 消息保存
- **WHEN** 用户或 assistant 发送消息
- **THEN** 系统将消息内容、会话 ID、发送者、时间戳保存到 t_message 表
