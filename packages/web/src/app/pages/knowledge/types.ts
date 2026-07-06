export interface Document {
  id: number;
  name: string;
  type: number; // 1: directory, 2: file, 3: attachment
  parentId: number;
  path: string;
  tags: { tags: string[] } | null;
  size: number;
  content: string | null;
  createdOn: string;
  createdBy: string;
  updatedOn: string | null;
  updatedBy: string | null;
  downloadUrl?: string;
}

export const DOC_TYPE_DIRECTORY = 1;
export const DOC_TYPE_FILE = 2;
export const DOC_TYPE_ATTACHMENT = 3;
