Client Tools 架构设计
===

> **状态：设计建议** — 本文给出在现有 Agent Loop 之上扩展「浏览器端工具（Client Tools）」的架构方案，供评审后再实施。

# 1. 背景与目标

现在的工具（MCP Tools）运行在**服务端**：Agent Loop 在 `session.service.ts` 的 `runLlmTurn` 里识别 LLM 输出的 `action`，解析出 `tool` / `params`，通过 `McpClientService` 发起 JSON-RPC 调用，把结果包装成 `observation` 消息反馈给 LLM，循环直到 `final_answer`。整个循环在**一次 SSE POST 请求内同步完成**。

目标是扩展另一类工具——**Client Tools**：

- 像 MCP Tools 一样注册在 Agent 上，但使用**新的名称前缀**与 `mcp__` 区分；
- Agent 构建消息时，把 Client Tools 一并放入发送给 LLM 的工具清单；
- LLM 返回 `action` 后，服务端**不执行**，而是把工具调用**派发到浏览器**；
- 浏览器识别工具调用，在 UI 上执行（弹窗、填表、跳转、读取页面状态等），把结果回传；
- 服务端拿到结果，构造 `observation`，**恢复** Agent Loop，继续直到 `final_answer`。

# 2. 核心难点

现有 Loop 的执行模型是：

```
浏览器 ──POST /sessions/:id/messages──▶ 服务端
                                         │ while(true):
                                         │   callLlm → action
                                         │   executeTool(MCP)  ← 同步、服务端完成
                                         │   observation → 下一轮
                                         │ final_answer
   ◀────────────── SSE 事件流 ───────────┘
```

SSE 在一次 POST 内是**单向**的（服务端 → 浏览器）。MCP 工具能内联执行，是因为服务端自己就能发起 HTTP 调用。而 Client Tool 的执行体在浏览器里，服务端在循环中途必须：

1. 暂停循环；
2. 把工具调用「请求」推给浏览器；
3. **等浏览器执行完并回传结果**；
4. 用结果恢复循环。

第 2、3 步要求一条**反向通道**（浏览器 → 服务端）。这正是业界几套协议要解决的问题。

# 3. 业界调研

| 方案 | 机制 | 对本项目的启发 |
| --- | --- | --- |
| **OpenAI / Anthropic 原生 Tool Calling** | 无状态多轮：模型返回 `tool_calls` 后**本次请求即结束**；客户端执行工具，把结果作为新一条消息**重新发起请求**，模型续接。 | 关键范式：**「挂起 = 结束本次请求」**。不需要长连接里做双向 RPC，靠「再发一次请求」把结果带回来。本项目 Loop 已经每轮从持久化历史重建上下文，天然契合。 |
| **Vercel AI SDK** | 工具分两类：带 `execute` 的在服务端跑；**不带 `execute` 的自动转发到前端**，前端用 `onToolCall` 执行、`addToolResult` 回传，SDK 自动续接对话。 | 与「按前缀区分执行位置」思路一致。证明「同一份工具清单，部分服务端执行、部分客户端执行」是成熟做法。 |
| **CopilotKit / AG-UI Protocol** | AG-UI 是面向「Agent ↔ 前端」的开放事件协议（`TOOL_CALL_START/ARGS/END`、`TOOL_RESULT` 等事件）。`useCopilotAction` 在前端注册可被 Agent 调用的动作（Frontend Actions / Generative UI）。 | 与本需求**最贴合**。可借鉴其事件命名与「前端注册动作表」的模型，但不必引入整套框架。 |
| **MCP（现状）** | JSON-RPC，传输无关。规范侧重「服务端工具」；`sampling`、`elicitation`、`roots` 等是 client feature，但面向的是「让服务器反过来用客户端能力」，并非浏览器 UI 动作。 | MCP 适合「外部服务端工具」，不适合「浏览器 UI 工具」。Client Tools 应另起一套，不要硬塞进 MCP。 |
| **LangGraph `interrupt` / Human-in-the-loop** | 图执行到中断点**挂起并持久化状态**，外部输入到达后**从断点恢复**。 | 「挂起—持久化—恢复」的状态机思想，正是跨多次请求续接 Loop 的理论模型。 |

