## ADDED Requirements

### Requirement: Create new session
系统 MUST 允许用户创建新的会话，并使用 selector agent 作为初始 agent。

#### Scenario: 成功创建会话
- **WHEN** 用户点击 "New Chat" 按钮
- **THEN** 系统创建一个新会话，使用 is_default=true 的 agent (selector)，返回 session ID，并跳转到对话界面

#### Scenario: Selector agent 作为默认 agent
- **WHEN** 新会话被创建
- **THEN** session 的 agent_id 字段被设置为 selector agent 的 ID

### Requirement: Support mid-conversation agent switching
系统 MUST 支持会话进行中的 agent 切换，允许 session.agent_id 字段在会话生命周期内被修改。

#### Scenario: Agent ID 可变性
- **WHEN** agent-switch 工具被调用
- **THEN** 系统更新 session.agent_id 为目标 agent 的 ID

#### Scenario: 保持会话连续性
- **WHEN** agent 切换发生
- **THEN** session ID 保持不变，仅 agent_id 字段被更新

#### Scenario: 更新会话活动时间
- **WHEN** agent 切换发生
- **THEN** session.last_activity_time 和 session.updated_on 字段被更新为当前时间

### Requirement: Track agent switch history
The system MUST maintain a log of all agent switches for a session in the `t_agent_switch_log` table.

#### Scenario: Log agent switch metadata
- **WHEN** an agent switch occurs
- **THEN** system creates a record in `t_agent_switch_log` with session_id, from_agent_id, to_agent_id, confidence_score, prompt_forward, switched_at timestamp, and created_by

#### Scenario: Query switch history
- **WHEN** retrieving session details
- **THEN** system can query switch history from `t_agent_switch_log` by session_id

### Requirement: List user sessions
系统 MUST 提供用户会话列表功能，仅显示当前用户创建的会话。

#### Scenario: 查看会话列表
- **WHEN** 用户访问 Chat 页面
- **THEN** 系统显示当前用户的所有会话，按最后活动时间倒序排列

#### Scenario: 过滤会话
- **WHEN** 用户在搜索框输入关键词
- **THEN** 系统过滤会话列表，仅显示名称包含关键词的会话

### Requirement: Delete sessions
系统 MUST 允许用户删除自己创建的会话。

#### Scenario: 删除单个会话
- **WHEN** 用户选中一个会话并点击 "Delete" 按钮，确认删除
- **THEN** 系统删除该会话及其所有消息记录

#### Scenario: 批量删除会话
- **WHEN** 用户选中多个会话并点击 "Delete" 按钮，确认删除
- **THEN** 系统批量删除所有选中的会话及其消息记录

#### Scenario: 删除前确认
- **WHEN** 用户点击 "Delete" 按钮
- **THEN** 系统弹出确认对话框："Delete sessions?"

### Requirement: Session access control
系统 MUST 确保用户只能访问和操作自己创建的会话。

#### Scenario: 访问他人会话
- **WHEN** 用户尝试访问不属于自己的会话
- **THEN** 系统返回 404 Not Found 错误
