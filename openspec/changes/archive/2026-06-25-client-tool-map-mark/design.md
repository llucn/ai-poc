## Context

Client Tools run in the browser. The agent loop suspends on a
`client__<toolId>__<toolName>` action, the server persists the suspended call to
`t_pending_client_call` and pushes a `client_call` SSE event, then `res.end()`s.
The Chat Page dispatches the event to `executeClientTool(name, params)` in
`client-tool-executor.ts`, which awaits the registered handler and POSTs the
outcome to `/sessions/:id/client-result` to resume the loop.

The Tool Area bridge (`tool-area-bridge.ts`) provides `renderInToolArea<T>(render)`
which returns a Promise. The handler passes a render function that receives a
`resolve` callback; the rendered React component calls `resolve(result)` to settle
the Promise, collapse the Tool Area, and resume the agent loop.

For `map-mark`, the tool receives an array of geographic points from the agent
and renders a Google Maps view with markers. Unlike `select-users` or
`select-string-array`, there is no selection — the user simply reviews the map
and acknowledges. The result is minimal: OK (acknowledged) or Cancel (dismissed).

The Google Maps JavaScript API must be loaded dynamically at runtime, only when
the tool is first activated, to avoid loading the ~200KB Maps SDK on every page.

## Goals / Non-Goals

**Goals:**
- A declared `map-mark` Client Tool that renders one or more point markers on a
  Google Maps view in the Tool Area.
- Dynamic loading of the Google Maps JavaScript API (lazy, on first use).
- Auto-fit map bounds to show all markers with appropriate zoom.
- OK/Cancel buttons to acknowledge or dismiss the map view.
- Support for optional marker labels (shown as info windows or marker titles).

**Non-Goals:**
- No interactive marker placement by the user (this is display-only).
- No directions, routes, or polylines (just point markers).
- No server-side geocoding; the agent passes lat/lng directly.
- No offline/fallback map provider; requires internet + valid API key.
- No Street View or satellite imagery toggle (use default roadmap).

## Decisions

### Decision 1: Dynamic Google Maps API loading via script injection
Load the Maps JavaScript API by injecting a `<script>` tag on first tool
activation. Use a module-level promise to deduplicate concurrent loads. The API
key comes from `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`.

- **Why**: avoids loading ~200KB of Maps SDK on every page load; only users who
  trigger the tool pay the cost. A single shared promise ensures the script is
  loaded exactly once even if the tool is invoked multiple times.
- **Alternative rejected**: bundling `@googlemaps/js-api-loader` as a dependency.
  Adds a package dependency for what is a 15-line script loader; the raw script
  injection is simpler and well-understood.

### Decision 2: Auto-fit bounds with fallback zoom
After placing all markers, call `map.fitBounds(bounds)` to automatically zoom
and center the map to show all markers. If only one marker is provided, center
on it and use the agent-provided `zoom` parameter (default 14). If no markers
are provided, show a world view.

- **Why**: ensures all markers are visible without the user needing to pan/zoom.
  The single-marker case needs an explicit zoom because fitBounds on a single
  point zooms to max (street level), which is usually too close.
- **Alternative rejected**: always use agent-provided zoom + center. Doesn't
  work well for multi-marker cases where the agent can't predict the right bounds.

### Decision 3: Markers with optional labels via title attribute
Each marker receives a `title` (native tooltip on hover) from the optional
`label` field in the marker data. For a richer experience, if a label is
provided, also show a small info label directly on the marker using Google Maps
`Marker.label` property (single character or short string).

- **Why**: lightweight approach that doesn't require InfoWindow management or
  click handlers. The built-in `title` gives hover tooltips; `Marker.label`
  gives on-map visibility for short labels.
- **Alternative rejected**: InfoWindows opened by default. Clutters the map
  when many markers are present; better to keep labels minimal and use hover.

### Decision 4: Result contract is acknowledgment-only
Result: `{ cancelled: boolean }`. OK → `{ cancelled: false }`, Cancel →
`{ cancelled: true }`. No data is returned from the map (it's display-only).

- **Why**: the purpose of this tool is to show geographic context, not to collect
  user input. The agent already knows the coordinates it sent. The OK/Cancel
  pattern is consistent with other tools and allows the agent to know whether the
  user saw/acknowledged the map.

### Decision 5: Graceful handling of missing API key
If `VITE_GOOGLE_MAPS_API_KEY` is not configured (empty or undefined), the panel
shows an error message ("Google Maps API key not configured") instead of crashing.
The user can still click OK/Cancel to dismiss.

- **Why**: prevents a hard crash in development or misconfigured deployments.
  The tool should degrade gracefully rather than break the agent loop.

## Risks / Trade-offs

- **[API key exposure in client bundle]** → standard for Google Maps JS API; the
  key should be restricted by HTTP referrer in the Google Cloud Console. Document
  this in setup instructions.
- **[Network dependency]** → if the user is offline or the Maps API fails to load,
  show an error state in the panel. The tool still resolves on OK/Cancel so the
  agent loop is never stuck.
- **[Maps API billing]** → Google Maps JavaScript API has a generous free tier
  (28,000 map loads/month). For a POC/internal tool this is acceptable.
- **[Content Security Policy]** → if CSP headers restrict script-src, the dynamic
  script injection will fail. Ensure CSP allows `https://maps.googleapis.com`.
- **[Single marker zoom too close with fitBounds]** → handled by Decision 2
  (explicit zoom fallback for single marker).

## Migration Plan

1. Web: add `tools/map-mark.tsx` with the Google Maps loader utility, the
   `MapMarkPanel` component, and `defineClientTool` declaration.
2. Web: register the tool in `tools/index.ts`.
3. Configuration: add `VITE_GOOGLE_MAPS_API_KEY` to `.env.example` / docs.
4. CSS: add map container sizing styles.
5. Sync registers `map-mark` into `t_tool` on next login (source='registry');
   link it to an agent to exercise end-to-end.
- **Rollback**: remove the tool file + registration; no persisted state beyond
  the auto-synced `t_tool` row (deleted on next sync).

## Open Questions

- Should the map support clicking a marker to see its full label in an InfoWindow?
  For v1, hover tooltip is sufficient; can add InfoWindow in a follow-up.
- Should the tool accept an optional `mapType` parameter (roadmap/satellite/terrain)?
  Out of scope for v1; default roadmap is fine.
