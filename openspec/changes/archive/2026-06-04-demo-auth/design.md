## Context

AI POC is a demonstration system using NestJS API and React web frontend. Currently uses AWS Cognito OIDC for authentication with JWT validation on the API side. The system has RBAC (role-based access control) that checks roles from JWT `cognito:groups` claim.

For demo purposes, we need to simplify authentication to allow quick role switching without real credentials. The goal is to remove the OIDC/JWT complexity while maintaining the existing RBAC authorization system.

## Goals / Non-Goals

**Goals:**
- Remove all OIDC/Cognito authentication infrastructure
- Replace JWT-based identity with simple header-based mechanism
- Provide a mock login UI that displays all users from database
- Allow one-click login without password entry
- Maintain existing RBAC authorization logic (only change identity source)
- Add full CRUD for managing mock users (SYSTEM_ADMIN only)

**Non-Goals:**
- Real authentication or credential validation
- Production-ready security
- Session management beyond in-memory web app state
- Multi-factor authentication or password reset flows
- Migration path to restore OIDC (this is a permanent simplification for demo)

## Decisions

### Decision 1: Header-based authentication over session cookies

**Choice:** Use custom HTTP headers (`X-User-Name`, `X-User-Role`) to transmit user identity.

**Rationale:** 
- Simpler than managing server-side sessions or cookies
- Makes identity explicit in every request for demo transparency
- No need for session store or distributed session management
- Easy to inspect in browser dev tools for debugging

**Alternatives considered:**
- Session cookies: Adds complexity with session store; overkill for demo
- Continue using JWT without validation: Still requires JWT library and complexity

### Decision 2: Store mock users in MySQL t_user table

**Choice:** Create a dedicated `t_user` table with fields for name, display_name, email, role, skill_matrix, is_available, and audit fields.

**Rationale:**
- Centralizes user data for both login display and user management
- Allows dynamic user creation/editing without code changes
- Consistent with project's existing MySQL-based persistence
- Supports role-based filtering and availability status

**Alternatives considered:**
- Hardcoded user list: Less flexible, requires code changes to add users
- JSON config file: Harder to query and filter, no transactional guarantees

### Decision 3: Keep RBAC guards and decorators, change data source only

**Choice:** Retain existing `@Roles()` decorator and `RolesGuard`, modify only to read from `request.user.role` instead of `cognito:groups`.

**Rationale:**
- Minimizes code changes to authorization logic
- All existing `@Roles()` annotations remain valid
- Authorization rules don't change, just the identity mechanism
- Clear separation: authentication mechanism changes, authorization logic stays

**Alternatives considered:**
- Rewrite RBAC from scratch: Unnecessary risk and effort when only identity source changes
- Remove role checks entirely: Defeats the purpose of demonstrating RBAC

### Decision 4: Web app stores user identity in React context/state

**Choice:** After mock login, store selected user's identity (username, role, display_name) in React context or global state (e.g., Zustand, Redux, or Context API).

**Rationale:**
- Simple in-memory state management for single-page app
- No server-side session needed
- Easy to access from any component or hook
- Lost on page reload (acceptable for demo; redirects to login)

**Alternatives considered:**
- localStorage: Persists across reloads but adds complexity for logout and stale data
- URL parameters: Exposes identity in URL; less clean

### Decision 5: Custom authentication middleware replaces JWT middleware

**Choice:** Create a new NestJS guard/middleware that extracts `X-User-Name` and `X-User-Role` headers and populates `request.user`.

**Rationale:**
- Centralizes header parsing logic
- Integrates cleanly with existing NestJS guard pipeline
- Can be applied globally like the old JWT guard
- `@Public()` decorator can still bypass authentication

**Alternatives considered:**
- Parse headers in each controller: Violates DRY, error-prone
- Modify existing JWT guard: Cleaner to replace entirely to avoid confusion

### Decision 6: User management API and UI for SYSTEM_ADMIN only

