import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FieldEntity } from '../field/field.entity';

@Entity({ name: 't_form_field' })
export class FormFieldEntity {
  @PrimaryColumn({ name: 'form_id', type: 'int' })
  formId!: number;

  @PrimaryColumn({ name: 'field_id', type: 'int' })
  fieldId!: number;

  @Column({ type: 'int' })
  position!: number;

  @CreateDateColumn({ name: 'created_on' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @UpdateDateColumn({ name: 'updated_on', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;

  @ManyToOne(() => FieldEntity, { eager: true })
  @JoinColumn({ name: 'field_id' })
  field!: FieldEntity;
}
