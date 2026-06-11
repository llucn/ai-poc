## MODIFIED Requirements

### Requirement: Agent 创建和编辑表单
系统 MUST 提供 Agent 创建和编辑表单，支持 Agent 自身字段（name、description、modelConfig、systemPrompt）的输入和编辑；Tools 和 Skills 通过"挑选已有项"的方式与 Agent 建立或解除关联，不再在 Agent 表单内创建新的 Tool/Skill。

#### Scenario: 创建新 Agent 表单
- **WHEN** SYSTEM_ADMIN 用户点击"创建 Agent"按钮
- **THEN** 系统显示空白表单，包含 `name`、`description`、`modelConfig`、`systemPrompt` 输入区域；Tools 和 Skills 区域仅在 Agent 保存后于详情页通过"添加 Tool"/"添加 Skill"按钮（弹出全局列表）进行关联

#### Scenario: 编辑 Agent 表单
- **WHEN** SYSTEM_ADMIN 用户点击某个 Agent 的编辑按钮
- **THEN** 系统显示预填充该 Agent 数据的表单（不含 Tools/Skills 内嵌编辑），Tools 和 Skills 的关联管理在详情页完成

#### Scenario: System Prompt Markdown 编辑
- **WHEN** SYSTEM_ADMIN 用户在 systemPrompt 输入框中输入或编辑 Markdown 文本
- **THEN** 系统实时显示格式效果，保留格式标签

#### Scenario: 通过挑选已有 Tool 关联到 Agent
- **WHEN** SYSTEM_ADMIN 用户在 Agent Detail 点击"添加 Tool"按钮
- **THEN** 系统弹出包含全部已注册 Tools 的列表对话框（来自 `t_tool`），用户勾选目标 Tool 并确认后系统在 `t_agent_tool` 写入关联记录；该对话框不提供"创建新 Tool"路径

#### Scenario: 通过挑选已有 Skill 关联到 Agent
- **WHEN** SYSTEM_ADMIN 用户在 Agent Detail 点击"添加 Skill"按钮
- **THEN** 系统弹出包含全部已存在 Skills 的列表对话框（来自 `t_skill`），用户勾选目标 Skill 并确认后系统在 `t_agent_skill` 写入关联记录；该对话框不提供"创建新 Skill"路径
