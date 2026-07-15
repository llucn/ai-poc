import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentEntity } from '../agent/agent.entity';
import { LlmService } from '../llm/llm.service';

export interface ParsedJobContent {
  cronExp: string | null;
  jobDetail: string | null;
}

@Injectable()
export class JobParserService {
  private readonly logger = new Logger(JobParserService.name);

  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentRepo: Repository<AgentEntity>,
    private readonly llmService: LlmService,
  ) {}

  async parse(content: string): Promise<ParsedJobContent> {
    // Find the "job" agent
    const agent = await this.agentRepo.findOne({
      where: { name: 'job' },
    });

    if (!agent) {
      this.logger.warn('Job agent not found, skipping parsing');
      return { cronExp: null, jobDetail: content };
    }

    const system = agent.systemPrompt || '';
    const messages = [
      { role: 'user' as const, content },
    ];

    const result = await this.llmService.callLlm(
      agent, system, messages, [],
    );

    if (result.kind === 'error') {
      this.logger.error(`Job parser LLM error: ${result.message}`);
      return { cronExp: null, jobDetail: content };
    }

    if (result.kind === 'final') {
      return this.parseJson(result.text, content);
    }

    return { cronExp: null, jobDetail: content };
  }

  private parseJson(text: string, originalContent: string): ParsedJobContent {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn('No JSON found in job agent response');
        return { cronExp: null, jobDetail: originalContent };
      }
      const parsed = JSON.parse(jsonMatch[0]);
      const cronExp = parsed.cron_exp || null;
      const jobDetail = parsed.job_detail || originalContent;

      if (cronExp && !this.isValidCron(cronExp)) {
        throw new BadRequestException(
          `Invalid cron expression extracted: "${cronExp}"`,
        );
      }

      return { cronExp, jobDetail };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Failed to parse job agent response: ${text}`);
      return { cronExp: null, jobDetail: originalContent };
    }
  }

  private isValidCron(expr: string): boolean {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return false;
    // Basic validation: each field should match cron patterns
    const patterns = [
      /^(\*|(\*\/\d+)|(\d+(-\d+)?(,\d+(-\d+)?)*))$/, // minute 0-59
      /^(\*|(\*\/\d+)|(\d+(-\d+)?(,\d+(-\d+)?)*))$/, // hour 0-23
      /^(\*|(\*\/\d+)|(\d+(-\d+)?(,\d+(-\d+)?)*))$/, // day 1-31
      /^(\*|(\*\/\d+)|(\d+(-\d+)?(,\d+(-\d+)?)*))$/, // month 1-12
      /^(\*|(\*\/\d+)|(\d+(-\d+)?(,\d+(-\d+)?)*))$/, // dow 0-6
    ];
    return parts.every((part, i) => patterns[i].test(part));
  }
}
