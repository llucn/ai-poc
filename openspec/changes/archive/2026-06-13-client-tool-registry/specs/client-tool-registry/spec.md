## ADDED Requirements

### Requirement: 声明式 Client Tool 注册（defineClientTool）
前端 MUST 提供 `defineClientTool({ name, description, parameters, handler })` API，在一处同时声明工具的元数据与执行体。`parameters` MUST 接受一个 zod schema（`z.ZodType`），handler 的入参类型 MUST 由 `z.infer<typeof parameters>` 自动推导。调用 `defineClientTool` MUST 把工具登记到前端内存注册表（按 `name` 索引）。

#### Scenario: 声明一个带参数的工具
- **WHEN** 开发者调用 `defineClientTool({ name: 'console-log-echo', description: '...', parameters: z.object({ message: z.string() }), handler })`
- **THEN** 该工具被登记到注册表，key 为 `console-log-echo`
- **AND** handler 的 `params` 参数被 TypeScript 推导为 `{ message: string }`

#### Scenario: 声明一个无参数的工具
- **WHEN** 开发者调用 `defineClientTool({ name: 'get-selected-user', description: '...', parameters: z.object({}), handler })`
- **THEN** 该工具被登记，handler 的 `params` 推导为 `{}`（空对象）

#### Scenario: 同名工具重复声明覆盖
- **WHEN** 两次以相同 `name` 调用 `defineClientTool`
- **THEN** 后者覆盖前者（注册表按 name 唯一）

### Requirement: zod schema 转 JSON Schema
前端 MUST 提供 `getAllClientTools()`，返回注册表中所有工具的 `{ name, description, parametersSchema }` 数组，其中 `parametersSchema` MUST 由 zod 4 原生的 `z.toJSONSchema()` 从工具的 zod `parameters` 生成，产出扁平、无 `$ref` 的 JSON Schema 以适配 LLM。（注：项目装的是 zod 4.x，`zod-to-json-schema` 仅兼容 zod 3，对 zod 4 返回空 schema；zod 4 内置 `z.toJSONSchema()` 已直接产出扁平结果，无需额外库。）

#### Scenario: 生成扁平 JSON Schema
- **GIVEN** 工具 `parameters` 为 `z.object({ message: z.string().describe('消息') })`
- **WHEN** 调用 `getAllClientTools()`
- **THEN** 返回项的 `parametersSchema` 为 `{ type: 'object', properties: { message: { type: 'string', description: '消息' } }, required: ['message'] }`（无 `$ref`/`definitions`）

#### Scenario: 可选字段不进 required
- **GIVEN** 工具 `parameters` 为 `z.object({ prefill: z.string().optional() })`
- **WHEN** 调用 `getAllClientTools()`
- **THEN** `parametersSchema.required` 不含 `prefill`

### Requirement: 浏览器执行仍按 name 派发
`executeClientTool(name, params)` MUST 从注册表按 `name` 取出工具的 handler 并执行，成功返回 `{ result }`、异常捕获为 `{ error }`，永不抛出。注册表条目同时持有 handler 与元数据（name/description/parameters），保证执行与同步用的是同一份清单。

#### Scenario: 执行已注册工具
- **GIVEN** 注册表中存在 `console-log-echo`，handler 返回 `{ echo, timestamp }`
- **WHEN** 调用 `executeClientTool('console-log-echo', { message: 'hi' })`
- **THEN** 返回 `{ result: { echo: 'hi', timestamp: <number> } }`

#### Scenario: 执行未注册工具
- **WHEN** 调用 `executeClientTool('does-not-exist', {})`
- **THEN** 返回 `{ error: ... }`，error 文本包含工具名

#### Scenario: handler 抛错被捕获
- **GIVEN** handler 抛出 `Error('boom')`
- **WHEN** 调用 `executeClientTool`
- **THEN** 返回 `{ error: 'boom' }`

### Requirement: 启动时同步注册表到后端
前端 MUST 在应用挂载时（一次性）`POST /client-tools/sync`，请求体为 `{ tools: getAllClientTools() }`。同步 MUST 携带现有的 header 鉴权（X-User-Name / X-User-Role）。同步失败 MUST NOT 阻塞应用启动（捕获错误并记录，不抛出）。

#### Scenario: 应用启动触发同步
- **WHEN** 前端应用挂载
- **THEN** 向 `/client-tools/sync` 发送 POST，body 为 `{ tools: [{ name, description, parametersSchema }, ...] }`

#### Scenario: 同步失败不影响应用
- **WHEN** `/client-tools/sync` 请求失败（网络错误或 5xx）
- **THEN** 错误被捕获记录，应用其余功能正常运行

### Requirement: t_tool 增加 source 字段
`t_tool` 表 MUST 增加 `source VARCHAR(16) NOT NULL DEFAULT 'database'` 字段，取值 'database'（管理员手动配置）或 'registry'（前端代码自动注册）。现有行默认 'database'，向后兼容。

#### Scenario: 手动创建的工具 source 为 database
- **WHEN** 管理员通过 `POST /tools` 创建工具
- **THEN** 该行 `source='database'`

#### Scenario: 同步创建的工具 source 为 registry
- **WHEN** `/client-tools/sync` 创建一个新工具行
- **THEN** 该行 `source='registry'`、`kind='client'`

#### Scenario: 工具响应包含 source
- **WHEN** 客户端调用 `GET /tools` 或 `GET /tools/:id`
- **THEN** 每个工具对象包含 `source` 字段

