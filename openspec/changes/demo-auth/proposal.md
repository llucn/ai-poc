## Why

AI POC is a demonstration system that doesn't require real authentication. The current OIDC and JWT authentication adds unnecessary complexity for a demo environment. We need a simpler approach that lets users quickly switch between different user roles to demonstrate the system's RBAC capabilities without authentication overhead.

## What Changes

- Remove OIDC authentication flow and all related routing/configuration
- Remove JWT token generation, validation, and middleware from both web and api packages
- Add a mock login page that displays all users from database, allowing one-click login without credentials
- Replace JWT authentication with a simple header-based user identity mechanism (username + role in plain text)
- Create user management functionality (CRUD operations) for managing mock users
- Maintain existing RBAC authorization system (only authentication mechanism changes)

## Capabilities

### New Capabilities
- `demo-auth`: Mock authentication system with header-based user identity and mock login UI
- `user-management`: CRUD operations and UI for managing demo users (name, email, role, skill matrix, availability)

### Modified Capabilities
- `rbac`: Change authentication mechanism from JWT validation to header parsing, keep authorization logic unchanged
- `web-shell`: Remove OIDC login routes and update useApiFetch hook to send user identity headers

## Impact

**API Package:**
- Remove JWT verification middleware and OIDC configuration
- Add header-based authentication middleware to extract user identity
- Add new user management endpoints (GET, POST, PUT, DELETE for users)
- Update auth decorators/guards to work with header-based user identity

**Web Package:**
- Remove OIDC login flow and related routes
- Add new mock login page displaying all users
- Update useApiFetch hook to include user identity headers (username, role)
- Add user management pages (list, detail, add, edit)
- Add Settings -> Users menu entry

**Database:**
- Add new table `t_user` for storing mock user data

**Configuration:**
- Remove OIDC-related environment variables and configuration files
