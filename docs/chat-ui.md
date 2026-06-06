Chat UI
===

完成 Chat 界面和会话管理相关的后台 API。暂时不要连接后端的 LLM 服务，只进行模拟会话，把用户输入的文字原样返回即可。

---

功能要求

- 开发会话列表界面，查看已经创建的会话
- 开发新建会话功能
- 对话窗口只支持文本对话，暂时不支持图片、音频。
- 开发传统对话界面，输入文本框在界面下方，用户输入文字后按 'Send' 按钮，或按回车键发出文字。用户头像 + 对话文字在对话界面滚动展示。
- 用户头像使用 First Name 和 Last Name 首字母，蓝色。Assistant 头像使用 Robot 图标，灰色。
- 对话内容显示四周圆角的气泡，宽度和高度自适应。
- 对话框内置支持 Markdown 格式

---

界面设计

- 权限：所有人可以使用 Chat 功能，可以查看自己的历史会话，可以创建新会话
- 菜单
    - 添加 "Chat" 一级菜单，位置在 "Dashboard" 和 "Settings" 之间
    - "Chat" 菜单添加两个子菜单："New Session", "Sessions"
- New Session Page
    - 显示 Chat 对话界面，对话框中心显示两行文字，第一行：机器人图标 + "Assistant"，第二行："Ready to chat"
    - 用户输入第一个消息之后，创建 Session，Session 名称就是用户输入的第一个消息（如果消息太长截断前 200 个字符）
- Sessions Page
    - 显示自己的会话历史，按照 last_activity_time 倒排序
    - 显示列：Check Box、Create Time、Last Activity Time、Name。头部显示 "- Delete" 按钮
    - 点击 Name 进入对话界面
    - 选中 Session，点击 Delete 按钮可以删除会话，删除前提示："Delete sessions?"

---

数据库表

- `t_session`: 会话信息，字段：
    - id
    - name
    - user_name: 关联用户
    - last_activity_time: 最后活动时间
    - created_on: 创建时间
    - created_by: 创建人
    - updated_on: 最新活动时间
    - updated_by: 最新活动人（assistant/{username}）
- `t_message`: 对话消息，字段：
    - id
    - session_id
    - user_name: assistant 消息是 `ASSISTANT`
    - message_type: 1: Text, 2: Image （现在只支持 Text）
    - content: 消息内容，Markdown 文本
    - created_on: 创建时间
    - created_by: 创建人
    - updated_on: 最新活动时间
    - updated_by: 最新活动人（assistant/{username}）
