## 1. 数据库迁移

- [ ] 1.1 创建迁移脚本：删除 `t_message.turn_id` 列及其索引
- [ ] 1.2 创建迁移脚本：修改 `t_pending_client_call` 的 `call_id` 索引，从 UNIQUE 改为复合 UNIQUE `(call_id, tool_use_id)`
- [ ] 1.3 更新 `docs/database.sql` 的 CREATE TABLE 语句，移除 `t_message.turn_id`，更新 `t_pending_client_call` 的索引和 `message_context` 注释
- [ ] 1.4 执行迁移脚本到开发数据库

## 2. 后端 Entity 修改

- [x] 2.1 修改 `message.entity.ts`：删除 `turnId` 字段
- [x] 2.2 修改 `pending-client-call.entity.ts`：移除 `call_id` 的 `unique: true`，添加复合 `@Index(['callId', 'toolUseId'], { unique: true })`；更新 `PendingMessageContext` 类型为单个 tool_result 对象类型（`{type:'tool_result', tool_use_id: string, content: string} | {error: string}`）；更新注释
- [x] 2.3 修改 `session.dto.ts`：`ClientResultDto` 增加 `toolUseId: string` 字段

## 3. LLM Service 修改（支持多 tool_use）

- [x] 3.1 修改 `llm.service.ts` 的 `LlmTurn` 类型：`tool_use` 变体改为 `{ kind: 'tool_use'; text: string; toolUses: {id: string; name: string; input: unknown}[]; assistantContent: ContentBlockParam[] }`
- [x] 3.2 修改 `callLlm` 方法：遍历 `response.content`，收集**所有** `tool_use` 块到 `toolUses` 数组，而不是只取最后一个
- [x] 3.3 更新 `llm.service.spec.ts` 中的相关测试用例

## 4. Message Helper 重写（核心修复）

- [x] 4.1 修改 `reconstructNativeMessages`：删除 `if (row.isThought === 1) continue;` 跳过逻辑；改为对每行检查 `nativeContent`，若非 null 则 push `{ role: message_role, content: native_content }`
- [x] 4.2 修改 `createAssistantToolUseMessage`：参数改为 `(sessionId, assistantContent: ContentBlockParam[], createdBy)`，删除 `turnId` 参数；设置 `isThought: 1`
- [x] 4.3 删除 `createToolResultMessage` 单数函数；新增 `createToolResultsMessage` 复数函数：`(sessionId, toolResults: ContentBlockParam[], createdBy) => Partial<MessageEntity>`，返回 `isThought: 1, message_role: 'user', native_content: toolResults, content: <summary>`
- [x] 4.4 修改 `createUserMessage` / `createAssistantMessage`：删除 `turnId` 参数
- [x] 4.5 删除不再使用的 `buildObservationThoughtContent` 等辅助函数

## 5. Session Service 重写（runLoop / suspend / resume）

