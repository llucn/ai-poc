## Why

The `web` package currently renders the Nx welcome scaffold with no project-specific branding, navigation, or theming. Before the team can demo the Work Order System or onboard new features, the shell needs a consistent visual identity: a topbar, a left-side menu, and the light/dark theming defined in `docs/style.md`. Establishing this shell now keeps later feature work focused on domain UI rather than re-doing layout.

## What Changes

- Introduce a CSS Variables-based theming system with `[data-theme="light"]` and `[data-theme="dark"]` palettes derived from `docs/style.md`.
- Add a theme controller that reads the user's saved preference from `localStorage` (key: `wo-theme`), falls back to the OS preference, and applies the chosen theme to `<html data-theme="...">` on load.
- Replace the Nx welcome scaffold in `App` with a new application shell that contains a fixed topbar (48 px), a collapsible left sidebar (225 px), and a router outlet for page content.
- Build the topbar with: a hamburger toggle (visible when viewport width is < 1024 px), the system title "Work Order System", a theme switch button, the logged-in username placeholder, and a user avatar whose dropdown exposes "Profile" and "Logout" entries.
- Build the sidebar with a two-level menu structure (top-level groups collapsed by default, expand on click, indented child links, active link highlighted) and seed it with a fixed demo set of items.
- Add demo routes/pages so each seeded menu item renders a placeholder page reachable from the menu, proving navigation works end-to-end.
- Add an outside-click handler so that, when the sidebar is opened from the collapsed (mobile) state, clicking outside the sidebar closes it.

## Capabilities

### New Capabilities

- `web-shell`: The top-level web application shell — topbar, sidebar menu, and theme switching for the `@wo-poc/web` package, including the seeded demo navigation items.

### Modified Capabilities

<!-- None. No existing specs in openspec/specs/. -->

## Impact

- **Affected code**: `packages/web/src/app/app.tsx`, `packages/web/src/main.tsx`, `packages/web/src/styles.css`, `packages/web/index.html`; new files under `packages/web/src/app/` for the shell components and theme controller; new files under `packages/web/src/pages/` (or similar) for the demo route placeholders.
- **Removed code**: The Nx welcome component (`nx-welcome.tsx`) is no longer rendered; the placeholder `Home` / `Page 2` `<Link>` block is replaced by the new sidebar navigation.
- **Dependencies**: No new runtime dependencies. Continues to use React 19 + `react-router-dom` 6.29 already present in the workspace.
- **Out of scope**: AWS Cognito login UI (per `docs/style.md`, the hosted Cognito page is used and no in-app login is needed), real authentication state, real menu wiring to backend data.
