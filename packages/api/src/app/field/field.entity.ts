import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 't_field' })
export class FieldEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int', default: 0 })
  required!: number;

  @Column({ name: 'default_value', type: 'text', nullable: true })
  defaultValue!: string | null;

  @Column({ type: 'varchar', length: 64 })
  type!: string;

  @Column({ type: 'text', nullable: true })
  properties!: string | null;

  @CreateDateColumn({ name: 'created_on' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @UpdateDateColumn({ name: 'updated_on', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