- [x] 5.1 修改 `runLoop` 方法签名：删除 `startToolCallCount` 参数，删除 `turnIdBase` 变量
- [x] 5.2 修改 `runLoop` 中 tool_use 分支：接收 `turn.toolUses` 数组；存储 1 行 assistant tool_use 消息（调用 `createAssistantToolUseMessage`，传入 `turn.assistantContent`）；生成共享的 `callId`（UUID）；为每个 tool_use 创建 1 条 pending 记录（共享 callId，各自 tool_use_id，message_context=null，status='pending'）
- [x] 5.3 修改 `executeTool`：执行完 MCP 工具后，返回 tool_result 对象而非 observation 字符串；不再持久化 observation Thought 行
- [x] 5.4 修改 tool 执行逻辑：遍历 `turn.toolUses`，对 MCP 工具即时执行并写回其 pending 行的 `message_context`（`{type:'tool_result', tool_use_id, content}`）和 status='completed'；对 Client 工具保持 pending
- [x] 5.5 新增 `dispatchNextClientTool` 辅助方法：查询 callId 下第一个 status='pending' 的 Client Tool 行，若存在则推送 `client_call`（携带 callId, toolUseId, toolName, params）并返回 true；若无则返回 false
- [x] 5.6 修改 tool 执行后逻辑：调用 `dispatchNextClientTool`；若有 pending client tool，关闭 SSE 并 return（挂起）；若无，调用 `mergeToolResults` 合并本轮所有结果
- [x] 5.7 新增 `mergeToolResults` 辅助方法：查询 callId 的所有 pending 行，从 message_context 提取 tool_result 对象（错误行映射为 `{type:'tool_result', tool_use_id, content: error, is_error:true}`），合并成数组，调用 `createToolResultsMessage` 持久化 1 行 user Thought，推送 `thought_created`，返回合并后的 tool_result 数组
- [x] 5.8 修改 `runLoop` 继续逻辑：在 `mergeToolResults` 后，将合并的 tool_result 数组作为 user turn 追加到 live `messages` 数组（`messages.push({ role: 'user', content: toolResults })`），继续循环
- [x] 5.9 修改 `suspendForClientTool`：删除整个方法（逻辑已合并到 runLoop 的 5.5/5.6）
- [x] 5.10 修改 `resumeClientResult`：按 `(dto.callId, dto.toolUseId)` 定位 pending 行；若 status 非 'pending'，幂等返回（推送 done）；否则写入 message_context（成功时 `{type:'tool_result', tool_use_id, content: JSON.stringify(result)}`，失败时 `{error}`）和 status='completed'；调用 `dispatchNextClientTool`，若有下一个 client tool 则推送其 client_call 并结束；若无，调用 `mergeToolResults`，从 t_message 重建上下文（调用 `reconstructNativeMessages`），继续 `runLoop`（不再传 startToolCallCount）
- [x] 5.11 修改 `runLlmTurn` 历史重建调用：使用 `reconstructNativeMessages(history)`，删除旧的 `.map()` 逻辑；调用 `runLoop` 时删除最后一个参数（不再传 toolCallCount，loop 内部从 messages 重新计算）
- [x] 5.12 删除 `countToolUseRounds` 函数（不再需要，loop 直接用 toolCallCount 计数器）
- [x] 5.13 更新 `session.service.spec.ts`：删除 `countToolUseRounds` 测试；更新 `parseToolName` 测试（如有）

## 6. 前端类型定义

- [x] 6.1 修改 `packages/web/src/app/pages/chat/types.ts`：`Message` 接口增加 `nativeContent?: any` 和 `messageRole?: string` 字段

## 7. 前端 Native Content 渲染组件（新建）

- [ ] 7.1 创建 `packages/web/src/app/pages/chat/native-content.tsx`：导出 `NativeContentView` 组件，props `{ blocks: any[] }`
- [ ] 7.2 实现 text 块渲染：`<pre>{block.text}</pre>`
- [ ] 7.3 实现 tool_use 块渲染：标题 "Tool Use: {block.name}"，参数 JSON.stringify(block.input, null, 2)
- [ ] 7.4 实现 tool_result 块渲染：标题 "Tool Result ({block.tool_use_id})" + (is_error ? " [Error]" : "")，内容 block.content，错误时红色样式
- [ ] 7.5 添加块之间的视觉分隔（border-top 或 margin）

## 8. 前端 Thought Message 修改

- [ ] 8.1 修改 `thought-message.tsx`：props 增加 `nativeContent?: any`
- [ ] 8.2 修改标题行：不再固定显示 "Thought"，改为显示 `content`
- [ ] 8.3 修改展开内容：若 `nativeContent` 存在且为数组，渲染 `<NativeContentView blocks={nativeContent} />`；否则回退显示 `content` 纯文本
- [ ] 8.4 保持灯泡图标和折叠/展开交互不变

## 9. 前端 Chat Page 修改

