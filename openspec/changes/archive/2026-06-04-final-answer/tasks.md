## 1. 实现解析函数

- [x] 1.1 在 `session.service.ts` 模块内实现纯函数 `parseAssistantReply(llmOutput: string): string`
- [x] 1.2 实现解析失败分支：`JSON.parse` 抛错时返回错误信息字符串
- [x] 1.3 实现 `final_answer` 分支：第一层含 `final_answer` 时返回其值（非字符串则 `JSON.stringify`）
- [x] 1.4 实现 `action` 兜底分支：无 `final_answer` 但含 `action` 时返回其值（字符串直用，对象序列化）
- [x] 1.5 实现「既无 final_answer 也无 action」分支：返回缺字段的错误提示

## 2. 接入两个流程

- [x] 2.1 在 `createSessionWithFirstMessage` 中将 assistant reply 的 content 改为 `parseAssistantReply(llmOutput)`，Thought 保持 `llmOutput` 原文
- [x] 2.2 在 `createMessage` 中将 assistant reply 的 content 改为 `parseAssistantReply(llmOutput)`，Thought 保持 `llmOutput` 原文

## 3. 验证

- [x] 3.1 运行 `npx tsc --noEmit` 确认无类型错误
- [x] 3.2 运行 `npx nx build api` 确认构建通过
- [ ] 3.3 手动验证：LLM 返回 `final_answer` 时，界面 reply 显示 final_answer 文本，Thought 仍显示原始 JSON
