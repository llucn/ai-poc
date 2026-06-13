## Context

现有 Agent Loop 在 `session.service.ts` 的 `runLlmTurn` 中同步执行：LLM 返回 action → 服务端通过 `McpClientService` 调用 MCP Tool → 包装 observation → 继续下一轮 LLM 对话，直到 final_answer。整个过程在一次 SSE POST 请求内完成，浏览器只负责接收和渲染消息。

这种架构限制了工具只能在服务端执行，无法调用浏览器环境的能力（DOM 操作、LocalStorage、用户交互弹窗、剪贴板、通知 API 等）。扩展 Client Tool 需要打破同步 Loop，引入**挂起/恢复**机制：服务端识别到 Client Tool 调用时挂起会话并派发到浏览器，浏览器执行后回传结果，服务端恢复会话继续 LLM Loop。

技术约束：
- 必须保持现有 MCP Tools 行为不变，两种工具类型共存。
- SSE 是单向流（服务端 → 浏览器），需复用 SSE 传递挂起信号，通过新 HTTP 端点回传结果。
- 会话状态需持久化到数据库，支持服务重启或横向扩展（未来）。
- Phase 1 先验证架构可行性，手动录入 schema；Phase 2 再引入自动注册（defineClientTool + Registry + sync）。

## Goals / Non-Goals

**Goals:**
- 服务端识别 `client__<toolId>__<toolName>` 前缀的工具调用，挂起 LLM Loop，通过 SSE 派发到浏览器。
- 浏览器执行 Client Tool 并回传结果，服务端恢复 Loop 继续对话。
- 数据库持久化挂起状态（t_pending_client_call），支持服务端重启或异步恢复。
- t_tool 表增加 `kind` 字段区分 MCP / Client，Agent 可同时关联两种工具。
- 实现一个测试工具 `client__1__console-log-echo`（浏览器执行 console.log + 返回演示对象），验证端到端流程。
- Phase 1 手动录入 Client Tool schema 到数据库，不做自动注册（defineClientTool / Registry）。

**Non-Goals:**
- **不**实现自动注册机制（defineClientTool / Registry / sync） — 这是 Phase 2 工作，Phase 1 专注验证 suspend/resume 架构。
- **不**处理并发多个 Client Tool 调用（单会话同时多个挂起） — 当前一次只挂起一个调用，简化状态管理；未来可扩展。
- **不**实现 Client Tool 的超时、重试、幂等性 — Phase 1 假设浏览器稳定在线，异常场景（如断网、刷新页面导致 callId 丢失）后续迭代。
- **不**改变现有 MCP Tools 行为 — t_tool.kind 默认 'mcp'，现有工具零改动。

## Decisions

### 1. 工具名称前缀与 ID 嵌入

**决策：** Client Tool 名称格式 `client__<toolId>__<toolName>`，工具 ID 嵌入名称字符串（与 MCP 的 `mcp__<toolId>__<actualToolName>` 平行）。

**理由：**
- 保持与 MCP Tools 命名的一致性，LLM 看到的工具列表中两种工具平行排列，前缀语义清晰（`mcp__` vs `client__`）。
- toolId 嵌入名称使服务端解析 action 时无需额外查表即可知道 t_tool 的哪一行（toolId），快速获取 kind / schema / agentId 上下文。
- 避免引入新的 action 格式 — LLM 仍然输出标准的 `action: { tool: "client__1__console-log-echo", params: {...} }`，服务端通过前缀和 ID 分发。

**备选方案：** 纯工具名（如 `consoleLogEcho`），服务端查表判断 kind。拒绝理由：需额外 DB 查询，且与 MCP 命名不对称，增加认知负担。

### 2. 挂起状态持久化（t_pending_client_call 表）

**决策：** 新增 `t_pending_client_call` 表存储挂起的工具调用上下文，字段：`callId`（UUID PK）、`sessionId`、`agentId`、`toolId`、`toolName`、`params`（JSON）、`messageContext`（JSON，存储当前 LLM 对话历史）、`createdOn`、`status`（'pending' / 'completed' / 'failed'）。

**理由：**
- 数据库持久化使挂起状态不依赖内存，支持服务端重启、横向扩展、异步处理（如浏览器 1 分钟后才回传结果）。
- `messageContext` 保存挂起时的 LLM 对话历史（messages 数组），恢复时直接拼接新的 observation 继续 Loop，无需重新构建上下文。
- callId 作为幂等 Key，浏览器重复回传同一 callId 时服务端可识别并忽略（status 已非 'pending'）。

**备选方案：** 内存缓存（如 Map<callId, context>）。拒绝理由：不支持重启，单机限制，无法审计历史调用。

### 3. SSE 单向流 + HTTP POST 回传结果

**决策：** 服务端通过 SSE 发送 `{ event: 'client_call', data: { callId, toolName, params } }`，浏览器接收后执行工具，通过新 HTTP 端点 `POST /sessions/:id/client-result` 回传 `{ callId, result/error }`。

**理由：**
- SSE 是单向流（server → client），无法反向传数据；WebSocket 虽支持双向，但现有架构已基于 SSE，引入 WebSocket 需重构整个消息推送层，成本高。
- HTTP POST 是标准的异步回传方式，与现有 RESTful 风格一致，易于调试和监控。
- callId 关联挂起上下文，POST 时携带 callId 使服务端能快速定位并恢复会话。

**备选方案：** WebSocket 双向通信。拒绝理由：需重构现有 SSE 架构，风险高；HTTP POST 已足够满足需求。

### 4. runLlmTurn 拆分为 suspend / resume 两阶段