### Requirement: 后端 reconcile 同步注册表到 t_tool
`POST /client-tools/sync` MUST 在一个事务内把上报的工具全量协调（reconcile）为 `t_tool` 中 `source='registry'` 的行：
- 上报的工具按 `server_name`（= 工具 name）匹配：不存在则创建（kind='client'、source='registry'、server_url=''、mcp_schema=单元素数组 `[{ name, description, parameters: parametersSchema }]`）；已存在的 registry 行则更新其 mcp_schema。
- 当前 `source='registry'` 但不在上报列表中的行 MUST 被删除，并在同一事务内级联删除其在 `t_agent_tool` 的关联。
- 若某上报 name 已被 `source='database'` 的行占用（server_name 唯一约束冲突），该工具 MUST 被跳过并记录告警，不阻断其余工具同步。
同步后，registry 工具是普通的 `t_tool` 行（kind='client'），由 Phase 1 既有的 `getAvailableTools` / `client__<toolId>__<name>` 派发 / `linkTool` 关联逻辑处理，无需特殊分支。

#### Scenario: 创建新 registry 工具
- **GIVEN** `t_tool` 无 server_name='echo' 的行
- **WHEN** sync 上报 `{ name: 'echo', description: '...', parametersSchema: {...} }`
- **THEN** 创建一行 `server_name='echo'`、`kind='client'`、`source='registry'`、`server_url=''`、`mcp_schema=[{ name:'echo', description:'...', parameters:{...} }]`

#### Scenario: 更新已有 registry 工具的 schema
- **GIVEN** `t_tool` 已有 source='registry' 的 `echo` 行
- **WHEN** sync 上报同名工具但 parametersSchema 变化
- **THEN** 该行 mcp_schema 被更新，id 保持不变（已建立的 Agent 关联保留）

#### Scenario: 删除代码中已移除的 registry 工具
- **GIVEN** `t_tool` 有 source='registry' 的 `old-tool` 行，且被某 Agent 关联
- **WHEN** sync 上报的列表不含 `old-tool`
- **THEN** 该行被删除，且 `t_agent_tool` 中指向它的关联在同一事务内被清理

#### Scenario: 与 database 工具同名冲突时跳过
- **GIVEN** `t_tool` 有 source='database'、server_name='weather' 的行
- **WHEN** sync 上报名为 `weather` 的工具
- **THEN** 该工具被跳过并记录告警，其余上报工具正常同步

#### Scenario: registry 工具复用 Phase 1 派发
- **GIVEN** 某 registry 工具 `console-log-echo` 的 `t_tool.id` 为 7，已关联到某 Agent
- **WHEN** LLM 调用 `client__7__console-log-echo`
- **THEN** 服务端按 Phase 1 既有逻辑挂起并派发，无 registry 特判分支

### Requirement: 暴露注册表镜像端点
后端 MUST 提供 `GET /client-tools/registry`，返回最近一次 sync 上报并被后端缓存的注册表镜像（`{ name, description, parametersSchema }[]`），供调试与只读详情展示。

#### Scenario: 读取注册表镜像
- **GIVEN** 前端已 sync 上报 N 个工具
- **WHEN** 调用 `GET /client-tools/registry`
- **THEN** 返回这 N 个工具的 `{ name, description, parametersSchema }` 数组

### Requirement: Tools 界面区分来源并锁定 registry 工具
Tools 管理界面 MUST 增加 "Source" 列显示每个工具的来源（Database / Registry）。对 `source='registry'` 的工具，前端 MUST 禁用 Edit 与 Delete 操作（按钮置灰、批量删除 checkbox 禁用），其真相在代码中维护；Tool Detail 页 MUST 对 registry 工具隐藏编辑入口，只读展示其 schema。registry 工具 MAY 仍被管理员关联到 Agent（与普通 Tool 关联一致）。

#### Scenario: 列表显示 Source 列
- **WHEN** 加载 All Tools 列表
- **THEN** 每行显示 Source 为 "Database" 或 "Registry"

#### Scenario: registry 工具禁止编辑/删除
- **GIVEN** 某工具 `source='registry'`
- **WHEN** 在 All Tools 列表或 Tool Detail 渲染该工具
- **THEN** 其 Edit / Delete 按钮被禁用，批量删除 checkbox 被禁用

#### Scenario: database 工具操作不受影响
- **GIVEN** 某工具 `source='database'`
- **WHEN** 渲染该工具
- **THEN** Edit / Delete 正常可用

#### Scenario: registry 工具仍可关联 Agent
- **WHEN** 管理员在 Agent Detail 关联一个 source='registry' 的工具
- **THEN** 通过现有 linkTool 流程在 `t_agent_tool` 写入关联，行为与关联普通 Tool 一致

### Requirement: 演示工具迁移为声明式注册
演示工具 `console-log-echo` MUST 从 Phase 1 的"数据库手动 seed"迁移为通过 `defineClientTool` 声明：参数为 `z.object({ message: z.string() })`，handler 在浏览器执行 `console.log(message)` 并返回 `{ echo: message, timestamp: Date.now() }`。Phase 1 手动 seed 的该行 MUST 被移除，改由启动 sync 以 `source='registry'` 重建。

#### Scenario: console-log-echo 经声明注册并同步
- **WHEN** 前端启动并完成 sync
- **THEN** `t_tool` 出现 server_name='console-log-echo'、kind='client'、source='registry' 的行
- **AND** All Tools 列表显示其 Source 为 Registry，Edit/Delete 禁用

#### Scenario: 迁移后端到端流程不变
- **GIVEN** Agent 关联了 registry 的 `console-log-echo`
- **WHEN** LLM 调用该工具
- **THEN** 浏览器控制台输出 message，LLM 收到 observation `{"echo":...,"timestamp":...}`（与 Phase 1 行为一致）
