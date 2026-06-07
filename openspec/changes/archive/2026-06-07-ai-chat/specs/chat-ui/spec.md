## MODIFIED Requirements

### Requirement: Message sending
系统 MUST 使用 SSE（Server-Sent Events）发送消息，实时接收 Thought 和 assistant 回复事件。

#### Scenario: 使用 SSE 发送消息
- **WHEN** 用户在输入框输入文本并点击 Send 或按回车键
- **THEN** 前端使用 `fetch` + SSE 解析（或 `@microsoft/fetch-event-source`）向 POST `/sessions/:id/messages` 发送请求，建立 SSE 连接

#### Scenario: 实时接收 Thought 事件
- **WHEN** 后端推送 `event: thought_created` 事件
- **THEN** 前端解析 `data` 字段（JSON），将 Thought 消息追加到 `messages` state，界面立即显示折叠的 Thought

#### Scenario: 实时接收回复事件
- **WHEN** 后端推送 `event: message_created` 事件
- **THEN** 前端解析 `data` 字段（JSON），将 assistant 回复追加到 `messages` state，界面立即显示气泡

#### Scenario: 接收错误事件
- **WHEN** 后端推送 `event: error` 事件
- **THEN** 前端解析 `data.message`，显示错误提示（如"LLM call failed, please try again"），不追加任何消息

#### Scenario: SSE 连接完成
- **WHEN** 后端发送完 Thought 和回复事件后关闭连接
- **THEN** 前端 `EventSource` 触发 `onclose`，清理资源

## ADDED Requirements

### Requirement: Real-time response display
系统 MUST 在 Thought 和 assistant 回复分别到达时立即渲染，无需等待所有事件完成。

#### Scenario: 发送前显示加载状态
- **WHEN** 用户点击 Send 按钮或按回车键，SSE 连接建立
- **THEN** 前端在对话区域显示 "Thinking..." 文字和 spinner 加载动画

#### Scenario: Thought 到达后替换加载状态
- **WHEN** SSE 推送 `thought_created` 事件
- **THEN** 前端移除 "Thinking..." 加载状态，立即显示折叠的 Thought（灯泡图标 + "Thought"），assistant 回复尚未显示

#### Scenario: 回复后到达
- **WHEN** SSE 推送 `message_created` 事件
- **THEN** 前端在 Thought 下方显示 assistant 回复气泡，对话完整呈现

#### Scenario: 发送过程中禁用输入
- **WHEN** SSE 连接建立且未关闭
- **THEN** Send 按钮和输入框保持禁用状态，防止重复发送

#### Scenario: 连接关闭后恢复输入
- **WHEN** SSE 连接关闭（成功或失败）
- **THEN** Send 按钮和输入框恢复可用状态，移除任何加载状态，用户可以继续发送消息
