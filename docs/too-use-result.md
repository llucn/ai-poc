Tool Use 与 Anthropic API 集成
===

重新整理 `t_pending_client_call` 和 `t_message` 两个表的处理过程，希望这次能终结混乱的程序：

# `t_pending_client_call` 表

## 表结构

结构不变

## 数据内容

`message_context` 字段不要记录完整的消息上下文，只记录 Tool Result 消息的 `content` 对象，数据结构：

```json
{
    "type": "tool_result", 
    "tool_use_id": "toolu_011WHzFDmWpDamsDPJkvB8vZ", 
    "content": "72F, Sunny"
}
```

---

# `t_message` 表

## 表结构

`turn_id` 字段去掉，这个字段可以不用

## 处理流程

1. 用户输入消息

创建 `t_message` 记录，内容如下：

```json
{
    "session_id": 666,
    "user_name": "${login_user}",
    "message_type": 1,
    "is_thought": 0,
    "content": "User input message",
    "native_content": [{
        "type": "text", 
        "text": "User input message"
    }],
    "message_role": "user"
}
```

向 LLM 发出消息，创建 SSE 通信，向浏览器发送消息。

2. 收到 LLM 返回消息

2.1 判断消息类型，如果 `stop_reason`==`end_turn`，创建 `t_message` 记录，属性如下：

```json
{
    "session_id": 666,
    "user_name": "ASSISTANT",
    "message_type": 1,
    "is_thought": 0,
    "content": "LLM reply message",
    "native_content": [{
        "type": "text", 
        "text": "LLM reply message"
    }],
    "message_role": "assistant"
}
```

向浏览器端发送 SSE 消息，SSE 通信结束。

2.2 判断消息类型，如果 `stop_reason`==`tool_use`，创建 `t_message` 记录，属性如下：

```json
{
    "session_id": 666,
    "user_name": "ASSISTANT",
    "message_type": 1,
    "is_thought": 1,
    "content": "Let me check the weather for you.",
    "native_content": [{
        "type": "text", 
        "text": "Let me check the weather for you."
    }, {
        "type": "tool_use", 
        "id": "toolu_01A09q90qw90lq917835lq9", 
        "name": "get_weather", 
        "input": {
            "location": "New York, US"
        }
    }],
    "message_role": "assistant"
}
```

向浏览器端发送 SSE 消息，保持 SSE 通信。

3. 记录 Pending Call

对于 `native_content` 字段内的每一个 `tool_use` 消息，在 `t_pending_client_call` 表创建一条记录：

```json
{
    "call_id": "64dbda57-5c9b-43e5-a119-3533455f1a05",
    "session_id": 666,
    "agent_id": 5,
    "tool_id": 1,
    "tool_name": "get_weather",
    "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
    "params": {"location": "New York, US"},
    "message_context": null,
    "status": "pending"
}
```

执行这个 Tool。如果是 MCP Tool，在服务端执行这个 Tool，获取结果。如果是 Client Tool，把工具送到客户端执行，关闭 SSE 连接。

4. 获得 Tool Result

执行 Tool 之后，得到执行结果，更新 `t_pending_client_call` 记录的 `message_context` 和 `status` 字段：

```json
{
    "message_context": {
        "type": "tool_result",
        "tool_use_id": "toolu_01A09q90qw90lq917835lq9",
        "content": "72°F, Sunny"
    },
    "status": "completed"
}
```

如果执行失败，记录失败信息：

```json
{
    "message_context": {
        "error": "..."
    },
    "status": "failed"
}
```

更新完成之后，查询同一 `call_id` 的所有记录，查看是否有 `pending` 状态的记录。如果有，继续执行下一个 Tool。如果全部执行完，合并所有的 `message_context`，在 `t_message` 创建一条新纪录：

```json
{
    "session_id": 666,
    "user_name": "USER",
    "message_type": 1,
    "is_thought": 1,
    "content": "Tool Result",
    "native_content": [{
        "type": "tool_result", 
        "id": "toolu_01A09q90qw90lq917835lq9", 
        "content": "72°F, Sunny"
    }],
    "message_role": "user"
}
```

向浏览器发送 SSE 消息，保持 SSE 通信。

等待下一次消息循环，直到 LLM 返回 `end_turn` 消息。

---

# LLM Context

对于每一轮会话，从 `t_message` 表查询 Session 的历史消息，根据 `message_role` 和 `native_content` 两个字段构建上下文列表.

---

# Chat Page

对于 `is_thought`==1 的对话，扩充对话显示的内容：不显示 "Thought"，显示 `content` 字段。点击 `content` 展开 `native_content`。

对于 `is_thought`==0 的对话，在气泡中显示 `content` 字段。在气泡右上角显示 "折叠/展开" 图标，点击图标展开 `native_content`。
