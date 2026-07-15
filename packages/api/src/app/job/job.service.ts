import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobEntity } from './job.entity';
import { JobLogEntity } from './job-log.entity';
import { AgentEntity } from '../agent/agent.entity';
import type { CreateJobDto, UpdateJobDto } from './job.dto';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(JobEntity)
    private readonly jobRepo: Repository<JobEntity>,
    @InjectRepository(JobLogEntity)
    private readonly jobLogRepo: Repository<JobLogEntity>,
    @InjectRepository(AgentEntity)
    private readonly agentRepo: Repository<AgentEntity>,
  ) {}

  async create(dto: CreateJobDto, createdBy: string): Promise<JobEntity> {
    await this.checkDuplicateName(dto.name);
    const job = this.jobRepo.create({
      name: dto.name,
      agentId: dto.agentId,
      content: dto.content,
      createdOn: new Date(),
      createdBy,
    });
    return this.jobRepo.save(job);
  }

  async list() {
    const jobs = await this.jobRepo.find({ order: { name: 'ASC' } });
    const agentIds = [...new Set(jobs.map(j => j.agentId))];
    const agents = agentIds.length
      ? await this.agentRepo.findBy(agentIds.map(id => ({ id })))
      : [];
    const agentMap = new Map(agents.map(a => [a.id, a.name]));
    return jobs.map(j => ({
      ...j,
      agentName: agentMap.get(j.agentId) || 'Unknown',
    }));
  }

  async findOne(id: number): Promise<JobEntity> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job with id ${id} not found`);
    return job;
  }

  async findOneWithAgent(id: number) {
    const job = await this.findOne(id);
    const agent = await this.agentRepo.findOne({ where: { id: job.agentId } });
    return { ...job, agentName: agent?.name || 'Unknown' };
  }

  async update(id: number, dto: UpdateJobDto, updatedBy: string): Promise<JobEntity> {
    const job = await this.findOne(id);
    if (dto.name && dto.name !== job.name) {
      await this.checkDuplicateName(dto.name, id);
      job.name = dto.name;
    }
    if (dto.agentId !== undefined) job.agentId = dto.agentId;
    if (dto.content !== undefined) job.content = dto.content;
    job.updatedOn = new Date();
    job.updatedBy = updatedBy;
    return this.jobRepo.save(job);
  }

  async updateParsedFields(
    id: number,
    cronExp: string | null,
    jobDetail: string | null,
    updatedBy: string,
  ) {
    const job = await this.findOne(id);
    job.cronExp = cronExp;
    job.jobDetail = jobDetail;
    job.updatedOn = new Date();
    job.updatedBy = updatedBy;
    return this.jobRepo.save(job);
  }

  async deleteOne(id: number): Promise<void> {
    const job = await this.findOne(id);
    await this.jobLogRepo.delete({ jobId: job.id });
    await this.jobRepo.remove(job);
  }

  async deleteMany(ids: number[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const job = await this.jobRepo.findOne({ where: { id } });
      if (job) {
        await this.jobLogRepo.delete({ jobId: job.id });
        await this.jobRepo.remove(job);
        count++;
      }
    }
    return count;
  }

  async findAllWithCron(): Promise<JobEntity[]> {
    return this.jobRepo
      .createQueryBuilder('j')
      .where('j.cron_exp IS NOT NULL')
      .getMany();
  }

  private async checkDuplicateName(name: string, excludeId?: number) {
    const existing = await this.jobRepo.findOne({ where: { name } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Job with name '${name}' already exists`);
    }
  }
}
