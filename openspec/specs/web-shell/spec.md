## MODIFIED Requirements

### Requirement: Topbar layout and contents

The web app SHALL render a single top-of-viewport bar that is 48 pixels tall, spans the full viewport width, and remains visible regardless of sidebar state. From left to right the topbar MUST contain:

1. A menu (hamburger) button — see the "Responsive hamburger button" requirement for visibility rules.
2. The system title text `Work Order System`.
3. A horizontal primary-menu bar that, in wide viewport (≥ 1024px), renders one button per top-level entry of `DEMO_MENU`, in the order they appear in `menu-config.ts`. In narrow viewport (< 1024px) this bar MUST be hidden and primary navigation MUST fall back to the hamburger sidebar.
4. A theme switch control aligned to the right.
5. The authenticated user's display name, aligned to the right. The display name MUST be derived from the current user's identity stored after mock login, using the `display_name` field from the user record.
6. A circular user avatar button aligned to the right, whose label is the initials derived from the same display name (first letter of each of the first two whitespace-separated tokens, uppercased). Clicking the avatar opens a dropdown menu.

#### Scenario: Topbar renders with all elements

- **WHEN** the app loads at any viewport width
- **THEN** the topbar is visible at the top of the viewport with the system title, theme switch, username, and avatar present

#### Scenario: Topbar height is 48 pixels

- **WHEN** the topbar renders
- **THEN** its computed height is exactly 48 pixels (excluding any safe-area inset padding)

#### Scenario: Username reflects the logged-in mock user

- **WHEN** a logged-in user with `display_name === 'Alice Lee'` views the app
- **THEN** the topbar shows the text `Alice Lee` and the avatar displays the initials `AL`

#### Scenario: Username falls back to name when display_name is absent

- **WHEN** the logged-in user's `display_name` field is empty but `name` is `alice123`
- **THEN** the topbar shows `alice123` and the avatar shows initials derived from that value

#### Scenario: Wide viewport renders primary menu in topbar

- **WHEN** the viewport width is at least 1024px
- **THEN** the topbar renders a horizontal primary-menu bar listing every top-level `MenuItem` from `DEMO_MENU` in declared order, the legacy left-side primary navigation is not rendered, and the hamburger button is hidden

#### Scenario: Narrow viewport hides primary menu in topbar

- **WHEN** the viewport width is below 1024px
- **THEN** the topbar's primary-menu bar is hidden, the hamburger button becomes visible, and primary navigation is delivered through the existing slide-in sidebar

### Requirement: Topbar primary menu opens secondary dropdown
The topbar primary menu (wide viewport only) SHALL show a secondary-menu dropdown when a top-level entry is clicked. The dropdown MUST list every child of the clicked entry, filtered by the current user's role (entries whose `roles` field excludes the current role MUST NOT render). Clicking a child MUST navigate the SPA to the child's `to` route and close the dropdown. Clicking the same top-level button again, clicking outside the dropdown, or pressing `Escape` MUST close the dropdown. Only one top-level dropdown MAY be open at a time.

#### Scenario: Open secondary dropdown
- **WHEN** a SYSTEM_ADMIN user at viewport ≥ 1024px clicks the `Settings` top-level button
- **THEN** a dropdown becomes visible listing the `Settings` children allowed for SYSTEM_ADMIN (e.g. `Users`, `Agents`, `Tools`, `Skills`, …) in declared order

#### Scenario: Click child navigates and closes
- **WHEN** the dropdown is open and the user clicks the `Tools` child
- **THEN** the SPA navigates to `/settings/tools` and the dropdown closes

#### Scenario: Click outside closes dropdown
- **WHEN** the dropdown is open and the user clicks anywhere outside the dropdown and its trigger button
- **THEN** the dropdown closes without navigation

#### Scenario: Escape closes dropdown
- **WHEN** the dropdown is open and the user presses the `Escape` key
- **THEN** the dropdown closes without navigation

