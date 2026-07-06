export interface CreateDirectoryDto {
  name: string;
  parentId: number;
}

export interface CreateDocumentDto {
  name: string;
  parentId: number;
  content: string;
  tags?: string[];
}

export interface UpdateDocumentContentDto {
  content: string;
}

export interface RenameDocumentDto {
  name: string;
}

export interface MoveDocumentDto {
  parentId: number;
}

export interface UpdateDocumentTagsDto {
  tags: string[];
}

export interface DeleteDocumentsDto {
  ids: number[];
}
