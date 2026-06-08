Action Tool
===

> **状态：已完成** — 通过 OpenSpec change `action-tool` 实现，详见 `openspec/changes/action-tool/`。

`session.service.ts` 文件里的 `parseAssistantReply` 函数对 LLM 输出进行解析，得到 `final_answer` 属性，把 `final_answer` 的值作为 assistant reply 返回。这个工作已经完成了。

现在需要继续处理 `action` 属性。

# 消息格式

action 消息格式如下：

```json
{"thought": "...", "action": {"tool": "工具名", "params": {...}}}
```

其中 `tool` 属性标识调用的工具名称，`params` 属性标识调用参数。格式说明：

- 工具名称
    - 格式: `mcp__${id}__${toolName}`，例如: 'mcp__1__getWeatherForecastByLocation'
    - `mcp` 是固定格式，表示这是一个 MCP Tool
    - `${id}` 对应 `t_agent_tool` 表的 `id` 字段
    - `${toolName}` 对应 `t_agent_tool` 表的 `mcp_schema` 里的 `name` 属性
    - `toolName` 本身可能含有下划线 `_`，解析时要注意
- 调用参数
    - JSON Object

# 调用过程

1. 解析 LLM 输出消息，如果第一层含有 `action`, 得到其中的 `tool` 和 `params` 属性
2. 不要把 action 消息作为 Assistant reply 输出，这是临时做法，这次要改 
3. 从 `tool` 属性中得到 `id` 和 `toolName`，查询 `t_agent_tool` 表获得 MCP 地址：`server_url`
4. 执行 MCP Tool，得到执行结果，构造 `observation` 消息，格式: `{"observation": ${JSON.stringify(result)}}`
5. 如果 MCP Tool 执行失败，得到异常信息，也构造 `observation` 消息，格式: `{"observation": ${JSON.stringify(error)}}`
6. 将 `observation` 消息记录为 Thought Message，在 Chat 界面上显示
7. 将 `observation` 消息发送给 LLM，等待 LLM 输出，进入下一轮消息循环，直到出现 `final_answer` 循环结束

# 技术方案

- `observation` 消息有可能连续循环调用，需要使用递归或者循环程序结构。优先使用循环方式
- 要控制工具调用次数，如果一轮对话工具调用 20 次以上，终止对话，向用户输出错误信息
- 有其他建议请提出
