## MODIFIED Requirements

### Requirement: Echo assistant response (mock)
系统 MUST 在用户发送消息后调用真实 LLM 生成回复。Thought message 保存 LLM 输出原文；Assistant reply 的内容通过解析 LLM 输出的 JSON 提取得到。LLM 被要求以结构化 JSON 回复（`{"thought": "...", "final_answer": "..."}` 或 `{"thought": "...", "action": {...}}`），系统据此确定 reply 内容。LLM 调用所用的 system 角色内容 MUST 由四段拼装而成（按以下顺序、以空行分隔）：(1) `packages/api/src/app/agent/system-prompt.ts` 导出的 `SYSTEM_PROMPT`；(2) 该会话 Agent 的 `systemPrompt`（为空时跳过）；(3) `{"available_tools": [...]}` 的 JSON 字符串，列出该 Agent 通过 `t_agent_tool` 关联的所有 Tool 的 `mcp_schema` 中的工具（每项含 `name`、`description`、`parameters`），无关联工具时仍输出 `{"available_tools": []}`；(4) `{"available_skills": [...]}` 的 JSON 字符串，列出该 Agent 通过 `t_agent_skill` 关联的所有 Skill（每项含 `name`、`description`），无关联技能时仍输出 `{"available_skills": []}`。

#### Scenario: 解析 final_answer 作为回复
- **WHEN** LLM 输出可成功解析为 JSON 且第一层含 `final_answer` 属性
- **THEN** Thought 保存 LLM 原文；Assistant reply 的 content 为 `final_answer` 的值（非字符串时序列化为字符串）

#### Scenario: 无 final_answer 时回退到 action
- **WHEN** LLM 输出可成功解析为 JSON，第一层不含 `final_answer` 但含 `action` 属性
- **THEN** Thought 保存 LLM 原文；Assistant reply 的 content 为 `action` 的值（字符串直接使用，对象序列化为字符串）

#### Scenario: JSON 解析失败时返回错误信息
- **WHEN** LLM 输出无法解析为合法 JSON
- **THEN** Thought 保存 LLM 原文；Assistant reply 的 content 为解析错误信息

#### Scenario: 既无 final_answer 也无 action
- **WHEN** LLM 输出可解析为 JSON，但第一层既不含 `final_answer` 也不含 `action`
- **THEN** Thought 保存 LLM 原文；Assistant reply 的 content 为提示缺少 `final_answer`/`action` 的错误信息

#### Scenario: 两个流程行为一致
- **WHEN** 用户在新会话发送第一条消息（`createSessionWithFirstMessage`）或在已有会话发送后续消息（`createMessage`）
- **THEN** 两个流程使用同一套解析逻辑确定 Assistant reply 内容，行为一致

#### Scenario: System 内容拼装四段
- **WHEN** 系统调用 LLM 时构建 `llmMessages`
- **THEN** 第一条消息的 `role` 为 `system`，其 `content` 依次包含 `SYSTEM_PROMPT` 文本、`agent.systemPrompt`（若非空）、`{"available_tools":[...]}` JSON 字符串、`{"available_skills":[...]}` JSON 字符串，四段之间以空行分隔

#### Scenario: available_tools 反映 Agent 关联的 Tools
- **WHEN** 当前会话的 Agent 通过 `t_agent_tool` 关联了 N 个 Tool
- **THEN** `available_tools` 数组的元素由这 N 个 Tool 的 `mcp_schema` 展平得到，每项至少包含 `name`、`description`、`parameters`，且 `name` 格式为 `mcp__<toolId>__<actualToolName>`（`toolId` 是 `t_tool.id`）

#### Scenario: available_skills 反映 Agent 关联的 Skills
- **WHEN** 当前会话的 Agent 通过 `t_agent_skill` 关联了 M 个 Skill
- **THEN** `available_skills` 数组列出这 M 个 Skill，每项含 `name` 与 `description`（`description` 缺失时为空字符串）

#### Scenario: 无关联时仍输出空数组
- **WHEN** 当前会话的 Agent 没有关联任何 Tool 或 Skill
- **THEN** system 内容仍包含 `{"available_tools": []}` 或 `{"available_skills": []}`，不省略对应段落
