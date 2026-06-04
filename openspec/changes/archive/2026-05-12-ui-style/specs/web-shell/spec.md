## ADDED Requirements

### Requirement: Theming system with persisted user preference

The web app SHALL provide a light theme and a dark theme. The active theme MUST be applied by setting `data-theme="light"` or `data-theme="dark"` on the root `<html>` element. The user's chosen theme MUST be persisted in browser storage (`localStorage` key `wo-theme`) so that revisiting the app restores the previously selected theme. On a first visit with no saved preference, the app MAY fall back to the operating system's color-scheme preference.

#### Scenario: User selects dark theme and reloads

- **WHEN** the user toggles the theme switch to dark and reloads the page
- **THEN** `<html>` has `data-theme="dark"` immediately on first paint and the CSS variables resolve to the dark palette

#### Scenario: User selects light theme and reloads

- **WHEN** the user toggles the theme switch to light and reloads the page
- **THEN** `<html>` has `data-theme="light"` immediately on first paint and the CSS variables resolve to the light palette

#### Scenario: First visit with no saved preference

- **WHEN** a new user opens the app and has no value at `localStorage["wo-theme"]`
- **THEN** the app applies a default theme without errors and persists no value until the user explicitly toggles

### Requirement: Topbar layout and contents

The web app SHALL render a single top-of-viewport bar that is 48 pixels tall, spans the full viewport width, and remains visible regardless of sidebar state. From left to right the topbar MUST contain:

1. A menu (hamburger) button — see the "Responsive hamburger button" requirement for visibility rules.
2. The system title text `Work Order System`.
3. A theme switch control aligned to the right.
4. The logged-in username (placeholder text for this change) aligned to the right.
5. A circular user avatar button aligned to the right; clicking it opens a dropdown menu.

#### Scenario: Topbar renders with all elements

- **WHEN** the app loads at any viewport width
- **THEN** the topbar is visible at the top of the viewport with the system title, theme switch, username, and avatar present

#### Scenario: Topbar height is 48 pixels

- **WHEN** the topbar renders
- **THEN** its computed height is exactly 48 pixels (excluding any safe-area inset padding)

### Requirement: Avatar dropdown menu

The user avatar button in the topbar SHALL open a dropdown menu when clicked. The dropdown MUST contain at least the items `Profile` and `Logout`. Clicking outside the dropdown or clicking the avatar again MUST close it.

#### Scenario: Open avatar dropdown

- **WHEN** the user clicks the avatar button
- **THEN** a dropdown menu becomes visible containing `Profile` and `Logout` items

#### Scenario: Close avatar dropdown by clicking outside

- **WHEN** the dropdown is open and the user clicks anywhere outside the dropdown
- **THEN** the dropdown closes

### Requirement: Sidebar layout

The web app SHALL render a left-side menu (sidebar) that is 225 pixels wide and spans the full viewport height. The sidebar MUST sit below the topbar (i.e. the topbar must not be covered by the sidebar).

#### Scenario: Sidebar geometry

- **WHEN** the sidebar is visible
- **THEN** its computed width is 225 pixels and the topbar remains fully visible at the top of the viewport

### Requirement: Two-level menu with collapsible groups

The sidebar SHALL display menu items in two levels. Top-level groups MUST be visually distinguished from their child links by font size and indentation. Every top-level group MUST start in the collapsed state on first render. A collapsed group MUST display a right-facing chevron (or equivalent) icon on its right side. Clicking a top-level group MUST toggle it: when expanded, the icon changes to a down-facing chevron and the children become visible. The currently active child MUST be visually highlighted to indicate the active route.

#### Scenario: Groups start collapsed

- **WHEN** the user opens the app for the first time
- **THEN** every top-level menu group is collapsed and shows the collapsed-state icon

#### Scenario: Expand a group

- **WHEN** the user clicks a collapsed top-level group
- **THEN** the group expands, its icon switches to the expanded-state icon, and its children become visible and clickable

#### Scenario: Active child is highlighted

- **WHEN** the user navigates to a route that matches a child menu item
- **THEN** that child item renders with the active visual treatment

### Requirement: Responsive hamburger button

The web app SHALL show the hamburger menu button in the topbar only when the viewport width is less than 1024 pixels. When the viewport is 1024 pixels or wider, the hamburger button MUST be hidden and the sidebar MUST be docked (always visible). When the hamburger is hidden, the sidebar icon does not toggle between hamburger and close states. When the hamburger is visible, it MUST render as a hamburger icon while the sidebar is closed and as a close (X) icon while the sidebar is open.

#### Scenario: Wide viewport hides hamburger and docks sidebar

- **WHEN** the viewport width is 1024 pixels or greater
- **THEN** the hamburger button is not rendered and the sidebar is visible alongside the page content

#### Scenario: Narrow viewport shows hamburger and hides sidebar by default

- **WHEN** the viewport width is less than 1024 pixels
- **THEN** the hamburger button is rendered as a hamburger icon and the sidebar is hidden from view until the user opens it

#### Scenario: Hamburger toggles icon based on sidebar state

- **WHEN** the sidebar transitions from closed to open in narrow-viewport mode
- **THEN** the hamburger button's icon changes from a hamburger glyph to a close (X) glyph; reversing the transition reverses the icon

### Requirement: Sidebar outside-click auto-close

When the sidebar has been opened from the collapsed (narrow-viewport) state, clicking anywhere outside the sidebar SHALL close it. This requirement applies only when the sidebar is in drawer (narrow-viewport) mode; in docked mode the sidebar remains visible and is not closed by outside clicks.

#### Scenario: Outside click closes the drawer sidebar

- **WHEN** the viewport width is less than 1024 pixels, the user opens the sidebar with the hamburger button, then clicks anywhere outside the sidebar
- **THEN** the sidebar closes and the hamburger icon returns to the hamburger glyph

#### Scenario: Docked sidebar is not closed by outside clicks

- **WHEN** the viewport width is 1024 pixels or greater and the user clicks anywhere in the page content area
- **THEN** the sidebar remains visible

### Requirement: Demo menu seed and routes

For this change the sidebar SHALL be populated with a fixed set of demonstration menu items that exercise two-level nesting. The seed MUST contain at least three top-level groups and each group MUST contain at least one child link. Every child link MUST navigate to a route within the app and MUST resolve to a rendered placeholder page so reviewers can confirm navigation works end-to-end. The exact labels are illustrative; the seed MUST cover both groups with multiple children and groups with a single child.

#### Scenario: Demo seed renders in the sidebar

- **WHEN** the app loads
- **THEN** the sidebar shows the seeded top-level groups (collapsed) and expanding any group reveals its seeded children

#### Scenario: Demo route renders a placeholder

- **WHEN** the user clicks any seeded child link in the sidebar
- **THEN** the URL updates and a placeholder page identifying that menu item renders inside the shell's content area

### Requirement: Login is delegated to AWS Cognito

The web app SHALL NOT implement an in-app login form or login page. Authentication is delegated to the AWS Cognito hosted UI.

#### Scenario: No internal login route

- **WHEN** the developer searches the `packages/web/src` tree for a login page component or `/login` route
- **THEN** none exists; the only authentication-related UI in this change is the placeholder username and the `Logout` item in the avatar dropdown
