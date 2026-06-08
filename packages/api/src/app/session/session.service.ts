import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { SessionEntity } from './session.entity';
import { MessageEntity } from './message.entity';
import { AgentEntity } from '../agent/agent.entity';
import { AgentToolEntity } from '../agent/agent-tool.entity';
import { LlmService } from '../llm/llm.service';
import { McpClientService } from '../mcp/mcp-client.service';
import type { CreateSessionDto, CreateMessageDto } from './session.dto';
import type { Response } from 'express';

const ASSISTANT_USER = 'ASSISTANT';
const MAX_TOOL_CALLS = 20;

/**
 * Result type from parsing the LLM's raw output.
 *
 * - `final_answer`: LLM produced a final reply for the user; the loop should end
 * - `action`: LLM requested a tool call; the loop should execute the tool and continue
 * - `error`: LLM output could not be parsed or was malformed; the loop should end
 */
export type ParsedReply =
  | { type: 'final_answer'; content: string }
  | {
      type: 'action';
      content: string;
      actionData: { tool: string; params: unknown };
    }
  | { type: 'error'; content: string };

/**
 * Parse the LLM's raw output into a structured result.
 *
 * The LLM is instructed to reply with a single JSON object, one of:
 *   {"thought": "...", "final_answer": "..."}
 *   {"thought": "...", "action": {"tool": "...", "params": {...}}}
 *
 * Returns a tagged union so the caller can decide how to handle each case
 * (display reply, execute tool, or surface an error).
 */
export function parseAssistantReply(llmOutput: string): ParsedReply {
  let parsed: unknown;
  try {
    parsed = JSON.parse(llmOutput);
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'unknown error';
    return {
      type: 'error',
      content: `Failed to parse LLM output as JSON: ${detail}. Raw output: ${llmOutput}`,
    };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return {
      type: 'error',
      content: `LLM output is not a JSON object. Raw output: ${llmOutput}`,
    };
  }

  const obj = parsed as Record<string, unknown>;

  if ('final_answer' in obj) {
    const value = obj.final_answer;
    return {
      type: 'final_answer',
      content: typeof value === 'string' ? value : JSON.stringify(value),
    };
  }

  if ('action' in obj) {
    const action = obj.action;
    if (
      typeof action === 'object' &&
      action !== null &&
      'tool' in action &&
      typeof (action as Record<string, unknown>).tool === 'string'
    ) {
      const a = action as { tool: string; params?: unknown };
      return {
        type: 'action',
        content: JSON.stringify(action),
        actionData: { tool: a.tool, params: a.params ?? {} },
      };
    }
    return {
      type: 'error',
      content: `Action field is malformed (missing tool). Raw output: ${llmOutput}`,
    };
  }

  return {
    type: 'error',
    content: `LLM output is missing both "final_answer" and "action". Raw output: ${llmOutput}`,
  };
}

/**
 * Parse a tool name in the format `mcp__${id}__${toolName}`.
 *
 * The tool name itself may contain underscores, so we split on the first
 * two `__` delimiters only. Returns null if the format doesn't match.
 *
 * Examples:
 *   "mcp__5__getWeatherForecastByLocation" → { agentToolId: 5, toolName: "getWeatherForecastByLocation" }
 *   "mcp__12__get_user_profile"             → { agentToolId: 12, toolName: "get_user_profile" }
 *   "invalid_format"                         → null
 */
export function parseToolName(
  tool: string
): { agentToolId: number; toolName: string } | null {
  const match = /^mcp__(\d+)__(.+)$/.exec(tool);
  if (!match) return null;
  const agentToolId = Number(match[1]);
  const toolName = match[2];
  if (!Number.isFinite(agentToolId) || toolName.length === 0) return null;
  return { agentToolId, toolName };
}

/**
 * Build an observation message content from a successful tool result.
 * Format: `{"observation": <result>}`
 */
export function buildObservationContent(result: unknown): string {
  return JSON.stringify({ observation: result });
}

/**
 * Build an observation message content from a tool execution error.
 * Format: `{"observation": "Error: <message>"}`
 */
