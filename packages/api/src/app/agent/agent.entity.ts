import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export interface AgentModelConfig {
  baseUrl: string | null;
  authToken: string | null;
  modelName: string | null;
}

@Entity({ name: 't_agent' })
export class AgentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'model_config', type: 'json', nullable: true })
  modelConfig!: AgentModelConfig | null;

  @Column({ name: 'is_default', type: 'int', default: 0 })
  isDefault!: number;

  @Column({ name: 'system_prompt', type: 'longtext', nullable: true })
  systemPrompt!: string | null;

  @Column({ name: 'created_on', type: 'timestamp' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'updated_on', type: 'timestamp', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
