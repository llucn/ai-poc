import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobLogEntity } from './job-log.entity';

export const JOB_STATUS_SUCCESS = 0;
export const JOB_STATUS_FAIL = -1;
export const JOB_STATUS_RUNNING = 1;

@Injectable()
export class JobLogService {
  constructor(
    @InjectRepository(JobLogEntity)
    private readonly logRepo: Repository<JobLogEntity>,
  ) {}

  async listByJob(jobId: number): Promise<JobLogEntity[]> {
    return this.logRepo.find({
      where: { jobId },
      order: { createdOn: 'DESC' },
    });
  }

  async findOne(id: number): Promise<JobLogEntity> {
    const log = await this.logRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException(`Job log with id ${id} not found`);
    return log;
  }

  async createRunning(jobId: number, createdBy: string): Promise<JobLogEntity> {
    const log = this.logRepo.create({
      jobId,
      jobStatus: JOB_STATUS_RUNNING,
      createdOn: new Date(),
      createdBy,
    });
    return this.logRepo.save(log);
  }

  async markSuccess(id: number, jobLog: string): Promise<void> {
    await this.logRepo.update(id, {
      jobStatus: JOB_STATUS_SUCCESS,
      jobLog,
      updatedOn: new Date(),
      updatedBy: 'scheduler',
    });
  }

  async markFail(id: number, errorMessage: string): Promise<void> {
    await this.logRepo.update(id, {
      jobStatus: JOB_STATUS_FAIL,
      jobLog: errorMessage,
      updatedOn: new Date(),
      updatedBy: 'scheduler',
    });
  }
}
