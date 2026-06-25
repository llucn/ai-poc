## ADDED Requirements

### Requirement: Map mark client tool
系统 MUST 提供一个名为 `map-mark` 的 Client Tool，使 agent 能够在 Tool Area 中
向用户展示一个 Google 地图视图，并在地图上标记一个或多个坐标点。该工具 MUST 通过
`defineClientTool` 声明并经由现有 `/client-tools/sync` 注册（source='registry'）。

#### Scenario: 工具已注册并同步
- **WHEN** Web 应用启动并完成登录后的 Client Tool 同步
- **THEN** `map-mark` 作为 registry 来源的 Client Tool 出现在 `t_tool` 中，
  可被关联到 agent 并由 agent loop 调度

#### Scenario: Agent 调用工具
- **WHEN** agent loop 在 `map-mark` 上挂起并推送 `client_call`
- **THEN** 浏览器在 Tool Area 中显示 Google 地图视图并标记指定坐标点

### Requirement: Google Maps view with markers
`map-mark` 工具的界面 MUST 在 Tool Area 中显示一个 Google Maps 地图视图，
地图上显示 agent 传入的坐标点标记（Marker），下方提供 "OK" 和 "Cancel" 按钮。

#### Scenario: 单个标记点
- **WHEN** agent 传入一个坐标点（lat, lng）
- **THEN** 地图居中到该点，使用指定的 zoom 级别（默认 14），显示一个 Marker

#### Scenario: 多个标记点
- **WHEN** agent 传入多个坐标点
- **THEN** 地图自动调整视野（fitBounds）以显示所有 Marker

#### Scenario: 无标记点
- **WHEN** agent 传入空的 markers 数组
- **THEN** 地图显示世界视图，无 Marker，仍提供 OK/Cancel 按钮

#### Scenario: 标记带标签
- **WHEN** marker 包含可选的 `label` 字段
- **THEN** Marker 显示标签（hover tooltip 和/或地图上的短标签）

### Requirement: Dynamic Google Maps API loading
系统 MUST 仅在 `map-mark` 工具首次激活时动态加载 Google Maps JavaScript API，
而非在每次页面加载时都加载。

#### Scenario: 首次加载 API
- **WHEN** `map-mark` 工具首次被激活
- **THEN** 系统动态注入 Google Maps script 标签并等待 API 就绪后再渲染地图

#### Scenario: 重复激活
- **WHEN** `map-mark` 工具被多次激活
- **THEN** 系统复用已加载的 Google Maps API，不重复注入 script

#### Scenario: API key 未配置
- **WHEN** 环境变量 `VITE_GOOGLE_MAPS_API_KEY` 未设置或为空
- **THEN** 面板显示错误提示 "Google Maps API key not configured"，仍提供 OK/Cancel 按钮

#### Scenario: API 加载失败
- **WHEN** Google Maps script 加载失败（网络错误等）
- **THEN** 面板显示错误提示，仍提供 OK/Cancel 按钮，不阻塞 agent loop

### Requirement: Confirm and cancel
`map-mark` 界面 MUST 通过 OK / Cancel 决定返回结果：OK 表示用户已查看地图，
Cancel 表示用户关闭了地图。

#### Scenario: 按下 OK
- **WHEN** 用户查看地图后点击 "OK" 按钮
- **THEN** 工具关闭界面并返回：`{ cancelled: false }`

#### Scenario: 按下 Cancel
- **WHEN** 用户点击 "Cancel" 按钮
- **THEN** 工具关闭界面并返回：`{ cancelled: true }`

### Requirement: Tool parameters schema
`map-mark` 工具 MUST 接受以下参数：

- **markers** (required, array): 坐标点数组，每个元素包含：
  - `lat` (required, number): 纬度
  - `lng` (required, number): 经度
  - `label` (optional, string): 标记标签
- **title** (optional, string): 显示在地图上方的标题（默认 "Map View"）
- **zoom** (optional, number): 单标记时的缩放级别（默认 14）

#### Scenario: 参数验证
- **WHEN** agent 调用 `map-mark` 传入 markers 数组
- **THEN** 每个 marker 的 lat 和 lng 为有效数字，工具正常渲染地图
