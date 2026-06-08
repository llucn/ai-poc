## Context

当前系统使用 OpenAI-compatible API 调用 LLM（Qwen），LLM 以 JSON 格式回复，包含 `thought` + `final_answer` 或 `thought` + `action`。`final_answer` 的处理已完成，`action`（MCP Tool 调用）目前只是将 JSON 原文显示为 assistant reply——需要实现真正的工具调用闭环。

现有基础设施：
- `agent.service.ts` 中已有 MCP JSON-RPC 客户端（`mcpRpc` / `parseSseJsonRpc`），用于 `tools/list`（获取工具 schema）
- `t_agent_tool` 表存储每个 agent 关联的 MCP 服务器地址和工具 schema
- `runLlmTurn` 是所有消息处理的核心私有方法，当前执行"单次 LLM 调用 → 存 thought → 存 reply"
- SSE 事件流已支持 `thought_created` / `message_created` / `error`

## Goals / Non-Goals

**Goals:**
- 实现 action → MCP Tool 调用 → observation → 再次 LLM 调用的多轮循环
- 抽取 MCP 客户端为独立服务，支持 `tools/call` 调用
- 每轮循环的中间状态（thought、observation）通过 SSE 实时推送给前端
- 控制工具调用上限（20 次/消息），防止无限循环
- observation 复用现有 Thought Message 渲染，前端无结构性改动

**Non-Goals:**
- 不改变 LLM 的消息格式或 system prompt（prompt 工程不在本次范围）
- 不实现工具调用的并行执行（每次只调一个工具）
- 不实现 MCP 的 streaming 响应处理（使用同步请求-响应模式）
- 不修改前端 ThoughtMessage 组件（复用现有样式）

## Decisions

### Decision 1: 将 `runLlmTurn` 从单次调用改为循环

**Choice:** 在 `runLlmTurn` 内部实现 while 循环。每轮迭代：调 LLM → 检查输出 → 若 `action` 则执行工具、存 observation、推 SSE、追加到 history 继续循环；若 `final_answer` 则存 reply、跳出循环。

**Rationale:** 循环在一个方法内完成，SSE 事件流保持连贯，不需要前端额外协调多次请求。比递归更直观，栈深度固定。

**Alternatives considered:**
- 递归调用：语义清晰但栈深度随工具调用次数增长，且 TypeScript 不保证尾调用优化
- 前端驱动多轮：增加前后端交互复杂度，且 SSE 连接需要频繁建立/断开

### Decision 2: 抽取 MCP 客户端为独立服务

**Choice:** 新建 `packages/api/src/app/mcp/mcp-client.service.ts`，将 `agent.service.ts` 中的 `mcpRpc` / `parseSseJsonRpc` 逻辑抽出，新增 `callTool(serverUrl, toolName, params)` 方法。`agent.service.ts` 改为注入该服务。

**Rationale:** `agent.service.ts` 的 MCP 调用是私有方法，无法被 `session.service.ts` 直接复用。抽为独立服务后两处均可注入使用，且职责更清晰（Agent 服务管 CRUD，MCP 客户端管通信）。

**Alternatives considered:**
- 在 `session.service.ts` 中重新实现 MCP 调用：重复代码
- 直接暴露 `agent.service.ts` 的方法为 public：违反单一职责

### Decision 3: observation 消息复用 Thought Message

**Choice:** observation 以 `isThought=1` 存储，content 为 `{"observation": <result>}` 格式的 JSON 字符串。前端通过现有 `thought_created` SSE 事件接收，用 ThoughtMessage 组件渲染。

**Rationale:** 改动最小。observation 的语义与 thought 接近（都是中间推理过程），用户可以展开查看工具执行结果。无需改数据库 schema 或前端组件。

### Decision 4: 工具名解析策略

**Choice:** 按 `mcp__${id}__${toolName}` 格式解析，用正则 `/^mcp__(\d+)__(.+)$/` 提取 `id` 和 `toolName`。由于 `toolName` 本身可能含 `_`，只在前两个 `__` 处分割。

**Rationale:** 与 `docs/action-tool.md` 规范一致。正则简单可靠，不依赖工具名的字符约束。

### Decision 5: 循环中 SSE 事件的推送策略

**Choice:** `runLlmTurn` 接收 `res: Response` 参数，在循环内部直接写 SSE 事件。每轮循环推送：
1. LLM 的 thought（`thought_created`）
2. 如果是 action → 工具执行后的 observation（`thought_created`）
3. 最终 `final_answer` 时推送 assistant reply（`message_created`）

**Rationale:** SSE 写入必须在循环内部完成才能实现实时推送。`createMessage` 作为外层只负责 try/catch/finally 和 `res.end()`。

## Risks / Trade-offs

**[Risk] MCP 服务器不可用或超时** → Mitigation: 复用现有 8s 超时机制。失败时构造 error observation 让 LLM 知道工具调用失败，由 LLM 决定是否重试或给出 fallback 回答。

**[Risk] LLM 陷入工具调用死循环** → Mitigation: 硬性限制 20 次上限，超限直接终止并推送 error 事件。

**[Risk] 长时间工具调用循环导致 SSE 连接超时** → Mitigation: 每轮循环都推送 SSE 事件，保持连接活跃。前端 `fetchEventSource` 不设超时。

**[Trade-off] observation 与 thought 视觉上无区分** → 可接受：用户可以展开查看 JSON 内容区分。后续可通过增加 messageType 或前端解析 content 来增强展示。
