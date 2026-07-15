import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { CronJob } from 'cron';
import { JobService } from './job.service';
import { JobExecutorService } from './job-executor.service';

@Injectable()
export class JobSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobSchedulerService.name);
  private readonly jobs = new Map<number, CronJob>();

  constructor(
    private readonly jobService: JobService,
    private readonly jobExecutor: JobExecutorService,
  ) {}

  async onModuleInit() {
    await this.loadAll();
    this.logger.log(`Scheduler initialized with ${this.jobs.size} jobs`);
  }

  onModuleDestroy() {
    this.stopAll();
  }

  async reload() {
    this.stopAll();
    await this.loadAll();
    this.logger.log(`Scheduler reloaded with ${this.jobs.size} jobs`);
  }

  private async loadAll() {
    const allJobs = await this.jobService.findAllWithCron();
    for (const job of allJobs) {
      if (!job.cronExp) continue;
      try {
        const cronJob = new CronJob(job.cronExp, () => {
          this.jobExecutor.execute(job.id).catch(err => {
            this.logger.error(`Job ${job.id} execution error: ${err}`);
          });
        });
        cronJob.start();
        this.jobs.set(job.id, cronJob);
      } catch (err) {
        this.logger.error(
          `Failed to schedule job ${job.id} (${job.cronExp}): ${err}`,
        );
      }
    }
  }

  private stopAll() {
    for (const [id, cronJob] of this.jobs) {
      cronJob.stop();
      this.jobs.delete(id);
    }
  }
}
