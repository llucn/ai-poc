# rbac Specification

## Purpose
Reusable role-based access control on top of the existing Cognito JWT layer — a @Roles(...) decorator and a global RolesGuard that reads cognito:groups from the verified access token, plus the matching web-side useUserGroups() hook and RequireRole wrapper used to hide UI a user is not authorized to access.

## Requirements

### Requirement: Cognito groups are the source of truth for roles

The system SHALL treat membership in a Cognito group as the user's role for the purposes of authorization. Roles MUST be read from the verified access token's `cognito:groups` claim — a JSON array of group-name strings. The system MUST NOT maintain a parallel roles table in its own database for the gates covered by this capability; if a user is not in the relevant Cognito group at the moment their access token was minted, they are not authorized.

#### Scenario: Group present in access token

- **WHEN** a user signs in and Cognito issues an access token with `cognito:groups: ['ADMIN']`
- **THEN** the user is treated as a member of the `ADMIN` role for every authorization decision made against that token

#### Scenario: No groups claim

- **WHEN** the access token has no `cognito:groups` claim at all
- **THEN** the user is treated as having an empty role set (`[]`), not `null` or `undefined`

#### Scenario: Token rotation picks up new memberships

- **WHEN** a user is added to a Cognito group after they already have an active session, and their access token subsequently rotates (silent renewal or re-login)
- **THEN** the next request that uses the new token reflects the new group membership

### Requirement: Roles are exposed through `@CurrentUser()` as a typed string array

The API SHALL extend the user object attached by the authentication guard to include a `groups: string[]` field. Handlers using `@CurrentUser() user` MUST be able to read `user.groups` as `string[]` (an empty array when the access token has no `cognito:groups` claim) without any token re-parsing. Handlers MUST NOT need to reach into `accessClaims['cognito:groups']` themselves.

#### Scenario: Handler reads groups via the decorator

- **WHEN** a handler is declared with `@CurrentUser() user` and the access token has `cognito:groups: ['ADMIN', 'EDITOR']`
- **THEN** `user.groups` is `['ADMIN', 'EDITOR']`

#### Scenario: Missing claim degrades to empty array

- **WHEN** the access token has no `cognito:groups` claim
- **THEN** `user.groups` is `[]` (not `undefined`, not `null`)

### Requirement: Reusable `@Roles(...)` decorator and `RolesGuard`

The API SHALL provide a `@Roles(...roles: string[])` decorator (applicable at the class or method level) and a global `RolesGuard` that, after the authentication guard runs, rejects any request whose `request.user.groups` is disjoint from the required roles. Endpoints with no `@Roles(...)` declaration MUST behave exactly as they did before this capability — the guard short-circuits to allow them. Endpoints marked `@Public()` MUST NOT trigger the roles guard.

#### Scenario: Required role present

- **WHEN** a handler is annotated `@Roles('ADMIN')`, the request is authenticated, and `request.user.groups` includes `ADMIN`
- **THEN** the handler executes normally

#### Scenario: Required role missing

- **WHEN** a handler is annotated `@Roles('ADMIN')`, the request is authenticated, and `request.user.groups` does not include `ADMIN`
- **THEN** the API responds `403` and the handler is not invoked

#### Scenario: Multiple acceptable roles

- **WHEN** a handler is annotated `@Roles('ADMIN', 'AUDITOR')` and the user's groups include `AUDITOR` but not `ADMIN`
- **THEN** the handler executes normally (any-of semantics)

#### Scenario: No role annotation

- **WHEN** a handler has no `@Roles(...)` annotation
- **THEN** the roles guard returns `true` and the handler executes regardless of the user's groups (subject to the authentication guard)

#### Scenario: `@Public()` bypasses roles

- **WHEN** a handler is annotated both `@Public()` and `@Roles('ADMIN')` (a configuration mistake)
- **THEN** the request reaches the handler — `@Public()` short-circuits both the authentication guard and the roles guard

#### Scenario: Class-level `@Roles` applies to every method

- **WHEN** a controller class is annotated `@Roles('ADMIN')` and one of its methods has no method-level annotation
- **THEN** that method behaves as if it were also annotated `@Roles('ADMIN')`

### Requirement: Web app exposes the current user's groups

The web app SHALL provide a hook (e.g. `useUserGroups()`) that returns the current user's `cognito:groups` as a `string[]`. The hook MUST source its data from the active access token in the OIDC client's user store, returning `[]` when no user is signed in or when the token has no groups claim. The hook MUST update when the OIDC user changes (sign-in, silent renew, sign-out).

#### Scenario: Signed-out user

- **WHEN** the `useUserGroups()` hook is called while no OIDC user is present
- **THEN** the hook returns `[]`

#### Scenario: Signed-in user with groups

- **WHEN** the `useUserGroups()` hook is called while the active access token has `cognito:groups: ['ADMIN']`
- **THEN** the hook returns `['ADMIN']`

#### Scenario: Token without groups claim

- **WHEN** the `useUserGroups()` hook is called while the active access token has no `cognito:groups` claim
- **THEN** the hook returns `[]`

### Requirement: Web app gates routes by required role

The web app SHALL provide a route-level mechanism (e.g. `<RequireRole role="…">{children}</RequireRole>`) that renders its children only when the current user is a member of the required Cognito group. If the user is not a member, the wrapper MUST render a recognizable `403` placeholder instead of the protected content. The wrapper MUST NOT issue any API call that the protected page would have issued.

#### Scenario: Authorized user sees protected content

- **WHEN** a route element `<RequireRole role="ADMIN"><AdminPage/></RequireRole>` is rendered and the current user is in the `ADMIN` group
- **THEN** `<AdminPage/>` renders normally

#### Scenario: Unauthorized user sees the 403 placeholder

- **WHEN** a route element `<RequireRole role="ADMIN"><AdminPage/></RequireRole>` is rendered and the current user is not in the `ADMIN` group
- **THEN** the route renders a visible `403` placeholder identifying the route as restricted; `<AdminPage/>` does not mount and issues no `useEffect`-driven API calls
