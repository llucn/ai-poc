## ADDED Requirements

### Requirement: t_tool 表增加 kind 字段
t_tool 表 MUST 增加 `kind VARCHAR(16) NOT NULL DEFAULT 'mcp'` 字段，用于区分工具类型：'mcp'（MCP Tool，服务端执行）或 'client'（Client Tool，浏览器端执行）。现有 MCP Tools 默认 kind='mcp'，向后兼容。Agent 通过 t_agent_tool 关联 Tool 时 MUST NOT 限制 kind，同一 Agent 可同时关联 MCP 和 Client 两种工具。

#### Scenario: 查询 MCP Tools
- **WHEN** 查询某 Agent 关联的所有 MCP Tools
- **THEN** 通过 t_agent_tool JOIN t_tool WHERE kind='mcp' 过滤

#### Scenario: 查询 Client Tools
- **WHEN** 查询某 Agent 关联的所有 Client Tools
- **THEN** 通过 t_agent_tool JOIN t_tool WHERE kind='client' 过滤

#### Scenario: Agent 同时关联两种工具
- **GIVEN** Agent ID=1 通过 t_agent_tool 关联了 toolId=2 (kind='mcp') 和 toolId=3 (kind='client')
- **WHEN** 构建 Agent 的 available_tools 列表
- **THEN** 两种工具都出现在列表中，前缀分别为 `mcp__2__...` 和 `client__3__...`

#### Scenario: 现有 MCP Tools 向后兼容
- **GIVEN** t_tool 表中已有记录（kind 字段未填）
- **WHEN** 添加 kind 字段（DEFAULT 'mcp'）
- **THEN** 所有现有记录自动标记为 kind='mcp'，行为不变

### Requirement: Client Tool schema 手动录入（Phase 1）
Phase 1 MUST NOT 实现自动注册机制（defineClientTool / Registry / sync），Client Tool 的 schema（name / description / parameters）MUST 手动录入 t_tool 表：kind='client'，server_name 填工具的 kebab-case 名称（如 "console-log-echo"），server_url 留空或填占位符，mcp_schema 字段存储 JSON 数组（格式与 MCP Tool 一致：`[{ name, description, parameters: { type: 'object', properties: {...}, required: [...] } }]`）。

#### Scenario: 手动录入 console-log-echo 工具
- **GIVEN** 需要创建测试工具 `console-log-echo`
- **WHEN** 在 t_tool 表插入一条记录：
  ```sql
  INSERT INTO t_tool (server_name, server_url, kind, mcp_schema, created_by) VALUES (
    'console-log-echo',
    '',
    'client',
    '[{
      "name": "console-log-echo",
      "description": "在浏览器控制台输出消息并返回演示对象",
      "parameters": {
        "type": "object",
        "properties": {
          "message": { "type": "string", "description": "要输出的消息" }
        },
        "required": ["message"]
      }
    }]',
    'admin'
  );
  ```
- **THEN** t_tool 表中生成一条 id（如 1），kind='client'，mcp_schema 包含完整的工具定义

#### Scenario: Agent 关联手动录入的 Client Tool
- **GIVEN** t_tool 表中存在 id=1, kind='client', server_name='console-log-echo' 的记录
- **WHEN** 在 t_agent_tool 表插入关联记录（agent_id=某Agent, tool_id=1）
- **THEN** 该 Agent 的 available_tools 中出现 `client__1__console-log-echo`

### Requirement: Agent 关联 Tool 不限 kind
Agent 通过 t_agent_tool 表关联 Tool 时 MUST NOT 检查 kind 字段（MCP 和 Client 工具平等对待）。同一 Agent MUST 能同时关联多个 MCP Tools 和多个 Client Tools，在构建 LLM system content 时合并到 available_tools 段（按 kind 分别添加 `mcp__` / `client__` 前缀）。

#### Scenario: 创建混合工具集的 Agent
- **GIVEN** Agent ID=1 需要关联 MCP Tool (toolId=2, kind='mcp', server_name='weather') 和 Client Tool (toolId=1, kind='client', server_name='console-log-echo')
- **WHEN** 在 t_agent_tool 表插入两条关联记录（agent_id=1, tool_id=2 和 agent_id=1, tool_id=1）
- **THEN** 两条记录均成功插入，不报错

