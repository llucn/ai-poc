## ADDED Requirements

### Requirement: Create new session
系统 MUST 允许用户创建新的会话。

#### Scenario: 成功创建会话
- **WHEN** 用户点击 "New Chat" 按钮
- **THEN** 系统创建一个新会话，返回 session ID，并跳转到对话界面

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
