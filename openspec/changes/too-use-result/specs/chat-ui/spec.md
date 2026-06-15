## MODIFIED Requirements

### Requirement: Thought message display

系统 MUST 以折叠形式在对话时间线上展示 Thought 消息（`isThought=1`），区别于普通消息。Thought 消息不再固定显示 "Thought" 标签，而是显示消息的 `content` 字段作为标题行。用户点击标题行可展开查看该消息的 `native_content`（渲染为结构化的 text / tool_use / tool_result 块）。

#### Scenario: Thought 默认折叠显示 content

- **WHEN** Thought 消息（`isThought=1`）显示在对话界面，其 `content` 为 "Calling tools…"
- **THEN** 系统默认折叠，仅显示一行：灯泡图标 + "Calling tools…" 文字（非固定 "Thought"）

#### Scenario: 点击展开显示 native_content

- **WHEN** 用户点击 Thought 的标题行
- **THEN** 系统展开显示该 Thought 的 `native_content` 字段（若为 JSON 数组，渲染每个 content block：text 块显示文本、tool_use 块显示工具名和参数、tool_result 块显示结果内容或错误）

#### Scenario: 再次点击折叠

- **WHEN** Thought 处于展开状态，用户再次点击标题行
- **THEN** 系统折叠 Thought，回到只显示 content 的状态

#### Scenario: 多个 Thought 独立控制

- **WHEN** 对话中存在多条 Thought 消息
- **THEN** 每条 Thought 的折叠/展开状态相互独立，不互相影响

### Requirement: Thought message styling

系统 MUST 为 Thought 消息使用区别于普通消息的样式：无头像、无气泡、可折叠的标题行。

#### Scenario: 不显示头像

- **WHEN** 渲染 Thought 消息
- **THEN** 系统不显示左侧的 Robot 头像图标

#### Scenario: 无气泡背景

- **WHEN** 渲染 Thought 消息
- **THEN** 系统不绘制气泡边框和背景色，以无边框样式呈现

#### Scenario: 灯泡图标提示

- **WHEN** Thought 消息显示标题行
- **THEN** 标题行包含灯泡图标 + `content` 字段文本，整行可点击切换展开状态

## ADDED Requirements

### Requirement: Regular message native content expansion

系统 MUST 为普通消息（`isThought=0`）的气泡右上角提供折叠/展开控件，点击后显示该消息的 `native_content` 结构化内容。默认状态为折叠（仅显示 `content` 的 Markdown 渲染）。

#### Scenario: 气泡右上角显示展开图标

- **WHEN** 渲染一条普通消息（`isThought=0`），该消息有 `native_content` 字段
- **THEN** 消息气泡右上角显示一个折叠/展开图标（如 chevron-down）

#### Scenario: 点击图标展开 native_content

- **WHEN** 用户点击折叠/展开图标
- **THEN** 气泡下方展开显示该消息的 `native_content`（渲染每个 content block），图标变为 chevron-up

#### Scenario: 再次点击折叠

- **WHEN** native_content 处于展开状态，用户再次点击图标
- **THEN** native_content 收起，图标变回 chevron-down

#### Scenario: 无 native_content 时不显示控件

- **WHEN** 消息的 `native_content` 为 null 或 undefined
- **THEN** 气泡右上角不显示折叠/展开控件

### Requirement: Native content block rendering

系统 MUST 提供结构化的 `native_content` 块渲染组件，支持以下三种 Anthropic content block 类型：`text`（纯文本）、`tool_use`（工具调用，显示工具名和参数）、`tool_result`（工具结果，显示内容和错误标记）。

#### Scenario: 渲染 text 块

- **WHEN** `native_content` 包含 `{type:'text', text:'Hello'}`
- **THEN** 渲染为纯文本 "Hello"

#### Scenario: 渲染 tool_use 块

- **WHEN** `native_content` 包含 `{type:'tool_use', id:'toolu_A', name:'mcp__5__getWeather', input:{city:'Beijing'}}`
- **THEN** 渲染为结构化显示：标题 "Tool Use: mcp__5__getWeather"，参数 `{city:'Beijing'}` 格式化为 JSON

#### Scenario: 渲染 tool_result 块（成功）

- **WHEN** `native_content` 包含 `{type:'tool_result', tool_use_id:'toolu_A', content:'{"temp":25}'}`
- **THEN** 渲染为标题 "Tool Result (toolu_A)"，内容 `{"temp":25}`

#### Scenario: 渲染 tool_result 块（错误）

- **WHEN** `native_content` 包含 `{type:'tool_result', tool_use_id:'toolu_B', content:'Timeout', is_error:true}`
- **THEN** 渲染为标题 "Tool Result (toolu_B) [Error]"，内容 "Timeout"，以错误样式（如红色文本）显示

#### Scenario: 渲染多个块

- **WHEN** `native_content` 为 `[{type:'text', text:'Checking...'}, {type:'tool_use', ...}, {type:'tool_result', ...}]`
- **THEN** 按顺序渲染 3 个块，每个块之间有视觉分隔