**结论**：不要在一条 SSE 长连接里造双向 RPC。采用业界主流的**「挂起即结束本次请求 + 携带结果重新发起请求恢复循环」**（suspend / resume）模式，它与现有「每轮从持久化消息历史重建上下文」的实现天然吻合，改动最小、最稳健。

# 4. 推荐架构：Suspend / Resume

## 4.1 整体时序

```
浏览器                                服务端                         LLM
  │                                     │                            │
  │ POST /sessions/:id/messages         │                            │
  ├────────────────────────────────────▶                            │
  │                                     │  runAgentLoop()            │
  │                                     ├── callLlm ─────────────────▶
  │                                     ◀──────── action(mcp__…) ────┤
  │      SSE: thought_created           │                            │
  ◀─────────────────────────────────────┤  executeTool() 服务端内联   │
  │      SSE: thought_created(obs)      │                            │
  ◀─────────────────────────────────────┤                            │
  │                                     ├── callLlm ─────────────────▶
  │                                     ◀────── action(client__…) ───┤
  │      SSE: thought_created           │                            │
  ◀─────────────────────────────────────┤  ← 识别为 Client Tool      │
  │      SSE: client_tool_call          │    保存 pending observation │
  ◀─────────────────────────────────────┤    结束本次请求 res.end()   │
  │                                     │                            │
  │ ① 在 UI 上执行工具                   │                            │
  │ ② POST /sessions/:id/tool-result    │                            │
  ├────────────────────────────────────▶  resumeAgentLoop()         │
  │                                     │  保存 observation          │
  │                                     ├── callLlm ─────────────────▶
  │                                     ◀──────── final_answer ──────┤
  │      SSE: message_created           │                            │
  ◀─────────────────────────────────────┤  res.end()                │
```

要点：**遇到 Client Tool 调用，本次 SSE 请求就此结束**；浏览器执行完后，用 `tool-result` 这条新请求**恢复**循环。中间可以多次挂起/恢复（多个 Client Tool 串联），也可以与 MCP Tool 混合。

## 4.2 为什么这套方案改动最小

现有 `runLlmTurn` 每一轮都做一件关键的事：**从 `t_message` 持久化历史重建 `llmMessages` 上下文**（见 `session.service.ts:366-385`）。这意味着 Loop 本身是**无状态、可重入**的——只要把 `observation` 作为一条消息存进库，下次进入循环时它自然出现在历史里。

所以「恢复」不需要在内存里保留任何挂起状态：把 observation 存库 → 重新跑一遍「读历史 → 调 LLM」即可。这与第 3 节调研的无状态范式完全一致。

# 5. 工具命名与区分

沿用现有 `mcp__${toolId}__${toolName}` 的格式，新增 client 前缀：

| 类型 | 名称格式 | 示例 | 执行位置 |
| --- | --- | --- | --- |
| MCP Tool | `mcp__${toolId}__${toolName}` | `mcp__5__getWeather` | 服务端 |
| Client Tool | `client__${toolId}__${toolName}` | `client__8__open_work_order_form` | 浏览器 |

服务端在 Loop 中按前缀**分流**：

```ts
function classifyTool(tool: string): 'mcp' | 'client' | 'invalid' {
  if (/^mcp__(\d+)__(.+)$/.test(tool)) return 'mcp';
  if (/^client__(\d+)__(.+)$/.test(tool)) return 'client';
  return 'invalid';
}
```

对 LLM 而言两类工具**完全一样**：都在 `available_tools` 里以 `{ name, description, parameters }` 出现，前缀只是给服务端看的「路由标记」。LLM 不需要知道工具跑在哪。

# 6. 数据模型

Client Tool 没有 `server_url`、没有 MCP 握手，但需要把 `name / description / parameters(JSON Schema)` 存库，以便 `buildSystemContent` 把它放进 `available_tools`。两种落地选择：

**方案 A（推荐）：复用 `t_tool`，加 `kind` 判别列**

```ts
// t_tool 增加：
@Column({ name: 'kind', type: 'varchar', length: 16, default: 'mcp' })
kind!: 'mcp' | 'client';

// server_url 改为可空（client 工具无 URL）
@Column({ name: 'server_url', type: 'varchar', length: 2048, nullable: true })
serverUrl!: string | null;
```

