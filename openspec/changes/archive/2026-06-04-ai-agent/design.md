## Context

当前系统需要支持多种 AI Agent 的创建和管理。每个 Agent 需要独立配置模型连接信息、系统提示词、MCP Tools 和 Skills，以便为不同的使用场景提供差异化的 AI 能力。

现有系统已有 User 管理模块作为参考实现，包括 CRUD 操作、权限控制和 Settings 界面集成。

约束条件：
- 必须使用 SYSTEM_ADMIN 角色进行权限控制
- 界面需要集成到现有 Settings 模块
- 需要支持 Markdown 格式的文本输入和预览
- MCP Tools 需要支持通过 URL 自动抓取注册信息

## Goals / Non-Goals

**Goals:**
- 实现完整的 Agent CRUD 功能
- 提供直观的 Agent 管理界面
- 支持 MCP Tools 的便捷注册和管理
- 支持 Skills 的创建和关联
- 确保数据完整性和权限安全

**Non-Goals:**
- 不涉及 AI 会话的创建和管理（属于下一阶段）
- 不处理 MCP Tools 的实际调用逻辑
- 不实现 Skills 的 scripts/references/assets 管理

## Decisions

### 1. 数据库设计
使用 3 张关联表管理 Agent 数据：
- **t_agent**: 存储 Agent 基本信息（name, description, model_config, system_prompt）
  - model_config 使用 JSON 字段存储 base_url、auth_token、model_name
  - system_prompt 使用 TEXT 字段支持大段文本
- **t_agent_tool**: 存储 MCP Tools 注册信息（name, description, parameters）
  - parameters 使用 JSON 字段存储
  - 通过 agent_id 字段关联 t_agent（仅作为普通字段，不建立数据库外键约束）
- **t_agent_skill**: 存储 Skills 信息（name, description, content）
  - content 使用 TEXT 字段支持 Markdown 内容
  - 通过 agent_id 字段关联 t_agent（仅作为普通字段，不建立数据库外键约束）

所有表包含审计字段：created_on, created_by, updated_on, updated_by

**数据一致性策略**：
- 不在数据库层面建立外键约束，关联关系通过 agent_id 普通字段维护
- 数据一致性完全在应用层控制（如级联删除、孤儿记录清理）
- 为 agent_id 字段建立索引以保证查询性能
- 理由：避免外键约束带来的耦合，便于分库分表和数据迁移，由应用统一管理引用完整性

**为什么选择 3 张表而不是 1 张表？**
- Tools 和 Skills 是一对多关系，独立表便于管理和查询
- 符合数据库范式设计，避免冗余
- 便于后续扩展（如 Tool/Skill 的独立管理）

### 2. API 设计
参考 User 模块的 RESTful API 设计：
- `GET /api/agents` - 列表查询（支持分页和过滤）
- `GET /api/agents/:id` - 获取单个 Agent 详情
- `POST /api/agents` - 创建 Agent
- `PUT /api/agents/:id` - 更新 Agent
- `DELETE /api/agents/:id` - 删除 Agent（在应用层级联删除关联的 Tools 和 Skills）

MCP Tools 注册：
- `POST /api/agents/:id/tools/register` - 通过 URL 注册 MCP Tool
  - 输入：name, url
  - 后端自动抓取 MCP 注册信息填充 description 和 parameters

### 3. 前端组件设计
复用 User 模块的界面模式：
- **AgentList**: 列表页，支持搜索、过滤、分页
- **AgentDetail**: 详情页，只读展示 Agent 的完整信息
  - 基本信息：name, description
  - 模型配置：base_url, auth_token（脱敏显示）, model_name
  - system_prompt: 以渲染后的 Markdown 格式展示
  - Tools 列表：展示已注册的 MCP Tools（name, description, parameters）
  - Skills 列表：展示关联的 Skills，content 以渲染后的 Markdown 格式展示
  - 提供编辑入口，跳转到 AgentForm
- **AgentForm**: 创建/编辑表单
  - 基本信息：name, description
  - 模型配置：base_url, auth_token, model_name
  - system_prompt: 使用 Markdown 编辑器组件
  - Tools: 注册表单（输入 name + URL 自动抓取）
  - Skills: 内联编辑（name, description, content with Markdown 支持）

Markdown 编辑器选择：
- 使用支持实时预览的组件（如 react-markdown-editor-lite）
- 保留格式标签但可见格式效果

### 4. 权限控制
所有 Agent 管理 API 和界面限定 SYSTEM_ADMIN 角色：
- 后端在 Controller 层使用 @PreAuthorize("hasRole('SYSTEM_ADMIN')") 注解
- 前端在路由配置中检查用户角色，非 SYSTEM_ADMIN 不显示 Agents 菜单

## Risks / Trade-offs

**[Risk] MCP Tools URL 抓取失败** → 提供手动填写表单作为降级方案，同时显示错误提示

**[Risk] Markdown 内容安全性（XSS）** → 使用 sanitize-html 库清理 Markdown 输出，只允许安全标签

**[Trade-off] Tools 和 Skills 内联编辑 vs 独立管理** → 当前选择内联编辑以简化流程，但后续可能需要独立的 Tool/Skill 管理模块以支持跨 Agent 复用
