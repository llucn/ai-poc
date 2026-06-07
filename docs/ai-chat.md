AI Chat
===

实际调用 LLM 实现对话

# 功能

用户在 Chat 界面发出第一个 Message，创建 Session 对象。创建 Session 对象时，得到默认的 Agent，使用 Agent 的信息发起 LLM 连接。

使用 ReAct Loop 的消息流程。LLM 返回的文本先作为 Thought 输出到 Chat 界面。Agent 端提取 Thought 内容里面的 `action` 操作，最后提取到 `final_answer` 输出到 Chat 对话。现在模拟提取 `final_answer` 的过程，把 LLM 输出原样作为 `final_answer` 输出到 ASSISTENT Message。

# 技术方案

- UI 界面与 API 对话接口使用 SSE 通信，提高界面响应实时性
- LLM 现在配置的是 Qwen 平台，使用 openai 兼容接口。不要使用 Stream Message，简化调用过程
- 从 Agent 设置上取得 System Prompt，附加上所有的会话历史，发送到 LLM （这个方案合理性你判断一下）
- 关于 Tools 和 Skills，这次不处理

# 数据库

`t_session` 表添加 `agent_id` 字段，记录对话使用的 Agent。