`mcp_schema` 字段对 client 工具同样适用（存 `name/description/parameters`，只是没有真正的 MCP 服务器）。复用现有的 `t_agent_tool` 关联表、`AgentService` 关联管理、`getAvailableTools` 展开逻辑——改动面最小。

**方案 B：新建 `t_client_tool` + `t_agent_client_tool`**

结构更清晰，但要复制一整套关联管理 / 解析代码。除非 Client Tool 的元数据将来会显著偏离 Tool，否则不建议。

> 建议采用**方案 A**。`getAvailableTools` 里只需根据 `kind` 决定前缀（`mcp__` 或 `client__`），其余不变。

**注意**：数据库只存工具的「声明」（schema），**真正的执行函数永远在浏览器**，以前端注册表（见 §8）形式存在。服务端无从、也不应执行 Client Tool。

# 7. 服务端改造

## 7.1 拆分可重入的 Loop

把现有 `runLlmTurn` 拆成两个入口 + 一个公共循环体：

- `startTurn(...)`：被 `POST /:id/messages` 调用。保存 user message（含现有的去重保护），然后进入 `runLoop`。
- `resumeTurn(...)`：被新端点 `POST /:id/tool-result` 调用。保存浏览器回传的 `observation`（作为 Thought message），然后进入 `runLoop`。
- `runLoop(session, agent, res)`：纯粹「读历史 → 调 LLM → 分流」的循环，**不关心**自己是被首发还是被恢复触发。

```ts
private async runLoop(session, agent, res): Promise<void> {
  let toolCallCount = await this.countToolCalls(session.id); // 跨请求累计
  while (true) {
    res.write(': processing\n\n');
    const llmMessages = await this.buildLlmMessages(session, agent);
    const llmOutput = await this.llmService.callLlm(agent, llmMessages);
    await this.saveThought(session, llmOutput, res); // thought_created

    const parsed = parseAssistantReply(llmOutput);
    if (parsed.type === 'final_answer' || parsed.type === 'error') {
      await this.saveAssistantReply(session, parsed.content, res); // message_created
      return; // 自然结束
    }

    // parsed.type === 'action'
    if (toolCallCount >= MAX_TOOL_CALLS) { /* error 事件 */ return; }

    const kind = classifyTool(parsed.actionData.tool);
    if (kind === 'mcp') {
      const obs = await this.executeTool(parsed.actionData); // 服务端内联，不变
      await this.saveObservation(session, obs, res);          // thought_created
      toolCallCount++;
      continue; // 同一请求内继续
    }

    if (kind === 'client') {
      // ★ 关键分叉：派发到浏览器，挂起本次请求
      await this.dispatchClientTool(session, parsed.actionData, res);
      return; // 结束本次 SSE；等 /tool-result 再恢复
    }

    // invalid：构造错误 observation，继续（与 MCP 非法名一致）
    await this.saveObservation(session, buildErrorObservationContent(
      `Invalid tool name: ${parsed.actionData.tool}`), res);
    toolCallCount++;
  }
}
```

## 7.2 派发 Client Tool

```ts
private async dispatchClientTool(session, actionData, res): Promise<void> {
  // 1) 校验：工具名前缀合法、toolId 属于本 Agent、kind === 'client'
  const parsed = parseClientToolName(actionData.tool);
  const valid = parsed && await this.isAgentClientTool(session.agentId, parsed.toolId);
  if (!valid) {
    // 非法/越权：当成错误 observation 在服务端续接，不派发给浏览器
    await this.saveObservation(session,
      buildErrorObservationContent(`Unknown client tool: ${actionData.tool}`), res);
    // 直接递归/继续 loop（此处可改为返回让 caller 决定）
    return;
  }

  // 2) action 已作为 Thought message 存库（runLoop 里 saveThought 已做）。
  //    用那条 Thought 的 id 作为 callId，保证恢复时可幂等匹配。
  const callId = this.lastThoughtId; // 即刚保存的 action thought id

  // 3) 推送 client_tool_call 事件，浏览器据此执行
  res.write(`event: client_tool_call\n`);
  res.write(`data: ${JSON.stringify({
    callId,
    tool: actionData.tool,        // client__8__open_work_order_form
    params: actionData.params,
  })}\n\n`);
  // 4) 不写 observation，不再调 LLM —— caller 直接 res.end()
}
```

