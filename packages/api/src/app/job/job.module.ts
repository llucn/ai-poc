import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobEntity } from './job.entity';
import { JobLogEntity } from './job-log.entity';
import { AgentEntity } from '../agent/agent.entity';
import { JobService } from './job.service';
import { JobLogService } from './job-log.service';
import { JobParserService } from './job-parser.service';
import { JobSchedulerService } from './job-scheduler.service';
import { JobExecutorService } from './job-executor.service';
import { JobController } from './job.controller';
import { LlmModule } from '../llm/llm.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobEntity, JobLogEntity, AgentEntity]),
    LlmModule,
    SessionModule,
  ],
  providers: [
    JobService,
    JobLogService,
    JobParserService,
    JobSchedulerService,
    JobExecutorService,
  ],
  controllers: [JobController],
})
export class JobModule {}
