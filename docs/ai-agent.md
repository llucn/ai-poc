AI Agent
===

# 功能
Agent 信息管理，可以创建多个 Agent，管理 Agent 的信息，包括：

- name，例如：selector、operational、rag、freetalk
- description：Agent 功能介绍
- model_config
  - base_url: 地址
  - auth_token
  - model_name: 模型名称
- system_prompt：系统提示词，在启动时注入 LLM
- tools: MCP 注册信息列表
- skills: Skill 列表

MCP Tools 信息：
- name
- description
- parameters

Skill 信息，只维护单个文本信息，不维护相关的 scripts，references，assets：
- name
- description
- content

创建 Agent 之后，下一步就可以基于 Agent 信息创建 AI 会话。

# 数据库表

设计以下数据库表，每个表都要有 created_on、created_by、updated_on、updated_by 字段

## Table 1: t_agent

管理 Agent 基本信息、model_config, system_prompt

## Table 2: t_agent_tool

管理 Tools，每个 Agent 可以注册多个 MCP Tools

## Table 3: t_agent_skill

管理 Skills，每个 Agent 可以关联多个 Skills

# 界面

参考 User 模块设计所有的界面，要求：

- 权限：所有界面限定 `SYSTEM_ADMIN` 角色
- 入口：Settings -> Agents，添加在 Users 菜单之后
- Markdown 输入：system_prompt、Skill content 是大段文本，输入框要支持 Markdown 格式，在保留格式标签的情况下可见格式效果
- MCP 注册：MCP Tools 列表使用注册形式添加，输入 Name 和 URL，自动抓取 MCP 注册信息
