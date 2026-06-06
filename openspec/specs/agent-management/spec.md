## ADDED Requirements

### Requirement: Agent CRUD Operations
系统 MUST 提供完整的 Agent 增删改查功能，包括创建、更新、删除和查询 Agent 信息。

#### Scenario: 创建新 Agent
- **WHEN** SYSTEM_ADMIN 用户提交包含 name、description、model_config 和 system_prompt 的创建请求
- **THEN** 系统创建新 Agent 记录并返回包含唯一 ID 的 Agent 对象

#### Scenario: 更新 Agent 信息
- **WHEN** SYSTEM_ADMIN 用户提交包含更新字段的请求
- **THEN** 系统更新对应 Agent 记录并返回更新后的 Agent 对象

#### Scenario: 删除 Agent
- **WHEN** SYSTEM_ADMIN 用户请求删除某个 Agent
- **THEN** 系统级联删除该 Agent 及其关联的所有 Tools 和 Skills

#### Scenario: 查询 Agent 列表
- **WHEN** SYSTEM_ADMIN 用户请求 Agent 列表
- **THEN** 系统返回分页的 Agent 列表，支持按 name 过滤和搜索

#### Scenario: 获取单个 Agent 详情
- **WHEN** SYSTEM_ADMIN 用户请求特定 Agent ID 的详情
- **THEN** 系统返回该 Agent 的完整信息，包括关联的 Tools 和 Skills
