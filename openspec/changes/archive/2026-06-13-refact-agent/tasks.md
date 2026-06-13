## 1. 数据库与实体（Tool 拆分）

- [x] 1.1 新建 `packages/api/src/app/tool/tool.entity.ts`，含 `id`、`serverName` (UNIQUE, kebab-case)、`serverUrl`、`mcpSchema`（复用 `McpToolSchema[]`）、审计字段，表名 `t_tool`
- [x] 1.2 改造 `packages/api/src/app/agent/agent-tool.entity.ts` 为关联实体：仅保留 `id`、`agentId`、`toolId`、审计字段；移除 `serverName` / `serverUrl` / `mcpSchema`

## 2. 数据库与实体（Skill 拆分）

- [x] 2.1 新建 `packages/api/src/app/skill/skill.entity.ts`，含 `id`、`name` (UNIQUE, kebab-case)、`description`、`content`、审计字段，表名 `t_skill`
- [x] 2.2 改造 `packages/api/src/app/agent/agent-skill.entity.ts` 为关联实体：仅保留 `id`、`agentId`、`skillId`、审计字段；移除 `name` / `description` / `content`

## 3. API（Tool 顶层资源）

- [x] 3.1 新建 `tool.dto.ts`：`CreateToolDto`、`UpdateToolDto`、`TestToolDto`（仅 `serverUrl`）；DTO 中对 `serverName` 添加格式校验装饰器（kebab-case 正则 `^[a-z0-9]+(-[a-z0-9]+)*$`）
- [x] 3.2 新建 `tool.service.ts`：`findAll`、`findOne`、`testServer(serverUrl)`、`create(dto, createdBy)`、`update(id, dto, updatedBy)`、`delete(ids)`（事务内先删 `t_agent_tool` 关联再删 `t_tool`）；创建/更新时校验 `serverName` 全局唯一性（与其它 Tool 不重复），不唯一时抛 `ConflictException('Server name already exists')`；MCP 抓取调用 `McpClientService`，搬迁现 `agent.service.ts` 中的对应逻辑
- [x] 3.3 新建 `tool.controller.ts`：`GET /api/tools`、`GET /api/tools/:id`、`POST /api/tools/test`、`POST /api/tools`、`PUT /api/tools/:id`、`DELETE /api/tools`（带 SYSTEM_ADMIN 守卫）
- [x] 3.4 新建 `tool.module.ts` 并在 `app.module.ts` 注册
- [x] 3.5 列出每个 Tool 时附带 `agentCount`（关联 Agent 数）以便 UI 删除确认提示

## 4. API（Skill 顶层资源）

- [x] 4.1 新建 `skill.dto.ts`：`CreateSkillDto`、`UpdateSkillDto`；DTO 中对 `name` 添加格式校验装饰器（kebab-case 正则 `^[a-z0-9]+(-[a-z0-9]+)*$`）
- [x] 4.2 新建 `skill.service.ts`：`findAll`、`findOne`、`create`、`update`、`delete(ids)`（事务内先删 `t_agent_skill` 关联再删 `t_skill`）；创建/更新时校验 `name` 全局唯一性（与其它 Skill 不重复），不唯一时抛 `ConflictException('Skill name already exists')`；保留现 `validateMarkdownContent` 调用
- [x] 4.3 新建 `skill.controller.ts`：`GET /api/skills`、`GET /api/skills/:id`、`POST /api/skills`、`PUT /api/skills/:id`、`DELETE /api/skills`（带 SYSTEM_ADMIN 守卫）
- [x] 4.4 新建 `skill.module.ts` 并在 `app.module.ts` 注册
- [x] 4.5 列出每个 Skill 时附带 `agentCount`

## 5. API（Agent 改为关联管理）

