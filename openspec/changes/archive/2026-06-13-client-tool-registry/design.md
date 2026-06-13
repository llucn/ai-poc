## Context

Phase 1（`client-tool`，已实现）落地了 suspend/resume 架构：`t_tool.kind='client'` 的工具手动录入数据库，LLM 调用 `client__<toolId>__<name>` 时服务端挂起、浏览器执行、回传后恢复。当前前端 `client-tool-executor.ts` 用一个 `Map<toolName, handler>` 静态注册 handler（含演示工具 `console-log-echo`），schema 则由管理员手动写入 `t_tool.mcp_schema`。

痛点（见 docs/client-tool.md §13.1）：handler 在代码里、schema 在数据库里，靠 name 对齐，签名漂移即运行时失败；JSON Schema 手填易错；开发流程割裂。

Phase 2 目标：开发者用 `defineClientTool` 在前端一处声明工具（name/description/参数类型 + handler），启动时自动同步给后端，schema 成为代码单一真相源。

约束：
- 不改 Phase 1 核心 Loop（suspend/resume、`client__<toolId>__<name>` 派发）。
- 沿用项目"应用层 referential integrity、手动迁移"约定。
- 项目现有 class-validator，无 zod；前端可引入轻量依赖。

## Goals / Non-Goals

**Goals:**
- 前端 `defineClientTool({ name, description, parameters(zod), handler })` 声明式注册，`z.infer` 自动推导 handler 入参类型。
- `z.toJSONSchema()`（zod 4 原生）把 zod schema 转 JSON Schema，作为 LLM 的 `parameters`。
- 启动时 `POST /client-tools/sync` 上报注册表；后端 reconcile 为 `t_tool` 行（kind='client'、source='registry'）。
- registry 工具拿到真实 `t_tool.id`，**复用** Phase 1 的 `getAvailableTools` / 关联 / 派发逻辑。
- Tools 界面区分 Database / Registry 来源，registry 工具只读。
- 演示工具 `console-log-echo` 从手动 seed 迁移为 `defineClientTool` 声明。

**Non-Goals:**
- 不改 suspend/resume Loop、`t_pending_client_call`、`client_call` SSE、`/client-result` 端点。
- 不引入 build-time manifest 或 TS Compiler API 反射（§13.3 方案 C）——只用运行时 sync。
- 不做 registry 工具的版本化、热重载、跨标签页一致性。
- 不强制 zod 之外的 schema 库；方案 B（手写 JSON Schema）仅作为备选不实现。

## Decisions

### 1. Reconcile registry 工具到 t_tool（而非 id=0 哨兵）

**决策：** `POST /client-tools/sync` 把上报的工具 **upsert 为 `t_tool` 行**（kind='client'，source='registry'，按 `server_name` = 工具 name 匹配）；注册表中已消失的 source='registry' 行被删除（事务内级联清理 `t_agent_tool`）。

**理由：**
- doc §13.4 提出过 `client__0__<name>` 或 `client__auto__<name>` 哨兵 id 方案，但那要求 `parseToolName` / `getAvailableTools` / `executeTool` / 关联管理全部对 id=0 特判，侵入 Phase 1 核心。
- 把 registry 工具 reconcile 成真实 `t_tool` 行后，它们对系统其余部分**就是普通 Client Tool**：`client__<realId>__<name>` 派发、`linkTool` 关联、`buildSystemContent` 展开全部零改动。Phase 2 真正做到"只改数据来源，不动 Loop"。
- All Tools 列表天然包含它们（`GET /tools` 已返回），无需前端额外合并 registry 端点（doc §13.5 的合并仅用于纯内存方案）。

**备选（拒绝）：** id=0/auto 哨兵 + 内存注册表直查。拒绝理由：侵入核心 Loop、关联无法持久化、列表需双源合并，复杂度更高。

### 2. `source` 字段区分来源 + 只读约束

**决策：** `t_tool` 增加 `source VARCHAR(16) NOT NULL DEFAULT 'database'`（'database' | 'registry'）。source='registry' 的行：
- sync 时由后端创建/更新/删除，管理员不可在 UI 编辑或删除（前端禁用按钮）。
- 仍可被管理员通过 `linkTool` 关联到 Agent。

**理由：** registry 工具的真相在代码里，UI 手动改 schema 会在下次 sync 被覆盖，造成困惑。用 source 显式标记并锁定编辑，避免双写。

