## ADDED Requirements

### Requirement: Skill 作为顶层资源管理
系统 MUST 把 Skill 作为独立顶层资源进行 CRUD 管理，与 Agent 解耦；每个 Skill 由 `id`、`name`、`description`、`content` 与审计字段构成。`name` 字段 MUST 符合 kebab-case 格式（仅小写字母、数字、连字符，不以连字符开头或结尾），且在 `t_skill` 表中全局唯一。

#### Scenario: 创建 Skill
- **WHEN** SYSTEM_ADMIN 用户在 Skills 编辑页输入符合 kebab-case 格式且唯一的 `name`、`description`、`content` 并保存
- **THEN** 系统向 `t_skill` 写入一条记录并在 Skills 列表显示该 Skill

#### Scenario: name 格式校验失败
- **WHEN** SYSTEM_ADMIN 用户输入的 `name` 不符合 kebab-case 格式（例如包含大写字母、空格、下划线，或以连字符开头/结尾）
- **THEN** 系统显示格式错误提示（"Skill name must be kebab-case: lowercase letters, numbers, and hyphens only, not starting or ending with hyphen"），且 `Save` 按钮保持禁用

#### Scenario: name 唯一性校验失败
- **WHEN** SYSTEM_ADMIN 用户输入的 `name` 已被其它 Skill 使用
- **THEN** 系统显示唯一性错误提示（"Skill name already exists"），且 `Save` 按钮保持禁用

#### Scenario: 编辑 Skill
- **WHEN** SYSTEM_ADMIN 用户修改某个 Skill 的 `name`（需满足 kebab-case 格式与全局唯一性）、`description`、`content` 并保存
- **THEN** 系统更新 `t_skill` 行的对应字段，写入 `updated_on` / `updated_by`，且 `content` 中的 Markdown 格式被原样保留

#### Scenario: 删除 Skill 并提示影响范围
- **WHEN** SYSTEM_ADMIN 用户点击 Skills 列表上的 `-Delete` 按钮
- **THEN** 系统弹出 `Delete skill?` 确认提示并显示该 Skill 当前关联的 Agent 数量；确认后系统先级联删除 `t_agent_skill` 中所有指向该 `skill_id` 的关联，再删除 `t_skill` 本体

### Requirement: Skills 列表与详情界面
系统 MUST 提供 SYSTEM_ADMIN 可见的 Skills 列表与详情界面。

#### Scenario: 列表展示
- **WHEN** SYSTEM_ADMIN 用户进入 `Skills` 顶部菜单
- **THEN** 系统显示 Skills 列表，列至少包含 `ID`、`Name`、`Description`，并提供 `+Add` 与 `-Delete` 按钮

#### Scenario: 查看详情
- **WHEN** SYSTEM_ADMIN 用户点击列表中某个 Skill 的 `Name`
- **THEN** 系统跳转到 Skill Detail 页，展示完整的 `id`、`name`、`description`、`content`，其中 `content` 以渲染后的 Markdown 显示

#### Scenario: 非 SYSTEM_ADMIN 不可访问
- **WHEN** 角色不是 `SYSTEM_ADMIN` 的用户访问 `/settings/skills`
- **THEN** 顶部菜单不显示 `Skills` 入口；直接通过 URL 访问也被路由保护拦截或返回 403

### Requirement: Skill 与 Agent 的多对多关联
系统 MUST 通过 `t_agent_skill` 关联表把 Skill 与 Agent 关联，支持同一 Skill 被多个 Agent 复用。

#### Scenario: 关联 Skill 到 Agent
- **WHEN** SYSTEM_ADMIN 用户在 Agent Detail 选择已有 Skill 并确认
- **THEN** 系统在 `t_agent_skill` 写入 `(agent_id, skill_id)` 关联（同一对组合保持唯一）

#### Scenario: 解除关联但保留 Skill
- **WHEN** SYSTEM_ADMIN 用户在 Agent Detail 把某个已关联 Skill 移除
- **THEN** 系统仅删除该 Agent 与 Skill 的 `t_agent_skill` 关联记录，`t_skill` 本体不受影响
