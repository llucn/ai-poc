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

/**
 * Parse the LLM's raw output into the content shown as the Assistant reply.
 *
 * The LLM is instructed to reply with a single JSON object, one of:
 *   {"thought": "...", "final_answer": "..."}
 *   {"thought": "...", "action": {"tool": "...", "params": {...}}}
 *
 * Reply content is determined by, in priority order:
 *   1. JSON.parse fails            -> error message
 *   2. has `final_answer`          -> its value (stringified if not a string)
 *   3. has `action` (no final_*)   -> its value (temporary fallback; tool calls
 *                                     are handled in a later change)
 *   4. neither present             -> error message about the missing field
 *
 * The Thought message keeps the raw output unchanged; only the reply uses this.
 * Always returns a string so it can be persisted safely.
 */
export function parseAssistantReply(llmOutput: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(llmOutput);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'unknown error';
    return `Failed to parse LLM output as JSON: ${detail}. Raw output: ${llmOutput}`;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return `LLM output is not a JSON object. Raw output: ${llmOutput}`;
  }

  const obj = parsed as Record<string, unknown>;

  if ('final_answer' in obj) {
    const value = obj.final_answer;
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  if ('action' in obj) {
    const value = obj.action;
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  return `LLM output is missing both "final_answer" and "action". Raw output: ${llmOutput}`;
}

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
   * Create a new empty session (lazy creation, no messages).
   * Session name = first 200 chars of the first message content.
   * Queries the default Agent (is_default=1) and associates it with the session.
   *
   * This is a plain HTTP call. The first user message is sent separately via
   * the SSE `createMessage` flow, exactly like every subsequent message — so
   * message handling lives in one place (`createMessage`) only.
   */
  async createSession(
    dto: CreateSessionDto,
    userName: string,
    createdBy: string
  ): Promise<SessionEntity> {
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

    const session = this.sessionRepository.create({
      name: sessionName,
      userName,
      agentId: defaultAgent.id,
      lastActivityTime: now,
      createdOn: now,
      createdBy,
    });
    return this.sessionRepository.save(session);
  }

  /**
   * Send a message to an existing session. Saves the user message, calls LLM,
   * saves thought + assistant reply, and streams all events via SSE to the response.
   * Does not return a value — writes directly to the response object.
   *
   * This is the single entry point for ALL message handling, including the very
   * first message of a freshly created session.
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

    // Query session's agent to get system_prompt and model_config
    const agent = await this.agentRepository.findOne({
      where: { id: session.agentId || 0 },
    });
    if (!agent) {
      throw new NotFoundException(
        `Agent with id ${session.agentId} not found for session ${sessionId}`
      );
    }

    try {
      const { savedThoughtMsg, savedAssistantMsg } = await this.runLlmTurn(
        session,
        agent,
        dto.content,
        userName,
        createdBy
      );

      // SSE event: thought_created
      res.write(`event: thought_created\n`);
      res.write(`data: ${JSON.stringify(savedThoughtMsg)}\n\n`);

      // SSE event: message_created
      res.write(`event: message_created\n`);
      res.write(`data: ${JSON.stringify(savedAssistantMsg)}\n\n`);
    } catch (err) {
      // SSE event: error
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      this.logger.error(`createMessage SSE error: ${errorMessage}`);
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: errorMessage })}\n\n`);
    } finally {
      // Close SSE connection
      res.end();
    }
  }

  /**
   * Run one full assistant turn for a session: persist the user message, build
   * the LLM context from history, call the LLM, then persist the Thought and
   * the parsed assistant reply. Also bumps the session's last_activity_time.
   *
   * The LLM call happens outside any DB transaction so the connection isn't
   * held during the network round-trip. Returns the two saved assistant-side
   * messages so the caller can stream them.
   */
  private async runLlmTurn(
    session: SessionEntity,
    agent: AgentEntity,
    content: string,
    userName: string,
    createdBy: string
  ): Promise<{
    savedUserMsg: MessageEntity;
    savedThoughtMsg: MessageEntity;
    savedAssistantMsg: MessageEntity;
  }> {
    const sessionId = session.id;
    const now = new Date();

    // Save user message first
    const userMessage = this.messageRepository.create({
      sessionId,
      userName,
      messageType: 1,
      isThought: 0,
      content,
      createdOn: now,
      createdBy,
    });
    const savedUserMsg = await this.messageRepository.save(userMessage);

    // Query session history (last 200 messages DESC, then reverse to ASC)
    const history = await this.messageRepository.find({
      where: { sessionId },
      order: { createdOn: 'DESC', id: 'DESC' },
      take: 200,
    });
    history.reverse();

    // Build messages array for LLM
    const systemPrompt = agent.systemPrompt || 'You are a helpful assistant.';
    const llmMessages: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({
        role: (msg.userName === ASSISTANT_USER ? 'assistant' : 'user') as
          | 'user'
          | 'assistant',
        content: msg.content || '',
      })),
    ];

    // Call LLM
    this.logger.log(
      `Calling LLM for session ${sessionId} with ${llmMessages.length} messages`
    );
    const llmOutput = await this.llmService.callLlm(agent, llmMessages);
    this.logger.log(`LLM output for session ${sessionId}: ${llmOutput}`);

    // Save Thought message (is_thought=1)
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

    // Save assistant reply (is_thought=0)
    const assistantMessage = this.messageRepository.create({
      sessionId,
      userName: ASSISTANT_USER,
      messageType: 1,
      isThought: 0,
      content: parseAssistantReply(llmOutput),
      createdOn: new Date(now.getTime() + 2),
      createdBy: `assistant/${createdBy}`,
    });
    const savedAssistantMsg =
      await this.messageRepository.save(assistantMessage);

    // Update session last_activity_time
    session.lastActivityTime = now;
    session.updatedOn = now;
    session.updatedBy = createdBy;
    await this.sessionRepository.save(session);

    return { savedUserMsg, savedThoughtMsg, savedAssistantMsg };
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
