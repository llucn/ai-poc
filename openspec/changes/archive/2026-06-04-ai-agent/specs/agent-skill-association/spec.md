## ADDED Requirements

### Requirement: Skill 管理
系统 MUST 为每个 Agent 提供 Skills 管理功能，支持创建、编辑、查看和删除 Skills。

#### Scenario: 创建新 Skill
- **WHEN** SYSTEM_ADMIN 用户为 Agent 添加 Skill，输入 name、description 和 content
- **THEN** 系统创建新 Skill 记录并关联到该 Agent

#### Scenario: 编辑 Skill 内容
- **WHEN** SYSTEM_ADMIN 用户更新 Skill 的 content 字段
- **THEN** 系统更新 Skill 记录并保留 Markdown 格式

#### Scenario: 查看 Agent 的 Skills 列表
- **WHEN** SYSTEM_ADMIN 用户查看某个 Agent 的详情
- **THEN** 系统显示该 Agent 关联的所有 Skills 列表

#### Scenario: 删除 Skill
- **WHEN** SYSTEM_ADMIN 用户删除某个 Skill
- **THEN** 系统从 Agent 的 Skills 列表中移除该 Skill 记录

### Requirement: Markdown 内容支持
系统 MUST 支持 Skill content 字段的 Markdown 格式输入、存储和显示。

#### Scenario: 输入 Markdown 内容
- **WHEN** SYSTEM_ADMIN 用户在 Skill content 输入框中输入 Markdown 格式文本
- **THEN** 系统保留格式标签并实时显示格式效果

#### Scenario: Markdown 内容安全过滤
- **WHEN** 系统渲染 Markdown 内容
- **THEN** 系统清理潜在的 XSS 攻击代码，只允许安全的 HTML 标签
