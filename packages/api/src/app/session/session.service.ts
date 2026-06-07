import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { SessionEntity } from './session.entity';
import { MessageEntity } from './message.entity';
import { AgentEntity } from '../agent/agent.entity';
import { LlmService } from '../llm/llm.service';
import type { CreateSessionDto, CreateMessageDto } from './session.dto';
import type { Response } from 'express';

const ASSISTANT_USER = 'ASSISTANT';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(AgentEntity)
    private readonly agentRepository: Repository<AgentEntity>,
    private readonly dataSource: DataSource,
    private readonly llmService: LlmService
  ) {}

  /**
   * List sessions for a given user, paginated, ordered by last_activity_time DESC.
   */
  async findAll(userName: string, page: number = 1, pageSize: number = 20) {
    const [sessions, total] = await this.sessionRepository.findAndCount({
      where: { userName },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { lastActivityTime: 'DESC' },
    });

    return {
      data: sessions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number, userName: string): Promise<SessionEntity> {
    const session = await this.sessionRepository.findOne({
      where: { id, userName },
    });
    if (!session) {
      throw new NotFoundException(`Session with id ${id} not found`);
    }
    return session;
  }

  /**
   * Create a new session with the first message (lazy creation).
   * Session name = first 200 chars of message content.
   * Queries the default Agent (is_default=1) and associates it with the session.
   *
   * Flow:
   *   1. (txn) Create session + user message.
   *   2. (no txn) Call LLM with system_prompt + first user message.
   *   3. (txn) Save Thought + assistant reply with the LLM output.
   *
   * The LLM call is outside the DB transaction so the connection isn't held
   * during the network round-trip.
   */
  async createSessionWithFirstMessage(
    dto: CreateSessionDto,
    userName: string,
    createdBy: string
  ): Promise<{ session: SessionEntity; messages: MessageEntity[] }> {
    const now = new Date();
    const sessionName = dto.content.substring(0, 200);

    // Query default Agent
    const defaultAgent = await this.agentRepository.findOne({
      where: { isDefault: 1 },
    });
    if (!defaultAgent) {
      throw new NotFoundException(
        'Default agent not configured. Please contact admin.'
      );
    }

    // Step 1: create session + user message in a short transaction.
    const { savedSession, savedUserMsg } = await this.dataSource.transaction(
      async (manager) => {
        const session = manager.create(SessionEntity, {
          name: sessionName,
          userName,
          agentId: defaultAgent.id,
          lastActivityTime: now,
          createdOn: now,
          createdBy,
        });
        const savedSession = await manager.save(SessionEntity, session);

        const userMessage = manager.create(MessageEntity, {
          sessionId: savedSession.id,
          userName,
          messageType: 1,
          isThought: 0,
          content: dto.content,
          createdOn: now,
          createdBy,
        });
        const savedUserMsg = await manager.save(MessageEntity, userMessage);

        return { savedSession, savedUserMsg };
      }
    );

    // Step 2: call LLM outside the transaction.
    const systemPrompt =
      defaultAgent.systemPrompt || 'You are a helpful assistant.';
    const llmMessages: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: dto.content },
    ];

    this.logger.log(
      `Calling LLM for new session ${savedSession.id} with ${llmMessages.length} messages`
    );
    const llmOutput = await this.llmService.callLlm(defaultAgent, llmMessages);
    this.logger.log(
      `LLM output for session ${savedSession.id}: ${llmOutput}`
    );

    // Step 3: save Thought + assistant reply in a second short transaction.
    const { savedThoughtMsg, savedAssistantMsg } =
      await this.dataSource.transaction(async (manager) => {
        const thoughtMessage = manager.create(MessageEntity, {
          sessionId: savedSession.id,
          userName: ASSISTANT_USER,
          messageType: 1,
          isThought: 1,
          content: llmOutput,
          createdOn: new Date(now.getTime() + 1),
          createdBy: `assistant/${createdBy}`,
        });
        const savedThoughtMsg = await manager.save(
          MessageEntity,
          thoughtMessage
        );

        const assistantMessage = manager.create(MessageEntity, {
          sessionId: savedSession.id,
          userName: ASSISTANT_USER,
          messageType: 1,
          isThought: 0,
          content: llmOutput,
          createdOn: new Date(now.getTime() + 2),
          createdBy: `assistant/${createdBy}`,
        });
        const savedAssistantMsg = await manager.save(
          MessageEntity,
          assistantMessage
        );

        return { savedThoughtMsg, savedAssistantMsg };
      });

    return {
      session: savedSession,
      messages: [savedUserMsg, savedThoughtMsg, savedAssistantMsg],
    };
  }

  /**
   * Send a message to an existing session. Saves the user message, calls LLM,
   * saves thought + assistant reply, and streams all events via SSE to the response.
   * Does not return a value — writes directly to the response object.
   */
  async createMessage(
    sessionId: number,
    dto: CreateMessageDto,
    userName: string,
    createdBy: string,
    res: Response
  ): Promise<void> {
    // Verify session belongs to user
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userName },
    });
    if (!session) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }

    // 5.2: Query session's agent to get system_prompt and model_config
    const agent = await this.agentRepository.findOne({
      where: { id: session.agentId || 0 },
    });
    if (!agent) {
      throw new NotFoundException(
        `Agent with id ${session.agentId} not found for session ${sessionId}`
      );
    }

    const now = new Date();

    try {
      // Save user message first
      const userMessage = this.messageRepository.create({
        sessionId,
        userName,
        messageType: 1,
        isThought: 0,
        content: dto.content,
        createdOn: now,
        createdBy,
      });
      await this.messageRepository.save(userMessage);

      // 5.3: Query session history (last 200 messages DESC, then reverse to ASC)
      const history = await this.messageRepository.find({
        where: { sessionId },
        order: { createdOn: 'DESC', id: 'DESC' },
        take: 200,
      });
      history.reverse();

      // 5.4: Build messages array for LLM
      const systemPrompt = agent.systemPrompt || 'You are a helpful assistant.';
      const llmMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt },
        ...history.map((msg) => ({
          role: (msg.userName === ASSISTANT_USER ? 'assistant' : 'user') as
            | 'user'
            | 'assistant',
          content: msg.content || '',
        })),
      ];

      // Call LLM
      this.logger.log(`Calling LLM for session ${sessionId} with ${llmMessages.length} messages`);
      const llmOutput = await this.llmService.callLlm(agent, llmMessages);
      this.logger.log(`LLM output for session ${sessionId}: ${llmOutput}`);

      // 5.5: Save Thought message (is_thought=1)
      const thoughtMessage = this.messageRepository.create({
        sessionId,
        userName: ASSISTANT_USER,
        messageType: 1,
        isThought: 1,
        content: llmOutput,
        createdOn: new Date(now.getTime() + 1),
        createdBy: `assistant/${createdBy}`,
      });
      const savedThoughtMsg = await this.messageRepository.save(thoughtMessage);

      // SSE event: thought_created
      res.write(`event: thought_created\n`);
      res.write(`data: ${JSON.stringify(savedThoughtMsg)}\n\n`);

      // 5.6: Save assistant reply (is_thought=0)
      const assistantMessage = this.messageRepository.create({
        sessionId,
        userName: ASSISTANT_USER,
        messageType: 1,
        isThought: 0,
        content: llmOutput,
        createdOn: new Date(now.getTime() + 2),
        createdBy: `assistant/${createdBy}`,
      });
      const savedAssistantMsg =
        await this.messageRepository.save(assistantMessage);

      // SSE event: message_created
      res.write(`event: message_created\n`);
      res.write(`data: ${JSON.stringify(savedAssistantMsg)}\n\n`);

      // Update session last_activity_time
      session.lastActivityTime = now;
      session.updatedOn = now;
      session.updatedBy = createdBy;
      await this.sessionRepository.save(session);
    } catch (err) {
      // 5.7: SSE event: error
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      this.logger.error(`createMessage SSE error: ${errorMessage}`);
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: errorMessage })}\n\n`);
    } finally {
      // 5.8: Close SSE connection
      res.end();
    }
  }

  /**
   * Get all messages for a session, ordered by created_on ASC (full load, no pagination).
   */
  async getMessages(
    sessionId: number,
    userName: string
  ): Promise<MessageEntity[]> {
    // Verify session belongs to user
    await this.findOne(sessionId, userName);

    return this.messageRepository.find({
      where: { sessionId },
      order: { createdOn: 'ASC', id: 'ASC' },
    });
  }

  /**
   * Delete sessions by IDs (only those belonging to the user).
   * Cascading: deletes associated messages in the application layer.
   */
  async deleteByIds(ids: number[], userName: string): Promise<number> {
    if (!ids || ids.length === 0) return 0;

    return await this.dataSource.transaction(async (manager) => {
      // Find sessions that belong to the user
      const sessions = await manager.find(SessionEntity, {
        where: ids.map((id) => ({ id, userName })),
      });
      const validIds = sessions.map((s) => s.id);
      if (validIds.length === 0) return 0;

      // Delete messages first
      await manager.delete(MessageEntity, { sessionId: In(validIds) });
      // Delete sessions
      const result = await manager.delete(SessionEntity, validIds);
      return result.affected ?? 0;
    });
  }
}