## 7.3 新增恢复端点

```ts
// session.controller.ts
@Post(':id/tool-result')
async toolResult(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: ClientToolResultDto,   // { callId: number; result?: unknown; error?: string }
  @CurrentUser() user, @Res() res: Response,
) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  await this.sessionService.resumeTurn(id, dto, userName, createdBy, res);
}
```

`resumeTurn` 的职责：

1. **幂等校验**：`callId` 指向的 action Thought 必须存在，且其后**还没有**对应的 observation（防止浏览器重试导致重复恢复）。已恢复过则直接发一个空闲/错误事件并 `res.end()`。
2. 把 `result`（或 `error`）包装成 observation：成功用 `buildObservationContent(result)`，失败用 `buildErrorObservationContent(error)`，作为 Thought message 存库并推 `thought_created`。
3. 进入 `runLoop` 继续。

## 7.4 工具调用次数上限

`MAX_TOOL_CALLS`（20）现在是**单次请求内**的局部计数。改成 suspend/resume 后，一轮对话会跨多次请求，必须改成**跨请求累计**：以「本轮 user message 之后的 Thought/observation 数量」近似统计，或在 session 上加一个 `pendingTurnToolCalls` 计数列，在 `final_answer` 时清零。否则恶意/失控的 LLM 可借 client 工具反复挂起绕过上限。

# 8. 浏览器端改造

## 8.1 Client Tool 注册表

前端维护一张「工具名 → 异步处理函数」表。处理函数能力即「在 UI 上执行」：打开弹窗、填表、读取当前页面状态、路由跳转、调用已有的受认证 API 等。

```ts
// packages/web/src/app/chat/client-tools/registry.ts
export interface ClientToolContext {
  navigate: (path: string) => void;
  apiFetch: ReturnType<typeof useApiFetch>;
  // …按需注入 UI 控制能力（打开 dialog、toast 等）
}
export type ClientToolHandler =
  (params: unknown, ctx: ClientToolContext) => Promise<unknown>;

const handlers = new Map<string, ClientToolHandler>();
export function registerClientTool(name: string, h: ClientToolHandler) {
  handlers.set(name, h);
}
export function getClientToolHandler(fullName: string) {
  // fullName = client__8__open_work_order_form
  const m = /^client__\d+__(.+)$/.exec(fullName);
  return m ? handlers.get(m[1]) : undefined;
}
```

> 注册表里 `name` 用「裸工具名」（去掉 `client__${id}__` 前缀），与数据库里的 `mcp_schema.name` 对应。schema 在后端、handler 在前端，二者靠 name 对齐——上线前需要一致性校验（见 §10）。

## 8.2 在 SSE 流里处理 `client_tool_call`

`chat-page.tsx` 的 `onmessage` 增加分支：

```ts
onmessage(ev) {
  if (ev.event === 'thought_created' || ev.event === 'message_created') {
    /* 现有逻辑：合并消息 */
  } else if (ev.event === 'client_tool_call') {
    const call = JSON.parse(ev.data); // { callId, tool, params }
    // 本次 SSE 流到此结束（服务端已 res.end()）；
    // 异步执行工具，完成后再发起 /tool-result 恢复。
    void runClientToolThenResume(sid, call);
  } else if (ev.event === 'error') { /* 现有逻辑 */ }
}
```

## 8.3 执行并恢复

```ts
async function runClientToolThenResume(sid: number, call: {
  callId: number; tool: string; params: unknown;
}) {
  let body: { callId: number; result?: unknown; error?: string };
  const handler = getClientToolHandler(call.tool);
  if (!handler) {
    body = { callId: call.callId, error: `No handler for ${call.tool}` };
  } else {
    try {
      const result = await handler(call.params, ctx);
      body = { callId: call.callId, result };
    } catch (e) {
      body = { callId: call.callId, error: e instanceof Error ? e.message : String(e) };
    }
  }
  // 复用 streamMessage 的 SSE 消费逻辑，只是换成 tool-result 端点。
  await streamFromEndpoint(`/api/sessions/${sid}/tool-result`, body);
}
```