**Choice:** Protect all user CRUD endpoints with `@Roles('SYSTEM_ADMIN')` and hide the Settings → Users menu for non-admins.

**Rationale:**
- Consistent with existing RBAC patterns (e.g., Issue Category is ADMIN-only)
- Prevents demo users from accidentally deleting users they need for testing
- Demonstrates role-based UI hiding in the web app

**Alternatives considered:**
- Allow all users to manage users: Too permissive for demo scenarios
- Separate admin interface: Overcomplicates a simple demo feature

## Risks / Trade-offs

**[Risk] Headers can be spoofed by clients** → Mitigation: Acceptable for demo environment. Document clearly that this is NOT production-ready. Add comment in code warning against using in production.

**[Risk] User identity lost on page reload** → Mitigation: Acceptable for demo. User simply logs in again from mock login page. Consider adding localStorage persistence as a future enhancement if needed.

**[Risk] No OIDC/JWT path back if requirements change** → Mitigation: This is a permanent demo simplification. If real auth is needed later, treat as a new feature rather than "reverting."

**[Risk] Name uniqueness constraint can be violated by concurrent inserts** → Mitigation: Database unique index on `name` column will reject duplicates. API returns 409 conflict error.

**[Trade-off] Removing OIDC makes this unsuitable for any production use** → Acceptable: This is explicitly a demo-only system per requirements.

**[Trade-off] In-memory session means users logged out on refresh** → Acceptable: Adds minimal friction in demo scenarios. Users can quickly log back in.

## Migration Plan

### Phase 1: Database and API changes
1. Create `t_user` table with migration script
2. Seed initial demo users (at least one SYSTEM_ADMIN)
3. Implement user CRUD endpoints with `@Roles('SYSTEM_ADMIN')` protection
4. Replace JWT guard with header-based authentication guard
5. Update `@CurrentUser()` decorator to populate from headers
6. Update `RolesGuard` to read from `request.user.role` instead of `cognito:groups`
7. Remove JWT-related configuration, dependencies, and middleware

### Phase 2: Web app changes
8. Remove OIDC provider configuration and dependencies
9. Create user context/state management for storing logged-in user
10. Implement mock login page (GET all users, display as cards)
11. Update `useApiFetch` hook to include `X-User-Name` and `X-User-Role` headers
12. Implement user management pages (All Users, User Detail, Add User, Edit User)
13. Add Settings → Users menu entry with role-based visibility
14. Update topbar to show user's display_name from context
15. Update logout to clear user context and navigate to login page

### Phase 3: Cleanup
16. Remove all OIDC-related routes (callback, logout redirect)
17. Remove unused OIDC environment variables from `.env.example`
18. Remove OIDC-related npm packages
19. Update documentation to reflect mock authentication approach

### Rollback Strategy
If issues arise, rollback is difficult since this removes infrastructure. Instead:
- Keep feature branch separate until fully tested
- Test all RBAC scenarios (SYSTEM_ADMIN, TECHNICIAN, SUPERVISOR, CUSTOMER roles)
- Verify all protected routes return 403 for unauthorized roles
- If critical issues found, fix forward rather than rollback (no production users exist)

## Open Questions

**Q: Should user identity persist across page reloads?**
A: Start without persistence (redirect to login on reload). Add localStorage if user feedback indicates it's needed.

**Q: What initial users should be seeded?**
A: At least one of each role (SYSTEM_ADMIN, TECHNICIAN, SUPERVISOR, CUSTOMER) for demo purposes. Exact users can be defined in seed script.

**Q: Should we keep the existing user profile page or build a new one?**
A: Keep existing profile page structure, just update data source from OIDC claims to user context.

**Q: Should deleted users be soft-deleted or hard-deleted?**
A: Hard delete (remove from database). This is a demo system with no audit requirements. The `is_available` flag can be used for soft-disable if needed.
