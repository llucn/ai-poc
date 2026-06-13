## 1. 依赖与数据库

- [x] 1.1 在 `packages/web` 安装 `zod`（zod 4.x 内置 `z.toJSONSchema()`，无需 `zod-to-json-schema`——后者仅兼容 zod 3）
- [x] 1.2 `docs/database.sql`：`t_tool` 增加 `source VARCHAR(16) NOT NULL DEFAULT 'database'`；移除 Phase 1 手动 seed 的 `console-log-echo` INSERT（改由 sync 重建）
- [x] 1.3 手动迁移现有库：`ALTER TABLE t_tool ADD COLUMN source ...` + `DELETE FROM t_tool WHERE server_name='console-log-echo' AND source='database'`（DDL 已在 database.sql 与 design.md Migration Plan 记录，由管理员手工执行）

## 2. 后端 - 实体与 DTO

- [x] 2.1 `ToolEntity` 增加 `source` 字段（'database' | 'registry'，默认 'database'）
- [x] 2.2 `ToolService.create` 默认写入 source='database'；列表/详情响应（ToolResponse）附带 `source`
- [x] 2.3 新建 `client-tools.dto.ts`：`SyncRegistryDto { tools: { name: string; description: string; parametersSchema: unknown }[] }`

## 3. 后端 - ClientToolsModule

- [x] 3.1 新建 `packages/api/src/app/client-tools/client-tools.service.ts`：内存缓存 `registry`；`getRegistry()`；`syncRegistry(tools, createdBy)` 事务内 reconcile `t_tool`（source='registry'）
- [x] 3.2 reconcile 逻辑：按 server_name upsert（新建 kind='client'/source='registry'/server_url=''/mcp_schema=[{name,description,parameters}]；已存在 registry 行更新 mcp_schema）
- [x] 3.3 reconcile 删除：当前 source='registry' 但不在上报列表的行，事务内删除并级联清理 `t_agent_tool`
- [x] 3.4 reconcile 冲突处理：name 已被 source='database' 行占用时跳过并 logger.warn，不阻断其余
- [x] 3.5 新建 `client-tools.controller.ts`：`POST /client-tools/sync`（鉴权，调用 syncRegistry）、`GET /client-tools/registry`（返回缓存镜像）
- [x] 3.6 新建 `client-tools.module.ts`（注入 ToolEntity / AgentToolEntity 仓库 + DataSource）并在 `app.module.ts` 注册

## 4. 前端 - 声明式注册表（zod）

- [x] 4.1 重构 `client-tool-executor.ts`：注册表条目升级为 `{ name, description, parameters(z.ZodType), handler }`；保留 `executeClientTool(name, params)` 行为
- [x] 4.2 实现 `defineClientTool<T extends z.ZodType>({ name, description, parameters, handler })`：登记到注册表，handler 入参 `z.infer<T>` 推导
- [x] 4.3 实现 `getAllClientTools()`：用 zod 4 原生 `z.toJSONSchema(parameters)` 生成 `{ name, description, parametersSchema }[]`
- [x] 4.4 新建 `client-tools/tools/console-log-echo.ts`：用 `defineClientTool` 声明（`z.object({ message: z.string() })` + console.log handler），并在 executor 模块导入以触发注册
- [x] 4.5 移除 executor 里 Phase 1 的静态 `registerClientTool('console-log-echo', ...)` 内联注册（已迁移为独立文件）

## 5. 前端 - 启动同步

- [x] 5.1 在 App 挂载的 `useEffect` 中 `POST /client-tools/sync`，body 为 `{ tools: getAllClientTools() }`，带 header 鉴权
- [x] 5.2 sync 失败用 `.catch` 捕获记录，不阻塞应用（不抛出）

## 6. 前端 - Tools 界面 Source 列与只读约束

- [x] 6.1 web `Tool` 类型增加 `source: 'database' | 'registry'`
- [x] 6.2 `all-tools.tsx`：增加 "Source" 列（Database / Registry 徽章）；source='registry' 行禁用 Edit/Delete 与批量删除 checkbox
- [x] 6.3 `tool-detail.tsx`：source='registry' 时隐藏 Edit 按钮、禁用 Delete，只读展示 schema
- [x] 6.4 `add-tool.tsx` / `edit-tool.tsx`：registry 工具不可经表单创建/编辑（edit 页对 registry 工具显示只读提示并禁止提交）

## 7. 验证

- [x] 7.1 后端：`npx nx build api` 通过，`npx tsc --noEmit -p packages/api/tsconfig.app.json` 无错
- [x] 7.2 前端：`npx nx build web` 通过，`npx tsc --noEmit -p packages/web/tsconfig.app.json` 无错
- [x] 7.3 前端单元测试（vitest）：`defineClientTool` 登记、`getAllClientTools` 生成扁平 JSON Schema（含 required / optional）、`executeClientTool` 成功/异常/未注册（10 tests passing）
- [ ] 7.4 端到端手工：启动前端 → 自动 sync → All Tools 出现 source='registry' 的 console-log-echo（Edit/Delete 禁用）
- [ ] 7.5 端到端手工：Agent 关联该 registry 工具 → chat 触发 → suspend → 浏览器执行 → 恢复 → final_answer（与 Phase 1 一致）
- [ ] 7.6 端到端手工：删除 console-log-echo 的工具定义代码并刷新 → sync 后该行从 All Tools 消失，关联随之清理
- [x] 7.7 `openspec validate client-tool-registry --strict` 通过