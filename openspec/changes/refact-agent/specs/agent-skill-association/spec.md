## MODIFIED Requirements

### Requirement: Skill 管理
系统 MUST 提供 Skill 的关联管理功能（关联已有 Skill 到 Agent、解除关联、查看 Agent 已关联 Skills 列表）；Skill 的创建、编辑、删除等顶层 CRUD 由 `skill-management` 能力承担，单个 Skill 可被任意数量的 Agent 关联。

#### Scenario: 关联已有 Skill 到 Agent
- **WHEN** SYSTEM_ADMIN 用户在 Agent Detail 页选择一个或多个已存在的 Skill 并确认
- **THEN** 系统在 `t_agent_skill` 写入对应的 `(agent_id, skill_id)` 关联（同一组合保持唯一），不创建新的 `t_skill` 行

#### Scenario: 编辑 Skill 内容（顶层维护）
- **WHEN** SYSTEM_ADMIN 用户在 Skills 顶层界面更新某个 Skill 的 `name` / `description` / `content`
- **THEN** 系统更新 `t_skill` 行，所有已关联到该 Skill 的 Agent 在重新查询时立即看到更新后的字段，不需要逐 Agent 重复保存

#### Scenario: 查看 Agent 的 Skills 列表
- **WHEN** SYSTEM_ADMIN 用户查看某个 Agent 的详情
- **THEN** 系统通过 join `t_agent_skill` 与 `t_skill` 显示该 Agent 已关联的所有 Skills 列表，包含每个 Skill 的 `id`、`name`、`description`、`content`

#### Scenario: 解除 Skill 与 Agent 的关联
- **WHEN** SYSTEM_ADMIN 用户在 Agent Detail 页对某个已关联 Skill 点击 `Remove`
- **THEN** 系统仅删除 `t_agent_skill` 中对应 `(agent_id, skill_id)` 的关联记录，`t_skill` 行保持不变

#### Scenario: 删除 Skill 时级联清理 Agent 关联
- **WHEN** Skill 通过 `skill-management` 能力被删除
- **THEN** 系统在同一事务内先删除 `t_agent_skill` 中所有指向该 `skill_id` 的关联记录，再删除 `t_skill` 行；之后查询任意 Agent 的 Skills 列表都不会再出现该 Skill

### Requirement: Markdown 内容支持
系统 MUST 支持 Skill content 字段的 Markdown 格式输入、存储和显示。Skill 在顶层 `t_skill` 表中维护 `content`，所有关联到该 Skill 的 Agent 共享同一份 Markdown 内容。

#### Scenario: 输入 Markdown 内容
- **WHEN** SYSTEM_ADMIN 用户在顶层 Skills 编辑页的 `content` 输入框中输入 Markdown 格式文本
- **THEN** 系统保留格式标签并实时显示格式效果

#### Scenario: Markdown 内容安全过滤
- **WHEN** 系统渲染 Markdown 内容
- **THEN** 系统清理潜在的 XSS 攻击代码，只允许安全的 HTML 标签
