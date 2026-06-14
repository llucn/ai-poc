import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { randomUUID } from 'crypto';
import type {
  ContentBlockParam,
  MessageParam,
  ToolResultBlockParam,
  ToolUseBlockParam,
} from '@anthropic-ai/sdk/resources/messages';
import { SessionEntity } from './session.entity';
import { MessageEntity } from './message.entity';
import {
  PendingClientCallEntity,
  type PendingMessageContext,
} from './pending-client-call.entity';
import { AgentEntity } from '../agent/agent.entity';
import { AgentToolEntity } from '../agent/agent-tool.entity';
import { AgentSkillEntity } from '../agent/agent-skill.entity';
import { ToolEntity } from '../tool/tool.entity';
import { SkillEntity } from '../skill/skill.entity';
import {
  LlmService,
  buildAnthropicTool,
  type AnthropicToolSpec,
  type LlmTurn,
} from '../llm/llm.service';
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
 * Render a `tool_use` block as the persisted Thought content when the
 * assistant emitted no text alongside it. The Thought row keeps a readable
 * timeline of what the model decided each turn.
 */
function renderToolUseAsThought(toolName: string, input: unknown): string {
  return JSON.stringify({ tool_use: { name: toolName, input } });
}

/**
 * Build a successful tool_result block for the in-memory message context.
 * The `content` field is stringified JSON so it round-trips cleanly through
 * the JSON column when persisted in pending_client_call.message_context.
 */
function buildToolResultBlock(
  toolUseId: string,
  result: unknown
): ToolResultBlockParam {
  return {
    type: 'tool_result',
    tool_use_id: toolUseId,
    content: JSON.stringify(result),
  };
}

/**
 * Build an error tool_result block (`is_error: true`) so the model knows the
 * call failed and can react accordingly on the next turn.
 */
function buildErrorToolResultBlock(
  toolUseId: string,
  error: Error | string
): ToolResultBlockParam {
  const message = error instanceof Error ? error.message : error;
  return {
    type: 'tool_result',
    tool_use_id: toolUseId,
    is_error: true,
    content: message,
  };
}

/**
 * The Thought content persisted alongside a tool_result for display in the
 * timeline. We keep the `{"observation": ...}` envelope so the chat UI's
 * existing collapsible ThoughtMessage component renders the result the same
 * way it always has.
 */
