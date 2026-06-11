import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Association table linking an Agent to a Skill (many-to-many). The Skill
// resource itself (name / description / content) lives in t_skill.
//
// Plain columns linking to t_agent.id and t_skill.id. No DB foreign keys —
// referential integrity is enforced in the application layer (see AgentService
// / SkillService).
@Entity({ name: 't_agent_skill' })
export class AgentSkillEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'agent_id', type: 'int' })
  agentId!: number;

  @Column({ name: 'skill_id', type: 'int' })
  skillId!: number;

  @Column({ name: 'created_on', type: 'timestamp' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'updated_on', type: 'timestamp', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
