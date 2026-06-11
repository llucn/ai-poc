import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { AgentEntity } from './agent.entity';
import { AgentToolEntity } from './agent-tool.entity';
import { AgentSkillEntity } from './agent-skill.entity';
import { ToolEntity } from '../tool/tool.entity';
import { SkillEntity } from '../skill/skill.entity';
import { validateMarkdownContent } from '../utils/sanitize-markdown';
import type {
  CreateAgentDto,
  UpdateAgentDto,
} from './agent.dto';

// Agent shape returned to clients: the model authToken (API key) is never
// sent back; modelConfig.authToken is nulled and a hasApiKey flag signals
// whether one is stored so the UI can show a masked placeholder.
//
// tools / skills are the associated top-level resources (from t_tool / t_skill),
// resolved through the t_agent_tool / t_agent_skill association tables.
export type AgentResponse = AgentEntity & {
  hasApiKey: boolean;
  tools: ToolEntity[];
  skills: SkillEntity[];
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
    @InjectRepository(ToolEntity)
    private readonly toolRepository: Repository<ToolEntity>,
    @InjectRepository(SkillEntity)
    private readonly skillRepository: Repository<SkillEntity>,
    private readonly dataSource: DataSource
  ) {}

  /** Strip the model authToken from an agent, exposing only hasApiKey. */
  private toResponse(
    agent: AgentEntity,
    tools: ToolEntity[] = [],
    skills: SkillEntity[] = []
  ): AgentResponse {
    const hasApiKey = !!agent.modelConfig?.authToken;
    const modelConfig = agent.modelConfig
      ? { ...agent.modelConfig, authToken: null }
      : agent.modelConfig;
    return { ...agent, modelConfig, hasApiKey, tools, skills };
  }

  /** Resolve the Tools associated with an agent through t_agent_tool. */
  private async resolveTools(agentId: number): Promise<ToolEntity[]> {
    const links = await this.agentToolRepository.find({
      where: { agentId },
      order: { id: 'ASC' },
    });
    if (links.length === 0) return [];
    const tools = await this.toolRepository.find({
      where: { id: In(links.map((l) => l.toolId)) },
    });
    // Preserve association order.
    const byId = new Map(tools.map((t) => [t.id, t]));
    return links
      .map((l) => byId.get(l.toolId))
      .filter((t): t is ToolEntity => !!t);
  }

  /** Resolve the Skills associated with an agent through t_agent_skill. */
  private async resolveSkills(agentId: number): Promise<SkillEntity[]> {
    const links = await this.agentSkillRepository.find({
      where: { agentId },
      order: { id: 'ASC' },
    });
    if (links.length === 0) return [];
    const skills = await this.skillRepository.find({
      where: { id: In(links.map((l) => l.skillId)) },
    });
    const byId = new Map(skills.map((s) => [s.id, s]));
    return links
      .map((l) => byId.get(l.skillId))
      .filter((s): s is SkillEntity => !!s);
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

    const tools = await this.resolveTools(id);
    const skills = await this.resolveSkills(id);

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
        incoming && incoming.authToken ? incoming.authToken : existingToken;
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
        await manager.update(AgentEntity, { isDefault: 1 }, { isDefault: 0 });
      }
      return manager.save(AgentEntity, agent);
    });

    const tools = await this.resolveTools(id);
    const skills = await this.resolveSkills(id);
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
   * Delete agents by IDs with cascading deletion of tool/skill associations.
   * Only the association rows are removed; the t_tool / t_skill resources are
   * left intact (they may be shared by other agents).
   */
  async delete(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) {
      return 0;
    }

    return await this.dataSource.transaction(async (manager) => {
      await manager.delete(AgentToolEntity, { agentId: In(ids) });
      await manager.delete(AgentSkillEntity, { agentId: In(ids) });
      const result = await manager.delete(AgentEntity, ids);
      return result.affected ?? 0;
    });
  }

  // ===== Tool associations =====

  private async ensureAgent(agentId: number): Promise<AgentEntity> {
    const agent = await this.agentRepository.findOne({ where: { id: agentId } });
    if (!agent) {
      throw new NotFoundException(`Agent with id ${agentId} not found`);
    }
    return agent;
  }

  /** Associate an existing Tool with an agent (idempotent). */
  async linkTool(
    agentId: number,
    toolId: number,
    createdBy: string
  ): Promise<ToolEntity[]> {
    await this.ensureAgent(agentId);
    const tool = await this.toolRepository.findOne({ where: { id: toolId } });
    if (!tool) {
      throw new NotFoundException(`Tool with id ${toolId} not found`);
    }

    const existing = await this.agentToolRepository.findOne({
      where: { agentId, toolId },
    });
    if (!existing) {
      const link = this.agentToolRepository.create({
        agentId,
        toolId,
        createdOn: new Date(),
        createdBy,
      });
      await this.agentToolRepository.save(link);
    }
    return this.resolveTools(agentId);
  }

  /** Remove the association between an agent and a Tool (keeps the Tool). */
  async unlinkTool(agentId: number, toolId: number): Promise<void> {
    const result = await this.agentToolRepository.delete({ agentId, toolId });
    if (!result.affected) {
      throw new NotFoundException(
        `Tool ${toolId} is not associated with agent ${agentId}`
      );
    }
  }

  // ===== Skill associations =====

  /** Associate an existing Skill with an agent (idempotent). */
  async linkSkill(
    agentId: number,
    skillId: number,
    createdBy: string
  ): Promise<SkillEntity[]> {
    await this.ensureAgent(agentId);
    const skill = await this.skillRepository.findOne({
      where: { id: skillId },
    });
    if (!skill) {
      throw new NotFoundException(`Skill with id ${skillId} not found`);
    }

    const existing = await this.agentSkillRepository.findOne({
      where: { agentId, skillId },
    });
    if (!existing) {
      const link = this.agentSkillRepository.create({
        agentId,
        skillId,
        createdOn: new Date(),
        createdBy,
      });
      await this.agentSkillRepository.save(link);
    }
    return this.resolveSkills(agentId);
  }

  /** Remove the association between an agent and a Skill (keeps the Skill). */
  async unlinkSkill(agentId: number, skillId: number): Promise<void> {
    const result = await this.agentSkillRepository.delete({ agentId, skillId });
    if (!result.affected) {
      throw new NotFoundException(
        `Skill ${skillId} is not associated with agent ${agentId}`
      );
    }
  }
}
