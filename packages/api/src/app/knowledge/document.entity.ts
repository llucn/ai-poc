import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_document' })
export class DocumentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'int' })
  type!: number; // 1: directory, 2: file, 3: attachment

  @Column({ name: 'parent_id', type: 'int', default: 0 })
  parentId!: number;

  @Column({ type: 'varchar', length: 255 })
  path!: string;

  @Column({ type: 'jsonb', nullable: true })
  tags!: { tags: string[] } | null;

  @Column({ type: 'int', default: 0 })
  size!: number;

  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @Column({ name: 'created_on', type: 'timestamp' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'updated_on', type: 'timestamp', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
