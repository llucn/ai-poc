# demo-auth Specification

## Purpose
Provide a mock authentication system for the AI POC demo environment that allows users to quickly switch between different user roles without real authentication credentials. Uses header-based user identity transmission between web and API.

## Requirements

### Requirement: Mock login page displays all users from database

The web app SHALL provide a mock login page that queries and displays all users from the `t_user` table. The page MUST show each user as a clickable card displaying the user's name, email, and role. No password input or credential validation is required. The page MUST be accessible without authentication.

#### Scenario: Login page displays all users

- **WHEN** a user navigates to the login page
- **THEN** the page displays all users from `t_user` as clickable cards showing name, email, and role

#### Scenario: Login page accessible without authentication

- **WHEN** an unauthenticated user accesses the login route
- **THEN** the login page loads without requiring any prior authentication or redirecting to an external login provider

### Requirement: Clicking a user card logs in as that user

The web app SHALL allow users to click any user card on the mock login page to "log in" as that user. When clicked, the system MUST store the selected user's identity (username and role) in the web app's session state and navigate to the application's home page. No server-side session or token generation is required.

#### Scenario: Successful mock login

- **WHEN** a user clicks a user card for "alice" with role "SYSTEM_ADMIN"
- **THEN** the user's identity is stored in the web app state and the app navigates to the home page

#### Scenario: User identity is stored for subsequent requests

- **WHEN** a user completes mock login
- **THEN** the web app retains the username and role in memory for use in API request headers

### Requirement: Web app sends user identity in request headers

The web app SHALL send the current user's identity in every API request via custom HTTP headers. The headers MUST include `X-User-Name` containing the username and `X-User-Role` containing the role as plain text. The headers MUST be added by the `useApiFetch` hook or equivalent HTTP client wrapper so that all API calls automatically include them.

#### Scenario: API request includes user identity headers

- **WHEN** the web app makes an API request after mock login as "alice" with role "SYSTEM_ADMIN"
- **THEN** the request includes headers `X-User-Name: alice` and `X-User-Role: SYSTEM_ADMIN`

#### Scenario: Unauthenticated requests omit headers

- **WHEN** the web app makes an API request before any user has logged in
- **THEN** the `X-User-Name` and `X-User-Role` headers are absent from the request

### Requirement: API extracts user identity from request headers

The API SHALL provide middleware that extracts the user identity from the `X-User-Name` and `X-User-Role` headers. The middleware MUST populate the request's user object with the username and role so that downstream guards and handlers can access the authenticated user via `@CurrentUser()`. If the headers are missing, the middleware MUST treat the request as unauthenticated.

#### Scenario: Headers present populate user object

- **WHEN** an API request arrives with `X-User-Name: alice` and `X-User-Role: SYSTEM_ADMIN`
- **THEN** the middleware populates `request.user` with `{ username: 'alice', role: 'SYSTEM_ADMIN' }`

#### Scenario: Missing headers result in unauthenticated state

- **WHEN** an API request arrives without `X-User-Name` or `X-User-Role` headers
- **THEN** the middleware leaves `request.user` undefined or null, indicating no authentication

### Requirement: RBAC guards use header-based user identity

The API's existing RBAC guards SHALL continue to enforce role-based authorization but MUST use the user identity extracted from headers instead of JWT claims. The `@Roles(...)` decorator and `RolesGuard` MUST read the user's role from `request.user.role` (populated by the header-based authentication middleware) rather than from `cognito:groups` in a JWT.

#### Scenario: Role guard authorizes based on header role

- **WHEN** a handler is annotated `@Roles('SYSTEM_ADMIN')` and the request has `X-User-Role: SYSTEM_ADMIN`
- **THEN** the role guard allows the request to proceed

#### Scenario: Role guard rejects unauthorized role

- **WHEN** a handler is annotated `@Roles('SYSTEM_ADMIN')` and the request has `X-User-Role: TECHNICIAN`
- **THEN** the role guard returns a 403 response

#### Scenario: Public endpoints bypass role checks

- **WHEN** a handler is annotated `@Public()`
- **THEN** the role guard allows the request regardless of `X-User-Role` value

### Requirement: Remove OIDC authentication flow

The web app SHALL NOT use any OIDC or OAuth authentication flow. All OIDC-related configuration, provider setup, redirect routes (callback, logout redirect), and OIDC client libraries MUST be removed from the web package. The web app MUST NOT redirect users to any external identity provider.

#### Scenario: No OIDC redirect on app load

- **WHEN** an unauthenticated user opens the web app
- **THEN** the app shows the mock login page without redirecting to an external OIDC provider

#### Scenario: No OIDC configuration in web app

- **WHEN** searching the web package for OIDC configuration files or environment variables
- **THEN** no OIDC authority, client ID, or redirect URI configuration exists

### Requirement: Remove JWT validation from API

The API SHALL NOT validate JWT tokens. All JWT-related middleware, guards, and configuration MUST be removed from the API package. The API MUST NOT require or parse any `Authorization: Bearer <token>` header.

#### Scenario: API accepts requests without Authorization header

- **WHEN** an API request arrives with `X-User-Name` and `X-User-Role` headers but no `Authorization` header
- **THEN** the API processes the request normally using the header-based identity

#### Scenario: No JWT secret configuration in API

- **WHEN** searching the API package for JWT secret or public key configuration
- **THEN** no JWT validation keys or JWKS endpoint configuration exists

### Requirement: Logout clears web app user state

The web app SHALL provide a logout mechanism that clears the stored user identity from the web app's session state and navigates back to the mock login page. No server-side logout or token revocation is required.

#### Scenario: Logout returns to login page

- **WHEN** a logged-in user clicks the logout button
- **THEN** the user's identity is cleared from the web app state and the app navigates to the mock login page

#### Scenario: API requests after logout have no identity headers

- **WHEN** a user logs out and then an API request is made
- **THEN** the request does not include `X-User-Name` or `X-User-Role` headers
