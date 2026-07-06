import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_document_chunk' })
export class DocumentChunkEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'document_id', type: 'int' })
  documentId!: number;

  @Column({ name: 'document_name', type: 'varchar', length: 255 })
  documentName!: string;

  @Column({ name: 'document_type', type: 'int' })
  documentType!: number;

  @Column({ name: 'document_path', type: 'varchar', length: 255 })
  documentPath!: string;

  @Column({ name: 'document_tags', type: 'jsonb', nullable: true })
  documentTags!: { tags: string[] } | null;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex!: number;

  @Column({ name: 'chunk_content', type: 'text', nullable: true })
  chunkContent!: string | null;

  @Column({ name: 'search_vector', type: 'tsvector', nullable: true, select: false })
  searchVector!: string | null;

  @Column({ name: 'created_on', type: 'timestamp' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'updated_on', type: 'timestamp', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
