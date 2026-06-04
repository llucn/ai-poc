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

export type FieldDto = {
  id: number;
  name: string;
  title: string;
  description: string | null;
  required: boolean;
  defaultValue: string | null;
  type: FieldType;
  properties: Record<string, unknown> | null;
  createdOn: string;
  createdBy: string;
  updatedOn: string | null;
  updatedBy: string | null;
};

export type ExistsFieldResponse = {
  name: boolean;
};

export type FieldConflictResponse = {
  statusCode: 409;
  message: string;
  field: 'name';
  value: string;
};
