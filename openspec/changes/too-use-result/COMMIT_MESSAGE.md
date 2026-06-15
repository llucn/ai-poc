# Commit Message

```
fix: support parallel tool use and fix context reconstruction

Root cause: `reconstructNativeMessages` was filtering out `isThought=1`
rows, causing tool_use and tool_result blocks to disappear from
conversation history. This led to unbalanced tool context and
"gateway.upstream_unavailable" errors from Anthropic API.

Key changes:
- Remove isThought filter in reconstructNativeMessages (ROOT FIX)
- Support multiple tool_use blocks per assistant turn (parallel tool use)
- Add composite unique index (callId, toolUseId) for pending client calls
- Rewrite runLoop to handle parallel MCP tools and serial client tools
- Merge all tool results into one user message per turn
- Remove obsolete turnId field from message entity

Design decisions (see design.md):
- D1: Complete context reconstruction (no filtering)
- D2: One DB row per turn (not per tool)
- D3-D8: Parallel tool use, composite keys, proper error mapping

Breaking changes:
- pending_client_call schema: removed unique constraint on call_id alone
- ClientResultDto: added required toolUseId field
- LlmTurn type: replaced single tool fields with toolUses array

Tests: ✅ All 12 tests passing
Compilation: ✅ TypeScript checks passing

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

## Verification Commands

```bash
# Check TypeScript compilation
npx tsc --noEmit -p packages/api/tsconfig.app.json

# Run tests
npx vitest run

# Build API
npx nx build api
```

## Frontend TODO

The backend fix is complete and functional, but frontend updates are needed:
- Update chat service to handle new SSE event format
- Support displaying merged tool results
- Handle parallel tool execution in UI
- Update client tool handler for serial dispatch

See tasks.md for detailed frontend task list (phases 6-7).