- [x] 5.1 在 `agent.service.ts` 移除 `registerMcpServer`/`updateMcpServer`/`deleteMcpServer`/`fetchMcpSchema`/`testMcpServer` 与 `createSkill`/`updateSkill`/`deleteSkill`，新增 `linkTool(agentId, toolId)`、`unlinkTool(agentId, toolId)`、`linkSkill(agentId, skillId)`、`unlinkSkill(agentId, skillId)`，与对应 Tool/Skill 存在性校验
- [x] 5.2 修改 `agent.service.ts.findOne` / `findAll`：通过 join 关联表 + 资源表组装 `tools` 与 `skills` 数组（保持 `AgentResponse` 结构，但内容来自 `t_tool` / `t_skill`）
- [x] 5.3 修改 `agent.service.ts.delete`：事务内级联删除该 Agent 在 `t_agent_tool` / `t_agent_skill` 的关联（不删除 `t_tool` / `t_skill` 本体）
- [x] 5.4 修改 `agent.controller.ts`：删除原 MCP server / Skill 子路由；新增 `POST /api/agents/:id/tools`（body 含 `toolId`）、`DELETE /api/agents/:id/tools/:toolId`、`POST /api/agents/:id/skills`（body 含 `skillId`）、`DELETE /api/agents/:id/skills/:skillId`
- [x] 5.5 更新 `agent.module.ts` providers 列表（注入 ToolService / SkillService 或直接注入 Tool/Skill 仓库）

## 6. API（LLM context 四段拼装 + parseToolName 改造）

- [x] 6.1 在 `session.service.ts` 中新增私有方法 `buildSystemContent(agent)`：返回拼装后的字符串，包含 `SYSTEM_PROMPT` + `agent.systemPrompt` + `available_tools` JSON + `available_skills` JSON，无关联时仍输出空数组段
- [x] 6.2 `available_tools` 数据来源：join `t_agent_tool` + `t_tool`，再展平 `mcp_schema`，工具名按 `mcp__<toolId>__<toolName>` 命名（`toolId` 是 `t_tool.id`），保留 `description` / `parameters`
- [x] 6.3 `available_skills` 数据来源：join `t_agent_skill` + `t_skill`，每项 `{ name, description }`
- [x] 6.4 修改 `runLlmTurn`：把 `llmMessages[0]` 的 system content 替换为 `buildSystemContent(agent)`；移除 `'You are a helpful assistant.'` fallback
- [x] 6.5 修改 `parseToolName` 函数：从解析 `agentToolId` 改为解析 `toolId`（`t_tool.id`），返回 `{ toolId: number; toolName: string }`
- [x] 6.6 修改 MCP 调用处（`runLlmTurn` 的 action 分支）：用 `toolId` 反查 `t_tool` 得到 `serverUrl` 和 `mcp_schema`，再用 `toolName` 匹配具体工具调用 MCP client
- [x] 6.7 修改 `session.module.ts`：注入 `ToolEntity`、`SkillEntity` 仓库（或新 ToolService / SkillService）以便 `buildSystemContent` / MCP 调用使用

## 7. Web（顶部菜单 + 下拉）

- [x] 7.1 在 `packages/web/src/app/shell/topbar.tsx` 新增"宽屏一级菜单 + 下拉"区块：从 `DEMO_MENU` 渲染按钮，按钮点击展开下拉浮层（仅一项可同时打开），二级项点击导航并关闭
- [x] 7.2 实现下拉关闭交互：点击外部、ESC、再次点击同一按钮、切换到另一按钮均触发关闭（参考 `avatar-menu.tsx` 的 outside-click 模式）
- [x] 7.3 在下拉中按 `useUserRole` 过滤 `roles` 不允许的二级项（复用 `sidebar.tsx::filterMenuByRoles` 的逻辑或抽取为共享工具）
- [x] 7.4 修改 `app-shell.tsx`：宽屏（`!isNarrow`）不渲染 `<Sidebar>`；窄屏继续保持现有 sidebar + hamburger 行为
- [x] 7.5 在 CSS（topbar 样式）中新增一级菜单按钮、下拉浮层样式，确保 topbar 高度仍为 48px
- [x] 7.6 修改 `menu-config.ts`：把 `Tools`、`Skills` 的 `to` 由占位 `/dashboard/overview` 改为真实路由 `/settings/tools`、`/settings/skills`

## 8. Web（Tools 管理界面）

