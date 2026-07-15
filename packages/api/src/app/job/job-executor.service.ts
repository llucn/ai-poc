import { Injectable, Logger } from '@nestjs/common';
import { JobService } from './job.service';
import { JobLogService } from './job-log.service';
import { SessionService } from '../session/session.service';

const MAX_CONCURRENT = 3;
const EXECUTION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class JobExecutorService {
  private readonly logger = new Logger(JobExecutorService.name);
  private running = 0;

  constructor(
    private readonly jobService: JobService,
    private readonly jobLogService: JobLogService,
    private readonly sessionService: SessionService,
  ) {}

  async execute(jobId: number): Promise<void> {
    if (this.running >= MAX_CONCURRENT) {
      this.logger.warn(
        `Concurrency limit reached (${MAX_CONCURRENT}), skipping job ${jobId}`,
      );
      return;
    }

    this.running++;
    const log = await this.jobLogService.createRunning(jobId, 'scheduler');

    try {
      const job = await this.jobService.findOne(jobId);
      const message = job.jobDetail || job.content || '';

      const result = await this.executeWithTimeout(
        job.agentId,
        message,
        EXECUTION_TIMEOUT_MS,
      );

      await this.jobLogService.markSuccess(log.id, result);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Job ${jobId} failed: ${errorMsg}`);
      await this.jobLogService.markFail(log.id, errorMsg);
    } finally {
      this.running--;
    }
  }

  private async executeWithTimeout(
    agentId: number,
    message: string,
    timeoutMs: number,
  ): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const session = await this.sessionService.createSessionForJob(
        agentId,
        'scheduler',
      );
      const result = await this.sessionService.sendMessageNonStreaming(
        session.id,
        message,
        'scheduler',
        'scheduler',
        controller.signal,
      );
      return result;
    } finally {
      clearTimeout(timer);
    }
  }
}
