## Context

`refact-agent` 议题源于三类已观察到的耦合问题：

1. **Tool / Skill 依附在 Agent 之下**：`t_agent_tool`、`t_agent_skill` 表当前直接持有 `serverName` / `serverUrl` / `mcpSchema` / `name` / `description` / `content` 等"资源数据"列，且通过 `agentId` 单向归属某个 Agent。共享同一个 MCP 服务器或同一段技能描述，必须在每个 Agent 下重复注册一次，且改一处不能同步。
2. **菜单架构与新页面冲突**：目前一级菜单全部在左侧侧边栏（`sidebar.tsx` + `menu-config.ts`）。新增 `Tools` 与 `Skills` 两个高频管理入口后，侧边栏会越来越长；产品要求宽屏改为顶部一级菜单 + 下拉二级菜单，窄屏（< 1024px）保持现有汉堡按钮行为不变。
3. **LLM 上下文缺少能力清单**：`session.service.ts` 的 `runLlmTurn` 当前只把 `agent.systemPrompt` 作为 system role 内容。模型无法主动看到自己被授予了哪些 MCP 工具、哪些 Skill，因此 system-prompt.ts 里的"必须先 read_skill"等规则没有可参考的能力列表。

约束：

- 必须保留与 `system-prompt.ts` 中 `SYSTEM_PROMPT` 的契约（JSON-only、`thought`/`action`/`final_answer`、`read_skill` 流程）。
- `t_agent_tool` / `t_agent_skill` 已有线上数据，需要可执行的迁移脚本而不是 drop-and-recreate。
- 不引入新依赖；菜单与 UI 仍使用现有 React + react-router 栈；UI 风格沿用现有 settings 页面（Users / Agents）的样式和交互。
- 应用层维护 referential integrity（沿用 `t_agent_tool` / `t_agent_skill` 当前"无数据库外键"的约定，见两个实体类的注释）。

## Goals / Non-Goals

**Goals:**
- 把 Tool 与 Skill 拆为顶层资源，与 Agent 形成显式多对多关联。
- 提供 SYSTEM_ADMIN 可用的 Tools / Skills 管理 UI（列表、详情、编辑、删除）。
- Agent Detail 改为从全局 Tools/Skills 列表中"挑选关联"，而不是内嵌创建。
- 宽屏菜单从左侧迁移到顶部，保持 < 1024px 的现有汉堡行为。
- LLM system role 改为四段式：系统级 SYSTEM_PROMPT + Agent systemPrompt + available_tools JSON + available_skills JSON。
- 提供数据迁移脚本：现有 `t_agent_tool` 行 → 一条 `t_tool` + 一条新 `t_agent_tool` 关联；`t_agent_skill` 同理。

**Non-Goals:**
- 不改 LLM 协议本身（`SYSTEM_PROMPT` 的 thought/action/final_answer 契约保持不变）。
- 不改 SSE 流式协议、消息持久化结构（`t_message`、`is_thought`、parseAssistantReply 等）。
- 不为 Tool / Skill 引入版本化、权限分级（除沿用 SYSTEM_ADMIN 角色外）。
- 不为顶部菜单引入键盘 a11y 全套（Roving tabindex 等），只保证现有点击/聚焦 + 移动端汉堡的等效体验。
- 不修改 `t_agent` 表本身，也不修改 `t_message`、`t_session`。

## Decisions

### Decision 1 — Tool 与 Skill 拆分为独立顶层资源

新增两张表：

- `t_tool`：`id`、`server_name` (varchar 255, UNIQUE, kebab-case 格式)、`server_url` (varchar 2048)、`mcp_schema` (json，复用 `McpToolSchema[]`)、审计字段。
- `t_skill`：`id`、`name` (varchar 255, UNIQUE, kebab-case 格式)、`description` (text)、`content` (longtext)、审计字段。

`t_agent_tool` 改造为关联表：`id`、`agent_id`、`tool_id`、审计字段。`t_agent_skill` 同理：`id`、`agent_id`、`skill_id`、审计字段。

代码层面：