### 3. 同步时机与信任模型

**决策：** 前端在 App 挂载的 `useEffect` 里 `POST /client-tools/sync`（带现有 header 鉴权）。sync 是幂等的全量协调（传入完整列表，后端据此增删改 source='registry' 行）。

**理由：** 所有客户端构建产物的注册表一致，sync 幂等，重复调用安全。

**风险与缓解：** 浏览器不可信，理论上可上报伪造工具。Phase 2（demo 场景）接受此风险——sync 只写 schema（声明），真正的 handler 仍只存在于浏览器代码，且 Client Tool 结果被当作不可信 observation（Phase 1 §9 已确立）。生产环境可改为 build-time manifest 或加管理员鉴权（Non-Goal）。

### 4. zod 作为 schema 库

**决策：** 引入 `zod` 到 `packages/web`（项目装的是 zod 4.x）。`defineClientTool` 的 `parameters` 收 `z.ZodType`，`getAllClientTools()` 用 zod 4 原生 `z.toJSONSchema(parameters)` 转换。

**理由：** doc §13.3 方案 A——类型推导完美（`z.infer`）、零学习成本。zod 4 原生 `z.toJSONSchema()` 直接产出扁平 JSON Schema 适配 LLM；`zod-to-json-schema` 仅兼容 zod 3（对 zod 4 返回空 schema），故不使用。

**备选（拒绝）：** 方案 B 手写 JSON Schema（类型需写两遍易漂移）、方案 C TS Compiler 反射（过重）。

### 5. executor 注册表承载元数据

**决策：** 重构 `client-tool-executor.ts`：注册表条目从 `handler` 升级为 `{ name, description, parameters(zod), handler }`。新增 `getAllClientTools()`（返回 `{ name, description, parametersSchema }[]`）供 sync 使用；`executeClientTool(name, params)` 行为不变（按 name 取 handler 执行、捕获错误）。保留 `registerClientTool` 作为内部底层 API，对外主推 `defineClientTool`。

**理由：** 单一注册表既驱动执行（handler）又驱动同步（元数据），避免两份清单不一致。

## Risks / Trade-offs

- **[sync 与首条消息竞态]** 用户在 sync 完成前发消息，Agent 可能看不到新 registry 工具 → 缓解：sync 在 App 挂载即触发，通常先于首条消息；registry 工具一旦 reconcile 进 `t_tool` 即持久化，后续会话都可见；未命中仅影响"刚加完代码的首次极短窗口"。
- **[多客户端并发 sync]** 多个浏览器同时 sync 同一份列表 → upsert 按 server_name 幂等，事务串行，结果一致。
- **[registry 工具被 Agent 关联后代码删除]** 下次 sync 删除该 `t_tool` 行并级联清理 `t_agent_tool`，Agent 自动失去该工具（与手动删 Tool 行为一致）。
- **[name 与已有 source='database' 工具冲突]** sync 只按 server_name 匹配并仅操作 source='registry' 行；若某 name 已被 source='database' 占用（unique server_name），upsert 该 registry 行会触发唯一约束失败 → 缓解：sync 时跳过并记录冲突（日志告警），不阻断其余工具同步。
- **[zod 体积]** 新增前端依赖增大 bundle → 可接受（zod 轻量，且已是 TS 生态事实标准）。

## Migration Plan

1. 手动执行 DDL：`ALTER TABLE t_tool ADD COLUMN source VARCHAR(16) NOT NULL DEFAULT 'database';`
2. 删除 Phase 1 手动 seed 的 `console-log-echo` 行（`DELETE FROM t_tool WHERE server_name='console-log-echo' AND source='database';`）——改由前端声明 + sync 重建为 source='registry'。
3. 部署后端（含 ClientToolsModule）与前端（含 zod + defineClientTool + 启动 sync）。
4. 启动前端 → 自动 sync → `console-log-echo` 以 source='registry' 重新出现在 All Tools。
5. 验证：Agent 关联该 registry 工具 → chat 触发 → suspend/resume 全流程通畅（与 Phase 1 一致）。

**Rollback：** 前端回退 prior commit（停止 sync）；后端保留 source 列无害（默认 'database'）；如需彻底回滚，`DELETE FROM t_tool WHERE source='registry';` 再手动 seed 回 Phase 1 的 console-log-echo。
