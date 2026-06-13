## Why

Phase 1（`client-tool`）让 Client Tool 的 schema 手动录入数据库（`t_tool`，kind='client'）。但工具的执行 handler 在浏览器代码里，schema 在数据库里，二者靠 name 对齐——一旦 handler 签名改了忘记同步数据库 schema，运行时参数就会不匹配；且 JSON Schema 嵌套结构手动录入极易出错，开发流程在"写代码"和"开管理后台录入"之间反复横跳。Phase 2 引入**自动注册**：开发者用声明式 API（`defineClientTool`）在前端一处定义工具的 name / description / 参数类型 + handler，应用启动时自动把 schema 同步给后端、暴露给 Agent，无需手动录入。schema 成为代码的单一真相源，与 handler 永不脱节。

## What Changes

- **前端声明式注册（zod）**：
  - 引入 `zod` 到 `packages/web`（zod 4.x，内置 `z.toJSONSchema()`）。
  - 新建 `defineClientTool({ name, description, parameters(zod), handler })`：把工具登记到前端内存注册表，`parameters` 用 `z.infer` 自动推导 handler 入参类型；`z.toJSONSchema()` 把 zod schema 转为 JSON Schema 供 LLM 使用。
  - 重构 Phase 1 的 `client-tool-executor.ts`：注册表条目同时持有 handler 与元数据（name/description/parametersSchema），`executeClientTool` 仍按 name 派发。
  - 把 Phase 1 的 `console-log-echo` 演示工具从"数据库手动 seed"迁移为 `defineClientTool` 声明。
- **启动时同步**：前端在 App 挂载时 `POST /client-tools/sync`，把 `getAllClientTools()`（每项 `{ name, description, parametersSchema }`）发给后端。
- **后端协调（reconcile 到 t_tool）**：
  - `t_tool` 增加 `source` 字段（'database' | 'registry'，默认 'database'）区分管理员手动配置与代码自动注册。
  - 新建 `ClientToolsModule`：`POST /client-tools/sync` 把上报的注册表工具 **upsert 为 `t_tool` 行**（kind='client'，source='registry'，按 server_name 匹配；注册表里已消失的 source='registry' 行被删除并级联清理 `t_agent_tool` 关联）。这样自动注册的工具拿到真实 `t_tool.id`，复用 Phase 1 的 `getAvailableTools` / 关联管理 / `client__<toolId>__<name>` 派发逻辑，**核心 Loop 零改动**。
  - `GET /client-tools/registry`：返回当前后端缓存的注册表镜像（供调试/只读详情）。
- **Tools 管理界面**：
  - All Tools 列表增加 "Source" 列（Database / Registry）。source='registry' 的工具：Edit / Delete 按钮禁用、批量删除 checkbox 禁用（其真相在代码里，改代码即可）。
  - Tool Detail 对 source='registry' 工具隐藏编辑入口，只读展示 schema。
- **关联仍走现有 linkTool**：Agent 关联 registry 工具与关联普通 Tool 完全一致（registry 工具同步后即是 `t_tool` 行）。

## Capabilities

### New Capabilities

- `client-tool-registry`: 前端 `defineClientTool` 声明式注册 + zod schema 生成、启动同步、后端 reconcile 到 `t_tool`（source 字段语义、upsert/删除规则）、Tools 界面 Source 列与 registry 工具只读约束。

### Modified Capabilities

（无——本变更作为独立新增能力实现。`t_tool.source` 字段、reconcile 规则、UI Source 列均归属新能力 `client-tool-registry`；Phase 1 的 `client-tool-execution` / `client-tool-registration` 因 registry 工具同步后即为普通 `t_tool` 行，派发与关联逻辑无需修改。）

## Impact

- **数据库**：`t_tool` 增加 `source VARCHAR(16) NOT NULL DEFAULT 'database'`。移除 Phase 1 手动 seed 的 `console-log-echo` 行（改由前端同步生成）。
- **API**：新建 `packages/api/src/app/client-tools/`（controller / service / dto / module）；`ClientToolsService.syncRegistry` 在事务内 reconcile `t_tool`。`ToolService` 列表/响应附带 `source`。
- **Web**：新增 `zod` 依赖（zod 4，原生 `z.toJSONSchema()`）；新建 `client-tools/registry.ts`（defineClientTool）与 `client-tools/tools/*.ts`（工具定义）；App 启动 `useEffect` 调用 sync；`all-tools.tsx` / `tool-detail.tsx` / `add-tool.tsx` / `edit-tool.tsx` 适配 source 只读约束。
- **依赖**：新增 `zod`（仅 web；zod 4 原生 JSON Schema，无需 `zod-to-json-schema`）。
- **向后兼容**：`source` 默认 'database'，Phase 1 手动录入的 Client Tool 与 MCP Tool 行为不变；registry 同步是增量 upsert，不影响 source='database' 的行。
