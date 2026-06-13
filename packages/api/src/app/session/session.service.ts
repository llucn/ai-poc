import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { randomUUID } from 'crypto';
import { SessionEntity } from './session.entity';
import { MessageEntity } from './message.entity';
import {
  PendingClientCallEntity,
  type LlmMessage,
} from './pending-client-call.entity';
import { AgentEntity } from '../agent/agent.entity';
import { AgentToolEntity } from '../agent/agent-tool.entity';
import { AgentSkillEntity } from '../agent/agent-skill.entity';
import { ToolEntity } from '../tool/tool.entity';
import { SkillEntity } from '../skill/skill.entity';
import { LlmService } from '../llm/llm.service';
import { McpClientService } from '../mcp/mcp-client.service';
import { SYSTEM_PROMPT } from '../agent/system-prompt';
import type {
  CreateSessionDto,
  CreateMessageDto,
  ClientResultDto,
} from './session.dto';
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
 * Parse a tool name in the format `<prefix>__<toolId>__<toolName>` where prefix
 * is `mcp` (server-side) or `client` (browser). `toolId` is the t_tool.id, so
 * the same tool has a stable name across every agent that references it. The
 * tool name itself may contain underscores, so we split on the first two `__`
 * delimiters only. Returns null if the format doesn't match.
 *
 * Examples:
 *   "mcp__5__getWeatherForecastByLocation" → { prefix: "mcp", toolId: 5, toolName: "getWeatherForecastByLocation" }
 *   "client__1__console-log-echo"           → { prefix: "client", toolId: 1, toolName: "console-log-echo" }
 *   "invalid_format"                         → null
 */
