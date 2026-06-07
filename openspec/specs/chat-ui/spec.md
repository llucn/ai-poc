## ADDED Requirements

### Requirement: Chat menu entry
系统 MUST 在主导航菜单中添加 Chat 入口。

#### Scenario: 菜单可见性
- **WHEN** 已登录用户查看主导航菜单
- **THEN** 系统显示 "Chat" 菜单项，位于 Dashboard 和 Settings 之间

#### Scenario: 点击 Chat 菜单
- **WHEN** 用户点击 Chat 菜单项
- **THEN** 系统导航到会话列表页面

### Requirement: Session list page
系统 MUST 提供会话列表页面，展示用户的所有会话。

#### Scenario: 显示会话列表
- **WHEN** 用户访问会话列表页面
- **THEN** 系统显示表格，包含列：Check Box、Create Time、Last Activity Time、Name

#### Scenario: 会话排序
- **WHEN** 会话列表加载
- **THEN** 系统按 Last Activity Time 倒序排列会话

#### Scenario: 点击会话名称
- **WHEN** 用户点击会话的 Name 列
- **THEN** 系统导航到该会话的对话界面

#### Scenario: 批量选择和删除
- **WHEN** 用户选中一个或多个会话，点击 "- Delete" 按钮
- **THEN** 系统弹出确认对话框 "Delete sessions?"，确认后删除选中的会话

### Requirement: New Chat button
系统 MUST 在会话列表页面提供 "New Chat" 按钮。

#### Scenario: 创建新会话
- **WHEN** 用户点击 "New Chat" 按钮
- **THEN** 系统创建新会话，生成默认名称（如 "Chat YYYY-MM-DD HH:MM"），并跳转到对话界面

### Requirement: Conversation interface
系统 MUST 提供传统对话界面，输入框位于底部，消息滚动显示在上方。

#### Scenario: 显示对话界面
- **WHEN** 用户打开一个会话
- **THEN** 系统显示对话窗口，输入框在底部，历史消息在上方，自动滚动到最新消息

#### Scenario: 文本输入和发送
- **WHEN** 用户在输入框输入文本并按回车键或点击 "Send" 按钮
- **THEN** 系统发送消息，清空输入框，在对话区域显示新消息

#### Scenario: 空输入禁用发送
- **WHEN** 输入框为空或仅包含空格
- **THEN** Send 按钮保持禁用状态，回车键不触发发送

### Requirement: Message bubble display
系统 MUST 以气泡形式显示消息，宽度和高度自适应内容。

#### Scenario: 用户消息气泡
- **WHEN** 显示用户消息
- **THEN** 系统显示蓝色圆角气泡，左侧显示用户头像（First Name 和 Last Name 首字母，蓝色背景）

#### Scenario: Assistant 消息气泡
- **WHEN** 显示 assistant 消息
- **THEN** 系统显示灰色圆角气泡，左侧显示 Robot 图标（灰色背景）

#### Scenario: Markdown 渲染
- **WHEN** 消息内容包含 Markdown 语法
- **THEN** 系统在气泡内正确渲染 Markdown 格式（粗体、斜体、列表、代码块等）

### Requirement: Avatar display
系统 MUST 为用户和 assistant 显示不同的头像。

#### Scenario: 用户头像
- **WHEN** 显示用户消息
- **THEN** 头像显示用户 First Name 和 Last Name 的首字母，蓝色背景

#### Scenario: Assistant 头像
- **WHEN** 显示 assistant 消息
- **THEN** 头像显示 Robot 图标，灰色背景

### Requirement: Text-only support
系统 MUST 仅支持文本对话，暂不支持图片、音频。

#### Scenario: 消息类型限制
- **WHEN** 用户尝试发送消息
- **THEN** 系统仅接受纯文本输入，不提供图片或音频上传功能

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
