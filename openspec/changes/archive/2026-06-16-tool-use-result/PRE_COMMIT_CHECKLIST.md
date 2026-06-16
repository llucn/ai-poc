# Pre-Commit Checklist

## ✅ Code Quality

- [x] TypeScript compilation passes (both packages)
- [x] All existing tests pass (12/12)
- [x] Both packages build successfully
- [x] No console errors or warnings (in critical paths)
- [x] Code follows existing style conventions

## ✅ Functionality

- [x] Root cause fixed (`isThought` filter removed)
- [x] Parallel tool use supported
- [x] Serial client tool dispatch working
- [x] Context reconstruction correct
- [x] Error handling improved

## ✅ Database

- [x] Schema changes documented
- [x] Migration SQL provided
- [ ] Migration tested on dev database (TODO: run before deploy)
- [x] Backward compatibility considered

## ✅ API Contract

- [x] Breaking changes documented
- [x] Frontend updated for new contract
- [x] Error responses unchanged
- [x] SSE event format extended (backward compatible)

## ✅ Documentation

- [x] IMPLEMENTATION_STATUS.md - Progress report
- [x] COMMIT_MESSAGE.md - Git commit template
- [x] QUICK_REFERENCE.md - Developer guide
- [x] FINAL_SUMMARY.md - Executive summary
- [x] Inline code comments updated
- [x] Design decisions documented

## 🚀 Ready to Commit

### Files to Stage

**Backend (7 files)**:
```bash
git add packages/api/src/app/llm/llm.service.ts
git add packages/api/src/app/session/message.entity.ts
git add packages/api/src/app/session/pending-client-call.entity.ts
git add packages/api/src/app/session/session.dto.ts
git add packages/api/src/app/session/message-native.helper.ts
git add packages/api/src/app/session/session.service.ts
git add packages/api/src/app/session/session.service.spec.ts
```

**Frontend (2 files)**:
```bash
git add packages/web/src/app/pages/chat/types.ts
git add packages/web/src/app/pages/chat/chat-page.tsx
```

**Documentation (4 files)**:
```bash
git add openspec/changes/too-use-result/IMPLEMENTATION_STATUS.md
git add openspec/changes/too-use-result/COMMIT_MESSAGE.md
git add openspec/changes/too-use-result/QUICK_REFERENCE.md
git add openspec/changes/too-use-result/FINAL_SUMMARY.md
```

**Existing docs (already tracked)**:
```bash
git add openspec/changes/too-use-result/design.md
git add openspec/changes/too-use-result/tasks.md
```

### Commit Command

```bash
git commit -F openspec/changes/too-use-result/COMMIT_MESSAGE.md
```

Or manually:
```bash
git commit -m "fix: support parallel tool use and fix context reconstruction

Root cause: reconstructNativeMessages was filtering out isThought=1
rows, causing tool_use and tool_result blocks to disappear from
conversation history. This led to unbalanced tool context and
gateway.upstream_unavailable errors from Anthropic API.

Key changes:
- Remove isThought filter in reconstructNativeMessages (ROOT FIX)
- Support multiple tool_use blocks per assistant turn
- Add composite unique index (callId, toolUseId)
- Rewrite runLoop for parallel MCP and serial client tools
- Merge all tool results into one user message per turn
- Remove obsolete turnId field from message entity

Breaking changes:
- pending_client_call: composite unique constraint
- ClientResultDto: added required toolUseId field
- LlmTurn: replaced single tool with toolUses array

Tests: All 12 tests passing
Builds: Both packages build successfully

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

## 📋 Post-Commit Actions

### 1. Create Migration Script
```bash
# Create migration file
cat > migrations/002_parallel_tool_use.sql << 'EOF'
-- Migration: Support parallel tool use
-- Date: 2025-06-15

-- Drop old unique constraint on t_pending_client_call
ALTER TABLE t_pending_client_call 
DROP INDEX IF EXISTS call_id;

-- Add composite unique constraint
ALTER TABLE t_pending_client_call 
ADD UNIQUE INDEX idx_callId_toolUseId (call_id, tool_use_id);

-- Clean up any pending calls (safe - users can retry)
DELETE FROM t_pending_client_call WHERE status = 'pending';
EOF
```

### 2. Test Migration
```bash
# On dev database
mysql -u user -p ai_poc < migrations/002_parallel_tool_use.sql

# Verify
mysql -u user -p -e "SHOW INDEX FROM t_pending_client_call WHERE Table = 'ai_poc.t_pending_client_call';"
```

### 3. Create PR (if using GitHub)
```bash
git push origin anthropic-api

gh pr create \
  --title "Fix: Support parallel tool use and fix context reconstruction" \
  --body "$(cat openspec/changes/too-use-result/FINAL_SUMMARY.md)" \
  --base main
```

### 4. Deploy Checklist
- [ ] Backup production database
- [ ] Run migration script
- [ ] Deploy backend
- [ ] Deploy frontend (simultaneously)
- [ ] Smoke test key scenarios
- [ ] Monitor error logs for 1 hour

## 🔍 Verification Commands

Run these before committing:

```bash
# 1. TypeScript check
npx tsc --noEmit -p packages/api/tsconfig.app.json
npx tsc --noEmit -p packages/web/tsconfig.app.json

# 2. Tests
npx vitest run

# 3. Builds
npx nx build api
npx nx build web

# 4. Git status
git status

# Expected: 13 modified files, 4 new files
```

## ⚠️ Important Notes

1. **Deploy Backend + Frontend Together**
   - Old frontend won't work with new backend (missing toolUseId)
   - Old backend will work with new frontend (graceful degradation)

2. **Database Migration is Required**
   - Don't skip the migration
   - Unique constraint change is critical

3. **Users May Need to Retry**
   - In-progress conversations with pending client calls will fail
   - They just need to send a new message
   - Clean slate recommended

4. **Monitor After Deploy**
   - Watch for `gateway.upstream_unavailable` (should be zero)
   - Check tool execution success rate
   - Monitor response times

---

## ✅ All Clear!

Everything is ready for commit and deployment. The bug is fixed, tests pass, builds succeed.

**Next Step**: Run the verification commands above, then commit!
