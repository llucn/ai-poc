## Context

The `@wo-poc/web` package is a Vite + React 19 + `react-router-dom` 6.29 app currently rendering the default Nx welcome scaffold (`packages/web/src/app/app.tsx` → `<NxWelcome/>` plus two demo `<Link>` placeholders). `packages/web/src/styles.css` is empty.

`docs/style.md` is the design source of truth. The relevant requirements are:

- A CSS-Variables-based theme system with separate `[data-theme="dark"]` and `[data-theme="light"]` palettes (full variable lists are in `docs/style.md` lines 12280–12393).
- Theme preference must be persisted and restored on next visit.
- A topbar with the system title, a theme switcher, a username, and an avatar dropdown ("Profile", "Logout"). The hamburger menu button appears only below 1024 px viewport width.
- A 225 px-wide left sidebar containing two levels of menu items (collapsed by default, expand on click, active item highlighted), full-height but not covering the topbar; when opened from the collapsed (mobile) state, an outside click auto-closes it.
- AWS Cognito hosted UI is used for login — no in-app login page is built.

This change introduces a small, focused application shell. There are no existing specs under `openspec/specs/`, so this is a greenfield capability.

## Goals / Non-Goals

**Goals:**

- Establish a reusable, theme-aware shell layout for every page rendered by the web app.
- Faithfully render the topbar + sidebar geometry and behavior described in `docs/style.md` §标题栏 and §菜单栏.
- Provide a working light/dark theme switcher with persistence across reloads.
- Seed the sidebar with a fixed demo navigation set wired to placeholder pages, so reviewers can see the layout in motion.
- Keep the implementation self-contained inside `packages/web/` with no new runtime dependencies.

**Non-Goals:**

- Building an in-app login screen (Cognito hosted UI is used).
- Wiring real auth state — the username and avatar dropdown render placeholder text.
- Implementing the full visual language from `docs/style.md` for non-shell components (forms, modals, dashboards, etc.). Only the shell-relevant CSS is brought in.
- Internationalization or RTL support.
- Backend menu loading — the demo menu is a static module-scope constant.

## Decisions

### 1. Theme is a top-level React context, applied via `data-theme` on `<html>`

We expose a `ThemeProvider` that owns the current theme (`"light" | "dark"`), reads/writes `localStorage["wo-theme"]`, and on every change sets `document.documentElement.dataset.theme`. A `useTheme()` hook gives consumers the current value and a `toggleTheme()` callback for the topbar switch.

- **Why on `<html>`**: All CSS-variable scopes in `docs/style.md` are written against `[data-theme="dark"]` / `[data-theme="light"]` selectors, so the variables resolve correctly only when the attribute lives on `<html>` (or `:root`).
- **Initial paint**: A tiny inline script in `index.html` reads `localStorage["wo-theme"]` (or `matchMedia('(prefers-color-scheme: dark)')`) and sets `data-theme` before React mounts, eliminating the light-flash on first load.
- **Alternative considered**: Using a CSS class (`.theme-dark`) on `<body>`. Rejected because it would diverge from the selectors already authored in `docs/style.md` and require rewriting all variable scopes.

### 2. Shell layout is a single `AppShell` component wrapping `<Routes>`

`AppShell` owns the topbar, the sidebar, the avatar dropdown state, the sidebar open/closed state, and the click-outside handler. Each route renders inside the shell's `<main>` content slot.

- **Why one component**: The shell pieces share a lot of UI state (sidebar open, avatar dropdown open, viewport breakpoint). Co-locating keeps state simple; no global store is needed.
- **Sub-components**: `Topbar`, `Sidebar`, `AvatarMenu`, `ThemeToggle`, `SidebarItem` live as small files under `packages/web/src/app/shell/` to keep `AppShell` readable.
- **Alternative considered**: Splitting topbar/sidebar into independent layouts wired via the router's nested `Outlet`. Rejected as over-engineering for a single layout that wraps every page.

### 3. Sidebar visibility uses a single breakpoint at 1024 px

`docs/style.md` mandates the hamburger button appears only when `width < 1024 px`. We mirror that with a `useMediaQuery('(max-width: 1023.98px)')` hook driving:

