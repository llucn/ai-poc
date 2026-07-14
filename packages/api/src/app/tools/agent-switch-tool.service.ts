import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentEntity } from '../agent/agent.entity';
import { SessionEntity } from '../session/session.entity';
import { AgentSwitchLogEntity } from '../session/agent-switch-log.entity';
import { MessageEntity } from '../session/message.entity';

export interface AgentSwitchResult {
  switched: boolean;
  targetAgent?: string;
  error?: string;
}

/**
 * Service that handles agent switching operations.
 * Used by the agent-switch server tool.
 */
@Injectable()
export class AgentSwitchToolService {
  private readonly logger = new Logger(AgentSwitchToolService.name);

  constructor(
    @InjectRepository(AgentEntity)
    private agentRepo: Repository<AgentEntity>,
    @InjectRepository(SessionEntity)
    private sessionRepo: Repository<SessionEntity>,
    @InjectRepository(AgentSwitchLogEntity)
    private switchLogRepo: Repository<AgentSwitchLogEntity>,
    @InjectRepository(MessageEntity)
    private messageRepo: Repository<MessageEntity>,
  ) {}

  /**
   * Switch the session's agent to the specified target agent.
   * Validates input, checks first-turn constraint, updates session, and logs the switch.
   */
  async switchAgent(
    sessionId: number,
    agent: string,
    confidenceScore: number,
    promptForward: string,
    createdBy: string,
  ): Promise<AgentSwitchResult> {
    const startTime = Date.now();

    try {
      // Validate parameters
      if (!agent || agent.trim().length === 0) {
        return { switched: false, error: 'Agent name is required' };
      }
      if (confidenceScore < 0.0 || confidenceScore > 1.0) {
        return {
          switched: false,
          error: 'Confidence score must be between 0.0 and 1.0',
        };
      }
      if (!promptForward || promptForward.trim().length === 0) {
        return { switched: false, error: 'Prompt forward is required' };
      }

      // Get session
      const session = await this.sessionRepo.findOne({
        where: { id: sessionId },
      });
      if (!session) {
        return { switched: false, error: `Session ${sessionId} not found` };
      }

      // Check first-turn constraint: only allow switch when session has exactly 1 user message
      const messageCount = await this.messageRepo.count({
        where: { sessionId, messageRole: 'user' },
      });
      if (messageCount > 1) {
        return {
          switched: false,
          error: 'Agent switching is only allowed on the first turn',
        };
      }

      // Get current agent
      const fromAgent = await this.agentRepo.findOne({
        where: { id: session.agentId || 0 },
      });
      if (!fromAgent) {
        return {
          switched: false,
          error: `Current agent ${session.agentId} not found`,
        };
      }

      // Look up target agent by name (case-insensitive)
      const targetAgent = await this.agentRepo
        .createQueryBuilder('agent')
        .where('LOWER(agent.name) = LOWER(:name)', { name: agent.trim() })
        .getOne();

      if (!targetAgent) {
        // Log failed attempt
        await this.createSwitchLog(
          sessionId,
          fromAgent.id,
          fromAgent.id, // Use same ID for failed attempts
          confidenceScore,
          promptForward,
          createdBy,
          `Agent not found: ${agent}`,
        );
        return { switched: false, error: `Agent not found: ${agent}` };
      }

      // Update session's agentId
      session.agentId = targetAgent.id;
      session.lastActivityTime = new Date();
      session.updatedOn = new Date();
      session.updatedBy = createdBy;
      await this.sessionRepo.save(session);

      // Log successful switch
      await this.createSwitchLog(
        sessionId,
        fromAgent.id,
        targetAgent.id,
        confidenceScore,
        promptForward,
        createdBy,
        null,
      );

      const duration = Date.now() - startTime;
      this.logger.log({
        message: 'Agent switch successful',
        sessionId,
        fromAgent: fromAgent.name,
        toAgent: targetAgent.name,
        confidenceScore,
        duration,
      });

      return { switched: true, targetAgent: targetAgent.name };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error({
        message: 'Agent switch failed',
        sessionId,
        error: errorMessage,
        duration,
      });

      return { switched: false, error: errorMessage };
    }
  }

  /**
   * Create a log entry in t_agent_switch_log
   */
  private async createSwitchLog(
    sessionId: number,
    fromAgentId: number,
    toAgentId: number,
    confidenceScore: number,
    promptForward: string,
    createdBy: string,
    errorMessage: string | null,
  ): Promise<void> {
    const log = this.switchLogRepo.create({
      sessionId,
      fromAgentId,
      toAgentId,
      confidenceScore,
      promptForward,
      switchedAt: new Date(),
      createdBy,
      errorMessage,
    });
    await this.switchLogRepo.save(log);
  }
}
