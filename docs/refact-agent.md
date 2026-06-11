重构 Agent 功能
===

重构 Agent 和其它功能

1. 菜单栏
    - 宽屏模式下的左侧菜单去掉，菜单全部移到顶部
    - 在顶部显示一级菜单，点击一级菜单向下拉出二级菜单，点击二级菜单工作区导航到对应的页面
    - 页面宽度小于 1024 像素时隐藏顶部菜单，收起成为汉堡按钮（与现在的行为一样）
2. Tool
    - 修改 Agent 与 Tool 之间的关系模式。为 Tool 建立专门的管理界面，Agent 与 Tool 之间是多对多的关系。
    - 菜单入口：`Tools` 菜单, 权限：SYSTEM 角色（已经在 menu-config.ts 创建菜单）
    - 界面设计
        - Tools 列表：查看每个工具的 ID、Name、URL、Tools、Status。显示 '+Add' 和 '-Delete' 按钮
        - Tool Detail：点击列表上的 Name 查看详细信息
        - Edit Tool：输入 Name 和 URL，按下 Test 按钮获取 MCP 信息，按下 'Save' 按钮注册 MCP 信息
        - Delete Tool：点击 '-Delete' 按钮，提示 'Delete tool?'，确认后删除
        - Agent Detail：修改添加 Tool 的方式，显示 Tools 列表，确认后把 Tool 关联到 Agent
        - 数据库表：新建 `t_tool`，字段：id、server_name、server_url、mcp_schema、审计字段
        - 数据库表：修改 `t_agent_tool`，字段：id、agent_id、tool_id、审计字段，关联 Agent 和 Tool
3. Skill
    - 修改 Agent 和 Skill 之间的关联模式，为 Skill 建立专门的管理界面，Agent 和 Skill 之间是多对多的关系
    - 菜单入口：`Skills` 菜单, 权限：SYSTEM 角色（已经在 menu-config.ts 创建菜单）
    - 界面设计
        - Skills 列表：查看每个 Skill 的 ID、Name、Description。显示 '+Add' 和 '-Delete' 按钮
        - Skill Detail：点击列表上的 Name 查看详细信息，包括 ID、Name、Description、Content
        - Edit Skill：输入和修改 Name、Description、Content，按下 'Save' 保存 Skill 信息
        - Delete Skill：点击 '-Delete' 按钮，提示 'Delete skill?'，确认后删除
        - Agent Detail：修改添加 Skill 的方式，显示 Skills 列表，确认后把 Skill 关联到 Agent
        - 数据库表：新建 `t_skill`，字段：id、name、description、content、审计字段
        - 数据库表：修改 `t_agent_skill`，字段：id、agent_id、skill_id、审计字段，关联 Agent 和 Skill
6. LLM Context: 
    - 修改 `session.service.ts`，修改 `llmMessages` 的结构，按照以下结构组建 `llmMessages` 的 System Prompt:
        1. 系统级提示词：`packages/api/src/app/agent/system-prompt.ts` 文件 `SYSTEM_PROMPT` 变量
        2. Agent 级提示词：`agent.systemPrompt`
        3. `available_tools`: Agent 关联的 MCP Tools，格式: `{"available_tools": [{"name":"mcp__weather__getWeatherForecastByLocation","description":"Get weather forecast for a specific latitude/longitude","parameters":{"type":"OBJECT","properties":{"latitude":{"type":"NUMBER"},"longitude":{"type":"NUMBER"}},"required":["latitude","longitude"]}}, ...]}`
        4. `available_skills`: Agent 官来呢的 Skills，格式：`{"available_skills": [{"name": "string", "description": "string"}, ...]}`
