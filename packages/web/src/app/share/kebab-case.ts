// Kebab-case rule, mirrored from the API
// (packages/api/src/app/utils/kebab-case.ts). The API enforces the contract;
// this client-side check is a UX nicety for inline form validation.
export const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isKebabCase(value: string): boolean {
  return KEBAB_CASE_REGEX.test(value);
}