为复用，建议把 `chat-page.tsx` 里 `streamMessage` 内部的 `fetchEventSource(...)` 抽成一个通用 `consumeSse(url, body, handlers)`，让 `messages` 与 `tool-result` 两个端点共用同一套事件处理（含 `client_tool_call` 分支），从而**天然支持多个 Client Tool 串联**——恢复后的流里再次出现 `client_tool_call` 会再次触发本流程。

# 9. 安全与健壮性

- **浏览器不可信**：`tool-result` 的 `result` 是用户侧数据，服务端只能把它当 observation 喂给 LLM，**不得**当成已授权的特权结果。Client Tool 若要改服务端数据，必须走**现有的受认证 API**（带 `X-User-Name` / 角色校验），其权限天然被「当前用户能做什么」限制住。
- **工具白名单校验**：`dispatchClientTool` 派发前要确认 `toolId` 确实关联在本 session 的 Agent 上且 `kind==='client'`，避免 LLM 捏造工具名诱导前端执行未注册动作。
- **幂等**：用 action Thought 的 `id` 作 `callId`；`resumeTurn` 检查「该 callId 之后是否已有 observation」防重复恢复（对应现有 user message 10s 去重思路）。
- **挂起态可恢复**：因为状态全在 `t_message` 里，用户刷新页面后重新打开会话，可由前端检测「最后一条是 client action thought 且无后续 observation」，提示用户「上一步操作未完成」或自动重发 tool-result。
- **超时与放弃**：Client Tool 可能永远不回（用户关页面）。这属于「未完成的挂起」，不占服务端资源（请求已结束）。可在 UI 上对长时间未响应的工具调用提供「取消」，取消即发一条 `error` observation 让 LLM 收尾。
- **次数上限跨请求累计**（见 §7.4），防止借挂起绕过 `MAX_TOOL_CALLS`。

# 10. System Prompt 影响

`SYSTEM_PROMPT`（`system-prompt.ts`）当前用 `observation` 的范式描述工具调用，**对 Client Tool 完全适用**——无须告诉 LLM 工具跑在哪。但需补充：

- 明确「调用工具后必须停下等待 `observation`」对 client 工具同样成立（浏览器执行也会回 observation）；
- 可选：在工具 description 里说明该工具会「在用户界面上执行某操作」，帮助 LLM 在合适时机选择它。

# 11. 实施步骤（建议顺序）

1. **数据模型**：`t_tool` 加 `kind`、`server_url` 可空（方案 A）；Tool 管理 UI/接口支持创建 `kind='client'` 的工具并录入 schema。
2. **服务端 Loop 重构**：把 `runLlmTurn` 拆成 `startTurn` / `resumeTurn` / `runLoop`，先保证**纯 MCP 流程行为不变**（回归测试）。
3. **分流与派发**：加 `classifyTool`、`dispatchClientTool`、`client_tool_call` 事件。
4. **恢复端点**：`POST /:id/tool-result` + `resumeTurn` + 幂等校验 + 跨请求次数累计。
5. **前端**：抽 `consumeSse` 公共消费器；加 Client Tool 注册表与 `client_tool_call` 处理；实现 1～2 个示范工具（如 `open_work_order_form`）。
6. **一致性校验**：启动时（或 CI）校验「Agent 关联的每个 client 工具，前端都注册了对应 handler」，缺失则告警。
7. **测试**：MCP-only 回归、单个 client 工具、client+MCP 混合多轮、挂起后刷新恢复、重复 tool-result 幂等、超过次数上限。

# 12. 备选方案（未采纳）及理由

- **一条 SSE 长连接内做双向 RPC**（服务端发 call、阻塞等浏览器经 WebSocket/第二请求回灌后继续）：需要把挂起的循环状态留在服务端内存，水平扩展、进程重启、连接中断都难处理；与现有「每轮重建上下文」的无状态实现相悖。不采纳。
- **WebSocket 全面替换 SSE**：能双向，但要重写现有 SSE 管线、引入连接状态管理，收益不抵成本。SSE + resume 已足够。
- **完整引入 AG-UI / CopilotKit 框架**：协议设计可借鉴，但整套框架对当前 React + 自研 Loop 偏重，耦合大。借鉴其事件模型即可。

---

# 13. Client Tools 自动注册方案

