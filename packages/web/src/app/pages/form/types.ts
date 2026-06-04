export type FormDto = {
  id: number;
  name: string;
  description: string | null;
  createdOn: string;
  createdBy: string;
  updatedOn: string | null;
  updatedBy: string | null;
};

export type FieldSnapshotDto = {
  id: number;
  name: string;
  title: string;
  type: string;
};

export type FormFieldDto = {
  formId: number;
  fieldId: number;
  position: number;
  field: FieldSnapshotDto;
};

export type ExistsFormResponse = { name: boolean };

export type FormConflictResponse = {
  statusCode: 409;
  message: string;
  field: 'name';
  value: string;
};
