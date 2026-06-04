## 1. Database Setup

- [x] 1.1 Create t_user table migration script in docs/database.sql
- [x] 1.2 Add t_user table entity in packages/api/src/app/user/user.entity.ts
- [x] 1.3 Create database migration to add t_user table
- [x] 1.4 Create seed script with initial demo users (one per role)

## 2. API - User Management Module

- [x] 2.1 Create user module directory structure (user.module.ts, user.controller.ts, user.service.ts, user.dto.ts, user.entity.ts)
- [x] 2.2 Implement UserService with CRUD methods (findAll, findOne, create, update, delete)
- [x] 2.3 Implement pagination logic for findAll method
- [x] 2.4 Implement UserController with endpoints (GET /users, GET /users/:id, POST /users, PUT /users/:id, DELETE /users)
- [x] 2.5 Add DTOs for create/update user requests and validation
- [x] 2.6 Add unique name validation in create/update endpoints (return 409 on duplicate)
- [x] 2.7 Protect all user endpoints with @Roles('SYSTEM_ADMIN')
- [x] 2.8 Add auto-population of created_by, updated_by, created_on, updated_on fields
- [x] 2.9 Register UserModule in AppModule

## 3. API - Header-Based Authentication

- [x] 3.1 Create header-auth guard in packages/api/src/app/auth/header-auth.guard.ts
- [x] 3.2 Implement header extraction logic (X-User-Name, X-User-Role)
- [x] 3.3 Update @CurrentUser decorator to work with header-based user object
- [x] 3.4 Remove JWT verification logic from auth module
- [x] 3.5 Remove JWT-related configuration from app-config.ts
- [x] 3.6 Remove verifiers.provider.ts and JWKS/JWT dependencies
- [x] 3.7 Update RolesGuard to read from request.user.role instead of cognito:groups
- [x] 3.8 Update AuthModule to use header-auth guard instead of JWT guard
- [x] 3.9 Apply header-auth guard globally in main.ts or AppModule
- [x] 3.10 Remove unused JWT/OIDC npm packages from api package.json

## 4. API - Mock Login Endpoint

- [x] 4.1 Add @Public() GET endpoint /auth/users for mock login page (returns all users)
- [x] 4.2 Ensure mock login endpoint does not require authentication

## 5. Web - User Context and State Management

- [x] 5.1 Create user context in packages/web/src/contexts/UserContext.tsx
- [x] 5.2 Define user state interface (username, role, displayName, email)
- [x] 5.3 Implement login and logout functions in context
- [x] 5.4 Add useUser and useUserRole hooks
- [x] 5.5 Wrap app with UserContext provider

## 6. Web - Update API Fetch Hook

- [x] 6.1 Update useApiFetch hook to include X-User-Name and X-User-Role headers
- [x] 6.2 Read user identity from user context
- [x] 6.3 Omit headers when user is not logged in

## 7. Web - Mock Login Page

- [x] 7.1 Create login page component at packages/web/src/pages/Login.tsx
- [x] 7.2 Fetch all users from GET /auth/users endpoint
- [x] 7.3 Display users as cards showing name, email, role
- [x] 7.4 Implement click handler to store user in context and navigate to home
- [x] 7.5 Add login route to router (make it accessible without authentication)
- [x] 7.6 Redirect to login page when user is not authenticated

## 8. Web - Update Topbar

- [x] 8.1 Update topbar to read display_name from user context instead of OIDC claims
- [x] 8.2 Update avatar initials logic to use context display_name
- [x] 8.3 Update logout dropdown item to call context logout function
- [x] 8.4 Remove OIDC user references from topbar component

## 9. Web - Remove OIDC/JWT Infrastructure

- [x] 9.1 Remove OIDC provider setup from App.tsx or main entry
- [x] 9.2 Remove OIDC callback and logout redirect routes
- [x] 9.3 Remove OIDC configuration from environment variables and config files
- [x] 9.4 Remove unused OIDC/JWT npm packages from web package.json
- [x] 9.5 Remove useUserGroups hook and replace with useUserRole where needed

## 10. Web - Update Role-Based Components

- [x] 10.1 Update RequireRole component to read from useUserRole instead of OIDC groups
- [x] 10.2 Update sidebar menu role visibility logic to use useUserRole
- [ ] 10.3 Verify existing role-protected routes work with new auth mechanism

## 11. Web - User Management Pages

- [x] 11.1 Create All Users list page at packages/web/src/pages/settings/users/AllUsers.tsx
- [x] 11.2 Implement pagination controls for All Users page
- [x] 11.3 Add checkboxes and bulk delete functionality
- [x] 11.4 Add + Add and - Delete header buttons
- [x] 11.5 Implement delete confirmation dialog
- [x] 11.6 Create User Detail page at packages/web/src/pages/settings/users/UserDetail.tsx
- [x] 11.7 Add Edit and Delete buttons to User Detail page
- [x] 11.8 Create Add User page at packages/web/src/pages/settings/users/AddUser.tsx
- [x] 11.9 Add form validation for Add User (name uniqueness, required fields)
- [x] 11.10 Create Edit User page at packages/web/src/pages/settings/users/EditUser.tsx
- [x] 11.11 Add form validation for Edit User (name uniqueness excluding self)
- [x] 11.12 Implement role dropdown with SUPERVISOR, TECHNICIAN, SYSTEM_ADMIN, CUSTOMER options
- [x] 11.13 Implement is_available dropdown (Yes/No)
- [x] 11.14 Add multiline text input for skill_matrix field

## 12. Web - Settings Menu Update

- [x] 12.1 Add Users menu entry under Settings group in sidebar
- [x] 12.2 Make Users entry visible only to SYSTEM_ADMIN role
- [x] 12.3 Add route highlighting for user management pages
- [x] 12.4 Add routes for user management pages (/settings/users, /settings/users/:id, /settings/users/new, /settings/users/:id/edit)

## 13. Testing and Verification

- [ ] 13.1 Test mock login with all user roles
- [ ] 13.2 Verify API endpoints return 403 for non-SYSTEM_ADMIN roles
- [ ] 13.3 Verify user CRUD operations (create, read, update, delete)
- [ ] 13.4 Verify name uniqueness validation on create and update
- [ ] 13.5 Verify bulk delete functionality
- [ ] 13.6 Test logout clears user context and redirects to login
- [ ] 13.7 Verify Settings → Users menu only visible to SYSTEM_ADMIN
- [ ] 13.8 Test existing RBAC-protected routes with new auth mechanism
- [ ] 13.9 Verify topbar shows correct user display name and avatar initials
- [ ] 13.10 Test page reload behavior (should redirect to login)

## 14. Documentation and Cleanup

- [x] 14.1 Update .env.example files to remove OIDC configuration
- [x] 14.2 Update README with mock authentication approach
- [x] 14.3 Add code comments warning that header-based auth is not production-ready
- [x] 14.4 Remove any remaining OIDC-related code or comments
- [x] 14.5 Create implementation summary document
