## Why

LLM 系统通常会输出"思考过程"（Thought）来展示推理步骤。Thought 内容通常较长，如果完全展开会干扰用户阅读最终回复。需要在对话界面以折叠形式展示 Thought，让用户可以选择性查看推理过程。当前虽然没有连接真实 LLM，但需要预先实现 Thought 的数据模型和 UI 组件，为后续集成铺路。

## What Changes

- `t_message` 表新增 `is_thought` 字段（int 类型），标识消息是否为 Thought
- 后端 echo 模式增强：用户发送消息后，先生成一条 Thought 消息（内容为用户输入），再生成普通的 assistant 回复
- 前端对话界面新增折叠组件展示 Thought：默认折叠，显示灯泡图标 + "Thought" 文字；点击展开/收起
- Thought 消息样式：无说话人头像、无气泡框、无边框文本

## Capabilities

### New Capabilities
<!-- 无新增能力 -->

### Modified Capabilities
- `message-management`: Echo 回复扩展为先发送 Thought 再发送回复；消息持久化包含 is_thought 字段
- `chat-ui`: 对话界面增加 Thought 折叠组件，与普通消息样式区分

## Impact

- **Backend**: `MessageEntity` 新增 `isThought` 字段；`SessionService` 的 `createSessionWithFirstMessage` 和 `createMessage` 在 echo 流程中插入 Thought 消息
- **Frontend**: `Message` 类型新增 `isThought` 字段；`ChatPage` 根据 `isThought` 渲染折叠组件，使用本地 state 控制展开/收起
- **Database**: `t_message` 表添加 `is_thought INT NOT NULL DEFAULT 0` 字段
- **Dependencies**: 灯泡图标使用 FontAwesome 已有的 `faLightbulb`