#### Scenario: Switching top-level entries closes the previous dropdown
- **WHEN** the dropdown for one top-level entry is open and the user clicks a different top-level entry
- **THEN** the previous dropdown closes and the new entry's dropdown opens

#### Scenario: Role filtering hides forbidden children
- **WHEN** a non-SYSTEM_ADMIN user opens the `Settings` top-level dropdown
- **THEN** children whose `roles` includes only `SYSTEM_ADMIN` (e.g. `Users`, `Agents`, `Tools`, `Skills`) are not rendered

### Requirement: Settings menu contains Tools and Skills entries visible only to SYSTEM_ADMIN
The `Settings` top-level group SHALL include child entries `Tools` and `Skills` routed to `/settings/tools` and `/settings/skills` respectively. Both entries MUST be visible only to users whose role is `SYSTEM_ADMIN`; non-`SYSTEM_ADMIN` users MUST NOT see them.

#### Scenario: SYSTEM_ADMIN sees Tools and Skills under Settings
- **WHEN** a SYSTEM_ADMIN user opens the `Settings` dropdown (or expands the sidebar group on narrow viewport)
- **THEN** `Tools` and `Skills` child links are visible and clicking them navigates to `/settings/tools` and `/settings/skills` respectively

#### Scenario: Non-SYSTEM_ADMIN does not see Tools or Skills
- **WHEN** a user whose role is not `SYSTEM_ADMIN` opens the `Settings` dropdown or sidebar group
- **THEN** neither `Tools` nor `Skills` child entries are rendered

### Requirement: Avatar dropdown menu

The user avatar button in the topbar SHALL open a dropdown menu when clicked. The dropdown MUST contain at least the items `Profile` and `Logout`. Clicking outside the dropdown or clicking the avatar again MUST close it. The `Profile` item MUST navigate the SPA to the `/profile` route. The `Logout` item MUST trigger mock logout — clearing the local user session state AND navigating back to the mock login page.

#### Scenario: Open avatar dropdown

- **WHEN** the user clicks the avatar button
- **THEN** a dropdown menu becomes visible containing `Profile` and `Logout` items

#### Scenario: Close avatar dropdown by clicking outside

- **WHEN** the dropdown is open and the user clicks anywhere outside the dropdown
- **THEN** the dropdown closes

#### Scenario: Profile menu navigates to /profile

- **WHEN** the user clicks `Profile` in the avatar dropdown
- **THEN** the dropdown closes and the SPA navigates to `/profile`

#### Scenario: Logout menu clears session and returns to login

- **WHEN** the user clicks `Logout` in the avatar dropdown
- **THEN** the local user session state is cleared and the browser navigates to the mock login page

### Requirement: Settings menu contains a Users entry visible only to SYSTEM_ADMIN

The sidebar's `Settings` group SHALL include a `Users` child link routed to `/settings/users`. The link is a real (non-demo) feature link and MUST coexist with the existing demo children under `Settings`. The link MUST be visible only to users whose role is `SYSTEM_ADMIN`; non-`SYSTEM_ADMIN` users MUST NOT see the link in the sidebar.

#### Scenario: SYSTEM_ADMIN sees Users under Settings

- **WHEN** a SYSTEM_ADMIN user expands the `Settings` group in the sidebar
- **THEN** a `Users` child link is visible and clicking it navigates to `/settings/users`

#### Scenario: Users child is highlighted when active

- **WHEN** a SYSTEM_ADMIN user is on a route matching `/settings/users` (the list page, detail page, add page, or edit page)
- **THEN** the `Users` child item in the sidebar renders with the active visual treatment

#### Scenario: Non-SYSTEM_ADMIN does not see the Users entry

- **WHEN** an authenticated user whose role is `TECHNICIAN` expands the `Settings` group
- **THEN** the `Users` child link is not rendered in the sidebar

## REMOVED Requirements

### Requirement: Login is delegated to AWS Cognito

**Reason**: Removed OIDC/Cognito authentication in favor of mock authentication for demo environment

**Migration**: Use the new mock login page at `/login` route. The page displays all users from the database and allows one-click login without credentials. No external identity provider is used.
