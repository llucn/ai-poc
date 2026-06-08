## Context

LLM 通过 Agent 的 system prompt 被要求以结构化 JSON 回复，两种格式：

```json
{"thought": "...", "action": {"tool": "工具名", "params": {...}}}
{"thought": "...", "final_answer": "..."}
```

当前 `session.service.ts` 的两个流程（`createSessionWithFirstMessage`、`createMessage`）都直接把 `llmOutput` 原文同时写入 Thought 和 Assistant reply。本次只处理 `final_answer` 格式的提取，`action` 暂以原始值兜底。

约束：
- Thought 必须保留 LLM 原文（便于调试与未来 ReAct 解析），不改变现有写法
- 解析逻辑必须在两个函数复用，不能各写一份
- LLM 输出格式无法保证 100% 合法 JSON，解析失败需优雅降级

## Goals / Non-Goals

**Goals:**
- 抽取一个纯函数，输入 LLM 原始输出字符串，输出「用于 Assistant reply 的内容」
- 在两个流程中以最小改动接入该函数（仅改变 reply 的 content 来源，Thought 不变）
- 解析失败、缺字段等边界情况有确定行为

**Non-Goals:**
- 不实现真正的工具调用（`action` 仅做字符串兜底展示）
- 不改前端、不改 SSE 协议、不改数据库 schema
- 不引入 JSON schema 校验库

## Decisions

**决策 1：抽取纯函数 `parseAssistantReply(llmOutput: string): string`**

放在 `session.service.ts` 模块内（或同目录的小工具文件），作为模块级纯函数而非依赖注入服务——逻辑无状态、无外部依赖，纯函数最简单且易测试。

返回值优先级：
1. `JSON.parse` 抛错 → 返回错误信息字符串（如 `Failed to parse LLM output: <error message>`），并附原始输出便于排查
2. 解析成功且对象第一层含 `final_answer` → 返回 `String(parsed.final_answer)`
3. 否则若含 `action` → 返回 `action` 的值序列化字符串（`typeof action === 'string' ? action : JSON.stringify(action)`）
4. 两者都不含 → 返回错误/兜底信息（按解析失败处理，提示缺少 `final_answer`/`action`）

> 备选：用 try/catch 内联在每个函数里。否决——违背「复用、优化结构」要求。

**决策 2：Thought 与 reply 内容解耦**

两个流程当前都用同一个 `llmOutput` 变量赋给 Thought.content 和 reply.content。改为：
- Thought.content = `llmOutput`（不变）
- reply.content = `parseAssistantReply(llmOutput)`

**决策 3：`final_answer` 为非字符串时的处理**

system prompt 约定 `final_answer` 为字符串，但 LLM 可能返回对象/数组。统一用 `typeof === 'string' ? value : JSON.stringify(value)` 转换，保证 reply.content 始终是字符串，避免存库类型问题。

## Risks / Trade-offs

- [LLM 偶发输出 Markdown 代码块包裹 JSON（```json ... ```）] → 本次按解析失败处理，reply 显示错误信息；如频繁出现可在后续变更增加去除代码块包裹的预处理，本次不做以保持范围聚焦
- [`action` 兜底展示的是原始 JSON，对用户不友好] → 已在 proposal 中声明为临时做法，本次只聚焦 `final_answer`
- [纯函数与 service 同文件可能后续膨胀] → 逻辑小且内聚，必要时再拆独立文件，当前不过度设计
