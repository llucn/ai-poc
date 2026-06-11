import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// A Skill is a top-level resource. It is associated with Agents through
// t_agent_skill (many-to-many). name is kebab-case and globally unique.
@Entity({ name: 't_skill' })
export class SkillEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'longtext', nullable: true })
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
