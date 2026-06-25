# Implementation Tasks

## 1. Web: select-string-array tool component

- [x] 1.1 Create `tools/select-string-array.tsx`: `defineClientTool` with zod params (`options: string[]`, `title?`, `multiple?` default true, `searchable?` default true); handler calls `renderInToolArea` with `<SelectStringArrayPanel>` and returns its Promise
- [x] 1.2 Implement `SelectStringArrayPanel`: manage selection state, optional search filter state, and client-side pagination (PAGE_SIZE=10) over the filtered options
- [x] 1.3 Render search input (if `searchable` is true) that filters options with case-insensitive substring matching; filter applies before pagination
- [x] 1.4 Render `ic-table` with single column (Option) showing checkboxes/radio buttons based on `multiple` flag; reuse existing table CSS classes
- [x] 1.5 Implement `ic-pagination` for Previous/Next navigation over the filtered options array
- [x] 1.6 Implement OK button → resolve `{ cancelled: false, selected: [...] }`, Cancel button → resolve `{ cancelled: true, selected: [] }`
- [x] 1.7 Handle edge cases: no options provided (show "No options" message), search narrows to zero results (show "No matching options")

## 2. Web: tool registration

- [x] 2.1 Register the tool in `tools/index.ts` (import `./select-string-array`)
- [x] 2.2 Confirm TypeScript compiles cleanly: `tsc --noEmit`
- [x] 2.3 Confirm build passes: `nx build web`

## 3. Verification

- [ ] 3.1 Unit test: `select-string-array` registers and `getAllClientTools()` emits its JSON schema with required `options` param
- [ ] 3.2 Unit test: bridge resolves correctly on OK (with selected options) and Cancel (with empty array and cancelled=true)
- [ ] 3.3 Verify existing tools (`prompt-input`, `select-users`) still work unchanged (regression test)

## 4. Manual end-to-end (requires running services + LLM)

- [ ] 4.1 Log in → `/client-tools/sync` registers `select-string-array` into `t_tool` (source='registry'); link it to an agent
- [ ] 4.2 In chat, drive the agent to call `select-string-array` with a small array (~5 items); verify Tool Area slides in, options render correctly
- [ ] 4.3 Test single-select mode: only one option selectable at a time (radio behavior)
- [ ] 4.4 Test multi-select mode: multiple options selectable (checkbox behavior)
- [ ] 4.5 Test pagination: provide 25+ options, verify pagination controls work and selection persists across pages
- [ ] 4.6 Test search: provide 20+ options with `searchable: true`, type search query, verify filtering works and pagination adjusts
- [ ] 4.7 Test OK flow: select options + OK → loop resumes with chosen options; verify Tool Area collapses and chat width restores
- [ ] 4.8 Test Cancel flow: Cancel → loop resumes with cancelled outcome; verify Tool Area collapses
- [ ] 4.9 Test edge case: empty options array → tool shows "No options" message
- [ ] 4.10 Test edge case: search query matching zero results → shows "No matching options"
