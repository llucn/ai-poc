## Why

当前系统的 LLM 回复只处理 `final_answer`（直接回答用户），当 LLM 输出 `action`（工具调用请求）时，仅将 action 的 JSON 原文作为 assistant reply 展示——这是一个临时做法。需要实现完整的 MCP Tool 调用闭环，使 AI 助手能够真正执行外部工具并将结果反馈给 LLM，形成 ReAct 风格的多轮推理-行动循环。

## What Changes

- 改造 `parseAssistantReply` 和 `runLlmTurn`，当 LLM 输出包含 `action` 时不再作为 assistant reply 返回，而是进入工具调用循环
- 新增 MCP Tool 执行能力：解析 `action.tool` 中的工具名，查询 `t_agent_tool` 获取 MCP 服务地址，通过 JSON-RPC 调用 `tools/call`
- 将工具执行结果构造为 `observation` 消息，记录为 Thought Message，通过 SSE 推送给前端
- 将 `observation` 追加到 LLM 上下文，再次调用 LLM，循环直到得到 `final_answer`
- 控制工具调用上限（20 次），超限时终止循环并输出 SSE error 事件
- 抽取现有 `agent.service.ts` 中的 MCP JSON-RPC 客户端为独立可复用的服务

## Capabilities

### New Capabilities
- `action-tool`: MCP Tool 调用循环——解析 LLM action 输出、执行 MCP 工具、构造 observation、多轮循环直到 final_answer

### Modified Capabilities
_(无 spec 级别的需求变更，现有 specs 不受影响)_

## Impact

**API Package (`packages/api/src/app/`):**
- `session/session.service.ts` — `parseAssistantReply` 拆分为判断逻辑 + 工具调用循环；`runLlmTurn` 从单次 LLM 调用改为循环
- `agent/agent.service.ts` — 抽取 `mcpRpc` / `parseSseJsonRpc` 为独立 MCP 客户端服务
- 新增 MCP 客户端服务（`mcp/mcp-client.service.ts`），提供 `callTool(serverUrl, toolName, params)` 方法
- `agent/agent-tool.entity.ts` — 已有，仅读取使用

**Web Package:**
- 前端无结构性改动。observation 消息以 `isThought=1` 存储，复用现有 ThoughtMessage 组件通过 SSE `thought_created` 事件渲染

**SSE 事件流变化:**
- 工具调用循环期间，每轮会推送额外的 `thought_created` 事件（包含 action 的 thought 和 observation 的 thought）
- 最终的 `message_created` 事件不变
