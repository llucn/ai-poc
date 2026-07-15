import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { JobService } from './job.service';
import { JobLogService } from './job-log.service';
import { JobParserService } from './job-parser.service';
import { JobSchedulerService } from './job-scheduler.service';
import { JobExecutorService } from './job-executor.service';
import type { CreateJobDto, UpdateJobDto, DeleteJobsDto } from './job.dto';

@Controller('jobs')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly jobLogService: JobLogService,
    private readonly jobParserService: JobParserService,
    private readonly jobSchedulerService: JobSchedulerService,
    private readonly jobExecutorService: JobExecutorService,
  ) {}

  @Get()
  @Roles('SYSTEM_ADMIN')
  async list() {
    return this.jobService.list();
  }

  @Get(':id')
  @Roles('SYSTEM_ADMIN')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobService.findOneWithAgent(id);
  }

  @Post()
  @Roles('SYSTEM_ADMIN')
  async create(@Body() dto: CreateJobDto, @CurrentUser() user: any) {
    const createdBy = user?.username || 'system';
    const job = await this.jobService.create(dto, createdBy);
    // Parse content to extract cron and detail
    const parsed = await this.jobParserService.parse(dto.content);
    await this.jobService.updateParsedFields(
      job.id, parsed.cronExp, parsed.jobDetail, createdBy,
    );
    this.jobSchedulerService.reload();
    return this.jobService.findOne(job.id);
  }

  @Put(':id')
  @Roles('SYSTEM_ADMIN')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: any,
  ) {
    const updatedBy = user?.username || 'system';
    const job = await this.jobService.update(id, dto, updatedBy);
    if (dto.content !== undefined) {
      const parsed = await this.jobParserService.parse(dto.content);
      await this.jobService.updateParsedFields(
        job.id, parsed.cronExp, parsed.jobDetail, updatedBy,
      );
    }
    this.jobSchedulerService.reload();
    return this.jobService.findOne(id);
  }

  @Delete(':id')
  @Roles('SYSTEM_ADMIN')
  @HttpCode(200)
  async deleteOne(@Param('id', ParseIntPipe) id: number) {
    await this.jobService.deleteOne(id);
    this.jobSchedulerService.reload();
    return { deleted: 1 };
  }

  @Delete()
  @Roles('SYSTEM_ADMIN')
  @HttpCode(200)
  async deleteMany(@Body() dto: DeleteJobsDto) {
    const deleted = await this.jobService.deleteMany(dto.ids);
    this.jobSchedulerService.reload();
    return { deleted };
  }

  // --- Job Logs ---

  @Get(':id/logs')
  @Roles('SYSTEM_ADMIN')
  async listLogs(@Param('id', ParseIntPipe) jobId: number) {
    return this.jobLogService.listByJob(jobId);
  }

  @Get(':id/logs/:logId')
  @Roles('SYSTEM_ADMIN')
  async findLog(
    @Param('id', ParseIntPipe) _jobId: number,
    @Param('logId', ParseIntPipe) logId: number,
  ) {
    return this.jobLogService.findOne(logId);
  }

  // --- Test Run ---

  @Post(':id/test-run')
  @Roles('SYSTEM_ADMIN')
  async testRun(@Param('id', ParseIntPipe) jobId: number) {
    await this.jobExecutorService.execute(jobId);
    const logs = await this.jobLogService.listByJob(jobId);
    const latestLog = logs[0];
    return { logId: latestLog?.id };
  }
}
