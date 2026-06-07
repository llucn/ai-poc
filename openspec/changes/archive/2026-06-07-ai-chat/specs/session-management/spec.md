## MODIFIED Requirements

### Requirement: Lazy session creation
系统 MUST 在用户发送第一条消息时创建会话，会话名称为消息内容的前 200 字符，并自动关联默认 Agent。

#### Scenario: 创建会话并关联默认 Agent
- **WHEN** 用户在空白对话界面发送第一条消息
- **THEN** 系统查询 `is_default=1` 的 Agent，创建会话并设置 `agent_id` 字段，保存用户消息，调用 LLM 生成 Thought 和回复

#### Scenario: 默认 Agent 不存在时报错
- **WHEN** 用户发送第一条消息但数据库中没有 `is_default=1` 的 Agent
- **THEN** 系统返回错误："Default agent not configured. Please contact admin."

## ADDED Requirements

### Requirement: Agent association
系统 MUST 为每个会话关联一个 Agent，后续对话使用该 Agent 的配置生成回复。

#### Scenario: 会话关联 Agent
- **WHEN** 会话创建时
- **THEN** 系统将 `agent_id` 字段设置为默认 Agent 的 ID

#### Scenario: 对话时实时查询 Agent
- **WHEN** 用户在已有会话中发送消息
- **THEN** 系统根据 `session.agent_id` 查询 Agent 记录，获取 `system_prompt` 和 `model_config`，用于构建 LLM 请求上下文
