Final Answer
===

系统使用提示词控制 LLM 的输出消息格式，每个回复时一个 JSON 对象，没有其它文本和 Markdown 代码块。

LLM 输出 JSON 对象格式有两种：

1. 调用工具时

```json
{"thought": "...", "action": {"tool": "工具名", "params": {...}}}
```

2. 给出最终答案时

```json
{"thought": "...", "final_answer": "..."}
```

本次变更实现第 2 种格式的处理。

处理要求如下：
- LLM 输出消息原文作为 Thought message 输出（现在就是这样做的，不用改变）
- 解析 LLM 输出的 JSON 字符串，反序列化成 Object。LLM 输出消息格式不可能做到完全准确，如果解析错误，就把错误信息作为 Assistant reply 输出
- 如果 JSON 对象第一层含有 `final_answer` 属性，就把 `final_answer` 的值作为 Assistant reply 输出
- 如果 JSON 对象第一层不含有 `final_answer` 属性，检查是否含有 `action` 属性
- 如果 JSON 对象第一层含有 `action` 属性，就把 `action` 的值作为 Assistant reply 输出（这是临时的做法，以后再修改。这次变更主要关注 `final_answer`）

注意：
- `session.service.ts` 文件里有两个函数都有 LLM 消息的处理流程，分别是 `createSessionWithFirstMessage`, `createMessage`。两个函数都要修改，不要遗漏。
- JSON 消息的处理判断具有通用性，并且要做多个函数里复用，要注意优化程序结构