- whether the hamburger button renders,
- whether the sidebar is "drawer mode" (overlay + transform off-screen, closed by default, outside-click closes) or "docked mode" (always visible alongside content).

We do NOT use the lower 900 px breakpoint that appears in `docs/style.md`'s legacy CSS — the spec text is canonical, and 1024 px is the value called out explicitly there.

### 4. Two-level menu is a static config object

```ts
type MenuItem = { id: string; label: string; icon?: ReactNode; to?: string; children?: MenuItem[] };
const DEMO_MENU: MenuItem[] = [/* … */];
```

`Sidebar` renders each top-level item as a collapsible group (chevron-right when collapsed, chevron-down when expanded) and the children as indented `<NavLink>`s. The currently active child receives the `.active` style. All groups start collapsed; expansion state lives in `Sidebar` component state.

- **Why static**: Demo only. A future change can swap the constant for a hook (`useMenu()`) without touching `Sidebar`.

### 5. Demo menu seed

Five top-level groups with a couple of leaves each — enough to demonstrate two-level nesting and active highlighting:

- **Dashboard** — Overview, Activity
- **Work Orders** — All Orders, Create Order
- **Assets** — Equipment, Locations
- **Maintenance** — Schedules, History
- **Settings** — Profile, Preferences

Each leaf maps to a route like `/work-orders/all` that renders a `<DemoPage title="..." />` placeholder. Names are illustrative only — they signal the eventual domain shape without committing to it.

### 6. CSS strategy: one global stylesheet, plain class selectors

We extend `packages/web/src/styles.css` (already imported from `index.html`) with:

- The two `[data-theme="..."]` variable blocks copied verbatim from `docs/style.md`.
- The shell-relevant class rules from `docs/style.md` (`.topbar`, `.sidebar`, `.nav-item`, etc.), with one **deviation explicitly noted**: the topbar height is set to 48 px to match the spec text in §标题栏, not the 56/60 px values in the variable blocks. We achieve this by overriding `--topbar-h: 48px` after the variable blocks.

- **Why global CSS**: Matches the class names already authored in `docs/style.md`. No CSS-in-JS, no CSS Modules, no build-tool changes needed.
- **Alternative considered**: Tailwind or CSS Modules. Both would force re-authoring class names and either fight the variable-driven scheme or add toolchain churn.

### 7. Outside-click on the sidebar

`AppShell` renders a full-screen overlay div (`.sidebar-overlay`) only when the sidebar is open in drawer mode. The overlay's `onClick` closes the sidebar. We also listen for `Escape` to close — small UX win, no extra cost.

## Risks / Trade-offs

- **Risk**: Topbar height mismatch — `docs/style.md` text says 48 px but CSS variables in the same doc say 56/60 px. → **Mitigation**: Explicitly override `--topbar-h: 48px` after the theme blocks and add a comment pointing at the spec line so future readers see the deliberate choice.
- **Risk**: First-paint flash if the inline theme script is forgotten. → **Mitigation**: Inline the read-and-apply script directly in `index.html` `<head>` so it runs before any stylesheet renders.
- **Risk**: Outside-click closing the sidebar can fire when clicking the hamburger to close. → **Mitigation**: The hamburger's `onClick` calls `setOpen(false)` and the overlay only renders while open; clicks on the hamburger don't propagate to the overlay because the topbar sits above the overlay in DOM order, not behind it.
- **Trade-off**: Static menu config means adding/removing items requires a code change. Acceptable for a demo seed; a runtime menu source is a future change, not this one.
- **Trade-off**: We pull in only the shell-relevant subset of `docs/style.md`. Future feature pages will need to import additional class blocks; we accept the incremental cost.

## Migration Plan

- This is greenfield UI for the web shell. No data or persisted state needs migrating.
- `nx-welcome.tsx` and `app.module.css` can be deleted in this change. If reviewers want to keep the Nx welcome reachable for reference, they can opt into preserving the file (we delete by default).
- Rollback: revert the commit. There is no server-side or persisted-state coupling.

## Open Questions

- None blocking. The username string in the topbar is hard-coded to `"Demo User"` until auth integration lands in a later change.
