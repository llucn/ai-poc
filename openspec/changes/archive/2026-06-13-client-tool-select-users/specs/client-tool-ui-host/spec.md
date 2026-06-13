## ADDED Requirements

### Requirement: In-page Tool Area
Chat Page MUST provide a Tool Area docked to the right of the conversation that
is collapsed and invisible by default and is shown only while a Client Tool has
requested an in-page UI.

#### Scenario: 默认收起
- **WHEN** 用户打开 Chat Page，没有 Client Tool 在请求界面
- **THEN** Tool Area 不可见，Chat Area 占据全部可用宽度

#### Scenario: 工具请求界面时展开
- **WHEN** 一个 Client Tool 通过 UI host bridge 请求渲染界面
- **THEN** Tool Area 在对话区域右侧显示出来，渲染该工具的界面

#### Scenario: 工具结束时收起
- **WHEN** 当前 Client Tool 的界面关闭（结果返回或取消）
- **THEN** Tool Area 重新收起为不可见，Chat Area 恢复原有宽度

### Requirement: Layout reflow
当 Tool Area 显示时，系统 MUST 缩小 Chat Area 的宽度为 Tool Area 让出空间；
当 Tool Area 收起时，系统 MUST 恢复 Chat Area 的宽度。

#### Scenario: 空白区域足够
- **WHEN** Chat Page 右侧的空白区域宽度足以容纳 Tool Area
- **THEN** Tool Area 占据该空白区域，Chat Area 宽度保持不变

#### Scenario: 空白区域不足
- **WHEN** 右侧空白区域宽度不足以容纳 Tool Area
- **THEN** Chat Area 的宽度缩小，直到 Tool Area 获得足够宽度为止

#### Scenario: 恢复宽度
- **WHEN** Tool Area 从显示变为收起
- **THEN** Chat Area 恢复到 Tool Area 显示前的宽度

### Requirement: Client Tool UI host bridge
系统 MUST 提供一个 bridge，使 Client Tool 的 handler（一个返回 Promise 的普通
异步函数）能够在 Tool Area 中渲染一个 React 组件，并从该组件解决（resolve）其
Promise，而无需直接操作 `document.body`。

#### Scenario: 渲染请求
- **WHEN** Client Tool handler 调用 bridge 请求渲染一个组件
- **THEN** Tool Area 显示该组件，handler 的 Promise 保持 pending

#### Scenario: 从组件返回结果
- **WHEN** Tool Area 中的组件调用 bridge 提供的 resolve 回调并传入结果
- **THEN** handler 的 Promise 以该结果 resolve，Tool Area 收起

#### Scenario: 单次只渲染一个工具
- **WHEN** 已有一个 Client Tool 在 Tool Area 中渲染界面
- **THEN** 在其结束之前，系统不会在 Tool Area 中渲染另一个工具的界面（与现有
  suspend/resume 串行执行一致）

### Requirement: Backward compatibility with imperative tools
现有以命令式方式（挂载到 `document.body`）渲染界面的 Client Tool MUST 在引入
Tool Area 与 UI host bridge 后继续正常工作。

#### Scenario: 现有 prompt-input 工具不受影响
- **WHEN** 一个未使用 bridge 的 Client Tool（如 `prompt-input`）被调用
- **THEN** 它仍以原有方式渲染界面并返回结果，Tool Area 不被触发
