## ADDED Requirements

### Requirement: Thought message display
系统 MUST 以折叠形式在对话时间线上展示 Thought 消息，区别于普通消息。

#### Scenario: 默认折叠
- **WHEN** Thought 消息显示在对话界面
- **THEN** 系统默认折叠 Thought 内容，仅显示一行：灯泡图标 + "Thought" 文字

#### Scenario: 点击展开
- **WHEN** 用户点击灯泡图标或 "Thought" 文字
- **THEN** 系统展开 Thought 消息，以纯文本形式显示完整内容（保留换行和空格，不解析 Markdown 语法）

#### Scenario: 再次点击折叠
- **WHEN** Thought 处于展开状态，用户再次点击图标或文字
- **THEN** 系统折叠 Thought，回到只显示标题的状态

#### Scenario: 多个 Thought 独立控制
- **WHEN** 对话中存在多条 Thought 消息
- **THEN** 每条 Thought 的折叠/展开状态相互独立，不互相影响

### Requirement: Thought message styling
系统 MUST 为 Thought 消息使用区别于普通消息的样式：无头像、无气泡。

#### Scenario: 不显示头像
- **WHEN** 渲染 Thought 消息
- **THEN** 系统不显示左侧的 Robot 头像图标

#### Scenario: 无气泡背景
- **WHEN** 渲染 Thought 消息
- **THEN** 系统不绘制气泡边框和背景色，文本以无边框样式呈现

#### Scenario: 灯泡图标提示
- **WHEN** Thought 消息显示标题行
- **THEN** 标题行包含灯泡图标 + "Thought" 文字，整行可点击切换展开状态