export function parseToolName(
  tool: string
): { prefix: 'mcp' | 'client'; toolId: number; toolName: string } | null {
  const match = /^(mcp|client)__(\d+)__(.+)$/.exec(tool);
  if (!match) return null;
  const prefix = match[1] as 'mcp' | 'client';
  const toolId = Number(match[2]);
  const toolName = match[3];
  if (!Number.isFinite(toolId) || toolName.length === 0) return null;
  return { prefix, toolId, toolName };
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
    @InjectRepository(AgentSkillEntity)
    private readonly agentSkillRepository: Repository<AgentSkillEntity>,
    @InjectRepository(ToolEntity)
    private readonly toolRepository: Repository<ToolEntity>,
    @InjectRepository(SkillEntity)
    private readonly skillRepository: Repository<SkillEntity>,
    @InjectRepository(PendingClientCallEntity)
    private readonly pendingClientCallRepository: Repository<PendingClientCallEntity>,
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
   * Resume a suspended turn after the browser executed a Client Tool and POSTed
   * the result. Loads the pending call, validates it, appends the result as an
   * observation Thought, marks the pending row completed, and re-enters the
   * agent loop — streaming the continuation over a fresh SSE response.
   *
   * Idempotent: a callId whose row is already non-'pending' is treated as a
   * duplicate (sends a `done` event and returns without resuming).
   */
  async resumeClientResult(
    sessionId: number,
    dto: ClientResultDto,
    userName: string,
    createdBy: string,
    res: Response
  ): Promise<void> {
    res.write(': connection established\n\n');

    try {
      // Verify session belongs to user.
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId, userName },
      });
      if (!session) {
        throw new NotFoundException(`Session with id ${sessionId} not found`);
      }

      const pending = await this.pendingClientCallRepository.findOne({
        where: { callId: dto.callId },
      });
      if (!pending) {
        throw new NotFoundException(
          `Pending client call ${dto.callId} not found`
        );
      }
      if (pending.sessionId !== sessionId) {
        throw new NotFoundException(
          `Pending client call ${dto.callId} does not belong to session ${sessionId}`
        );
      }

      // Idempotency: already resumed → ignore duplicate result POST.
      if (pending.status !== 'pending') {
        this.logger.warn(
          `Duplicate client-result for callId=${dto.callId} (status=${pending.status}); ignoring`
        );
        res.write(`event: done\n`);
        res.write(`data: ${JSON.stringify({ duplicate: true })}\n\n`);
        return;
      }

      const agent = await this.agentRepository.findOne({
        where: { id: pending.agentId },
      });
      if (!agent) {
        throw new NotFoundException(
          `Agent with id ${pending.agentId} not found for session ${sessionId}`
        );
      }

      // Build the observation from the client's result (or error), in the same
      // shape MCP observations use so the LLM sees a consistent format.
      const observationContent =
        dto.error !== undefined && dto.error !== null
          ? buildErrorObservationContent(dto.error)
          : buildObservationContent(dto.result ?? null);

      // Persist the observation as a Thought and push it.
      const now = new Date();
      const observationMessage = this.messageRepository.create({
        sessionId,
        userName: ASSISTANT_USER,
        messageType: 1,
        isThought: 1,
        content: observationContent,
        createdOn: now,
        createdBy: `assistant/${createdBy}`,
      });
      const savedObservationMsg = await this.messageRepository.save(
        observationMessage
      );
      res.write(`event: thought_created\n`);
      res.write(`data: ${JSON.stringify(savedObservationMsg)}\n\n`);

      // Restore the suspended LLM context and append the observation.
      const llmMessages: LlmMessage[] = [
        ...pending.messageContext,
        { role: 'assistant', content: observationContent },
      ];

      // Mark the pending call resolved before continuing (idempotency guard).
      pending.status = 'completed';
      pending.updatedOn = now;
      pending.updatedBy = createdBy;
      await this.pendingClientCallRepository.save(pending);

      // Count prior tool rounds from the restored context so the cap carries
      // across suspend/resume. Each round adds one assistant action turn plus
      // one assistant observation turn after the initial assistant action.
      const priorAssistantTurns = pending.messageContext.filter(
        (m) => m.role === 'assistant'
      ).length;
      const startToolCallCount = Math.floor(priorAssistantTurns / 2);

      await this.runLoop(
        session,
        agent,
        llmMessages,
        createdBy,
        res,
        startToolCallCount
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      this.logger.error(`resumeClientResult SSE error: ${errorMessage}`);
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: errorMessage })}\n\n`);
    } finally {
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

    const systemContent = await this.buildSystemContent(agent);
    const llmMessages: LlmMessage[] = [
      { role: 'system', content: systemContent },
      ...history.map((msg) => ({
        role: (msg.userName === ASSISTANT_USER ? 'assistant' : 'user') as
          | 'user'
          | 'assistant',
        content: msg.content || '',
      })),
    ];

    // Run the (re-entrant) agent loop. It runs until final_answer/error, the
    // tool-call cap, or a Client Tool suspends it (returns early after pushing
    // a `client_call` event).
    await this.runLoop(session, agent, llmMessages, createdBy, res, 0);
  }

  /**
   * The re-entrant agent loop: read context → call LLM → dispatch. Shared by
   * the initial turn (`runLlmTurn`) and the resume path (`resumeClientResult`),
   * so it must not assume whether it was first-started or resumed.
   *
   * Each iteration:
   *   1. Call LLM, save raw output as a Thought message, push `thought_created`.
   *   2. Parse output:
   *        - `final_answer` / `error` → save assistant reply, push
   *          `message_created`, finalize session, return.
   *        - `action` (mcp)  → execute MCP tool inline, save observation as a
   *          Thought, push `thought_created`, continue.
   *        - `action` (client) → suspend: persist t_pending_client_call, push
   *          `client_call`, finalize session, return (browser resumes later).
   *   3. Hard-cap at MAX_TOOL_CALLS to prevent runaway loops.
   */
  private async runLoop(
    session: SessionEntity,
    agent: AgentEntity,
    llmMessages: LlmMessage[],
    createdBy: string,
    res: Response,
    startToolCallCount: number
  ): Promise<void> {
    const sessionId = session.id;
    const now = new Date();
    let timestampOffset = 1;
    let toolCallCount = startToolCallCount;

    while (true) {
      // Keep-alive comment before each LLM call to prevent connection timeout.
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

      if (parsed.type === 'final_answer' || parsed.type === 'error') {
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
        await this.finalizeSession(session, createdBy);
        return;
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
        await this.finalizeSession(session, createdBy);
        return;
      }

      // Append the LLM's action thought to the LLM-side history so the next
      // turn (or the resumed loop) sees what action the model just decided.
      llmMessages.push({ role: 'assistant', content: llmOutput });

      // Route by tool kind. Client tools suspend the loop; MCP tools run inline.
      const classified = parseToolName(parsed.actionData.tool);
      if (classified && classified.prefix === 'client') {
        await this.suspendForClientTool(
          session,
          agent,
          llmMessages,
          parsed.actionData,
          classified.toolId,
          classified.toolName,
          createdBy,
          res
        );
        return; // suspended — browser will POST the result to resume
      }

      // MCP tool (or invalid name): execute server-side and produce observation.
      const observationContent = await this.executeTool(parsed.actionData);

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

      llmMessages.push({ role: 'assistant', content: observationContent });
      toolCallCount++;
    }
  }

  /**
   * Suspend the loop for a Client Tool call: persist the suspended LLM context
   * to t_pending_client_call, push a `client_call` SSE event for the browser to
   * execute, and finalize the session. The loop resumes via resumeClientResult
   * once the browser POSTs the result.
   */
  private async suspendForClientTool(
    session: SessionEntity,
    agent: AgentEntity,
    llmMessages: LlmMessage[],
    actionData: { tool: string; params: unknown },
    toolId: number,
    toolName: string,
    createdBy: string,
    res: Response
  ): Promise<void> {
    const callId = randomUUID();
    const pending = this.pendingClientCallRepository.create({
      callId,
      sessionId: session.id,
      agentId: agent.id,
      toolId,
      toolName,
      params: actionData.params ?? {},
      messageContext: llmMessages,
      status: 'pending',
      createdOn: new Date(),
      createdBy,
    });
    await this.pendingClientCallRepository.save(pending);

    this.logger.log(
      `Suspending session ${session.id} for client tool ${toolName} (callId=${callId})`
    );
    res.write(`event: client_call\n`);
    res.write(
      `data: ${JSON.stringify({
        callId,
        toolName,
        params: actionData.params ?? {},
      })}\n\n`
    );

    await this.finalizeSession(session, createdBy);
  }

  /** Update a session's last activity timestamp after a turn or suspension. */
  private async finalizeSession(
    session: SessionEntity,
    updatedBy: string
  ): Promise<void> {
    const now = new Date();
    session.lastActivityTime = now;
    session.updatedOn = now;
    session.updatedBy = updatedBy;
    await this.sessionRepository.save(session);
  }

  /**
   * Build the system-role content for the LLM from four segments, joined by
   * blank lines (empty segments are skipped except the available_* segments,
   * which always render even when empty):
   *   1. SYSTEM_PROMPT          — the process/protocol contract
   *   2. agent.systemPrompt     — the agent-specific instructions
   *   3. {"available_tools": [...]}   — tools the agent may call (flattened
   *      from each associated Tool's mcp_schema; names are mcp__<toolId>__<name>)
   *   4. {"available_skills": [...]}  — skills the agent may read
   */
  private async buildSystemContent(agent: AgentEntity): Promise<string> {
    const availableTools = await this.getAvailableTools(agent.id);
    const availableSkills = await this.getAvailableSkills(agent.id);

    const segments = [
      SYSTEM_PROMPT,
      agent.systemPrompt ?? '',
      JSON.stringify({ available_tools: availableTools }),
      JSON.stringify({ available_skills: availableSkills }),
    ].filter((s) => s && s.trim().length > 0);

    return segments.join('\n\n');
  }

  /**
   * Resolve the flattened tool list for an agent: join t_agent_tool + t_tool,
   * then expand each Tool's mcp_schema. Each tool name is prefixed with the
   * tool kind and t_tool.id so it is globally stable and routable:
   * `mcp__<toolId>__<actualToolName>` (server-side) or
   * `client__<toolId>__<actualToolName>` (browser).
   */
  private async getAvailableTools(agentId: number): Promise<
    { name: string; description: string | null; parameters: unknown }[]
  > {
    const links = await this.agentToolRepository.find({
      where: { agentId },
      order: { id: 'ASC' },
    });
    if (links.length === 0) return [];

    const tools = await this.toolRepository.find({
      where: { id: In(links.map((l) => l.toolId)) },
    });
    const byId = new Map(tools.map((t) => [t.id, t]));

    const result: {
      name: string;
      description: string | null;
      parameters: unknown;
    }[] = [];
    for (const link of links) {
      const tool = byId.get(link.toolId);
      if (!tool || !tool.mcpSchema) continue;
      const prefix = tool.kind === 'client' ? 'client' : 'mcp';
      for (const schema of tool.mcpSchema) {
        result.push({
          name: `${prefix}__${tool.id}__${schema.name}`,
          description: schema.description ?? null,
          parameters: schema.parameters ?? null,
        });
      }
    }
    return result;
  }

  /** Resolve the skill list for an agent: join t_agent_skill + t_skill. */
  private async getAvailableSkills(
    agentId: number
  ): Promise<{ name: string; description: string }[]> {
    const links = await this.agentSkillRepository.find({
      where: { agentId },
      order: { id: 'ASC' },
    });
    if (links.length === 0) return [];

    const skills = await this.skillRepository.find({
      where: { id: In(links.map((l) => l.skillId)) },
    });
    const byId = new Map(skills.map((s) => [s.id, s]));

    const result: { name: string; description: string }[] = [];
    for (const link of links) {
      const skill = byId.get(link.skillId);
      if (!skill) continue;
      result.push({ name: skill.name, description: skill.description ?? '' });
    }
    return result;
  }

  /**
   * Execute one MCP tool call and return the observation message content.
   *
   * Handles three failure modes by returning an error observation (so the LLM
   * can react to them) instead of throwing:
   *   - tool name doesn't match the `mcp__${toolId}__${toolName}` format
   *   - the t_tool row for the parsed toolId doesn't exist
   *   - the MCP server call itself fails
   */
  private async executeTool(actionData: {
    tool: string;
    params: unknown;
  }): Promise<string> {
    // Parse the tool name into tool ID + tool name.
    const parsed = parseToolName(actionData.tool);
    if (!parsed) {
      this.logger.warn(`Invalid tool name format: ${actionData.tool}`);
      return buildErrorObservationContent(
        `Invalid tool name format: "${actionData.tool}". Expected mcp__<id>__<name>.`
      );
    }

    // Look up the MCP server URL from t_tool.
    const tool = await this.toolRepository.findOne({
      where: { id: parsed.toolId },
    });
    if (!tool) {
      this.logger.warn(`Tool not found: id=${parsed.toolId}`);
      return buildErrorObservationContent(
        `Tool with id ${parsed.toolId} not found.`
      );
    }

    // Call the MCP tool.
    try {
      const result = await this.mcpClientService.callTool(
        tool.serverUrl,
        parsed.toolName,
        actionData.params
      );
      return buildObservationContent(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `MCP tool execution failed: tool=${parsed.toolName} url=${tool.serverUrl}: ${message}`
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
