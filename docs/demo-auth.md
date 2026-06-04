Demo Auth
===

# 说明
AI POC 是一个用于演示的系统，不需要真正的 Authentication 功能。需要去掉这些功能：
- 去掉 OIDC 登录，相关的跳转路由，相关的配置文件
- 去掉 JWT 支持，`web` 项目不需要从 OIDC Provider 取得 JWT，`api` 接口不需要验证 JWT

增加以下功能：
- 增加一个模拟的登录界面，界面从数据库里列出所有的用户名和角色。使用者点击用户，模拟登录过程进入系统。不需要输入账号密码
- `web` 项目中的 `useApiFetch` Hook 向后台发出一个消息头，用户名和角色以明文形式附加在消息头里
- `api` 接口解析消息头里的用户名，得到用户身份，保持现有的 RBAC
- 增加模拟用户表管理功能，包括前后台界面和 API 接口

# Tables

## Table 1: t_user

| Name          | Type         | Description    | Nullable | PK  | Index  |
|---------------|--------------|----------------|----------|-----|--------|
| id            | int          | auto increment | No       | Yes |        |
| name          | varchar(255) |                | No       |     | Unique |
| display_name  | varchar(255) |                | No       |     |        |
| email         | varchar(255) |                | No       |     |        |
| role          | varchar(255) |                | Yes      |     |        |
| skill_matrix  | text         |                | Yes      |     |        |
| is_available  | int          | default `1`    | No       |     |        |
| created_on    | timestamp    |                | No       |     |        |
| created_by    | varchar(255) |                | No       |     |        |
| updated_on    | timestamp    |                | Yes      |     |        |
| updated_by    | varchar(255) |                | Yes      |     |        |

`role` 值域: 'SUPERVISOR' | 'TECHNICIAN' | 'SYSTEM_ADMIN' | 'CUSTOMER'

生成数据库建表脚本，写入 `docs/database.sql` 文件。

# Pages

## Page 1: Login（模拟）

界面样式：以 Card 形式显示所有用户，包括 name、email、role。不需要任何过滤条件。

界面操作：点击用户名，以用户身份进入系统主页。

## Page 2: All Users

角色权限：SYSTEM_ADMIN

菜单入口: Settings -> Users

标题：All Users

功能：以列表形式显示所有 User，分页，默认每页 20 条

Head button:
- 添加按钮：文本 `+ Add`
- 删除按钮：文本 `- Delete`，删除时弹出提示框，文本：`Delete Users?`

Table columns:
- Check Box
- ID: '#' + id
- Name：可点击的连接，点击进入 `User Detail` 界面
- Display Name
- Email
- Role
- Available: 根据 `is_available` 字段值显示图标
- Action: 显示 `Edit` 连接，点击进入 `Edit User` 界面

## Page 3: User Detail

角色权限：SYSTEM_ADMIN

标题：'User #' + id

返回页面：All Users

Head button：
- 编辑按钮：文本 `Edit`
- 删除按钮：文本 `- Delete`，删除时弹出提示框，文本：`Delete User #id?`

显示内容：
- ID: '#' + id
- Name
- Display Name
- Email
- Role
- Skill Matrix
- Available

## Page 4: Add User

角色权限：SYSTEM_ADMIN

标题：Add User

返回页面：All User

输入框：
- Name：输入时检查重复，如果有重复提示错误
- Display Name
- Email
- Role: 选择框（可以选空）
- Skill Matrix：多行文本输入框
- Available：选择框，可选 `Yes`, `No`，默认 `Yes`

按钮：
- Save: Primary button
- Cancel: Secondary button, 点击返回 All Users 页面

## Page 5: Edit User

角色权限：SYSTEM_ADMIN

标题：'Edit User #' + id

返回页面：User Detail

输入框：
- ID: 初始化显示 '#' + id，不可编辑
- Name：输入时检查重复，如果有重复提示错误
- Display Name
- Email
- Role: 选择框（可以选空）
- Skill Matrix：多行文本输入框
- Available：选择框，可选 `Yes`, `No`，默认 `Yes`

按钮：
- Save: Primary button
- Cancel: Secondary button, 点击返回 User Detail 页面
