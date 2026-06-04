export const FIELD_TYPES = [
  'text-field',
  'text-area',
  'number',
  'select',
  'radio',
  'checkbox',
  'date',
  'datetime',
  'file',
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export function isFieldType(value: string): value is FieldType {
  return (FIELD_TYPES as readonly string[]).includes(value);
}