## 13.1 问题背景

§6 推荐的「数据库存 schema」方案存在致命缺陷：

- **参数结构复杂**：工具的 `parameters` 是 JSON Schema（嵌套对象、数组、枚举、必填校验等），手动在 UI 里输入极易出错。
- **与代码脱节**：工具的**执行 handler 在浏览器代码里**（§8.1 注册表），schema 在数据库里，二者靠 `name` 对齐。一旦 handler 签名改了，忘记同步更新数据库 schema → 运行时参数不匹配 → 工具调用失败。
- **开发流程割裂**：开发者先写前端 handler，再切到管理后台手动录入 schema，重复且易错。

**理想流程**：开发者在前端代码里用**声明式 API** 注册 Client Tool（名称、描述、参数类型一处定义），应用启动时**自动**把这些工具暴露给 Agent，无需数据库手动录入。

## 13.2 自动注册的核心思路

**「Schema 与 Handler 在同一处声明」** —— 借鉴 NestJS 的 `@ApiProperty` / Swagger 自动生成 OpenAPI 文档的思路，以及 tRPC / Hono 的类型安全 RPC 模式：**从类型推导 schema，在运行时同时注册执行体与元数据**。

```ts
// packages/web/src/app/chat/client-tools/tools/open-work-order-form.ts
import { defineClientTool } from '../registry';
import { z } from 'zod'; // 假设引入 zod 作为 schema 库（或用其他方案，见下文）

export const openWorkOrderForm = defineClientTool({
  name: 'open_work_order_form',
  description: '打开工单填写表单，用户填写完成后返回工单 ID',
  parameters: z.object({
    prefillLocation: z.string().optional().describe('预填充的位置信息'),
    prefillDescription: z.string().optional().describe('预填充的问题描述'),
  }),
  async handler(params, ctx) {
    // params 自动推导为 { prefillLocation?: string; prefillDescription?: string }
    const result = await ctx.openDialog('WorkOrderForm', params);
    return { workOrderId: result.id };
  },
});
```

**关键机制**：

1. `defineClientTool` 把 `{ name, description, parameters(zod schema), handler }` 注册到**前端内存注册表**（§8.1）。
2. 启动时（或懒加载），前端通过一个**内部端点** `GET /client-tools/registry`（仅本地可达，或返回 JS module 形式）把所有已注册工具的 `{ name, description, parametersSchema }` 暴露给服务端。
3. Agent 构建 `available_tools` 时，从两处合并：
   - 数据库 `t_tool` (kind='client') — 管理员手动配置的、跨会话持久化的工具；
   - 前端注册表 — 开发者声明的、与代码一体的工具。

**优势**：

- ✅ **类型安全**：`handler` 的 `params` 自动推导，IDE 有补全，改签名时 TS 编译器会报错。
- ✅ **单一真相源**：schema 从 `parameters` zod 对象自动转 JSON Schema，与 handler 永不脱节。
- ✅ **零管理负担**：新工具直接写代码，不用开管理后台手动录入；删工具删代码即可。

## 13.3 技术选型：Schema 生成方案

项目现有 `class-validator` / `class-transformer`（用于 DTO 校验），**没有 zod**。三种落地路径：

### 方案 A（推荐）：引入轻量 Schema 库（zod / valibot）

```bash
npm install zod zod-to-json-schema  # 前端 package
```

优势：

- 零学习成本（zod 是 TypeScript 生态事实标准）；
- `zod-to-json-schema` 自动转成 JSON Schema 给 LLM；
- 类型推导完美（`z.infer<typeof schema>` 即 handler params 类型）。

示例（完整）：

```ts
// packages/web/src/app/chat/client-tools/registry.ts
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface ClientToolDefinition<TParams = unknown> {
  name: string;
  description: string;
  parameters: z.ZodType<TParams>;
  handler: (params: TParams, ctx: ClientToolContext) => Promise<unknown>;
}

const registry = new Map<string, ClientToolDefinition>();

export function defineClientTool<T extends z.ZodType>(
  def: ClientToolDefinition<z.infer<T>>
): ClientToolDefinition<z.infer<T>> {
  registry.set(def.name, def as ClientToolDefinition);
  return def;
}

export function getAllClientTools() {
  return Array.from(registry.values()).map((def) => ({
    name: def.name,
    description: def.description,
    parametersSchema: zodToJsonSchema(def.parameters, { $refStrategy: 'none' }),
  }));
}

export function getClientToolHandler(name: string) {
  return registry.get(name)?.handler;
}
```

