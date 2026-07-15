import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_job' })
export class JobEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'agent_id', type: 'int' })
  agentId!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  content!: string | null;

  @Column({ name: 'cron_exp', type: 'varchar', length: 255, nullable: true })
  cronExp!: string | null;

  @Column({ name: 'job_detail', type: 'text', nullable: true })
  jobDetail!: string | null;

  @Column({ name: 'created_on', type: 'timestamp' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'updated_on', type: 'timestamp', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
