import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SessionEntity } from './session.entity';
import { MessageEntity } from './message.entity';
import type { CreateSessionDto, CreateMessageDto } from './session.dto';

const ASSISTANT_USER = 'ASSISTANT';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    private readonly dataSource: DataSource
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
   * Echo flow inside the transaction creates three messages in time order:
   *   1. user message
   *   2. assistant Thought (is_thought = 1)
   *   3. assistant reply
   */
  async createSessionWithFirstMessage(
    dto: CreateSessionDto,
    userName: string,
    createdBy: string
  ): Promise<{ session: SessionEntity; messages: MessageEntity[] }> {
    const now = new Date();
    const sessionName = dto.content.substring(0, 200);

    return await this.dataSource.transaction(async (manager) => {
      // Create session
      const session = manager.create(SessionEntity, {
        name: sessionName,
        userName,
        lastActivityTime: now,
        createdOn: now,
        createdBy,
      });
      const savedSession = await manager.save(SessionEntity, session);

      // 1. User message
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

      // 2. Thought message (assistant) — +1ms ensures it sorts after user.
      const thoughtMessage = manager.create(MessageEntity, {
        sessionId: savedSession.id,
        userName: ASSISTANT_USER,
        messageType: 1,
        isThought: 1,
        content: dto.content,
        createdOn: new Date(now.getTime() + 1),
        createdBy: `assistant/${createdBy}`,
      });
      const savedThoughtMsg = await manager.save(
        MessageEntity,
        thoughtMessage
      );

      // 3. Assistant reply — +2ms ensures it sorts after the Thought.
      const assistantMessage = manager.create(MessageEntity, {
        sessionId: savedSession.id,
        userName: ASSISTANT_USER,
        messageType: 1,
        isThought: 0,
        content: dto.content,
        createdOn: new Date(now.getTime() + 2),
        createdBy: `assistant/${createdBy}`,
      });
      const savedAssistantMsg = await manager.save(
        MessageEntity,
        assistantMessage
      );

      return {
        session: savedSession,
        messages: [savedUserMsg, savedThoughtMsg, savedAssistantMsg],
      };
    });
  }

  /**
   * Send a message to an existing session. Creates user message, a Thought,
   * then an echo assistant reply in time order. Updates lastActivityTime.
   */
  async createMessage(
    sessionId: number,
    dto: CreateMessageDto,
    userName: string,
    createdBy: string
  ): Promise<{
    userMessage: MessageEntity;
    thoughtMessage: MessageEntity;
    assistantMessage: MessageEntity;
  }> {
    // Verify session belongs to user
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userName },
    });
    if (!session) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }

    const now = new Date();

    return await this.dataSource.transaction(async (manager) => {
      // 1. User message
      const userMessage = manager.create(MessageEntity, {
        sessionId,
        userName,
        messageType: 1,
        isThought: 0,
        content: dto.content,
        createdOn: now,
        createdBy,
      });
      const savedUserMsg = await manager.save(MessageEntity, userMessage);

      // 2. Thought message — +1ms ensures it sorts after user.
      const thoughtMessage = manager.create(MessageEntity, {
        sessionId,
        userName: ASSISTANT_USER,
        messageType: 1,
        isThought: 1,
        content: dto.content,
        createdOn: new Date(now.getTime() + 1),
        createdBy: `assistant/${createdBy}`,
      });
      const savedThoughtMsg = await manager.save(
        MessageEntity,
        thoughtMessage
      );

      // 3. Assistant reply — +2ms ensures it sorts after the Thought.
      const assistantMessage = manager.create(MessageEntity, {
        sessionId,
        userName: ASSISTANT_USER,
        messageType: 1,
        isThought: 0,
        content: dto.content,
        createdOn: new Date(now.getTime() + 2),
        createdBy: `assistant/${createdBy}`,
      });
      const savedAssistantMsg = await manager.save(
        MessageEntity,
        assistantMessage
      );

      // Update session last_activity_time
      session.lastActivityTime = now;
      session.updatedOn = now;
      session.updatedBy = createdBy;
      await manager.save(SessionEntity, session);

      return {
        userMessage: savedUserMsg,
        thoughtMessage: savedThoughtMsg,
        assistantMessage: savedAssistantMsg,
      };
    });
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
      await manager.delete(MessageEntity, { sessionId: validIds as any });
      // Delete sessions
      const result = await manager.delete(SessionEntity, validIds);
      return result.affected ?? 0;
    });
  }
}
