## Why

当前系统把 LLM 的原始输出同时作为 Thought 和 Assistant reply 保存，内容完全相同。但 Agent 的 system prompt 要求 LLM 以结构化 JSON（`{"thought": "...", "final_answer": "..."}` 或带 `action` 的工具调用）回复。直接把 JSON 原文展示给用户既不友好，也无法支撑后续的工具调用流程。本次变更引入对 LLM 输出 JSON 的解析，将真正面向用户的内容（`final_answer`）提取出来作为回复。

## What Changes

- 解析 LLM 输出的 JSON 字符串，从中提取 Assistant reply 的内容
- Thought message 仍保存 LLM 输出原文（保持现状，不改变）
- Assistant reply 的内容按以下规则确定：
  - JSON 解析失败 → 以错误信息作为 reply
  - JSON 含 `final_answer` 属性 → 以 `final_answer` 的值作为 reply
  - JSON 不含 `final_answer` 但含 `action` 属性 → 以 `action` 的值作为 reply（临时做法，本次不深入处理工具调用）
- 在 `session.service.ts` 的两个处理流程 `createSessionWithFirstMessage` 与 `createMessage` 中复用同一套解析逻辑
- 抽取通用的 LLM 输出解析函数，避免在两个函数中重复实现

## Capabilities

### New Capabilities
<!-- 无新增 capability -->

### Modified Capabilities
- `message-management`: Assistant reply 的内容不再是 LLM 输出原文，而是解析 JSON 后提取的 `final_answer`（或 `action`，或解析错误信息）；Thought 仍为原文

## Impact

- 代码：`packages/api/src/app/session/session.service.ts`（两个函数 + 新增解析工具函数）
- 行为：Assistant reply 内容从「等于 Thought 原文」变为「解析后的 final_answer」
- 无 API 接口签名变更，无数据库 schema 变更，无新增依赖