- [x] 8.1 新建 `packages/web/src/app/pages/settings/tools/all-tools.tsx`：列表显示 `ID`、`Name`、`URL`、`Tools`（mcp_schema 长度）、`Status`，提供 `+Add` 与 `-Delete` 按钮
- [x] 8.2 新建 `tool-detail.tsx`：展示完整字段并以可读格式列出 `mcp_schema`
- [x] 8.3 新建 `add-tool.tsx` / `edit-tool.tsx`：表单包含 `Name`（kebab-case 校验与唯一性提示）/ `URL`，按 `Test` 调用 `POST /api/tools/test`，成功后启用 `Save`；编辑时改 URL 必须再次 Test；前端用正则 `^[a-z0-9]+(-[a-z0-9]+)*$` 实时校验 `Name` 格式，不通过时显示错误提示
- [x] 8.4 删除流程：`Delete tool?` 确认对话框附带 `agentCount` 提示
- [x] 8.5 在路由表中加入 `/settings/tools`、`/settings/tools/:id`、`/settings/tools/new`、`/settings/tools/:id/edit`，全部要求 SYSTEM_ADMIN

## 9. Web（Skills 管理界面）

- [x] 9.1 新建 `packages/web/src/app/pages/settings/skills/all-skills.tsx`：列表显示 `ID`、`Name`、`Description`，提供 `+Add` 与 `-Delete` 按钮
- [x] 9.2 新建 `skill-detail.tsx`：展示 `id`、`name`、`description`、`content`（content 以渲染后的 Markdown 显示）
- [x] 9.3 新建 `add-skill.tsx` / `edit-skill.tsx`：表单包含 `Name`（kebab-case 校验与唯一性提示）/ `Description` / `Content`（Markdown 编辑器），保存调用对应 API；前端用正则 `^[a-z0-9]+(-[a-z0-9]+)*$` 实时校验 `Name` 格式，不通过时显示错误提示
- [x] 9.4 删除流程：`Delete skill?` 确认对话框附带 `agentCount` 提示
- [x] 9.5 在路由表中加入 `/settings/skills`、`/settings/skills/:id`、`/settings/skills/new`、`/settings/skills/:id/edit`，全部要求 SYSTEM_ADMIN

## 10. Web（Agent Detail 改造）

- [x] 10.1 修改 `mcp-server-dialog.tsx`：从"输入 URL 注册"改为"显示全局 Tools 列表 + 复选框"，确认后调用 `POST /api/agents/:id/tools`（多选时循环或批量端点）；已关联项默认勾选并禁用
- [x] 10.2 修改 `skill-dialog.tsx`：从"输入 name/description/content 创建"改为"显示全局 Skills 列表 + 复选框"，确认后调用 `POST /api/agents/:id/skills`
- [x] 10.3 修改 `agent-detail.tsx`：Tools / Skills 表格的 Remove 按钮调用 `DELETE /api/agents/:id/tools/:toolId` 与 `DELETE /api/agents/:id/skills/:skillId`，仅解除关联
- [x] 10.4 调整 `add-agent.tsx` / `edit-agent.tsx`：表单不再含内嵌 Tool/Skill 创建区域，只保留 name、description、modelConfig、systemPrompt
- [x] 10.5 移除 `mcp-server-dialog.tsx` / `skill-dialog.tsx` 内"创建新资源"的代码路径

## 11. 验证

- [x] 11.1 后端：`npx nx build api` 通过，`npx tsc --noEmit -p packages/api/tsconfig.json` 无错
- [x] 11.2 前端：`npx nx build web` 通过，路由能加载新 Tools / Skills 页面
- [ ] 11.3 手工冒烟：从顶部菜单进入 `Tools` → 创建一个 Tool → 在 Agent Detail 关联 → 进入 chat 验证 LLM system content 中包含该工具的 `available_tools` 段（通过日志或 LLM 输出回看），且工具名格式为 `mcp__<toolId>__<actualToolName>`
- [ ] 11.4 删除 Tool 后，关联到该 Tool 的 Agent 在详情页与 chat 的 `available_tools` 中都不再出现该工具
- [x] 11.5 `openspec validate refact-agent --strict` 通过
