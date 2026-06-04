// Source of truth for the kebab-case rule on issue-category names.
// The same regex literal is duplicated at
// packages/web/src/app/pages/issue-category/kebab-case.ts — if they ever
// disagree, this file wins (the API enforces the contract; the web check
// is a UX nicety).
export const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isKebabCase(value: string): boolean {
  return KEBAB_CASE_REGEX.test(value);
}
