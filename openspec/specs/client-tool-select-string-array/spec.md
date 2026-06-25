## ADDED Requirements

### Requirement: Select string array client tool
系统 MUST 提供一个名为 `select-string-array` 的 Client Tool，使 agent 能够请求用户从
一个字符串数组中选择一个或多个选项。该工具 MUST 通过 `defineClientTool` 声明并经由
现有 `/client-tools/sync` 注册（source='registry'）。

#### Scenario: 工具已注册并同步
- **WHEN** Web 应用启动并完成登录后的 Client Tool 同步
- **THEN** `select-string-array` 作为 registry 来源的 Client Tool 出现在 `t_tool` 中，
  可被关联到 agent 并由 agent loop 调度

#### Scenario: Agent 调用工具
- **WHEN** agent loop 在 `select-string-array` 上挂起并推送 `client_call`
- **THEN** 浏览器在 Tool Area 中显示字符串选项选择界面

### Requirement: String array picker UI
`select-string-array` 工具的界面 MUST 在 Tool Area 中显示一个分页的选项列表，
列显示字符串选项，每行包含 Check Box/Radio Button（取决于 multiple 参数）和选项文本，
列表上方可选地显示搜索输入框（取决于 searchable 参数），下方提供 "OK" 和 "Cancel" 按钮。

#### Scenario: 显示选项列表
- **WHEN** 字符串选项选择界面打开
- **THEN** 系统显示选项列表表格，包含列：Check Box/Radio Button、Option

#### Scenario: 客户端分页
- **WHEN** 选项数量超过单页容量（PAGE_SIZE=10）
- **THEN** 系统对列表进行客户端分页，用户可在页与页之间导航

#### Scenario: 多选模式
- **WHEN** 工具参数 `multiple` 为 true（或未指定，默认 true）
- **THEN** 每行显示 checkbox，用户可勾选多个选项

#### Scenario: 单选模式
- **WHEN** 工具参数 `multiple` 为 false
- **THEN** 每行显示 radio button，用户只能选择一个选项

### Requirement: Search filtering
当 `searchable` 参数为 true（默认）时，`select-string-array` 界面 MUST 在列表上方
显示搜索输入框，并对选项进行客户端实时过滤（大小写不敏感子串匹配），过滤后的结果
再进行分页。

#### Scenario: 搜索过滤选项
- **WHEN** 用户在搜索框中输入查询文本
- **THEN** 系统仅显示包含该查询文本的选项（大小写不敏感），分页基于过滤后的结果

#### Scenario: 无匹配结果
- **WHEN** 搜索查询未匹配任何选项
- **THEN** 表格显示 "No matching options" 消息

### Requirement: Confirm and cancel
`select-string-array` 界面 MUST 通过 OK / Cancel 决定返回结果：OK 返回已选字符串列表，
Cancel（或关闭）返回一个表示已取消的结果。

#### Scenario: 按下 OK
- **WHEN** 用户选择了选项并点击 "OK" 按钮
- **THEN** 工具关闭界面并返回已选字符串列表：`{ cancelled: false, selected: string[] }`

#### Scenario: 按下 Cancel
- **WHEN** 用户点击 "Cancel" 按钮
- **THEN** 工具关闭界面并返回表示已取消的结果：`{ cancelled: true, selected: [] }`

#### Scenario: 未选择即确认
- **WHEN** 用户未选择任何选项即点击 "OK"
- **THEN** 工具返回空的选项列表：`{ cancelled: false, selected: [] }`

### Requirement: Tool parameters schema
`select-string-array` 工具 MUST 接受以下参数：

- **options** (required, string[]): 可选项的字符串数组
- **title** (optional, string): 显示在选择界面顶部的标题（默认 "Select Options"）
- **multiple** (optional, boolean): 是否允许多选（默认 true）
- **searchable** (optional, boolean): 是否显示搜索框（默认 true）

#### Scenario: 未提供 options 参数
- **WHEN** agent 调用 `select-string-array` 未传递 `options` 参数
- **THEN** 工具应拒绝执行或显示错误消息

#### Scenario: options 为空数组
- **WHEN** agent 调用 `select-string-array` 传递空数组 `options: []`
- **THEN** 界面显示 "No options" 消息，仍提供 OK/Cancel 按钮

### Requirement: Edge cases handling
`select-string-array` MUST 正确处理边缘情况。

#### Scenario: 非唯一字符串选项
- **WHEN** `options` 数组包含重复的字符串
- **THEN** 系统仅显示和处理唯一的字符串（去重由工具自行决定，或保持原样但选择行为基于字符串值）

#### Scenario: 大数组性能
- **WHEN** `options` 数组包含 100+ 项
- **THEN** 客户端分页和搜索过滤应保持流畅响应（合理范围内，建议最大 ~500 项）

#### Scenario: 跨页选择保持
- **WHEN** 用户在第 1 页选择选项，然后导航到第 2 页选择更多选项，再返回第 1 页
- **THEN** 第 1 页的选择状态保持不变，最终 OK 返回所有选中的选项
