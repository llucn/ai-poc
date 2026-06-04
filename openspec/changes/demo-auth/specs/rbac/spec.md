## MODIFIED Requirements

### Requirement: Header-based user identity is the source of truth for roles

The system SHALL treat the role value from the `X-User-Role` request header as the user's role for the purposes of authorization. Roles MUST be read from the authenticated user object (`request.user.role`) populated by the header-based authentication middleware. The system MUST NOT maintain a parallel roles table in its own database for the gates covered by this capability; if the `X-User-Role` header is missing or the user is not authenticated, the user has no role.

#### Scenario: Role present in request header

- **WHEN** a user makes a request with `X-User-Role: SYSTEM_ADMIN`
- **THEN** the user is treated as a member of the `SYSTEM_ADMIN` role for every authorization decision made for that request

#### Scenario: No role header

- **WHEN** a request arrives without the `X-User-Role` header
- **THEN** the user is treated as having no role (empty role), not `null` or `undefined`

#### Scenario: Role changes take effect immediately

- **WHEN** a user logs out and logs back in as a different user with a different role
- **THEN** the next request that includes the new role in `X-User-Role` reflects the new role membership

### Requirement: Roles are exposed through `@CurrentUser()` with role field

The API SHALL extend the user object attached by the authentication guard to include a `role: string` field. Handlers using `@CurrentUser() user` MUST be able to read `user.role` as a `string` (an empty string or undefined when the `X-User-Role` header is missing) without any header re-parsing. Handlers MUST NOT need to reach into the raw request headers themselves.

#### Scenario: Handler reads role via the decorator

- **WHEN** a handler is declared with `@CurrentUser() user` and the request has `X-User-Role: SYSTEM_ADMIN`
- **THEN** `user.role` is `'SYSTEM_ADMIN'`

#### Scenario: Missing header degrades to empty or undefined

- **WHEN** the request has no `X-User-Role` header
- **THEN** `user.role` is an empty string or `undefined` (not `null`)

### Requirement: Reusable `@Roles(...)` decorator and `RolesGuard`

The API SHALL provide a `@Roles(...roles: string[])` decorator (applicable at the class or method level) and a global `RolesGuard` that, after the authentication guard runs, rejects any request whose `request.user.role` is not in the required roles array. Endpoints with no `@Roles(...)` declaration MUST behave exactly as they did before this capability — the guard short-circuits to allow them. Endpoints marked `@Public()` MUST NOT trigger the roles guard.

#### Scenario: Required role present

- **WHEN** a handler is annotated `@Roles('SYSTEM_ADMIN')`, the request is authenticated, and `request.user.role` is `SYSTEM_ADMIN`
- **THEN** the handler executes normally

#### Scenario: Required role missing

- **WHEN** a handler is annotated `@Roles('SYSTEM_ADMIN')`, the request is authenticated, and `request.user.role` is `TECHNICIAN`
- **THEN** the API responds `403` and the handler is not invoked

#### Scenario: Multiple acceptable roles

- **WHEN** a handler is annotated `@Roles('SYSTEM_ADMIN', 'SUPERVISOR')` and the user's role is `SUPERVISOR`
- **THEN** the handler executes normally (any-of semantics)

#### Scenario: No role annotation

- **WHEN** a handler has no `@Roles(...)` annotation
- **THEN** the roles guard returns `true` and the handler executes regardless of the user's role (subject to the authentication guard)

#### Scenario: `@Public()` bypasses roles

- **WHEN** a handler is annotated both `@Public()` and `@Roles('SYSTEM_ADMIN')` (a configuration mistake)
- **THEN** the request reaches the handler — `@Public()` short-circuits both the authentication guard and the roles guard

#### Scenario: Class-level `@Roles` applies to every method

- **WHEN** a controller class is annotated `@Roles('SYSTEM_ADMIN')` and one of its methods has no method-level annotation
- **THEN** that method behaves as if it were also annotated `@Roles('SYSTEM_ADMIN')`

### Requirement: Web app exposes the current user's role

The web app SHALL provide a hook (e.g. `useUserRole()`) that returns the current user's role as a `string`. The hook MUST source its data from the active user session state stored after mock login, returning an empty string or undefined when no user is signed in. The hook MUST update when the user logs in or logs out.

#### Scenario: Signed-out user

- **WHEN** the `useUserRole()` hook is called while no user is logged in
- **THEN** the hook returns an empty string or `undefined`

#### Scenario: Signed-in user with role

- **WHEN** the `useUserRole()` hook is called while the logged-in user has role `SYSTEM_ADMIN`
- **THEN** the hook returns `'SYSTEM_ADMIN'`

#### Scenario: Hook updates on login

- **WHEN** a user logs in as a user with role `TECHNICIAN`
- **THEN** the `useUserRole()` hook returns `'TECHNICIAN'`

### Requirement: Web app gates routes by required role

The web app SHALL provide a route-level mechanism (e.g. `<RequireRole role="…">{children}</RequireRole>`) that renders its children only when the current user's role matches the required role. If the user does not have the required role, the wrapper MUST render a recognizable `403` placeholder instead of the protected content. The wrapper MUST NOT issue any API call that the protected page would have issued.

#### Scenario: Authorized user sees protected content

- **WHEN** a route element `<RequireRole role="SYSTEM_ADMIN"><AdminPage/></RequireRole>` is rendered and the current user has role `SYSTEM_ADMIN`
- **THEN** `<AdminPage/>` renders normally

#### Scenario: Unauthorized user sees the 403 placeholder

- **WHEN** a route element `<RequireRole role="SYSTEM_ADMIN"><AdminPage/></RequireRole>` is rendered and the current user has role `TECHNICIAN`
- **THEN** the route renders a visible `403` placeholder identifying the route as restricted; `<AdminPage/>` does not mount and issues no `useEffect`-driven API calls

## REMOVED Requirements

### Requirement: Cognito groups are the source of truth for roles

**Reason**: Removed OIDC/Cognito authentication in favor of header-based mock authentication for demo environment

**Migration**: Use `X-User-Role` header to specify the user's role. The API middleware extracts this header and populates `request.user.role`. No JWT or Cognito groups claim is involved.