#### Scenario: 构建混合工具的 available_tools
- **GIVEN** Agent ID=1 关联了 toolId=2 (kind='mcp', server_name='weather', mcp_schema=[{name:'get_weather',...}]) 和 toolId=1 (kind='client', server_name='console-log-echo', mcp_schema=[{name:'console-log-echo',...}])
- **WHEN** 构建该 Agent 的 LLM system content
- **THEN** available_tools 段包含：
  ```
  - mcp__2__get_weather: 查询天气信息
    parameters: {...}
  - client__1__console-log-echo: 在浏览器控制台输出消息并返回演示对象
    parameters: { message: string (required) }
  ```

### Requirement: /tools/test 端点仅对 MCP Tool 有效
`POST /tools/test` 端点用于测试 MCP 服务器连通性（发起 JSON-RPC tools/list 调用），MUST 仅对 kind='mcp' 的 Tool 有效。对 kind='client' 的 Tool（serverUrl 为空）调用 `/tools/test` 时，服务端 MUST 返回 400 错误 `{ error: "Test endpoint is not applicable to Client Tools" }`；前端 UI 在 kind='client' 时 MUST NOT 显示 Test 按钮。

#### Scenario: 测试 MCP Tool
- **GIVEN** 请求 `POST /tools/test`，body 为 `{ serverUrl: "http://localhost:3100" }`
- **AND** 该 URL 对应一个 MCP 服务器
- **WHEN** 服务端发起 tools/list JSON-RPC 调用
- **THEN** 返回 200 及 mcp_schema 数组

#### Scenario: 测试 Client Tool（不支持）
- **GIVEN** 前端尝试调用 `POST /tools/test`，body 为 `{ serverUrl: "", kind: "client" }`（或 serverUrl 为空）
- **WHEN** 服务端识别 kind='client' 或 serverUrl 为空
- **THEN** 返回 400 `{ error: "Test endpoint is not applicable to Client Tools" }`

#### Scenario: 前端 UI 隐藏 Test 按钮
- **GIVEN** Tool 编辑页面显示一个 kind='client' 的 Tool
- **WHEN** 渲染工具详情
- **THEN** 不显示 "Test Connection" 按钮（或按钮置灰并提示 "Client Tools do not require server connectivity test"）

### Requirement: Tool CRUD 接口支持 kind 字段
Tool 的创建（`POST /tools`）和编辑（`PUT /tools/:id`）接口 MUST 支持 `kind` 字段（可选，默认 'mcp'）。前端 Add Tool / Edit Tool 表单 MUST 提供 kind 选择器（MCP Tool / Client Tool）。kind='client' 时，server_url 字段 MAY 留空（前端不强制校验 URL 格式），mcp_schema 字段 MUST 必填（手动粘贴 JSON）。

#### Scenario: 创建 MCP Tool
- **GIVEN** 前端提交 `POST /tools`，body 为 `{ serverName: "weather-api", serverUrl: "http://...", kind: "mcp" }`
- **WHEN** 服务端创建 Tool
- **THEN** t_tool 表插入一条 kind='mcp' 的记录

#### Scenario: 创建 Client Tool
- **GIVEN** 前端提交 `POST /tools`，body 为 `{ serverName: "console-log-echo", serverUrl: "", kind: "client", mcpSchema: [{...}] }`
- **WHEN** 服务端创建 Tool
- **THEN** t_tool 表插入一条 kind='client' 的记录，server_url 为空字符串

#### Scenario: 编辑 Tool 修改 kind
- **GIVEN** t_tool 表中存在 id=1, kind='mcp' 的记录
- **WHEN** 前端提交 `PATCH /tools/1`，body 为 `{ kind: "client" }`
- **THEN** 服务端更新 kind='client'（注意：实际场景中切换 kind 可能需要同步修改 schema / serverUrl，前端应提示用户谨慎操作或禁止切换）

### Requirement: Tools 列表显示 kind 标识
Tools 管理页面（All Tools 列表）MUST 增加 "Type" 列，显示每个 Tool 的 kind（MCP / Client）。前端 MUST 用徽章标识（MCP 显示蓝色 "MCP" 徽章，Client 显示绿色 "Client" 徽章）。

#### Scenario: 列表显示 MCP Tool
- **GIVEN** t_tool 表中存在 id=2, kind='mcp', server_name='weather' 的记录
- **WHEN** 加载 Tools 列表页
- **THEN** 该行显示 Type 列为 "MCP"（蓝色徽章）

#### Scenario: 列表显示 Client Tool
- **GIVEN** t_tool 表中存在 id=1, kind='client', server_name='console-log-echo' 的记录
- **WHEN** 加载 Tools 列表页
- **THEN** 该行显示 Type 列为 "Client"（绿色徽章）
