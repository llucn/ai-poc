## Why

The agent sometimes needs to present geographic information to the user — showing
a location on a map is far more intuitive than listing coordinates as text. For
example, the agent might retrieve a store address, a delivery destination, or a
set of POIs and want the user to visually confirm them on a map.

Currently there is no Client Tool that renders a map view. Without one, the agent
can only output coordinates as plain text, losing the spatial context that a map
provides. A `map-mark` tool lets the agent pass one or more lat/lng points (with
optional labels) and display them as markers on a Google Maps view inside the
Tool Area, giving the user immediate visual feedback.

## What Changes

- Add a new declared Client Tool `map-mark`: it accepts an array of point
  markers (each with latitude, longitude, and optional label), a title, and an
  optional zoom level, then renders a Google Maps view in the Tool Area with
  markers at the specified positions. The user reviews the map and clicks **OK**
  to acknowledge or **Cancel** to dismiss.
- Integrate the Google Maps JavaScript API via a dynamically loaded script tag
  (loaded only when the tool activates, not on every page load).
- Reuse the existing Tool Area infrastructure from `client-tool-ui-host`: same
  panel layout, same single-active-tool semantics, same OK/Cancel result contract.
- No server-side changes: this is a pure client-side tool operating on data
  passed by the agent in the tool_use parameters.

## Capabilities

### New Capabilities
- `client-tool-map-mark`: the `map-mark` Client Tool — its declared schema, the
  Google Maps view with point markers, OK/Cancel result contract, and reuse of
  the Tool Area bridge for rendering.

### Modified Capabilities
<!-- No existing spec requirements change. This tool reuses the existing
     client-tool-ui-host and client-tool-registry infrastructure without
     modifying their contracts. -->

## Impact

- **Web**: new tool `packages/web/src/app/pages/chat/tools/map-mark.tsx` and its
  registration in `packages/web/src/app/pages/chat/tools/index.ts`. The component
  dynamically loads the Google Maps JS API and renders markers.
- **Configuration**: a Google Maps API key is needed. It will be read from an
  environment variable (`VITE_GOOGLE_MAPS_API_KEY`) injected at build time.
- **No API change**: this tool operates entirely in the browser with data passed
  by the agent. No new endpoints, no database changes.
- **No agent-loop change**: suspend/resume and `client__<id>__<name>` dispatch
  are reused as-is from the existing Client Tool execution flow.
- **Styles**: minor CSS additions for the map container sizing within the Tool
  Area panel.
