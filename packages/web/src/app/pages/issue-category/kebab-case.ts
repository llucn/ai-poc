// Kebab-case rule on issue-category names. The source of truth lives in
// packages/api/src/app/issue-category/kebab-case.ts — if these two files
// ever disagree, the API wins (this check is a UX nicety; the API enforces
// the contract).
export const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isKebabCase(value: string): boolean {
  return KEBAB_CASE_REGEX.test(value);
}
