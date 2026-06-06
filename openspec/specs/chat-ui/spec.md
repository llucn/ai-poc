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
