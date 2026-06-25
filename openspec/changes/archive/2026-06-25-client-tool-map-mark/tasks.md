# Implementation Tasks

## 1. Web: Google Maps loader utility

- [x] 1.1 Create a `loadGoogleMapsApi()` utility function in `map-mark.tsx` (or a shared helper) that injects the Google Maps script tag and returns a Promise resolving when the API is ready; deduplicate concurrent calls with a module-level promise cache
- [x] 1.2 Read the API key from `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`; if missing or empty, reject with a descriptive error message
- [x] 1.3 Handle script load failure (network error, invalid key) gracefully — reject the promise so the panel can show an error state

## 2. Web: map-mark tool component

- [x] 2.1 Create `tools/map-mark.tsx`: `defineClientTool` with zod params (`markers: Array<{ lat: number, lng: number, label?: string }>`, `title?`, `zoom?`); handler calls `renderInToolArea` with `<MapMarkPanel>` and returns its Promise
- [x] 2.2 Implement `MapMarkPanel`: call `loadGoogleMapsApi()` on mount, show loading state while API loads, show error state if it fails
- [x] 2.3 Once API loaded, create a `google.maps.Map` instance in a ref'd div container; apply auto-fit bounds logic (fitBounds for multi-marker, center+zoom for single marker, world view for zero markers)
- [x] 2.4 Create `google.maps.Marker` for each point; set `title` and `label` from the marker's optional label field
- [x] 2.5 Render OK/Cancel buttons below the map; OK → resolve `{ cancelled: false }`, Cancel → resolve `{ cancelled: true }`
- [x] 2.6 Handle edge case: empty markers array → show map at world zoom with no markers, still allow OK/Cancel

## 3. Web: tool registration and styling

- [x] 3.1 Register the tool in `tools/index.ts` (import `./map-mark`)
- [x] 3.2 Add CSS for map container in `styles.css`: fixed height within the tool panel (e.g., 400px), border-radius, overflow hidden
- [x] 3.3 Add `VITE_GOOGLE_MAPS_API_KEY` to `.env.example` (or create one) with a comment explaining how to obtain a key

## 4. Verification

- [x] 4.1 Confirm TypeScript compiles cleanly: `tsc --noEmit`
- [x] 4.2 Confirm build passes: `nx build web`
- [x] 4.3 Unit test: `map-mark` registers and `getAllClientTools()` emits its JSON schema with required `markers` param
- [x] 4.4 Verify existing tools (`prompt-input`, `select-users`, `select-string-array`) still work unchanged

## 5. Manual end-to-end (requires running services + LLM + valid API key)

- [ ] 5.1 Set `VITE_GOOGLE_MAPS_API_KEY` in environment; rebuild web
- [ ] 5.2 Log in → `/client-tools/sync` registers `map-mark` into `t_tool` (source='registry'); link it to an agent
- [ ] 5.3 In chat, drive the agent to call `map-mark` with a single marker; verify map renders centered on the point with appropriate zoom
- [ ] 5.4 Test multi-marker: provide 3+ markers at different locations; verify map auto-fits bounds to show all markers
- [ ] 5.5 Test marker labels: provide markers with labels; verify tooltips on hover
- [ ] 5.6 Test OK flow: click OK → loop resumes with `{ cancelled: false }`; Tool Area collapses
- [ ] 5.7 Test Cancel flow: click Cancel → loop resumes with `{ cancelled: true }`; Tool Area collapses
- [ ] 5.8 Test missing API key: unset `VITE_GOOGLE_MAPS_API_KEY`; verify error message shows in panel, OK/Cancel still work
- [ ] 5.9 Test empty markers: provide `markers: []`; verify world-view map renders without errors
