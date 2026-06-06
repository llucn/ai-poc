## ADDED Requirements

### Requirement: MCP Tool Registration via URL
系统 MUST 支持通过 URL 自动注册 MCP Tools，自动抓取工具的描述和参数信息。

#### Scenario: 成功注册 MCP Tool
- **WHEN** SYSTEM_ADMIN 用户输入 Tool name 和 URL 并提交注册请求
- **THEN** 系统自动抓取 MCP 注册信息并创建 Tool 记录，包含 name、description 和 parameters

#### Scenario: URL 抓取失败时的降级
- **WHEN** URL 抓取失败或超时
- **THEN** 系统显示错误提示并提供手动填写表单作为降级方案

### Requirement: Tool 列表管理
系统 MUST 为每个 Agent 提供 Tools 列表管理功能，支持添加、查看和删除 Tools。

#### Scenario: 查看 Agent 的 Tools 列表
- **WHEN** SYSTEM_ADMIN 用户查看某个 Agent 的详情
- **THEN** 系统显示该 Agent 关联的所有 Tools 列表

#### Scenario: 删除 Tool
- **WHEN** SYSTEM_ADMIN 用户删除某个 Tool
- **THEN** 系统从 Agent 的 Tools 列表中移除该 Tool 记录
