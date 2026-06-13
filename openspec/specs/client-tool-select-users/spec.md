## ADDED Requirements

### Requirement: Select Users client tool
系统 MUST 提供一个名为 `select-users` 的 Client Tool，使 agent 能够请求用户从
系统用户中选择一个或多个用户。该工具 MUST 通过 `defineClientTool` 声明并经由
现有 `/client-tools/sync` 注册（source='registry'）。

#### Scenario: 工具已注册并同步
- **WHEN** Web 应用启动并完成登录后的 Client Tool 同步
- **THEN** `select-users` 作为 registry 来源的 Client Tool 出现在 `t_tool` 中，
  可被关联到 agent 并由 agent loop 调度

#### Scenario: Agent 调用工具
- **WHEN** agent loop 在 `select-users` 上挂起并推送 `client_call`
- **THEN** 浏览器在 Tool Area 中显示用户选择界面

### Requirement: User picker UI
`select-users` 工具的界面 MUST 在 Tool Area 中显示一个分页的用户列表，列包含
Check Box、Name、Display Name、Email，列表下方提供 "OK" 和 "Cancel" 按钮。

#### Scenario: 显示用户列表
- **WHEN** 用户选择界面打开
- **THEN** 系统显示用户列表表格，包含列：Check Box、Name、Display Name、Email

#### Scenario: 分页
- **WHEN** 用户数量超过单页容量
- **THEN** 系统对列表分页，用户可在页与页之间导航

#### Scenario: 多选
- **WHEN** 用户勾选一个或多个用户的 Check Box
- **THEN** 这些用户被标记为已选中

### Requirement: Confirm and cancel
`select-users` 界面 MUST 通过 OK / Cancel 决定返回结果：OK 返回已选用户列表，
Cancel（或关闭）返回一个表示已取消的结果。

#### Scenario: 按下 OK
- **WHEN** 用户勾选了用户并点击 "OK" 按钮
- **THEN** 工具关闭界面并返回已选用户列表（每个用户至少包含 name、displayName、
  email）

#### Scenario: 按下 Cancel
- **WHEN** 用户点击 "Cancel" 按钮
- **THEN** 工具关闭界面并返回表示已取消的结果（不返回任何选中用户）

#### Scenario: 未选择即确认
- **WHEN** 用户未勾选任何用户即点击 "OK"
- **THEN** 工具返回空的已选用户列表

### Requirement: Authenticated user listing for picker
系统 MUST 提供一个面向任意已登录用户的只读分页用户列表接口，供 `select-users`
界面使用，返回每个用户的 name、display name、email；该接口 MUST NOT 要求
`SYSTEM_ADMIN` 角色。

#### Scenario: 普通用户获取列表
- **WHEN** 一个非管理员的已登录用户的浏览器请求用户列表接口
- **THEN** 接口返回分页的用户数据（含 name、displayName、email 与分页信息），
  不返回 403

#### Scenario: 未登录拒绝
- **WHEN** 未携带用户凭据的请求访问该接口
- **THEN** 接口拒绝请求（401）
