## 1. 数据库表设计

- [x] 1.1 创建 t_agent 表（id, name, description, model_config JSON, system_prompt TEXT, created_on, created_by, updated_on, updated_by）
- [x] 1.2 创建 t_agent_tool 表（id, agent_id, name, description, parameters JSON, created_on, created_by, updated_on, updated_by）
- [x] 1.3 创建 t_agent_skill 表（id, agent_id, name, description, content TEXT, created_on, created_by, updated_on, updated_by）
- [x] 1.4 为 agent_id 等字段建立索引（不建立数据库外键约束）

## 2. 后端 API 实现

- [x] 2.1 创建 Agent Entity 和 Repository
- [x] 2.2 创建 AgentTool Entity 和 Repository
- [x] 2.3 创建 AgentSkill Entity 和 Repository
- [x] 2.4 实现 AgentService（CRUD 操作）
- [x] 2.5 实现应用层级联删除和数据一致性控制（删除 Agent 时清理关联的 Tools 和 Skills）
- [x] 2.6 实现 AgentController（RESTful API endpoints）
- [x] 2.7 实现 MCP Tools 注册功能（URL 抓取逻辑）
- [x] 2.8 添加 SYSTEM_ADMIN 权限验证（@PreAuthorize 注解）
- [x] 2.9 添加 Markdown 内容安全过滤（sanitize-html）

## 3. 前端界面实现

- [x] 3.1 在 Settings 菜单中添加 Agents 入口（位于 Users 之后）
- [x] 3.2 实现 AgentList 组件（列表、搜索、分页）
- [x] 3.3 实现 AgentDetail 组件（只读展示 Agent 完整信息，含 Markdown 渲染、Tools/Skills 列表）
- [x] 3.4 实现 AgentForm 组件（创建/编辑表单）
- [x] 3.5 集成 Markdown 编辑器组件（system_prompt 和 Skill content）
- [x] 3.6 实现 MCP Tools 注册表单（name + URL 输入）
- [x] 3.7 实现 Skills 内联编辑功能
- [x] 3.8 添加表单验证（必填字段、格式验证）
- [x] 3.9 添加权限控制（只对 SYSTEM_ADMIN 显示菜单）

## 4. 测试

- [x] 4.1 编写 Agent CRUD 单元测试
- [x] 4.2 编写 MCP Tools 注册功能测试
- [x] 4.3 编写 Skills 管理功能测试
- [x] 4.4 编写权限控制集成测试
- [x] 4.5 编写前端组件测试

## 5. 文档和部署

- [x] 5.1 更新 API 文档
- [x] 5.2 编写用户使用文档
- [x] 5.3 准备数据库迁移脚本
- [x] 5.4 验证部署流程
