## 1. Theme foundation

- [x] 1.1 Replace the empty `packages/web/src/styles.css` with the shell stylesheet: copy the `[data-theme="dark"]` and `[data-theme="light"]` variable blocks from `docs/style.md` (lines ~12280–12393) and append a comment block noting the source.
- [x] 1.2 In the same stylesheet, append `--topbar-h: 48px` overrides inside both theme blocks (and the `:root:not([data-theme])` fallback) with a `/* spec: §标题栏 height 48px */` comment.
- [x] 1.3 Add the shell-relevant class rules from `docs/style.md` to `styles.css`: `.app-layout`, `.main`, `.topbar`, `.hamburger`, `.topbar-title`, `.topbar-spacer`, `.topbar-actions`, `.topbar-avatar`, `.avatar-dropdown`, `.avatar-dropdown-info`, `.avatar-dropdown-item`, `.sidebar`, `.sidebar-logo`, `.sidebar-overlay`, `.nav`, `.nav-section`, `.nav-item`, `.nav-item.active`, `.nav-item.disabled`, `.nav-badge`. Drop unrelated rules — pull in only what the shell uses.
- [x] 1.4 Update the `.sidebar` and `@media` rules so docked mode triggers at min-width 1024 px (not 900 px), and the drawer/transform behavior triggers below 1024 px. Keep the 225 px width.
- [x] 1.5 Add base resets to `styles.css`: `html, body, #root { height: 100%; margin: 0 }`, `body { background: var(--bg); color: var(--text); font-family: var(--font-body) }`, and box-sizing inheritance.
- [x] 1.6 Inline an early-paint theme script in `packages/web/index.html` `<head>` that reads `localStorage["wo-theme"]` (falling back to `matchMedia('(prefers-color-scheme: dark)')`) and sets `document.documentElement.dataset.theme` before any stylesheet evaluates.

## 2. Theme runtime

- [x] 2.1 Create `packages/web/src/app/shell/theme-context.tsx` exporting a `ThemeProvider` component, a `useTheme()` hook returning `{ theme, setTheme, toggleTheme }`, and a `Theme = "light" | "dark"` type.
- [x] 2.2 In `ThemeProvider`, initialize state from `document.documentElement.dataset.theme` (set by the inline script) and on every change write to `localStorage["wo-theme"]` and update `document.documentElement.dataset.theme`.
- [x] 2.3 Wrap the app with `<ThemeProvider>` in `packages/web/src/main.tsx` (outside `<HashRouter>` is fine; nesting does not matter for context).

## 3. Shell layout

- [x] 3.1 Create `packages/web/src/app/shell/use-media-query.ts` exporting `useMediaQuery(query: string): boolean` (subscribes to a `MediaQueryList` and returns its `matches` value).
- [x] 3.2 Create `packages/web/src/app/shell/app-shell.tsx` that renders `<div class="app-layout">` containing `<Sidebar/>`, an optional `.sidebar-overlay`, and `<main class="main">` with `<Topbar/>` followed by a `<div class="content">` slot holding `{children}` (or `<Outlet/>` if you go nested-routes).
- [x] 3.3 In `AppShell`, hold `sidebarOpen` state and an `isNarrow = useMediaQuery('(max-width: 1023.98px)')` derived value. Render the overlay only when `isNarrow && sidebarOpen`; clicking the overlay sets `sidebarOpen` to false. Add an `Escape`-key listener that does the same.
- [x] 3.4 Ensure that when `isNarrow` flips back to false (viewport widened past 1024 px), the overlay disappears and the sidebar is shown docked regardless of `sidebarOpen`.

## 4. Topbar

- [x] 4.1 Create `packages/web/src/app/shell/topbar.tsx` rendering `.topbar` with: hamburger button (rendered only when `isNarrow`), `.topbar-title` showing `Work Order System`, `.topbar-spacer`, then a `.topbar-actions` group containing `<ThemeToggle/>`, the username text (`Demo User`), and `<AvatarMenu/>`.
- [x] 4.2 The hamburger button MUST swap its inline SVG icon between a hamburger glyph and a close (X) glyph based on the current `sidebarOpen` value. Clicking it calls `onToggleSidebar()`.
- [x] 4.3 Create `packages/web/src/app/shell/theme-toggle.tsx` rendering a small button that calls `toggleTheme()` and shows a sun glyph when `theme === "dark"` and a moon glyph when `theme === "light"`.
- [x] 4.4 Create `packages/web/src/app/shell/avatar-menu.tsx` rendering a `.topbar-avatar` button. On click it toggles a `.avatar-dropdown` panel containing two `.avatar-dropdown-item` entries: `Profile` (no-op for now) and `Logout` (no-op for now). Clicking outside the panel closes it (`useEffect` with a `mousedown` listener that compares `event.target` against the panel ref).

