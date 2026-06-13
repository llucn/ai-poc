## ADDED Requirements

### Requirement: MCP Tool Registration via URL
系统 MUST 允许 SYSTEM_ADMIN 用户通过 URL 注册 Tool（顶层资源），自动抓取 MCP 工具的描述和参数信息后保存到 `t_tool` 表；Agent 与 Tool 之间的关联保存在 `t_agent_tool` 关联表，单个 Tool 可被任意数量的 Agent 关联。**`t_tool` 表增加 `kind` 字段（'mcp' | 'client'，默认 'mcp'），用于区分 MCP Tool 和 Client Tool。**

#### Scenario: 成功注册 MCP Tool
- **WHEN** SYSTEM_ADMIN 用户在 Tools 编辑页输入 `server_name` 和 `server_url`，选择 kind='mcp'，并完成 `Test` + `Save` 流程
- **THEN** 系统在 `t_tool` 创建一条记录，`kind='mcp'`，`mcp_schema` 字段保存抓取到的 MCP 工具数组（`name`、`description`、`parameters`），不会自动建立任何 Agent 关联

#### Scenario: URL 抓取失败时的降级
- **WHEN** URL 抓取失败或超时
- **THEN** 系统在表单内显示错误提示，不创建 `t_tool` 记录，且 `Save` 按钮保持禁用直至再次 Test 成功

#### Scenario: 关联已有 Tool 到 Agent（不限 kind）
- **WHEN** SYSTEM_ADMIN 用户在 Agent Detail 页选择一个已注册的 Tool（kind='mcp' 或 'client'）并确认
- **THEN** 系统在 `t_agent_tool` 写入 `(agent_id, tool_id)` 关联，且不重复创建 `t_tool` 行
- **AND** Agent 可同时关联 MCP Tool 和 Client Tool

#### Scenario: 手动注册 Client Tool（Phase 1）
- **WHEN** SYSTEM_ADMIN 用户在 Tools 编辑页选择 kind='client'，输入 `server_name`（kebab-case），手动粘贴 `mcp_schema` JSON（格式与 MCP Tool 一致），server_url 留空或填占位符，点击 Save（不点击 Test）
- **THEN** 系统在 `t_tool` 创建一条记录，`kind='client'`，`mcp_schema` 保存手动输入的 JSON，不验证 server_url 连通性

#### Scenario: Client Tool 不支持 Test 按钮
- **WHEN** SYSTEM_ADMIN 用户在 Tools 编辑页选择 kind='client'
- **THEN** Test 按钮置灰或不显示（提示 "Client Tools do not require server connectivity test"）

### Requirement: Tool 列表管理
系统 MUST 为每个 Agent 提供"已关联 Tool"的列表管理功能，支持查看已关联 Tool、关联新的已有 Tool 以及解除关联，但 Tool 本身的创建/编辑/删除由顶层 `tool-management` 能力承担。**列表显示时需区分 kind（MCP / Client）。**

#### Scenario: 查看 Agent 的 Tools 列表（含 kind）
- **WHEN** SYSTEM_ADMIN 用户查看某个 Agent 的详情
- **THEN** 系统通过 join `t_agent_tool` 与 `t_tool` 显示该 Agent 已关联的所有 Tools 列表，包含每个 Tool 的 `id`、`kind`、`server_name`、`server_url` 和 `mcp_schema` 摘要
- **AND** 列表中 kind='mcp' 的工具显示蓝色 "MCP" 徽章，kind='client' 的工具显示绿色 "Client" 徽章

#### Scenario: 解除 Tool 与 Agent 的关联
- **WHEN** SYSTEM_ADMIN 用户在 Agent Detail 页对某个已关联 Tool（kind='mcp' 或 'client'）点击 `Remove`
- **THEN** 系统仅删除 `t_agent_tool` 中对应 `(agent_id, tool_id)` 的关联记录，`t_tool` 行保持不变

#### Scenario: 删除 Tool 时级联清理 Agent 关联
- **WHEN** Tool 通过 `tool-management` 能力被删除（无论 kind='mcp' 或 'client'）
- **THEN** 系统在同一事务内先删除 `t_agent_tool` 中所有指向该 `tool_id` 的关联记录，再删除 `t_tool` 行；之后查询任意 Agent 的 Tools 列表都不会再出现该 Tool
