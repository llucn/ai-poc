## Why

随着 Agent 的能力扩展，当前架构出现两类问题：（1）Tools 和 Skills 都耦合在 Agent 之下（每个 Agent 单独注册自己的 MCP 工具、单独维护自己的 Skill），同样的工具/技能在多个 Agent 之间无法复用，重复注册成本高；（2）侧边栏菜单与 Agent 详情页里的 Tool/Skill 添加方式不再适应"复用"的工作流——SYSTEM_ADMIN 期望从全局列表中挑选已有的工具/技能挂到 Agent 上，而不是每次都新建。同时，LLM 上下文当前只用 `agent.systemPrompt` 一层提示词，缺少可用工具与技能的结构化清单，模型无法主动发现可调用的能力。

## What Changes

- **菜单结构**：宽屏模式去掉左侧菜单栏，所有一级菜单移到顶部；点击一级项下拉显示二级项，点击二级项跳转到对应工作区页面。窄屏（< 1024px）保持现有汉堡按钮行为。
- **Tools 重构（多对多）**：
  - 新建 `t_tool` 表（id、server_name、server_url、mcp_schema、审计字段），Tool 成为独立资源。
  - 修改 `t_agent_tool` 表为关联表：字段 id、agent_id、tool_id、审计字段；移除原 server_name / server_url / mcp_schema 列。
  - 新建顶部 `Tools` 菜单（SYSTEM_ADMIN）：Tools 列表（ID/Name/URL/Tools 数量/Status；+Add / -Delete 按钮）、Tool Detail、Edit Tool（输入 Name + URL → Test 抓取 MCP 信息 → Save 注册）、Delete Tool（"Delete tool?" 确认）。
  - Agent Detail 修改 Tool 添加方式：弹出 Tools 列表挑选已有 Tool，确认后写入 `t_agent_tool`。
- **Skills 重构（多对多）**：
  - 新建 `t_skill` 表（id、name、description、content、审计字段），Skill 成为独立资源。
  - 修改 `t_agent_skill` 表为关联表：字段 id、agent_id、skill_id、审计字段；移除原 name / description / content 列。
  - 新建顶部 `Skills` 菜单（SYSTEM_ADMIN）：Skills 列表（ID/Name/Description；+Add / -Delete 按钮）、Skill Detail、Edit Skill（输入 Name/Description/Content → Save）、Delete Skill（"Delete skill?" 确认）。
  - Agent Detail 修改 Skill 添加方式：弹出 Skills 列表挑选已有 Skill，确认后写入 `t_agent_skill`。
- **LLM Context 结构**：在 `session.service.ts` 的 `runLlmTurn` 中重组 `llmMessages` 的 system role 内容，按以下顺序拼接四段：
  1. `SYSTEM_PROMPT`（来自 `packages/api/src/app/agent/system-prompt.ts`）
  2. `agent.systemPrompt`
  3. `{"available_tools": [{ name, description, parameters }, ...]}`（Agent 关联的所有 Tools 的 mcp_schema 展平）
  4. `{"available_skills": [{ name, description }, ...]}`（Agent 关联的 Skills）
- **BREAKING（数据迁移）**：`t_agent_tool` 与 `t_agent_skill` 的列结构变更；现有数据需迁移：每条旧的 `t_agent_tool` → 新建一条 `t_tool` + 一条新 `t_agent_tool` 关联；`t_agent_skill` 同理。

## Capabilities

### New Capabilities
- `tool-management`: Tools 作为独立资源的 CRUD、MCP URL 测试与注册、UI（列表/详情/编辑/删除），权限 SYSTEM_ADMIN。
- `skill-management`: Skills 作为独立资源的 CRUD、UI（列表/详情/编辑/删除），权限 SYSTEM_ADMIN。

### Modified Capabilities
- `web-shell`: 宽屏一级菜单从侧边栏迁移到顶部下拉；新增 Tools 与 Skills 顶部菜单项；窄屏汉堡行为保持不变。
- `agent-tool-registration`: 从"Agent 内嵌注册 Tool"变成"Agent 关联到独立 Tool"的多对多模型；移除原 per-agent 注册流程，保留并改写"Agent 的 Tools 列表"语义。
- `agent-skill-association`: 从"Agent 内嵌创建 Skill"变成"Agent 关联到独立 Skill"的多对多模型；移除原 per-agent 创建流程。
- `agent-ui`: Agent Detail / Edit 页面的 Tool / Skill 添加方式改为从全局列表挑选已有项。
- `message-management`: LLM system prompt 不再只用 `agent.systemPrompt`，改为四段式结构（系统级 + Agent 级 + available_tools + available_skills）。

## Impact

- **代码**：
  - API: `packages/api/src/app/agent/agent.entity.ts`（拆分为 ToolEntity/SkillEntity 与新关联实体）、`agent.service.ts`、`agent.controller.ts`、`agent.dto.ts`、`agent.module.ts`；新增 `tool/` 与 `skill/` 模块（entity、service、controller、dto、module）；`session/session.service.ts` 中 `runLlmTurn` 的 system prompt 拼装逻辑。
  - Web: `packages/web/src/app/shell/`（topbar 一级菜单/下拉、移除/调整 sidebar）、`menu-config.ts` 调整 `to` 字段；新增 `pages/settings/tools/`、`pages/settings/skills/`；改造 `pages/settings/agents/agent-detail.tsx`、`mcp-server-dialog.tsx`、`skill-dialog.tsx` 为"挑选已有项"模式；路由配置加入 `/settings/tools` 与 `/settings/skills`。
- **数据库**：新增 `t_tool`、`t_skill` 表；`t_agent_tool`、`t_agent_skill` 列结构变更；需要数据迁移脚本。
- **API 契约**：新增 `/api/tools/*` 与 `/api/skills/*` 路由；现有 `/api/agents/:id/mcp-servers/*`、`/api/agents/:id/skills/*` 端点的语义和 payload 调整为关联管理（关联/取消关联）。
- **依赖**：无新增。
- **风险**：表结构变更需要写迁移脚本，对存量数据要做映射；多 Agent 共享同一 Tool 后，删除 Tool 必须先级联清理 `t_agent_tool` 关联以避免悬挂引用。
