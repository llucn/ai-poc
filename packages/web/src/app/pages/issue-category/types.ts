export type IssueCategoryDto = {
  id: number;
  name: string;
  displayName: string;
};

export type ExistsResponse = {
  name: boolean;
  displayName: boolean;
};

export type ConflictResponse = {
  statusCode: 409;
  message: string;
  field: 'name' | 'displayName';
  value: string;
};
