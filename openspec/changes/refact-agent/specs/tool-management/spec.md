## ADDED Requirements

### Requirement: Tool 作为顶层资源管理
系统 MUST 把 MCP Tool 作为独立顶层资源进行 CRUD 管理，与 Agent 解耦；每个 Tool 由 `id`、`server_name`、`server_url`、`mcp_schema` 与审计字段构成。`server_name` 字段 MUST 符合 kebab-case 格式（仅小写字母、数字、连字符，不以连字符开头或结尾），且在 `t_tool` 表中全局唯一。

#### Scenario: 创建 Tool（MCP URL 注册）
- **WHEN** SYSTEM_ADMIN 用户在 Tools 编辑页输入符合 kebab-case 格式且唯一的 `server_name` 与 `server_url`，先按 `Test` 抓取 MCP 信息成功，再按 `Save`
- **THEN** 系统向 `t_tool` 写入一条记录，`mcp_schema` 字段保存抓取到的 `[{ name, description, parameters }, ...]` 数组，并在 Tools 列表显示该 Tool

#### Scenario: server_name 格式校验失败
- **WHEN** SYSTEM_ADMIN 用户输入的 `server_name` 不符合 kebab-case 格式（例如包含大写字母、空格、下划线，或以连字符开头/结尾）
- **THEN** 系统显示格式错误提示（"Server name must be kebab-case: lowercase letters, numbers, and hyphens only, not starting or ending with hyphen"），且 `Save` 按钮保持禁用

#### Scenario: server_name 唯一性校验失败
- **WHEN** SYSTEM_ADMIN 用户输入的 `server_name` 已被其它 Tool 使用
- **THEN** 系统显示唯一性错误提示（"Server name already exists"），且 `Save` 按钮保持禁用

#### Scenario: 测试 MCP URL 失败
- **WHEN** SYSTEM_ADMIN 用户输入 `server_url` 后按 `Test`，但 URL 无法返回合法 MCP 注册信息
- **THEN** 系统在表单内显示具体错误提示且不创建记录，`Save` 按钮保持禁用直到再次成功 `Test`

#### Scenario: 编辑 Tool
- **WHEN** SYSTEM_ADMIN 用户在 Tool Detail 修改 `server_name`（需满足 kebab-case 格式与全局唯一性）或 `server_url`（修改 URL 时必须先 Test 成功）并保存
- **THEN** 系统更新 `t_tool` 行的对应字段、刷新 `mcp_schema`，并写入 `updated_on` / `updated_by`

#### Scenario: 删除 Tool 并提示影响范围
- **WHEN** SYSTEM_ADMIN 用户点击 Tools 列表上的 `-Delete` 按钮
- **THEN** 系统弹出 `Delete tool?` 确认提示并显示该 Tool 当前关联的 Agent 数量；确认后系统先级联删除 `t_agent_tool` 中所有指向该 `tool_id` 的关联，再删除 `t_tool` 本体

### Requirement: Tools 列表与详情界面
系统 MUST 提供 SYSTEM_ADMIN 可见的 Tools 列表与详情界面。

#### Scenario: 列表展示
- **WHEN** SYSTEM_ADMIN 用户进入 `Tools` 顶部菜单
- **THEN** 系统显示 Tools 列表，列至少包含 `ID`、`Name`、`URL`、`Tools`（mcp_schema 中工具数量）、`Status`，并提供 `+Add` 与 `-Delete` 按钮

#### Scenario: 查看详情
- **WHEN** SYSTEM_ADMIN 用户点击列表中某个 Tool 的 `Name`
- **THEN** 系统跳转到 Tool Detail 页，展示该 Tool 的完整字段并以可读格式列出 `mcp_schema` 内的每个工具（name、description、parameters）

#### Scenario: 非 SYSTEM_ADMIN 不可访问
- **WHEN** 角色不是 `SYSTEM_ADMIN` 的用户访问 `/settings/tools`
- **THEN** 顶部菜单不显示 `Tools` 入口；直接通过 URL 访问也被路由保护拦截或返回 403

### Requirement: Tool 与 Agent 的多对多关联
系统 MUST 通过 `t_agent_tool` 关联表把 Tool 与 Agent 关联，支持同一 Tool 被多个 Agent 复用。

#### Scenario: 关联 Tool 到 Agent
- **WHEN** SYSTEM_ADMIN 用户在 Agent Detail 选择已有 Tool 并确认
- **THEN** 系统在 `t_agent_tool` 写入 `(agent_id, tool_id)` 关联（同一对组合保持唯一）

#### Scenario: 解除关联但保留 Tool
- **WHEN** SYSTEM_ADMIN 用户在 Agent Detail 把某个已关联 Tool 移除
- **THEN** 系统仅删除该 Agent 与 Tool 的 `t_agent_tool` 关联记录，`t_tool` 本体不受影响
