import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_issue_category' })
export class IssueCategoryEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 255, unique: true })
  displayName!: string;
}