- [ ] 9.1 修改 `chat-page.tsx` 消息渲染：对 `isThought=0` 的普通消息气泡，右上角添加折叠/展开图标（chevron-down / chevron-up）
- [ ] 9.2 添加状态：`const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set())`，跟踪哪些消息的 native_content 是展开的
- [ ] 9.3 实现图标点击 handler：切换该消息 id 在 expandedMessages 中的存在性
- [ ] 9.4 在气泡下方条件渲染：`{expandedMessages.has(msg.id) && msg.nativeContent && <NativeContentView blocks={Array.isArray(msg.nativeContent) ? msg.nativeContent : [msg.nativeContent]} />}`
- [ ] 9.5 修改 `client_call` SSE 事件处理：解析 `data.toolUseId`，与 `callId` 一起存储到状态 `pendingClientTool: { callId, toolUseId, toolName }`
- [ ] 9.6 修改 `streamMessage` / client tool 执行后的 POST：body 增加 `toolUseId: pendingClientTool.toolUseId`

## 10. 前端 Client Tool Executor 修改

- [ ] 10.1 修改 `client-tool-executor.ts` / `tool-area-bridge.ts`：透传 `toolUseId` 从 `client_call` 事件到结果回传的 POST body

## 11. 单元测试更新

- [ ] 11.1 更新 `session.service.spec.ts`：删除 `countToolUseRounds` 测试，删除 `parseToolName` 中的 turnId 相关断言（如有）
- [ ] 11.2 更新 `llm.service.spec.ts`：修改涉及 `LlmTurn.tool_use` 的测试，改为 `toolUses` 数组断言
- [ ] 11.3 运行 `npx vitest run` 确保所有测试通过

## 12. 编译与构建验证

- [ ] 12.1 运行 `npx tsc --noEmit -p packages/api/tsconfig.app.json` 确保后端无类型错误
- [ ] 12.2 运行 `npx tsc --noEmit -p packages/web/tsconfig.app.json` 确保前端无类型错误
- [ ] 12.3 运行 `npx nx build api` 确保后端构建成功
- [ ] 12.4 运行 `npx nx build web` 确保前端构建成功

## 13. 集成测试（手动）

- [ ] 13.1 启动开发环境（API + Web + MCP 服务器）
- [ ] 13.2 测试场景：单个 MCP tool 调用 → 验证 1 个 assistant tool_use Thought + 1 个 user tool_result Thought + LLM 继续回复
- [ ] 13.3 测试场景：单个 Client tool 调用 → 验证 client_call SSE 携带 toolUseId，浏览器回传 toolUseId，恢复正常
- [ ] 13.4 测试场景：多个 MCP tools（并行）→ 验证 1 个 assistant Thought 包含多个 tool_use，1 个 user Thought 包含多个 tool_result
- [ ] 13.5 测试场景：多个 Client tools（串行派发）→ 验证收到第一个 client_call，返回后收到第二个 client_call，全部返回后合并
- [ ] 13.6 测试场景：混合 MCP + Client tools → 验证 MCP 即时执行，Client 串行派发，最终合并成 1 个 user Thought
- [ ] 13.7 测试场景：Client tool 返回后再发第二条用户消息 → 验证 LLM 上下文包含完整的 tool_use + tool_result（不再 `gateway.upstream_unavailable`）
- [ ] 13.8 测试场景：点击 Thought 展开 native_content → 验证渲染 tool_use / tool_result 块
- [ ] 13.9 测试场景：点击普通消息气泡的展开图标 → 验证渲染 native_content
- [ ] 13.10 查询 `t_message` 表：验证 assistant tool_use 行（is_thought=1, native_content 包含 tool_use）、user tool_result 行（is_thought=1, message_role='user', native_content 包含 tool_result）都存在
- [ ] 13.11 查询 `t_pending_client_call` 表：验证多个 tool_use 共享 call_id，各自 tool_use_id，message_context 只存单个 tool_result 对象

## 14. 文档更新

- [ ] 14.1 更新 `docs/too-use-result.md`：合并本次 OpenSpec 设计的 4 个补齐点
- [ ] 14.2 归档 `docs/fix-gateway-error-migration-guide.md` / `docs/native-content-migration-summary.md`（标记为过时，指向新的 OpenSpec）
- [ ] 14.3 归档 `docs/QUICK-TEST-GUIDE.md`（指向 OpenSpec tasks 作为新的测试指南）
