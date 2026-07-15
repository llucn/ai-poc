import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 't_job_log' })
export class JobLogEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'job_id', type: 'int' })
  jobId!: number;

  @Column({ name: 'job_log', type: 'text', nullable: true })
  jobLog!: string | null;

  @Column({ name: 'job_status', type: 'int', nullable: true })
  jobStatus!: number | null;

  @Column({ name: 'created_on', type: 'timestamp' })
  createdOn!: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ name: 'updated_on', type: 'timestamp', nullable: true })
  updatedOn!: Date | null;

  @Column({ name: 'updated_by', type: 'varchar', length: 255, nullable: true })
  updatedBy!: string | null;
}
