## ADDED Requirements

### Requirement: Agent 管理界面入口
系统 MUST 在 Settings 模块中提供 Agents 管理入口，位于 Users 菜单之后。

#### Scenario: 菜单可见性
- **WHEN** 用户具有 SYSTEM_ADMIN 角色
- **THEN** Settings 菜单显示 Agents 选项，位于 Users 之后

#### Scenario: 非授权用户访问
- **WHEN** 用户不具有 SYSTEM_ADMIN 角色
- **THEN** Settings 菜单不显示 Agents 选项

### Requirement: Agent 列表界面
系统 MUST 提供 Agent 列表界面，支持查看、搜索、过滤和分页。

#### Scenario: 显示 Agent 列表
- **WHEN** SYSTEM_ADMIN 用户访问 Agents 页面
- **THEN** 系统显示 Agent 列表，包含 name、description 和操作按钮

#### Scenario: 搜索 Agent
- **WHEN** SYSTEM_ADMIN 用户在搜索框输入关键词
- **THEN** 系统过滤显示 name 或 description 包含关键词的 Agent

#### Scenario: 分页显示
- **WHEN** Agent 数量超过单页显示限制
- **THEN** 系统提供分页导航，支持翻页和跳转

### Requirement: Agent 详情界面
系统 MUST 提供 Agent 详情界面（AgentDetail），只读展示 Agent 的完整信息。

#### Scenario: 查看 Agent 详情
- **WHEN** SYSTEM_ADMIN 用户点击列表中某个 Agent
- **THEN** 系统跳转到详情页，展示该 Agent 的基本信息、模型配置、system_prompt、Tools 列表和 Skills 列表

#### Scenario: Markdown 内容渲染
- **WHEN** 详情页展示 system_prompt 和 Skill content
- **THEN** 系统以渲染后的 Markdown 格式显示内容

#### Scenario: 敏感信息脱敏
- **WHEN** 详情页展示模型配置中的 auth_token
- **THEN** 系统对 auth_token 进行脱敏显示

#### Scenario: 从详情页进入编辑
- **WHEN** SYSTEM_ADMIN 用户在详情页点击"编辑"按钮
- **THEN** 系统跳转到该 Agent 的编辑表单

### Requirement: Agent 创建和编辑表单
系统 MUST 提供 Agent 创建和编辑表单，支持所有字段的输入和编辑。

#### Scenario: 创建新 Agent 表单
- **WHEN** SYSTEM_ADMIN 用户点击"创建 Agent"按钮
- **THEN** 系统显示空白表单，包含 name、description、model_config、system_prompt、Tools 和 Skills 输入区域

#### Scenario: 编辑 Agent 表单
- **WHEN** SYSTEM_ADMIN 用户点击某个 Agent 的编辑按钮
- **THEN** 系统显示预填充该 Agent 数据的表单

#### Scenario: System Prompt Markdown 编辑
- **WHEN** SYSTEM_ADMIN 用户在 system_prompt 输入框中输入或编辑 Markdown 文本
- **THEN** 系统实时显示格式效果，保留格式标签

#### Scenario: MCP Tool 注册表单
- **WHEN** SYSTEM_ADMIN 用户在 Tools 区域输入 name 和 URL 并提交
- **THEN** 系统自动抓取 MCP 信息并添加到 Tools 列表

#### Scenario: Skill 内联编辑
- **WHEN** SYSTEM_ADMIN 用户在 Skills 区域添加或编辑 Skill
- **THEN** 系统提供 name、description 和 content 输入框，content 支持 Markdown 编辑

### Requirement: 表单验证
系统 MUST 验证表单输入的有效性并显示错误提示。

#### Scenario: 必填字段验证
- **WHEN** SYSTEM_ADMIN 用户提交表单但必填字段（name）为空
- **THEN** 系统显示错误提示并阻止提交

#### Scenario: 字段格式验证
- **WHEN** SYSTEM_ADMIN 用户输入的 base_url 不是有效的 URL 格式
- **THEN** 系统显示格式错误提示
