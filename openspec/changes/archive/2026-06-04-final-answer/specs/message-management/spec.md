## MODIFIED Requirements

### Requirement: Echo assistant response (mock)
系统 MUST 在用户发送消息后调用真实 LLM 生成回复。Thought message 保存 LLM 输出原文；Assistant reply 的内容通过解析 LLM 输出的 JSON 提取得到。LLM 被要求以结构化 JSON 回复（`{"thought": "...", "final_answer": "..."}` 或 `{"thought": "...", "action": {...}}`），系统据此确定 reply 内容。

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

### Requirement: Message persistence
系统 MUST 持久化所有消息记录到数据库，包括 is_thought 标识。

#### Scenario: 消息保存
- **WHEN** 用户或 assistant 发送消息
- **THEN** 系统将消息内容、会话 ID、发送者、时间戳、is_thought 字段保存到 t_message 表

#### Scenario: Assistant reply 内容为字符串
- **WHEN** 系统保存 Assistant reply
- **THEN** reply 的 content 始终为字符串类型（解析得到的非字符串值已序列化），可安全写入 t_message 表
