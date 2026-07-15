## MODIFIED Requirements

### Requirement: Create new session
The system MUST allow sessions to be created both by user interaction (clicking "New Chat") and programmatically by internal services (e.g., the job scheduler). When created programmatically, the session SHALL use the specified agent_id directly rather than the default selector agent.

#### Scenario: 成功创建会话
- **WHEN** 用户点击 "New Chat" 按钮
- **THEN** 系统创建一个新会话，使用 is_default=true 的 agent (selector)，返回 session ID，并跳转到对话界面

#### Scenario: Selector agent 作为默认 agent
- **WHEN** 新会话被创建 by user interaction
- **THEN** session 的 agent_id 字段被设置为 selector agent 的 ID

#### Scenario: Programmatic session creation
- **WHEN** an internal service creates a session with a specific agent_id and userName
- **THEN** the system creates the session with the provided agent_id directly, without going through the selector agent