### 方案 B：手动写 JSON Schema + JSDoc 类型注解

不引入新库，直接传 JSON Schema 对象：

```ts
defineClientTool({
  name: 'open_work_order_form',
  description: '...',
  parametersSchema: {
    type: 'object',
    properties: {
      prefillLocation: { type: 'string', description: '...' },
    },
  },
  async handler(params: { prefillLocation?: string }, ctx) { /* ... */ },
});
```

优势：零依赖。劣势：类型不自动推导（需手写两遍），易出错。**不推荐**，除非严格禁止新依赖。

### 方案 C：用 TypeScript Compiler API 运行时反射

启动时读 `.ts` 源码，用 `ts.createProgram` 解析类型签名生成 JSON Schema。极客但过重，维护成本高。**不推荐**。

> **结论**：采用**方案 A（zod）**，引入 `zod` + `zod-to-json-schema` 到 `packages/web`。如果团队有"最小化依赖"的硬约束，退而求其次用**方案 B（手写 JSON Schema）**，但要在 CI 里加 lint 规则检查 schema 与 handler 类型一致。

## 13.4 服务端：暴露注册表

新增只读端点，返回前端当前已注册的 Client Tools 列表：

```ts
// packages/api/src/app/client-tools/client-tools.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';

@Controller('client-tools')
export class ClientToolsController {
  // 注意：此端点返回的是**前端注册表的镜像**，不直接可用——需前端先通过某种方式
  // 把注册信息传给后端。最简单的方式：前端在启动时 POST /client-tools/sync，把
  // getAllClientTools() 的结果发给后端缓存；或者让后端直接读前端构建产物的
  // manifest.json（如果 build 时导出）。下文用 POST /sync 方案。

  @Get('registry')
  @Public()
  async getRegistry() {
    return this.clientToolsService.getRegistry();
  }
}

// client-tools.service.ts
@Injectable()
export class ClientToolsService {
  private registry: Array<{
    name: string;
    description: string;
    parametersSchema: unknown;
  }> = [];

  syncRegistry(tools: Array<{ name: string; description: string; parametersSchema: unknown }>) {
    this.registry = tools;
  }

  getRegistry() {
    return this.registry;
  }
}
```

前端在应用启动时（`App.tsx` 的 `useEffect`）调用：

```ts
useEffect(() => {
  const tools = getAllClientTools();
  apiFetch('/client-tools/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tools }),
  }).catch(console.error);
}, []);
```

这样后端就拿到了前端的工具清单。Agent 构建 `available_tools` 时，从 `clientToolsService.getRegistry()` 读取动态注册的工具，合并到 `t_tool` (kind='client') 的结果里。

**生成 `client__${id}__${name}` 前缀的策略**：动态注册的工具没有数据库 `id`，用 **`client__0__${name}`**（id=0 标记为「自动注册」），或用 `client__auto__${name}` 显式区分。解析时特殊处理 `id=0` 或 `auto`：不查数据库，直接从注册表取 handler。

## 13.5 All Tools 页面：合并显示

`all-tools.tsx` 当前只显示数据库的 `t_tool`。改造后，同时拉取：

1. `GET /tools?page=1` — 数据库工具（含 kind='mcp' 和 kind='client'）；
2. `GET /client-tools/registry` — 前端自动注册的工具。

在表格里区分展示：

| ID | Name | Source | Kind | Tools | Status / Actions |
| --- | --- | --- | --- | --- | --- |
| #5 | weather-mcp | Database | MCP | 3 | 🟢 Online |
| #8 | manual-client | Database | Client | 1 | Edit / Delete |
| **auto** | **open_work_order_form** | **Registry** | **Client** | **1** | **View only** |

**新增列 "Source"**：`Database` / `Registry`。来自 Registry 的工具：

- 不可编辑、不可删除（前端 disabled 按钮）；
- 点击跳转到一个只读详情页，显示 `parametersSchema` JSON（从 `/client-tools/registry` 取）；
- 不参与批量删除（checkbox disabled）。

