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

## ADDED Requirements

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