function buildObservationThoughtContent(
  result: unknown,
  isError: boolean
): string {
  return JSON.stringify({
    observation: isError ? `Error: ${String(result)}` : result,
  });
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
   * the result. Loads the pending call, validates it, appends the result as a
   * native `tool_result` block correlated by the saved `tool_use_id`, persists
   * the result as a Thought (`{"observation": ...}` envelope) for the timeline,
   * marks the pending row completed, and re-enters the agent loop — streaming
   * the continuation over a fresh SSE response.
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

      // Build the tool_result from the client's result (or error), correlated
      // to the suspended tool_use by its id (saved on the pending row).
      const isError = dto.error !== undefined && dto.error !== null;
      const toolResultBlock: ToolResultBlockParam = isError
        ? buildErrorToolResultBlock(pending.toolUseId, String(dto.error))
        : buildToolResultBlock(pending.toolUseId, dto.result ?? null);

      const observationThought = buildObservationThoughtContent(
        isError ? String(dto.error) : (dto.result ?? null),
        isError
      );

      // Persist the observation as a Thought and push it.
      const now = new Date();
      const observationMessage = this.messageRepository.create({
        sessionId,
        userName: ASSISTANT_USER,
        messageType: 1,
        isThought: 1,
        content: observationThought,
        createdOn: now,
        createdBy: `assistant/${createdBy}`,
      });
      const savedObservationMsg = await this.messageRepository.save(
        observationMessage
      );
      res.write(`event: thought_created\n`);
      res.write(`data: ${JSON.stringify(savedObservationMsg)}\n\n`);

      // Restore the suspended message context and append the tool_result as a
      // user-role turn (tool_result blocks always live inside a user turn).
      const messages: PendingMessageContext = [
        ...pending.messageContext,
        { role: 'user', content: [toolResultBlock] },
      ];

      // Mark the pending call resolved before continuing (idempotency guard).
      pending.status = 'completed';
      pending.updatedOn = now;
      pending.updatedBy = createdBy;
      await this.pendingClientCallRepository.save(pending);

      // Carry forward the tool-call count from the restored context so the
      // 20-cap survives suspend/resume. Each completed tool round contributes
      // one assistant turn containing a `tool_use` block.
      const startToolCallCount = countToolUseRounds(pending.messageContext);

      await this.runLoop(
        session,
        agent,
        messages,
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
   * Run a full multi-turn assistant turn for a session: persist the user
   * message, build the native Anthropic context from history, then enter the
   * agent loop. Streams every intermediate state (LLM thoughts and tool
   * observations) via SSE to the response.
   *
   * History rebuild (design D4): prior completed turns are collapsed to plain
   * user/assistant text only — internal tool exchanges from previous turns are
   * not replayed, so the request never carries an unbalanced `tool_use` /
   * `tool_result` pair.
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

    // Build the initial native context from session history. The history
    // already includes the user message we just saved. Per design D4 we use
    // ONLY user/assistant text rows (`isThought=0`) so prior turns' internal
    // tool scaffolding never makes it into the request — that scaffolding is
    // not needed for the model to continue the conversation, and replaying it
    // would risk an unbalanced tool_use/tool_result sequence.
    const history = await this.messageRepository.find({
      where: { sessionId, isThought: 0, messageType: 1 },
      order: { createdOn: 'DESC', id: 'DESC' },
      take: 200,
    });
    history.reverse();

    const messages: MessageParam[] = history.map((msg) => ({
      role: msg.userName === ASSISTANT_USER ? ('assistant' as const) : ('user' as const),
      content: msg.content || '',
    }));

    // Run the (re-entrant) agent loop. It runs until final_answer/error, the
    // tool-call cap, or a Client Tool suspends it (returns early after pushing
    // a `client_call` event).
    await this.runLoop(session, agent, messages, createdBy, res, 0);
  }

  /**
   * The re-entrant agent loop: build request → call Anthropic → dispatch on
   * the structured `LlmTurn`. Shared by the initial turn (`runLlmTurn`) and
   * the resume path (`resumeClientResult`), so it must not assume whether it
   * was first-started or resumed.
   *
   * Each iteration:
   *   1. Call Anthropic with (system, messages, tools); persist the assistant
   *      thought (text or a tool_use rendering) as a Thought + push
   *      `thought_created`.
   *   2. Dispatch on the LlmTurn:
   *        - `final` / `error` → save assistant reply + push `message_created`,
   *          finalize, return.
   *        - `tool_use` (mcp / invalid name) → execute server-side, append the
   *          assistant tool_use turn + a user tool_result turn, persist the
   *          observation Thought, push `thought_created`, continue.
   *        - `tool_use` (client) → suspend: persist t_pending_client_call with
   *          the native context + tool_use_id, push `client_call`, finalize,
   *          return (browser resumes later).
   *   3. Hard-cap at MAX_TOOL_CALLS to prevent runaway loops.
   */
  private async runLoop(
    session: SessionEntity,
    agent: AgentEntity,
    messages: MessageParam[],
    createdBy: string,
    res: Response,
    startToolCallCount: number
  ): Promise<void> {
    const sessionId = session.id;
    const now = new Date();
    let timestampOffset = 1;
    let toolCallCount = startToolCallCount;

    const system = await this.buildSystemContent(agent);
    const availableTools = await this.getAvailableTools(agent.id);
    const tools: AnthropicToolSpec[] = availableTools.map((t) =>
      buildAnthropicTool(t.name, t.description, t.parameters)
    );

    while (true) {
      // Keep-alive comment before each LLM call to prevent connection timeout.
      res.write(': processing\n\n');

      // Step 1: call LLM
      this.logger.log(
        `Calling LLM for session ${sessionId} with ${messages.length} messages (toolCallCount=${toolCallCount})`
      );
      const turn: LlmTurn = await this.llmService.callLlm(
        agent,
        system,
        messages,
        tools
      );
      this.logger.log(
        `LLM turn for session ${sessionId}: kind=${turn.kind}` +
          (turn.kind === 'tool_use' ? ` tool=${turn.toolName}` : '')
      );

      // Step 2: persist the assistant thought as a Thought message and push.
      const thoughtContent =
        turn.kind === 'final'
          ? turn.text
          : turn.kind === 'tool_use'
          ? turn.text || renderToolUseAsThought(turn.toolName, turn.input)
          : `Error: ${turn.message}`;

      const thoughtMessage = this.messageRepository.create({
        sessionId,
        userName: ASSISTANT_USER,
        messageType: 1,
        isThought: 1,
        content: thoughtContent,
        createdOn: new Date(now.getTime() + timestampOffset++),
        createdBy: `assistant/${createdBy}`,
      });
      const savedThoughtMsg = await this.messageRepository.save(thoughtMessage);
      res.write(`event: thought_created\n`);
      res.write(`data: ${JSON.stringify(savedThoughtMsg)}\n\n`);

      // Step 3: dispatch
      if (turn.kind === 'final' || turn.kind === 'error') {
        if (turn.kind === 'error') {
          // Surface as an SSE error event for the UI; persisting an assistant
          // reply with the error text keeps the session readable on reload.
          res.write(`event: error\n`);
          res.write(`data: ${JSON.stringify({ message: turn.message })}\n\n`);
        }
        const replyContent = turn.kind === 'final' ? turn.text : `Error: ${turn.message}`;
        const assistantMessage = this.messageRepository.create({
          sessionId,
          userName: ASSISTANT_USER,
          messageType: 1,
          isThought: 0,
          content: replyContent,
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

      // turn.kind === 'tool_use': enforce the cap before doing anything else.
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

      // Append the assistant turn (text + tool_use) to the live context. The
      // next user turn will carry the tool_result.
      messages.push({ role: 'assistant', content: turn.assistantContent });

      // Route by tool kind. Client tools suspend the loop; MCP tools run inline.
      const classified = parseToolName(turn.toolName);
      if (classified && classified.prefix === 'client') {
        await this.suspendForClientTool(
          session,
          agent,
          messages,
          {
            toolUseId: turn.toolUseId,
            toolName: turn.toolName,
            input: turn.input,
          },
          classified.toolId,
          classified.toolName,
          createdBy,
          res
        );
        return; // suspended — browser will POST the result to resume
      }

      // MCP tool (or invalid name): execute server-side and produce a
      // tool_result block.
      const { toolResult, observationContent, isError } = await this.executeTool(
        turn.toolUseId,
        turn.toolName,
        turn.input
      );

      // Persist the observation as a Thought for the chat timeline.
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

      // Append the tool_result as a user turn so the model receives it on the
      // next call.
      messages.push({ role: 'user', content: [toolResult] });
      toolCallCount++;
      // isError is intentionally not surfaced as an SSE error — the model is
      // expected to react to the tool failure on the next turn.
      void isError;
    }
  }

  /**
   * Suspend the loop for a Client Tool call: persist the suspended native
   * context (with the originating `tool_use_id`) to t_pending_client_call,
   * push a `client_call` SSE event for the browser to execute, and finalize
   * the session. The loop resumes via resumeClientResult once the browser
   * POSTs the result.
   */
  private async suspendForClientTool(
    session: SessionEntity,
    agent: AgentEntity,
    messages: MessageParam[],
    pendingToolUse: { toolUseId: string; toolName: string; input: unknown },
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
      toolUseId: pendingToolUse.toolUseId,
      params: pendingToolUse.input ?? {},
      messageContext: messages,
      status: 'pending',
      createdOn: new Date(),
      createdBy,
    });
    await this.pendingClientCallRepository.save(pending);

    this.logger.log(
      `Suspending session ${session.id} for client tool ${toolName} (callId=${callId}, toolUseId=${pendingToolUse.toolUseId})`
    );
    res.write(`event: client_call\n`);
    res.write(
      `data: ${JSON.stringify({
        callId,
        toolName,
        params: pendingToolUse.input ?? {},
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
   * Build the system-role content for the LLM from three segments, joined by
   * blank lines (empty segments skipped). Tools are no longer in the system
   * string — they are passed via the Anthropic `tools` request param.
   *   1. SYSTEM_PROMPT          — the base contract (role / skill rule / ask-user rule)
   *   2. agent.systemPrompt     — agent-specific instructions
   *   3. {"available_skills":[...]}  — skills the agent may read via read_skill
   */
  private async buildSystemContent(agent: AgentEntity): Promise<string> {
    const availableSkills = await this.getAvailableSkills(agent.id);

    const segments = [
      SYSTEM_PROMPT,
      agent.systemPrompt ?? '',
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
   * Execute one MCP tool call and return the native `tool_result` block plus
   * a Thought-content string for the timeline.
   *
   * Handles three failure modes by returning an error tool_result (so the LLM
   * can react to them) instead of throwing:
   *   - tool name doesn't match the `<prefix>__<toolId>__<toolName>` format
   *   - the t_tool row for the parsed toolId doesn't exist
   *   - the MCP server call itself fails
   */
  private async executeTool(
    toolUseId: string,
    toolName: string,
    input: unknown
  ): Promise<{
    toolResult: ToolResultBlockParam;
    observationContent: string;
    isError: boolean;
  }> {
    const parsed = parseToolName(toolName);
    if (!parsed) {
      const message = `Invalid tool name format: "${toolName}". Expected mcp__<id>__<name>.`;
      this.logger.warn(message);
      return {
        toolResult: buildErrorToolResultBlock(toolUseId, message),
        observationContent: buildObservationThoughtContent(message, true),
        isError: true,
      };
    }

    const tool = await this.toolRepository.findOne({
      where: { id: parsed.toolId },
    });
    if (!tool) {
      const message = `Tool with id ${parsed.toolId} not found.`;
      this.logger.warn(message);
      return {
        toolResult: buildErrorToolResultBlock(toolUseId, message),
        observationContent: buildObservationThoughtContent(message, true),
        isError: true,
      };
    }

    try {
      const result = await this.mcpClientService.callTool(
        tool.serverUrl,
        parsed.toolName,
        input
      );
      return {
        toolResult: buildToolResultBlock(toolUseId, result),
        observationContent: buildObservationThoughtContent(result, false),
        isError: false,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `MCP tool execution failed: tool=${parsed.toolName} url=${tool.serverUrl}: ${message}`
      );
      return {
        toolResult: buildErrorToolResultBlock(toolUseId, message),
        observationContent: buildObservationThoughtContent(message, true),
        isError: true,
      };
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

/**
 * Count the number of completed `tool_use` rounds in a restored message
 * context, so the 20-cap survives suspend/resume. Each round is one assistant
 * turn carrying at least one `tool_use` block. Used by `resumeClientResult`
 * to seed the loop's counter — the suspended (yet-to-be-answered) tool_use is
 * counted because it is a round the model has *initiated*; the cap fires when
 * the model would start a 21st round.
 */
export function countToolUseRounds(messages: MessageParam[]): number {
  let n = 0;
  for (const msg of messages) {
    if (msg.role !== 'assistant') continue;
    if (typeof msg.content === 'string') continue;
    if (containsBlockOfType(msg.content, 'tool_use')) n++;
  }
  return n;
}

function containsBlockOfType(
  content: ContentBlockParam[],
  type: 'tool_use' | 'tool_result'
): boolean {
  for (const block of content) {
    if (block && (block as { type?: string }).type === type) return true;
  }
  return false;
}

// Type re-export so the tests have a stable import surface.
export type { ToolUseBlockParam };
