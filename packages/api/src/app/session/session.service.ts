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
   * Also creates the echo assistant reply in the same transaction.
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

      // Create user message
      const userMessage = manager.create(MessageEntity, {
        sessionId: savedSession.id,
        userName,
        messageType: 1,
        content: dto.content,
        createdOn: now,
        createdBy,
      });
      const savedUserMsg = await manager.save(MessageEntity, userMessage);

      // Create echo assistant message
      const assistantMessage = manager.create(MessageEntity, {
        sessionId: savedSession.id,
        userName: ASSISTANT_USER,
        messageType: 1,
        content: dto.content,
        createdOn: new Date(now.getTime() + 1), // 1ms later for ordering
        createdBy: `assistant/${createdBy}`,
      });
      const savedAssistantMsg = await manager.save(
        MessageEntity,
        assistantMessage
      );

      return {
        session: savedSession,
        messages: [savedUserMsg, savedAssistantMsg],
      };
    });
  }

  /**
   * Send a message to an existing session. Creates the user message and
   * an echo assistant reply. Updates session.lastActivityTime.
   */
  async createMessage(
    sessionId: number,
    dto: CreateMessageDto,
    userName: string,
    createdBy: string
  ): Promise<{ userMessage: MessageEntity; assistantMessage: MessageEntity }> {
    // Verify session belongs to user
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userName },
    });
    if (!session) {
      throw new NotFoundException(`Session with id ${sessionId} not found`);
    }

    const now = new Date();

    return await this.dataSource.transaction(async (manager) => {
      // Create user message
      const userMessage = manager.create(MessageEntity, {
        sessionId,
        userName,
        messageType: 1,
        content: dto.content,
        createdOn: now,
        createdBy,
      });
      const savedUserMsg = await manager.save(MessageEntity, userMessage);

      // Create echo assistant message
      const assistantMessage = manager.create(MessageEntity, {
        sessionId,
        userName: ASSISTANT_USER,
        messageType: 1,
        content: dto.content,
        createdOn: new Date(now.getTime() + 1),
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

      return { userMessage: savedUserMsg, assistantMessage: savedAssistantMsg };
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