## 5. Sidebar and demo menu

- [x] 5.1 Create `packages/web/src/app/shell/menu-config.ts` exporting a typed `DEMO_MENU: MenuItem[]` containing the seed: Dashboard (Overview, Activity), Work Orders (All Orders, Create Order), Assets (Equipment, Locations), Maintenance (Schedules, History), Settings (Profile, Preferences). `MenuItem = { id; label; icon?; to?; children?: MenuItem[] }`.
- [x] 5.2 Create `packages/web/src/app/shell/sidebar.tsx` rendering `.sidebar` with a `.sidebar-logo` header (text: `Work Order System` / `Operations`) and a `<nav class="nav">` body. In drawer mode, apply an `.open` class to `.sidebar` when `sidebarOpen` is true.
- [x] 5.3 Render each `DEMO_MENU` entry as a `<SidebarGroup>` component. Each group has its own collapsed/expanded local state, initialized to collapsed. The header row uses larger font and shows a chevron-right (collapsed) or chevron-down (expanded) SVG aligned right.
- [x] 5.4 When a group is expanded, render its children as `<NavLink to={child.to}>` elements inside the group, with smaller font and additional left padding to indicate hierarchy. Apply `.nav-item.active` via `NavLink`'s `className` callback when `isActive` is true.
- [x] 5.5 Wire the hamburger and overlay behavior end-to-end: opening the sidebar in narrow mode shows the overlay; clicking the overlay, pressing Escape, or clicking the hamburger close button all set `sidebarOpen` to false.

## 6. Routes and demo pages

- [x] 6.1 Create `packages/web/src/app/pages/demo-page.tsx` exporting a single `<DemoPage title="..." />` component that renders a small placeholder card with the title and a one-line description, themed via existing CSS variables.
- [x] 6.2 Replace the body of `packages/web/src/app/app.tsx` with `<AppShell><Routes>...</Routes></AppShell>`. Define one `<Route>` per leaf in `DEMO_MENU` rendering `<DemoPage title="..."/>`. Add a default `<Route path="/" element={<Navigate to="/dashboard/overview" replace/>}/>` so the app lands somewhere visible.
- [x] 6.3 Delete `packages/web/src/app/nx-welcome.tsx` and `packages/web/src/app/app.module.css` (no longer referenced).

## 7. Manual verification

> Awaiting human verification — the agent cannot drive a real browser. The dev server starts and serves the new shell HTML, `vite build` succeeds (42 modules, no errors), and `tsc --noEmit` is clean.

- [ ] 7.1 Run `npx nx serve web` (or the workspace's equivalent dev command) and confirm: topbar is exactly 48 px tall, sidebar is 225 px wide, sidebar is docked at ≥1024 px and drawer at <1024 px.
- [ ] 7.2 In the browser, verify the theme switch flips the palette, reloading preserves the choice (`localStorage["wo-theme"]` is set), and there is no light-flash on a hard reload while dark is saved.
- [ ] 7.3 In the browser, verify: all groups start collapsed, clicking a group expands it and swaps its chevron, clicking a child navigates and highlights the active item, and the URL matches the active item.
- [ ] 7.4 In the browser at narrow width, verify: hamburger toggles the sidebar, the icon switches between hamburger and X glyphs, clicking the overlay closes the sidebar, and pressing Escape closes the sidebar.
- [ ] 7.5 In the browser, verify the avatar dropdown opens on click, shows `Profile` and `Logout`, and closes on outside click.

## 8. Cleanup

- [x] 8.1 Run the workspace's lint/typecheck (`npx nx lint web`, `npx nx typecheck web` or equivalent) and resolve any new findings. — No `lint` target is configured for `@wo-poc/web`; ran `tsc --noEmit -p packages/web/tsconfig.app.json` (clean) and `npx nx build web` (clean) as the equivalents.
- [x] 8.2 Run `openspec validate ui-style` and resolve any reported issues.
