Hide Thought
===

在 Chat 界面显示 Thought 过程。

# 功能

Thought 过程出现在对话时间线上，默认折叠收起，只能看见一个 灯泡图标 + "Thought"。点击图标和 "Thought" 文字，打开全部文本。再点击图标和 "Thought" 文字，折叠全部文本。

# 样式

- Thought 不显示说话人图标（Robot 图标），因为 Thought 肯定不是人类发出的，不需要显示。
- Thought 是一个无边框的文本，不需要气泡框

# 设计

- 目前没有实际连接 LLM，伪造 Thought 输出。参考现在的回复方式：用户输入消息，模仿一个 Thought 消息，把用户的输入当作 Thought 直接输出
- `t_message` 表增加 `is_thought` 字段，int 类型，标识 Thought 消息。`user_name` 是 'ASSISTANT'。
