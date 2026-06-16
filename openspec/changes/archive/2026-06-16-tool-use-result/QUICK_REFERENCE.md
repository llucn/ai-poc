# Quick Reference - Tool Use Result Fix

## What Was Fixed

**Problem**: Anthropic API returned `gateway.upstream_unavailable` error after tool calls because tool_use and tool_result blocks were missing from conversation history.

**Root Cause**: `reconstructNativeMessages()` was skipping `isThought=1` rows, which contained all tool_use and tool_result blocks.

**Solution**: Remove the `isThought` filter and properly reconstruct complete conversation history including all tool interactions.

## Key Code Changes

### 1. Context Reconstruction (The Fix)
```typescript
// BEFORE (BROKEN)
for (const row of rows) {
  if (row.isThought === 1) continue; // ❌ Skipped tool blocks!
  // ...
}

// AFTER (FIXED)
for (const row of rows) {
  // ✅ Include ALL rows - isThought is UI-only
  // ...
}
```

### 2. Parallel Tool Use Support
```typescript
// BEFORE (Single tool)
type LlmTurn = 
  | { kind: 'tool_use'; toolUseId: string; toolName: string; input: unknown; ... }

// AFTER (Multiple tools)
type LlmTurn = 
  | { kind: 'tool_use'; toolUses: Array<{id, name, input}>; ... }
```

### 3. Composite Unique Key
```typescript
// BEFORE
@Index('call_id', { unique: true })

// AFTER
@Index(['callId', 'toolUseId'], { unique: true })
```

## Database Schema Changes

### message.entity.ts
- ❌ Removed: `turnId` field (no longer needed)

### pending-client-call.entity.ts
- ✅ Changed: `call_id` unique index → composite `(call_id, tool_use_id)` unique index
- ✅ Updated: `message_context` type for single tool_result format

### session.dto.ts
- ✅ Added: `toolUseId: string` to `ClientResultDto`

## API Changes

### Request/Response Format

**Client Tool Result (POST /sessions/:id/result)**
```typescript
// BEFORE
{ callId: "uuid", result: {...}, error?: string }

// AFTER (Added toolUseId)
{ callId: "uuid", toolUseId: "toolu_xxx", result: {...}, error?: string }
```

**SSE Event Format**
```typescript
// client_call event now includes toolUseId
{
  callId: "uuid",
  toolUseId: "toolu_xxx",  // NEW
  toolName: "client__7__select-users",
  params: {...}
}
```

## Migration Notes

### For Existing Data

If you have existing sessions with pending client calls:

```sql
-- Option 1: Clear pending calls (safe, forces users to retry)
DELETE FROM t_pending_client_call WHERE status = 'pending';

-- Option 2: Backfill tool_use_id from message_context (if available)
-- Requires custom migration script based on your data
```

### For Frontend

Update client tool handler:
```typescript
// Listen for client_call event
eventSource.addEventListener('client_call', (e) => {
  const { callId, toolUseId, toolName, params } = JSON.parse(e.data);
  
  // Execute tool
  const result = await executeClientTool(toolName, params);
  
  // POST result with toolUseId
  await fetch(`/sessions/${sessionId}/result`, {
    method: 'POST',
    body: JSON.stringify({ callId, toolUseId, result })  // Include toolUseId
  });
});
```

## Testing

### Verify the Fix

```bash
# 1. Compile
npx tsc --noEmit -p packages/api/tsconfig.app.json

# 2. Run tests
npx vitest run

# 3. Build
npx nx build api
```

### Manual Testing Scenarios

1. **Single MCP tool** - Basic tool call and response
2. **Multiple parallel MCP tools** - LLM calls 2+ tools in one turn
3. **Client tool + resume** - Browser executes tool and resumes
4. **Mixed tools** - MCP + Client tools in same turn
5. **Long conversation** - Multiple tool turns, verify context preserved

## Troubleshooting

### Error: "Pending client call not found"
- Cause: Missing `toolUseId` in POST body
- Fix: Include `toolUseId` from the `client_call` SSE event

### Error: "Duplicate key violation on (call_id, tool_use_id)"
- Cause: Attempting to create duplicate pending record
- Fix: Check if tool already executed, or clear stale pending records

### Error: "gateway.upstream_unavailable" still occurring
- Cause: Old sessions with incomplete context
- Fix: Start a new session to test with fresh context

## Files Modified

**Backend Core** (7 files):
- `llm/llm.service.ts` - Parallel tool use
- `session/message.entity.ts` - Remove turnId
- `session/pending-client-call.entity.ts` - Composite key
- `session/session.dto.ts` - Add toolUseId
- `session/message-native.helper.ts` - **ROOT FIX HERE**
- `session/session.service.ts` - Complete rewrite
- `session/session.service.spec.ts` - Test cleanup

**Frontend** (1 file, partial):
- `web/src/app/pages/chat/types.ts` - Extended Message type

## What's Next

Frontend updates needed (see tasks.md phases 6-7):
- Update chat service for new SSE format
- Support parallel tool execution in UI
- Update client tool dispatcher
- Add UI for expanded tool context view

Backend is **complete and functional** - the bug is fixed!
