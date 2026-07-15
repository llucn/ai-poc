Cron Job
===

# 功能

- 设置 Job：选择 Agent、输入 Job Name、Job Content，从 Job Content 中提取 Cron Expression 和 Job Detail，存入数据库
- 管理 Job：查看、修改、删除 Job
- 执行 Job：在后台自动定时执行 Job，记录 Job 执行过程和执行结果

# 数据库

## Table: `t_job`

| Name          | Type         | Description                          | Nullable | PK  | Index  |
|---------------|--------------|--------------------------------------|----------|-----|--------|
| id            | int          | Auto increment                       | No       | Yes |        |
| agent_id      | int          | Link to `t_agent.id`                 | No       |     |        |
| name          | varchar(255) |                                      | No       |     | Unique |
| content       | text         |                                      | Yes      |     |        |
| cron_exp      | varchar(255) |                                      | Yes      |     |        |
| job_detail    | text         |                                      | Yes      |     |        |
| created_on    | timestamp    |                                      | No       |     |        |
| created_by    | varchar(255) |                                      | No       |     |        |
| updated_on    | timestamp    |                                      | Yes      |     |        |
| updated_by    | varchar(255) |                                      | Yes      |     |        |

## Table: `t_job_log`

| Name          | Type         | Description                          | Nullable | PK  | Index  |
|---------------|--------------|--------------------------------------|----------|-----|--------|
| id            | int          | Auto increment                       | No       | Yes |        |
| job_id        | int          | Link to `t_job.id`                   | No       |     |        |
| job_log       | text         |                                      | Yes      |     |        |
| job_status    | int          | 0: Success, -1: Fail, 1: Running     | Yes      |     |        |
| created_on    | timestamp    |                                      | No       |     |        |
| created_by    | varchar(255) |                                      | No       |     |        |
| updated_on    | timestamp    |                                      | Yes      |     |        |
| updated_by    | varchar(255) |                                      | Yes      |     |        |

# 操作界面

## All Jobs

权限：
- SYSTEM_ADMIN（读写）

菜单入口：Settings -> Job

Head Buttons：
- Add: 添加 Job
- Delete：删除选中的 Job

Table Columns：
- Name: 点击查看 Job
- Cron Expression
- Agent
- Link to `Job Log`

## Job Detail

权限：
- SYSTEM_ADMIN（读写）

Job 信息：
- ID
- Name
- Agent
- Content
- Cron Expression
- Detail
- Created On
- Created By
- Updated On
- Updated By

## Add Job

权限：
- SYSTEM_ADMIN（读写）

输入信息
- Name
- Agent: 选择框
- Content: 多行文本

## Edit Job

权限：
- SYSTEM_ADMIN（读写）

输入信息
- ID: 不可输入
- Name
- Agent: 选择框
- Content: 多行文本

## Job Log List

权限：
- SYSTEM_ADMIN（读写）

Table Columns：
- ID: `#{id}`，点击查看 Log Detail
- Job Name
- Time: `created_on` 字段
- Status: 图标显示

## Job Log Detail

权限：
- SYSTEM_ADMIN（读写）

Job Log 信息：
- ID
- Job Name
- Log
- Status
- Created On
- Created By
- Updated On
- Updated By

# 技术架构

- 创建名为 `job` 的 Agent
- 为 `job` Agent 写一个 System Prompt，内容：分析输入的文本，提取 Cron Expression 和 Job Detail，输出 JSON 格式的数据。写入 `docs/job-agent-prompt.md`
- 编辑 Job 时调用 `job` Agent，提取 Cron Expression 和 Job Detail，写入 `t_job` 表
- 后台执行定时器，执行结果写入 `t_job_log`