- `packages/api/src/app/agent/agent-tool.entity.ts` → 改造为关联实体（仅保留 `agentId` + `toolId` + 审计字段）；新建 `packages/api/src/app/tool/tool.entity.ts` 持有原 `serverName` / `serverUrl` / `mcpSchema`。
- `packages/api/src/app/agent/agent-skill.entity.ts` → 改造为关联实体（`agentId` + `skillId` + 审计字段）；新建 `packages/api/src/app/skill/skill.entity.ts` 持有原 `name` / `description` / `content`。
- 新建 `tool/` 模块（`tool.entity.ts`、`tool.service.ts`、`tool.controller.ts`、`tool.dto.ts`、`tool.module.ts`）与 `skill/` 模块。
- `tool.service.ts` / `skill.service.ts` 在创建/更新时 MUST 校验 `server_name` / `name` 符合 kebab-case 格式（正则 `^[a-z0-9]+(-[a-z0-9]+)*$`）且全局唯一；不通过时抛出 `BadRequestException` 或 `ConflictException`。
- `agent.service.ts` 中关于 MCP server 的 CRUD（`registerMcpServer`/`updateMcpServer`/`deleteMcpServer`）和 Skill 的 CRUD（`createSkill`/`updateSkill`/`deleteSkill`）整体迁移到新的 `ToolService` / `SkillService`；Agent 侧只保留"关联/取消关联"两个端点：`POST /api/agents/:id/tools`、`DELETE /api/agents/:id/tools/:toolId`，Skill 同理。

**为什么不复用现有实体只加列**：现有列 `serverName`、`serverUrl`、`mcpSchema`、`name`、`description`、`content` 与"关联"语义无关；如果只加 `toolId` / `skillId` 而保留旧列，会出现"哪一个是 source of truth"的歧义。彻底拆开比加列更干净。

**为什么不在 DB 层加外键**：沿用项目里已有的"应用层 referential integrity"约定（参见 `agent-tool.entity.ts:8` 的注释）。删除 Tool 时用事务级联清理 `t_agent_tool`，删除 Agent 时已有的级联（见 `agent.service.ts:225` 附近）继续保留并扩展。

### Decision 2 — 顶部一级菜单 + 下拉二级菜单（宽屏）

宽屏（≥ 1024px）：

- `app-shell.tsx` 不再渲染 `<Sidebar>`（或仅在窄屏渲染）。
- `topbar.tsx` 在标题与右侧 actions 之间渲染水平排列的一级菜单按钮；点击展开下拉浮层，浮层中列出二级项；点击二级项导航并自动收起。
- 点击其它地方或 ESC 关闭下拉，与 `avatar-menu.tsx` 现有"点击外部关闭"模式保持一致。

窄屏（< 1024px）：

- 顶部一级菜单整体隐藏，沿用现有 `hamburger` 按钮 + `<Sidebar isNarrow open …>` 逻辑（`app-shell.tsx:23`）。`Sidebar` 组件继续承担抽屉式二级导航。

`menu-config.ts` 的数据结构无需修改（仍是一级 / 二级树）；只把 `Tools` / `Skills` 两项的 `to` 改成真正的 `/settings/tools` / `/settings/skills`。

**为什么共用 `MenuItem` 数据结构**：避免维护两套菜单数据；不同视图（topbar 下拉 vs sidebar 抽屉）只是渲染层差异。

### Decision 3 — LLM system 内容四段式拼装

在 `runLlmTurn`（`session.service.ts:291` 起的方法）内，原来的：

```ts
const systemPrompt = agent.systemPrompt || 'You are a helpful assistant.';
const llmMessages = [{ role: 'system', content: systemPrompt }, ...history.map(...)];
```

改为：

```ts
const tools = await getAgentTools(agent.id);          // join t_agent_tool + t_tool, return McpToolSchema[]
const skills = await getAgentSkills(agent.id);        // join t_agent_skill + t_skill
const systemContent = [
  SYSTEM_PROMPT,                                       // from agent/system-prompt.ts
  agent.systemPrompt ?? '',
  JSON.stringify({ available_tools: flattenedTools }),
  JSON.stringify({ available_skills: skills.map(s => ({ name: s.name, description: s.description })) }),
].filter(Boolean).join('\n\n');
```

`flattenedTools` 是把每个关联 Tool 的 `mcp_schema` 数组展平后的 `[{ name, description, parameters }, ...]`，工具名带 `mcp__<agentToolId>__` 前缀（参考 `parseToolName` 在 `session.service.ts:109` 的现有契约——但 `agentToolId` 现在指的是关联表 `t_agent_tool.id`，与现状一致，无需改 `parseToolName`）。

**为什么用拼接字符串而不是多条 system message**：现有 LlmService 的入参类型是 `{role: 'system'|'user'|'assistant', content: string}[]`，且 Qwen 等模型对多条 system message 的支持不一致。单条 system + 段间空行最安全。

**为什么 available_tools 用 JSON 字符串嵌入**：与 `system-prompt.ts` 中"输出必须是 JSON"的契约对齐，模型对 JSON 块的提取最稳定。

