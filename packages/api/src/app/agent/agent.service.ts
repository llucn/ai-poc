import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AgentEntity } from './agent.entity';
import { AgentToolEntity, type McpToolSchema } from './agent-tool.entity';
import { AgentSkillEntity } from './agent-skill.entity';
import { validateMarkdownContent } from '../utils/sanitize-markdown';
import { McpClientService } from '../mcp/mcp-client.service';
import type {
  CreateAgentDto,
  UpdateAgentDto,
  RegisterMcpServerDto,
  CreateSkillDto,
  UpdateSkillDto,
} from './agent.dto';

// Agent shape returned to clients: the model authToken (API key) is never
// sent back; modelConfig.authToken is nulled and a hasApiKey flag signals
// whether one is stored so the UI can show a masked placeholder.
export type AgentResponse = AgentEntity & {
  hasApiKey: boolean;
  tools: AgentToolEntity[];
  skills: AgentSkillEntity[];
};

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    @InjectRepository(AgentEntity)
    private readonly agentRepository: Repository<AgentEntity>,
    @InjectRepository(AgentToolEntity)
    private readonly agentToolRepository: Repository<AgentToolEntity>,
    @InjectRepository(AgentSkillEntity)
    private readonly agentSkillRepository: Repository<AgentSkillEntity>,
    private readonly dataSource: DataSource,
    private readonly mcpClientService: McpClientService
  ) {}

  /** Strip the model authToken from an agent, exposing only hasApiKey. */
  private toResponse(
    agent: AgentEntity,
    tools: AgentToolEntity[] = [],
    skills: AgentSkillEntity[] = []
  ): AgentResponse {
    const hasApiKey = !!agent.modelConfig?.authToken;
    const modelConfig = agent.modelConfig
      ? { ...agent.modelConfig, authToken: null }
      : agent.modelConfig;
    return { ...agent, modelConfig, hasApiKey, tools, skills };
  }

  async findAll(page: number = 1, pageSize: number = 20) {
    const [agents, total] = await this.agentRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'ASC' },
    });

    return {
      data: agents.map((a) => this.toResponse(a)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number): Promise<AgentResponse> {
    const agent = await this.agentRepository.findOne({ where: { id } });
    if (!agent) {
      throw new NotFoundException(`Agent with id ${id} not found`);
    }

    const tools = await this.agentToolRepository.find({
      where: { agentId: id },
      order: { id: 'ASC' },
    });
    const skills = await this.agentSkillRepository.find({
      where: { agentId: id },
      order: { id: 'ASC' },
    });

    return this.toResponse(agent, tools, skills);
  }

  async create(dto: CreateAgentDto, createdBy: string): Promise<AgentResponse> {
    const existing = await this.agentRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Agent with name '${dto.name}' already exists`);
    }

    const makeDefault = dto.isDefault === 1;

    const saved = await this.dataSource.transaction(async (manager) => {
      // Only one default agent allowed: clear others first.
      if (makeDefault) {
        await manager.update(AgentEntity, { isDefault: 1 }, { isDefault: 0 });
      }

      const agent = manager.create(AgentEntity, {
        name: dto.name,
        description: dto.description ?? null,
        modelConfig: dto.modelConfig ?? null,
        isDefault: makeDefault ? 1 : 0,
        systemPrompt: null,
        createdOn: new Date(),
        createdBy,
      });
      return manager.save(AgentEntity, agent);
    });

    return this.toResponse(saved, [], []);
  }

  /**
   * Update basic agent info.
   * - modelConfig.authToken: a non-empty value replaces the stored token;
   *   blank/null/undefined keeps the existing one.
   * - isDefault: setting to 1 clears the flag on all other agents.
   */
  async update(
    id: number,
    dto: UpdateAgentDto,
    updatedBy: string
  ): Promise<AgentResponse> {
    const agent = await this.agentRepository.findOne({ where: { id } });
    if (!agent) {
      throw new NotFoundException(`Agent with id ${id} not found`);
    }

    if (dto.name && dto.name !== agent.name) {
      const existing = await this.agentRepository.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(
          `Agent with name '${dto.name}' already exists`
        );
      }
    }

    if (dto.name !== undefined) agent.name = dto.name;
    if (dto.description !== undefined) agent.description = dto.description;
    if (dto.modelConfig !== undefined) {
      // Preserve the existing authToken when the incoming one is blank.
      const incoming = dto.modelConfig;
      const existingToken = agent.modelConfig?.authToken ?? null;
      const nextToken =
        incoming && incoming.authToken
          ? incoming.authToken
          : existingToken;
      agent.modelConfig = incoming
        ? { ...incoming, authToken: nextToken }
        : incoming;
    }
    if (dto.isDefault !== undefined) {
      agent.isDefault = dto.isDefault === 1 ? 1 : 0;
    }
    agent.updatedOn = new Date();
    agent.updatedBy = updatedBy;

    const saved = await this.dataSource.transaction(async (manager) => {
      // Only one default agent allowed: clear others before saving this one.
      if (agent.isDefault === 1) {
        await manager.update(
          AgentEntity,
          { isDefault: 1 },
          { isDefault: 0 }
        );
      }
      return manager.save(AgentEntity, agent);
    });

    const tools = await this.agentToolRepository.find({
      where: { agentId: id },
      order: { id: 'ASC' },
    });
    const skills = await this.agentSkillRepository.find({
      where: { agentId: id },
      order: { id: 'ASC' },
    });
    return this.toResponse(saved, tools, skills);
  }

  async updateSystemPrompt(
    id: number,
    systemPrompt: string | null,
    updatedBy: string
  ): Promise<AgentResponse> {
    const agent = await this.agentRepository.findOne({ where: { id } });
    if (!agent) {
      throw new NotFoundException(`Agent with id ${id} not found`);
    }

    if (systemPrompt) {
      const validation = validateMarkdownContent(systemPrompt);
      if (validation.warnings.length > 0) {
        this.logger.warn(
          `Markdown validation warnings for agent '${agent.name}' system_prompt: ${validation.warnings.join(', ')}`
        );
      }
    }

    agent.systemPrompt = systemPrompt;
    agent.updatedOn = new Date();
    agent.updatedBy = updatedBy;
    const saved = await this.agentRepository.save(agent);
    return this.toResponse(saved);
  }

  /**
   * Delete agents by IDs with cascading deletion of tools and skills.
   * Application-level referential integrity enforcement.
   */
  async delete(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) {
      return 0;
    }

    return await this.dataSource.transaction(async (manager) => {
      await manager.delete(AgentToolEntity, { agentId: ids as any });
      await manager.delete(AgentSkillEntity, { agentId: ids as any });
      const result = await manager.delete(AgentEntity, ids);
      return result.affected ?? 0;
    });
  }

  // ===== MCP Servers =====

  private async ensureAgent(agentId: number): Promise<AgentEntity> {
    const agent = await this.agentRepository.findOne({ where: { id: agentId } });
    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`);
    }
    return agent;
  }

  /**
   * Fetch and parse the tool list from an MCP server URL.
   *
   * Delegates to McpClientService for MCP communication.
   * Throws BadRequestException on failure.
   */
  async fetchMcpSchema(serverUrl: string): Promise<McpToolSchema[]> {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(serverUrl);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    const url = parsedUrl.toString();
    try {
      return await this.mcpClientService.fetchTools(url);
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch MCP schema: ${error?.message ?? 'unknown error'}`
      );
    }
  }

  /** Test an MCP server URL without persisting; returns the parsed tools. */
  async testMcpServer(serverUrl: string): Promise<{ tools: McpToolSchema[] }> {
    const tools = await this.fetchMcpSchema(serverUrl);
    return { tools };
  }

  async listMcpServers(agentId: number): Promise<AgentToolEntity[]> {
    await this.ensureAgent(agentId);
    return this.agentToolRepository.find({
      where: { agentId },
      order: { id: 'ASC' },
    });
  }

  async registerMcpServer(
    agentId: number,
    dto: RegisterMcpServerDto,
    createdBy: string
  ): Promise<AgentToolEntity> {
    await this.ensureAgent(agentId);
    const mcpSchema = await this.fetchMcpSchema(dto.serverUrl);

    const server = this.agentToolRepository.create({
      agentId,
      serverName: dto.serverName,
      serverUrl: dto.serverUrl,
      mcpSchema,
      createdOn: new Date(),
      createdBy,
    });
    return this.agentToolRepository.save(server);
  }

  async updateMcpServer(
    agentId: number,
    serverId: number,
    dto: RegisterMcpServerDto,
    updatedBy: string
  ): Promise<AgentToolEntity> {
    const server = await this.agentToolRepository.findOne({
      where: { id: serverId, agentId },
    });
    if (!server) {
      throw new NotFoundException(`MCP server with id ${serverId} not found`);
    }

    const mcpSchema = await this.fetchMcpSchema(dto.serverUrl);
    server.serverName = dto.serverName;
    server.serverUrl = dto.serverUrl;
    server.mcpSchema = mcpSchema;
    server.updatedOn = new Date();
    server.updatedBy = updatedBy;
    return this.agentToolRepository.save(server);
  }

  async deleteMcpServer(agentId: number, serverId: number): Promise<void> {
    const result = await this.agentToolRepository.delete({
      id: serverId,
      agentId,
    });
    if (!result.affected) {
      throw new NotFoundException(`MCP server with id ${serverId} not found`);
    }
  }

  // ===== Skills =====

  async createSkill(
    agentId: number,
    dto: CreateSkillDto,
    createdBy: string
  ): Promise<AgentSkillEntity> {
    await this.ensureAgent(agentId);

    if (dto.content) {
      const validation = validateMarkdownContent(dto.content);
      if (validation.warnings.length > 0) {
        this.logger.warn(
          `Markdown validation warnings for skill '${dto.name}': ${validation.warnings.join(', ')}`
        );
      }
    }

    const skill = this.agentSkillRepository.create({
      agentId,
      name: dto.name,
      description: dto.description ?? null,
      content: dto.content ?? null,
      createdOn: new Date(),
      createdBy,
    });
    return this.agentSkillRepository.save(skill);
  }

  async updateSkill(
    agentId: number,
    skillId: number,
    dto: UpdateSkillDto,
    updatedBy: string
  ): Promise<AgentSkillEntity> {
    const skill = await this.agentSkillRepository.findOne({
      where: { id: skillId, agentId },
    });
    if (!skill) {
      throw new NotFoundException(`Skill with id ${skillId} not found`);
    }

    if (dto.content) {
      const validation = validateMarkdownContent(dto.content);
      if (validation.warnings.length > 0) {
        this.logger.warn(
          `Markdown validation warnings for skill '${dto.name ?? skill.name}': ${validation.warnings.join(', ')}`
        );
      }
    }

    if (dto.name !== undefined) skill.name = dto.name;
    if (dto.description !== undefined) skill.description = dto.description;
    if (dto.content !== undefined) skill.content = dto.content;
    skill.updatedOn = new Date();
    skill.updatedBy = updatedBy;
    return this.agentSkillRepository.save(skill);
  }

  async deleteSkill(agentId: number, skillId: number): Promise<void> {
    const result = await this.agentSkillRepository.delete({
      id: skillId,
      agentId,
    });
    if (!result.affected) {
      throw new NotFoundException(`Skill with id ${skillId} not found`);
    }
  }
}
