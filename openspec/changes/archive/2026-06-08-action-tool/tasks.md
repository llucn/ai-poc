## 1. Backend - MCP Client Service

- [x] 1.1 Create `packages/api/src/app/mcp/` module directory
- [x] 1.2 Create `mcp-client.service.ts` with `@Injectable()` decorator
- [x] 1.3 Move `mcpRpc`, `parseSseJsonRpc` private methods from `agent.service.ts` to `McpClientService`
- [x] 1.4 Add `callTool(serverUrl: string, toolName: string, params: unknown): Promise<unknown>` method to `McpClientService`
- [x] 1.5 Implement `callTool` using `tools/call` JSON-RPC method (similar to `fetchMcpSchema` but calling `tools/call` instead of `tools/list`)
- [x] 1.6 Handle both `application/json` and `text/event-stream` responses in `callTool`
- [x] 1.7 Create `mcp.module.ts` exporting `McpClientService`
- [x] 1.8 Update `agent.module.ts` to import `McpModule`
- [x] 1.9 Update `agent.service.ts` to inject `McpClientService` and use it for `fetchMcpSchema`
- [x] 1.10 Update `session.module.ts` to import `McpModule`

## 2. Backend - Tool Name Parsing

- [x] 2.1 Create `parseToolName(tool: string): { agentToolId: number; toolName: string } | null` utility function in `session.service.ts`
- [x] 2.2 Implement regex parsing `/^mcp__(\d+)__(.+)$/` to extract agent tool ID and tool name
- [x] 2.3 Return `null` if the tool string doesn't match the expected format
- [ ] 2.4 Add unit test cases for standard tool names, tool names with underscores, and invalid formats

## 3. Backend - Observation Message Construction

- [x] 3.1 Create `buildObservationContent(result: unknown): string` utility function in `session.service.ts`
- [x] 3.2 Implement JSON stringification of result into `{"observation": <result>}` format
- [x] 3.3 Create `buildErrorObservationContent(error: Error | string): string` utility function
- [x] 3.4 Implement error wrapping into `{"observation": "Error: <message>"}` format

## 4. Backend - Action Detection in parseAssistantReply

- [x] 4.1 Update `parseAssistantReply` to return type `{ type: 'final_answer' | 'action' | 'error'; content: string; actionData?: { tool: string; params: unknown } }`
- [x] 4.2 Parse LLM output JSON and detect `final_answer`, `action`, or neither
- [x] 4.3 If `action` exists, extract `tool` and `params` fields and return `{ type: 'action', content: JSON.stringify(action), actionData: { tool, params } }`
- [x] 4.4 If `final_answer` exists, return `{ type: 'final_answer', content: <value> }` (existing behavior)
- [x] 4.5 If neither, return `{ type: 'error', content: <error message> }` (existing behavior)

## 5. Backend - Multi-turn Loop in runLlmTurn

- [x] 5.1 Refactor `runLlmTurn` signature to accept `res: Response` parameter for SSE streaming
- [x] 5.2 Change `runLlmTurn` from single LLM call to `while (true)` loop
- [x] 5.3 Add loop counter `toolCallCount` initialized to `0`
- [x] 5.4 Each iteration: call LLM, save thought message (raw output), push `thought_created` SSE event
- [x] 5.5 Parse LLM output with updated `parseAssistantReply`
- [x] 5.6 If result type is `final_answer`, save assistant message (parsed content), push `message_created` SSE event, break loop
- [x] 5.7 If result type is `action`, proceed to tool execution (step 6)
- [x] 5.8 If result type is `error`, push `error` SSE event, break loop
- [x] 5.9 Check if `toolCallCount >= 20` before each tool call; if true, push `error` SSE event with "Tool call limit exceeded" message, break loop

## 6. Backend - MCP Tool Execution in Loop

- [x] 6.1 When `parseAssistantReply` returns `action`, parse tool name with `parseToolName`
- [x] 6.2 If tool name parse fails, construct error observation, save as thought message, push `thought_created` event, append to history, continue loop
- [x] 6.3 Query `t_agent_tool` table with parsed `agentToolId` to get `server_url`
- [x] 6.4 If agent tool not found, construct error observation, save as thought message, push `thought_created` event, append to history, continue loop
- [x] 6.5 Call `mcpClientService.callTool(serverUrl, toolName, params)`
- [x] 6.6 If tool call succeeds, construct observation with `buildObservationContent(result)`
- [x] 6.7 If tool call fails, construct observation with `buildErrorObservationContent(error)`
- [x] 6.8 Save observation as thought message (`isThought=1`, `userName='ASSISTANT'`)
- [x] 6.9 Push `thought_created` SSE event with observation message
- [x] 6.10 Append observation message content to LLM history (`role: 'assistant'`)
- [x] 6.11 Increment `toolCallCount` by 1
- [x] 6.12 Continue loop (next iteration calls LLM with updated history including observation)

## 7. Backend - Update createMessage

- [x] 7.1 Update `createMessage` to pass `res` parameter to `runLlmTurn`
- [x] 7.2 Remove the SSE push logic from `createMessage` (now handled inside `runLlmTurn`)
- [x] 7.3 Update error handling to push `error` SSE event if `runLlmTurn` throws

## 8. Backend - AgentToolRepository Injection

- [x] 8.1 Inject `AgentToolEntity` repository into `SessionService` constructor
- [x] 8.2 Use repository to query agent tool by ID in tool execution step

## 9. Testing and Verification

_(Runtime verification — requires running API + LLM + MCP servers locally; build-level verification done.)_

- [ ] 9.1 Test single tool call → final answer (e.g., weather query)
- [ ] 9.2 Test multi-turn tool calling (LLM makes multiple tool calls before final answer)
- [ ] 9.3 Test tool call limit (verify loop terminates at 20 calls with error event)
- [ ] 9.4 Test tool execution error (MCP server error or timeout)
- [ ] 9.5 Test invalid tool name format (verify error observation)
- [ ] 9.6 Test agent tool ID not found (verify error observation)
- [ ] 9.7 Verify SSE events stream correctly (thought_created for each thought and observation, message_created for final reply)
- [ ] 9.8 Verify frontend renders observations as collapsible thought messages
- [ ] 9.9 Test existing non-action flows (pure final_answer) still work unchanged
- [ ] 9.10 Check database: observations saved as thought messages with correct timestamps

## 10. Documentation

- [x] 10.1 Update API documentation for SSE event flow (multiple thought_created events during tool calling)
- [x] 10.2 Add code comments explaining the tool calling loop structure in `runLlmTurn`
- [x] 10.3 Document the tool name format (`mcp__${id}__${toolName}`) in code comments
- [x] 10.4 Update `docs/action-tool.md` to reflect "completed" status or archive it