**工具名前缀**：`flattenedTools` 中每项的 `name` 按 `mcp__<toolId>__<actualToolName>` 命名，其中 `toolId` 是 `t_tool.id`（Tool 资源主键），保证同一 Tool 在所有 Agent 下工具名一致。`parseToolName` 函数需要相应修改：提取 `toolId` 而非 `agentToolId`，调用 MCP 时通过 `toolId` 反查 `t_tool` 得到 `serverUrl` 和 `mcp_schema`。

### Decision 4 — 工具名称前缀使用 toolId

工具名称按 `mcp__<toolId>__<toolName>` 命名，其中 `toolId` 是 `t_tool.id`（Tool 顶层资源的主键），`toolName` 是 `mcp_schema` 中的工具名。

修改 `parseToolName` 在 `session.service.ts` 中的实现：从解析 `agentToolId`（关联表 id）改为解析 `toolId`（资源表 id）。调用 MCP 时，通过 `toolId` 反查 `t_tool` 获得 `serverUrl` 和完整 `mcp_schema`，再用 `toolName` 匹配到具体工具。

**为什么用 toolId 而非 agentToolId**：多对多关系下，同一 Tool 被多个 Agent 关联，每个关联有不同的 `t_agent_tool.id`，会导致同一工具在不同 Agent 下名称不同。用 `t_tool.id` 作为前缀保证工具名全局唯一且稳定。

**为什么不直接用 toolName**：不同 MCP 服务器可能注册同名工具；加 `toolId` 前缀避免冲突。

### Decision 5 — 数据迁移策略

数据库结构变更（`t_agent_tool` / `t_agent_skill` 列变更、新增 `t_tool` / `t_skill`）与数据迁移由管理员手工执行，不在代码中提供自动迁移脚本。

### Decision 6 — Agent Detail 关联/解除关联的 UX

Agent Detail 页面的"添加 Tool / Skill"按钮：

- 弹出 Dialog（复用 `mcp-server-dialog.tsx` / `skill-dialog.tsx` 的样式）展示**全局** Tools / Skills 列表 + 复选框；底部 `Confirm` 写入关联，已关联项默认勾选并禁用取消（取消通过详情页表格的"Remove"按钮）。
- 详情页表格的"Remove"按钮调用 `DELETE /api/agents/:id/tools/:toolId`，仅解除关联，不删除 `t_tool` 本体。

**为什么不直接在 Dialog 里允许"创建新 Tool"**：避免两条创建路径分裂数据来源；统一从 `Tools` 顶部菜单创建。

## Risks / Trade-offs

- **[Tool 共享后的删除语义]** 删除 Tool 时，所有关联到它的 Agent 都会失能 → UI 上 Delete Tool 的确认对话框显示"该 Tool 当前被 N 个 Agent 使用，删除后这些 Agent 将不再具备该工具"；事务里先 `DELETE FROM t_agent_tool WHERE tool_id=?` 再 `DELETE FROM t_tool WHERE id=?`。
- **[available_tools / available_skills 体积膨胀]** Agent 关联很多 Tool 后，system content 可能变长，逼近模型上下文上限 → 当前只在 `runLlmTurn` 头部计算一次，不在 loop 里重复；如果未来体积成为问题，再引入分页/筛选机制（本次不做）。
- **[菜单空间不足]** 宽屏一级菜单 5+ 项时，topbar 在中等宽度（约 1024–1280px）可能拥挤 → 按 `menu-config.ts` 当前规模（4 个一级项）测算无问题；超出时顶部菜单整体折叠成"More"下拉作为后续改进。
- **[parseToolName 与 toolId 含义变更]** 当前 `mcp__<agentToolId>__<toolName>` 用的是 `t_agent_tool.id`；重构后改为 `mcp__<toolId>__<toolName>`，`toolId` 是 `t_tool.id`。这样同一 Tool 在所有 Agent 下工具名一致。`parseToolName` 函数需要修改：返回 `toolId` 而非 `agentToolId`，调用 MCP 时通过 `toolId` 反查 `t_tool` 获得 `serverUrl`。
- **[数据迁移风险]** 表结构变更与数据拷贝由管理员手工执行 → 代码中不承担迁移逻辑；上线前需要在 staging 环境验证数据完整性。

## Migration Plan

1. 合并代码到 release 分支。
2. 部署前停 API（chat 流量短暂中断）。
3. 管理员手工执行数据库结构变更与数据迁移（建 `t_tool` / `t_skill`、改造关联表列、拷贝数据）。
4. 启动 API；手工验证 1 个 Agent 的 Tools 和 Skills 列表展示与原一致；新建 Tool 走通 Test + Save；在 chat 中验证 LLM 的 system content 包含 `available_tools` / `available_skills`。

**Rollback**：回滚到 prior commit + 反向 SQL（恢复表结构与数据）。