状态列：Registry 工具永远显示 "✅ Registered"（因为前端代码在运行），不做 MCP 的 online 检测。

实现改动：

```tsx
// all-tools.tsx
const [dbTools, setDbTools] = useState<Tool[]>([]);
const [registryTools, setRegistryTools] = useState<ClientToolMeta[]>([]);

useEffect(() => {
  Promise.all([
    apiFetch('/tools?page=1').then(r => r.json()),
    apiFetch('/client-tools/registry').then(r => r.json()),
  ]).then(([db, reg]) => {
    setDbTools(db.data || []);
    setRegistryTools(reg || []);
  });
}, [page, apiFetch]);

const allRows = [
  ...dbTools.map(t => ({ ...t, source: 'database' as const })),
  ...registryTools.map(t => ({ ...t, source: 'registry' as const, id: `auto-${t.name}` })),
];

// 渲染时根据 source 决定操作按钮 enabled/disabled
```

## 13.6 完整流程示例

**开发者新增一个 Client Tool："读取当前页面选中的用户 ID"**

1. 前端写工具定义：

```ts
// packages/web/src/app/chat/client-tools/tools/get-selected-user.ts
import { defineClientTool } from '../registry';
import { z } from 'zod';

export const getSelectedUser = defineClientTool({
  name: 'get_selected_user',
  description: '获取当前用户列表页面中选中的用户 ID（仅在 /settings/users 页面可用）',
  parameters: z.object({}), // 无参数
  async handler(params, ctx) {
    const path = window.location.pathname;
    if (!path.startsWith('/settings/users')) {
      throw new Error('This tool only works on /settings/users page');
    }
    // 从某个全局 store / context 读取选中状态
    const selected = ctx.getSelectedUserIds();
    return { userIds: selected };
  },
});
```

2. 在 `registry.ts` 里导入（或用自动扫描 `tools/*.ts` 的动态 import）：

```ts
import './tools/get-selected-user';
```

3. 刷新浏览器 → 前端 `useEffect` 自动 POST /client-tools/sync → 后端缓存。

4. 管理员进入 All Tools 页面 → 看到新增的 `get_selected_user`（Source=Registry）。

5. 管理员在 Agent 设置里关联此工具（可以像现有 Tool 一样用 linkTool API，只是传 `toolId = 'auto-get_selected_user'` 或从 Registry 列表选）。

6. 对话时，LLM 看到 `available_tools` 里有 `client__0__get_selected_user`；输出 `{"action": {"tool": "client__0__get_selected_user", "params": {}}}`；服务端识别 `id=0` → 派发 `client_tool_call`；浏览器注册表执行 handler → 回传 `{userIds: [3, 7]}`。

**删除工具**：直接删代码文件、移除 import → 刷新 → Registry 里消失 → All Tools 页不再显示。

## 13.7 数据库 Tool 与 Registry 的职责划分

| 场景 | 存储位置 | 举例 |
| --- | --- | --- |
| **开发者定义的 UI 操作工具**（代码驱动、频繁迭代） | Registry（前端代码） | `open_work_order_form`、`get_selected_user`、`navigate_to_page` |
| **管理员配置的外部 MCP 工具**（运维驱动、需跨环境复用） | Database (kind='mcp') | 天气 API、企业内部服务 |
| **管理员手动配置的特殊 Client Tool**（如需不同环境不同参数） | Database (kind='client') | 某些需要环境变量配置、不便写死在代码里的前端工具 |

二者可共存：同一个 Agent 可同时关联来自 Database 的 Tool 和来自 Registry 的 Tool。`buildSystemContent` 时把两处合并即可。

## 13.8 实施优先级建议

**最小化 MVP（Phase 1）**：先落地 §4～§8 的 suspend/resume 流程，Client Tool **全部手动在数据库录入 schema**（忍受复杂录入的痛苦），验证端到端可行性。

**自动注册（Phase 2）**：流程跑通后，再引入本节的 `defineClientTool` + Registry + sync 机制，把常用的 UI 工具迁移到代码声明，逐步替换数据库手动录入。

这样风险可控：Phase 1 证明架构正确，Phase 2 只是改数据来源，不动核心 Loop。