**决策：** 保留 `runLlmTurn` 作为同步 Loop 入口（处理 MCP Tools），新增 `resumeLlmTurn(callId, clientResult)` 处理恢复逻辑。挂起时 `runLlmTurn` 提前返回（发送 client_call SSE 后结束本次响应），恢复时 `resumeLlmTurn` 从 t_pending_client_call 加载上下文、拼接 observation、继续 LLM Loop。

**理由：**
- 清晰分离同步路径（MCP）和异步路径（Client Tool 挂起/恢复），减少单函数复杂度。
- `resumeLlmTurn` 是独立入口，可被 `/client-result` 端点调用，职责单一。
- 保持向后兼容：纯 MCP 场景下 `runLlmTurn` 行为不变（不进入挂起分支）。

**备选方案：** 在 `runLlmTurn` 内部用状态机处理挂起/恢复。拒绝理由：状态机逻辑复杂，难以测试和调试；拆分函数更易理解。

### 5. 浏览器端 ClientToolExecutor 集中管理

**决策：** 新增 `ClientToolExecutor` 类（或模块），维护一个 `Map<toolName, executorFunction>`，`useChatSse` Hook 监听 `client_call` 事件后派发到 Executor，由 Executor 路由到对应实现函数。

**理由：**
- 集中管理避免工具实现散落各处（每个工具一个独立文件/组件），易于维护和扩展。
- Executor 作为注册表，新增工具只需在 Executor 内添加一条映射 `toolName → function`，Hook 层无需改动。
- 错误处理统一：Executor 捕获工具执行异常，统一包装为 `{ error: message }` 回传服务端。

**备选方案：** 每个工具独立监听 SSE，自行回传结果。拒绝理由：重复代码多（每个工具都要写 POST 逻辑），难以统一错误处理和日志。

### 6. Phase 1 手动录入 schema，Phase 2 自动注册

**决策：** Phase 1 不实现 `defineClientTool` / Registry / sync 机制，Client Tool 的 schema（name / description / parameters JSON Schema）手动录入 t_tool 表（kind='client'）。Phase 2 再引入代码声明 + 自动同步。

**理由：**
- 降低 MVP 风险：先验证 suspend/resume 架构端到端可行（最大不确定性在于 LLM Loop 的状态持久化与恢复），再优化 schema 管理体验。
- 手动录入虽繁琐，但功能完整（schema 到位后 LLM 能正常调用），不阻塞流程验证。
- Phase 2 的 defineClientTool + Registry 只是改数据来源（从数据库读 → 从代码读），不改核心 Loop 逻辑，解耦风险。

**备选方案：** 一次性实现自动注册。拒绝理由：增加 Phase 1 复杂度，若 suspend/resume 架构有问题需返工，自动注册部分会浪费。

## Risks / Trade-offs

### 1. 浏览器刷新或断网导致 callId 丢失
**风险：** 挂起期间浏览器刷新页面，SSE 连接断开，新页面加载后无法恢复之前的 callId。服务端挂起状态（t_pending_client_call）成为僵尸记录。

**缓解：**
- Phase 1 不处理此场景（假设浏览器稳定在线），UI 提示"工具执行中，请勿刷新"。
- Phase 2 可引入超时机制：t_pending_client_call.createdOn 超过 5 分钟的记录标记为 'timeout'，定时任务清理；服务端恢复会话时若发现超时，返回 error observation 给 LLM（"Client tool execution timeout"），LLM 可选择重试或放弃。

### 2. 单会话同时多个 Client Tool 调用
**风险：** LLM 并发调用两个 Client Tool（理论上可能，虽然当前 action 一次只输出一个 tool），Phase 1 的挂起逻辑假设单次挂起，无法处理并发。

**缓解：**
- Phase 1 在 `runLlmTurn` 中检测到 Client Tool 时立即挂起（不继续解析后续 action），单会话同时只有一个 pending call。
- 若需支持并发，Phase 2 可扩展 t_pending_client_call 表支持同一 sessionId 的多条 pending 记录，浏览器端 Executor 也需改为并发执行多个工具。当前不是高优先级需求。

### 3. 手动录入 schema 易出错
**风险：** Phase 1 手动在数据库写 JSON Schema（t_tool.mcp_schema），格式错误或参数定义不准确会导致 LLM 调用失败。

**缓解：**
- 提供一个参考模板（如 `console-log-echo` 的完整 schema JSON），开发者复制粘贴后修改。
- Phase 2 自动注册时由 TypeScript 类型约束保证 schema 正确性，消除此风险。

### 4. LLM Loop 状态持久化的复杂度
**风险：** `messageContext` 字段存储整个对话历史（JSON 数组），大会话时字段体积膨胀；恢复时需精确还原 LLM 对话状态，任何不一致可能导致 LLM 输出异常。

**缓解：**
- Phase 1 限制测试场景（短会话），验证逻辑正确性。
- `messageContext` 只存 messages 数组，不存其他无关状态；恢复时直接追加新 observation，保持上下文连续性。
- 未来可优化：对超长会话压缩或分段存储，或只存必要的上下文摘要（需 LLM 支持 context truncation）。

### 5. 测试覆盖挑战
**风险：** suspend/resume 流程跨服务端和浏览器，涉及数据库持久化、SSE 事件、HTTP 回调，集成测试难以编写。

**缓解：**
- 单元测试覆盖关键函数：`parseToolName`（前缀解析）、`resumeLlmTurn`（恢复逻辑）、ClientToolExecutor（工具派发）。
- 端到端测试依赖手工验证：Phase 1 用 `console-log-echo` 工具跑一遍完整流程，确认挂起 → 执行 → 恢复 → final_answer 路径通畅。
- Phase 2 可引入 E2E 自动化（如 Playwright），模拟浏览器执行 Client Tool 并回传。
