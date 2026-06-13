## Why

现有 MCP Tools 全部在服务端执行，无法调用浏览器环境的能力（DOM 操作、本地存储、用户交互弹窗等）。许多实用的 Agent 工具场景需要在客户端完成。扩展 Agent Loop 支持 Client Tools：LLM 调用工具时，服务端识别 `client__` 前缀，挂起会话并派发工具调用到浏览器；浏览器执行后回传结果，服务端恢复会话继续 LLM Loop。这样 Agent 可同时使用服务端工具和客户端工具，能力范围大幅扩展。

## What Changes

- **工具名称规范**：Client Tools 使用 `client__<toolId>__<toolName>` 前缀（与 MCP 的 `mcp__<toolId>__<toolName>` 平行），toolId 指向 t_tool 表的 id；服务端通过前缀识别工具类型。
- **服务端（API）扩展**：
  - `t_tool` 表增加 `kind` 字段（'mcp' | 'client'），区分工具类型；Agent 关联 Tool 时不限 kind，两种工具可共存。
  - `session.service.ts` 的 `runLlmTurn` 增加工具分发逻辑：解析到 `client__` 前缀的 action 时，**挂起 Loop**，写入 `t_pending_client_call` 表，返回 SSE 消息 `{ event: 'client_call', data: { callId, toolName, params } }`，结束本轮响应。
  - 新增 `POST /sessions/:id/client-result` 端点：浏览器回传 `{ callId, result/error }`，服务端从 `t_pending_client_call` 取出上下文，**恢复 Loop**，把结果作为 observation 继续 LLM 对话，直到 final_answer 或再次挂起。
  - 工具 schema 初期**手动录入数据库**（t_tool 表，kind='client'），不做自动注册。
- **浏览器端（Web）改造**：
  - `useChatSse` Hook 监听 `client_call` 事件，派发到 `ClientToolExecutor`（集中管理所有 Client Tool 实现）。
  - Executor 根据 `toolName` 调用对应实现函数，捕获结果或错误，POST 到 `/client-result` 端点，完成异步回传。
  - UI 显示挂起状态（loading indicator "Waiting for client tool..."）。
- **演示用测试工具**：实现 `client__1__console-log-echo`（假设 toolId=1），浏览器执行 `console.log('echo test')` 并异步返回演示对象 `{ echo: params.message, timestamp: Date.now() }`，验证端到端流程。

## Capabilities

### New Capabilities

- `client-tool-execution`: Client Tool 在浏览器端执行的完整流程，包括服务端挂起/恢复机制、浏览器端工具派发与结果回传、t_pending_client_call 表设计、工具名称解析规则（client__ 前缀 + toolId + toolName）。
- `client-tool-registration`: Client Tool 的注册与管理（Phase 1 手动录入），包括 t_tool 表 kind 字段、schema 存储格式（mcp_schema 字段复用）、Agent 关联 Client Tool 的逻辑（通过 t_agent_tool，与 MCP Tool 一致）。

### Modified Capabilities

- `message-management`: 扩展 `buildSystemContent` 逻辑，在 available_tools 段中同时列出 MCP Tools 和 Client Tools（按 kind 过滤并拼接 `mcp__` / `client__` 前缀）；扩展 `runLlmTurn` 增加工具类型判断和挂起逻辑；新增 `resumeLlmTurn` 方法处理恢复场景。
- `agent-tool-registration`: t_tool 表增加 `kind` 枚举字段（'mcp' | 'client'，默认 'mcp'）；Tool 注册/编辑时需指定 kind；`/tools/test` 端点只对 kind='mcp' 有效（Client Tool 无需服务端连通性测试）；Agent 关联 Tool 时不限 kind。

## Impact

- **数据库**：t_tool 表增加 `kind VARCHAR(16) NOT NULL DEFAULT 'mcp'` 字段；新增 t_pending_client_call 表（callId PK, sessionId, agentId, toolId, toolName, params JSON, createdOn, status）。
- **API**：session.service 的 LLM Loop 从同步改为可挂起/恢复的状态机；新增 `/sessions/:id/client-result` 端点；Tool 相关接口需处理 kind 字段。
- **Web**：Chat 页面增加 client_call SSE 事件处理；新增 ClientToolExecutor 模块和测试工具实现；UI 显示挂起状态。
- **依赖**：无新外部依赖；复用现有 SSE 机制和 Tool 管理基础设施。
- **向后兼容**：t_tool.kind 默认 'mcp'，现有 MCP Tools 行为不变；Agent 可同时使用两种工具，不影响现有会话。
