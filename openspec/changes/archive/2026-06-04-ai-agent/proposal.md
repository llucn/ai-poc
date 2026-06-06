## Why

当前系统需要支持多种 AI Agent 的创建和管理，每个 Agent 具有不同的功能定位（如 selector、operational、rag、freetalk）。Agent 需要配置独立的模型连接、系统提示词、工具（MCP Tools）和技能（Skills），以便在创建 AI 会话时提供差异化的服务能力。

## What Changes

- 新增 Agent 信息管理模块，支持创建、编辑、删除和查看 Agent
- 新增 3 张数据库表：t_agent（Agent 基本信息）、t_agent_tool（MCP Tools 注册）、t_agent_skill（Skills 关联）
- 新增 Agent 管理界面，入口位于 Settings -> Agents（Users 菜单之后）
- 支持 Agent 的模型配置（base_url、auth_token、model_name）
- 支持 system_prompt 的 Markdown 编辑和预览
- 支持 MCP Tools 通过 URL 自动注册
- 支持 Skills 的创建和关联管理

## Capabilities

### New Capabilities
- `agent-management`: Agent CRUD 操作和列表查询
- `agent-tool-registration`: MCP Tools 的注册和管理
- `agent-skill-association`: Skills 的创建和关联
- `agent-ui`: Agent 管理界面（Settings -> Agents）

### Modified Capabilities
<!-- 无现有能力需要修改 -->

## Impact

- 新增 3 张数据库表（t_agent、t_agent_tool、t_agent_skill）
- Settings 菜单新增 Agents 入口
- 需要 SYSTEM_ADMIN 角色权限控制
- 前端需要支持 Markdown 编辑器组件