export function buildErrorObservationContent(error: Error | string): string {
  const message = error instanceof Error ? error.message : error;
  return JSON.stringify({ observation: `Error: ${message}` });
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
    @InjectRepository(AgentToolEntity)
    private readonly agentToolRepository: Repository<AgentToolEntity>,
    private readonly dataSource: DataSource,
    private readonly llmService: LlmService,
    private readonly mcpClientService: McpClientService
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
      await this.runLlmTurn(session, agent, dto.content, userName, createdBy, res);
    } catch (err) {
      // SSE event: error — runLlmTurn handles its own errors internally and
      // pushes error events itself; this only catches unexpected throws.
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
   * Run a full multi-turn assistant turn for a session: persist the user message,
   * then loop until the LLM produces a `final_answer`, executing MCP tools each
   * time the LLM emits an `action`. Streams every intermediate state (LLM thoughts
   * and tool observations) via SSE to the response.
   *
   * Loop structure:
   *   1. Build LLM context from session history (saved messages so far)
   *   2. Call LLM, save raw output as Thought message, push `thought_created`
   *   3. Parse output:
   *        - `final_answer` → save assistant reply, push `message_created`, exit
   *        - `action`        → execute MCP tool, save observation as Thought,
   *                            push `thought_created`, increment counter, loop
   *        - `error`         → push `error` event, exit
   *   4. Hard-cap at MAX_TOOL_CALLS (20) to prevent runaway loops.
   *
   * The LLM call happens outside any DB transaction so the connection isn't
   * held during the network round-trip.
   */
  private async runLlmTurn(
    session: SessionEntity,
    agent: AgentEntity,
    content: string,
    userName: string,
    createdBy: string,
    res: Response
  ): Promise<void> {
    const sessionId = session.id;
    const now = new Date();
    let timestampOffset = 1;

    // Send an initial SSE comment immediately to establish the connection and
    // prevent browser timeout during the first LLM call.
    res.write(': connection established\n\n');

    // Check for duplicate user message (idempotency protection).
    // If a recent message (within 10 seconds) with identical content exists,
    // this is likely a retry from the client after a perceived timeout.
    const recentWindow = new Date(now.getTime() - 10000);
    const recentDuplicate = await this.messageRepository.findOne({
      where: {
        sessionId,
        userName,
        messageType: 1,
        isThought: 0,
        content,
      },
      order: { createdOn: 'DESC' },
    });

    if (
      recentDuplicate &&
      new Date(recentDuplicate.createdOn).getTime() > recentWindow.getTime()
    ) {
      // Duplicate detected: do not save the user message again, do not call LLM.
      // Just send an error event and close.
      this.logger.warn(
        `Duplicate user message detected for session ${sessionId} (content: "${content.substring(0, 50)}...")`
      );
      res.write(`event: error\n`);
      res.write(
        `data: ${JSON.stringify({
          message: 'Duplicate message detected (request already in progress)',
        })}\n\n`
      );
      return;
    }

    // Save user message (one-time, before the loop starts)
    const userMessage = this.messageRepository.create({
      sessionId,
      userName,
      messageType: 1,
      isThought: 0,
      content,
      createdOn: now,
      createdBy,
    });
    await this.messageRepository.save(userMessage);

    // Build the initial LLM context from session history. The history already
    // includes the user message we just saved.
    const history = await this.messageRepository.find({
      where: { sessionId },
      order: { createdOn: 'DESC', id: 'DESC' },
      take: 200,
    });
    history.reverse();

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

    let toolCallCount = 0;

    // Tool calling loop: run until final_answer, error, or tool call limit.
    while (true) {
      // Send a keep-alive comment before each LLM call to prevent connection timeout.
      res.write(': processing\n\n');

      // Step 1: call LLM
      this.logger.log(
        `Calling LLM for session ${sessionId} with ${llmMessages.length} messages (toolCallCount=${toolCallCount})`
      );
      const llmOutput = await this.llmService.callLlm(agent, llmMessages);
      this.logger.log(`LLM output for session ${sessionId}: ${llmOutput}`);

      // Step 2: save the raw output as a Thought message and push it.
      const thoughtMessage = this.messageRepository.create({
        sessionId,
        userName: ASSISTANT_USER,
        messageType: 1,
        isThought: 1,
        content: llmOutput,
        createdOn: new Date(now.getTime() + timestampOffset++),
        createdBy: `assistant/${createdBy}`,
      });
      const savedThoughtMsg = await this.messageRepository.save(thoughtMessage);
      res.write(`event: thought_created\n`);
      res.write(`data: ${JSON.stringify(savedThoughtMsg)}\n\n`);

      // Step 3: parse and dispatch
      const parsed = parseAssistantReply(llmOutput);

      if (parsed.type === 'final_answer') {
        // Save assistant reply, push `message_created`, exit loop.
        const assistantMessage = this.messageRepository.create({
          sessionId,
          userName: ASSISTANT_USER,
          messageType: 1,
          isThought: 0,
          content: parsed.content,
          createdOn: new Date(now.getTime() + timestampOffset++),
          createdBy: `assistant/${createdBy}`,
        });
        const savedAssistantMsg = await this.messageRepository.save(
          assistantMessage
        );
        res.write(`event: message_created\n`);
        res.write(`data: ${JSON.stringify(savedAssistantMsg)}\n\n`);
        break;
      }

      if (parsed.type === 'error') {
        // LLM output was malformed: save error as the assistant reply so the
        // user sees what went wrong, push it, and exit.
        const assistantMessage = this.messageRepository.create({
          sessionId,
          userName: ASSISTANT_USER,
          messageType: 1,
          isThought: 0,
          content: parsed.content,
          createdOn: new Date(now.getTime() + timestampOffset++),
          createdBy: `assistant/${createdBy}`,
        });
        const savedAssistantMsg = await this.messageRepository.save(
          assistantMessage
        );
        res.write(`event: message_created\n`);
        res.write(`data: ${JSON.stringify(savedAssistantMsg)}\n\n`);
        break;
      }

      // parsed.type === 'action': enforce the tool-call cap before executing.
      if (toolCallCount >= MAX_TOOL_CALLS) {
        this.logger.warn(
          `Tool call limit (${MAX_TOOL_CALLS}) exceeded for session ${sessionId}`
        );
        res.write(`event: error\n`);
        res.write(
          `data: ${JSON.stringify({
            message: `Tool call limit exceeded (max ${MAX_TOOL_CALLS} calls per message)`,
          })}\n\n`
        );
        break;
      }

      // Append the LLM's action thought to the LLM-side history so the next
      // turn sees what action the model just decided.
      llmMessages.push({ role: 'assistant', content: llmOutput });

      // Step 4: execute the MCP tool and produce an observation.
      const observationContent = await this.executeTool(parsed.actionData);

      // Persist the observation as a Thought message and push it.
      const observationMessage = this.messageRepository.create({
        sessionId,
        userName: ASSISTANT_USER,
        messageType: 1,
        isThought: 1,
        content: observationContent,
        createdOn: new Date(now.getTime() + timestampOffset++),
        createdBy: `assistant/${createdBy}`,
      });
      const savedObservationMsg = await this.messageRepository.save(
        observationMessage
      );
      res.write(`event: thought_created\n`);
      res.write(`data: ${JSON.stringify(savedObservationMsg)}\n\n`);

      // Append the observation to the LLM history (as an assistant turn) and
      // continue the loop.
      llmMessages.push({ role: 'assistant', content: observationContent });
      toolCallCount++;
    }

    // Update session last_activity_time once the turn completes.
    session.lastActivityTime = now;
    session.updatedOn = now;
    session.updatedBy = createdBy;
    await this.sessionRepository.save(session);
  }

  /**
   * Execute one MCP tool call and return the observation message content.
   *
   * Handles three failure modes by returning an error observation (so the LLM
   * can react to them) instead of throwing:
   *   - tool name doesn't match the `mcp__${id}__${toolName}` format
   *   - the agent_tool row for the parsed id doesn't exist
   *   - the MCP server call itself fails
   */
  private async executeTool(actionData: {
    tool: string;
    params: unknown;
  }): Promise<string> {
    // Parse the tool name into agent tool ID + tool name.
    const parsed = parseToolName(actionData.tool);
    if (!parsed) {
      this.logger.warn(`Invalid tool name format: ${actionData.tool}`);
      return buildErrorObservationContent(
        `Invalid tool name format: "${actionData.tool}". Expected mcp__<id>__<name>.`
      );
    }

    // Look up the MCP server URL from t_agent_tool.
    const agentTool = await this.agentToolRepository.findOne({
      where: { id: parsed.agentToolId },
    });
    if (!agentTool) {
      this.logger.warn(`Agent tool not found: id=${parsed.agentToolId}`);
      return buildErrorObservationContent(
        `Agent tool with id ${parsed.agentToolId} not found.`
      );
    }

    // Call the MCP tool.
    try {
      const result = await this.mcpClientService.callTool(
        agentTool.serverUrl,
        parsed.toolName,
        actionData.params
      );
      return buildObservationContent(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `MCP tool execution failed: tool=${parsed.toolName} url=${agentTool.serverUrl}: ${message}`
      );
      return buildErrorObservationContent(message);
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
