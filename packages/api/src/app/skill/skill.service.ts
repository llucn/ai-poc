import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Not } from 'typeorm';
import { SkillEntity } from './skill.entity';
import { AgentSkillEntity } from '../agent/agent-skill.entity';
import { validateMarkdownContent } from '../utils/sanitize-markdown';
import { isKebabCase } from '../utils/kebab-case';
import type { CreateSkillDto, UpdateSkillDto } from './skill.dto';

// Skill shape returned to clients, augmented with the number of agents that
// currently reference it (so the UI can warn before deletion).
export type SkillResponse = SkillEntity & { agentCount: number };

@Injectable()
export class SkillService {
  private readonly logger = new Logger(SkillService.name);

  constructor(
    @InjectRepository(SkillEntity)
    private readonly skillRepository: Repository<SkillEntity>,
    @InjectRepository(AgentSkillEntity)
    private readonly agentSkillRepository: Repository<AgentSkillEntity>,
    private readonly dataSource: DataSource
  ) {}

  /** Attach agentCount (number of t_agent_skill rows referencing each skill). */
  private async withAgentCounts(
    skills: SkillEntity[]
  ): Promise<SkillResponse[]> {
    if (skills.length === 0) return [];
    const ids = skills.map((s) => s.id);
    const rows = await this.agentSkillRepository.find({
      where: { skillId: In(ids) },
    });
    const counts = new Map<number, number>();
    for (const row of rows) {
      counts.set(row.skillId, (counts.get(row.skillId) ?? 0) + 1);
    }
    return skills.map((s) => ({ ...s, agentCount: counts.get(s.id) ?? 0 }));
  }

  async findAll(page = 1, pageSize = 20) {
    const [skills, total] = await this.skillRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'ASC' },
    });

    return {
      data: await this.withAgentCounts(skills),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number): Promise<SkillResponse> {
    const skill = await this.skillRepository.findOne({ where: { id } });
    if (!skill) {
      throw new NotFoundException(`Skill with id ${id} not found`);
    }
    const [withCount] = await this.withAgentCounts([skill]);
    return withCount;
  }

  /** Validate name is kebab-case and not used by another skill. */
  private async assertNameValid(
    name: string,
    excludeId?: number
  ): Promise<void> {
    if (!isKebabCase(name)) {
      throw new BadRequestException(
        'Skill name must be kebab-case: lowercase letters, numbers, and hyphens only, not starting or ending with hyphen'
      );
    }
    const existing = await this.skillRepository.findOne({
      where: excludeId === undefined ? { name } : { name, id: Not(excludeId) },
    });
    if (existing) {
      throw new ConflictException('Skill name already exists');
    }
  }

  private warnIfDangerousMarkdown(content: string | null, label: string): void {
    if (!content) return;
    const validation = validateMarkdownContent(content);
    if (validation.warnings.length > 0) {
      this.logger.warn(
        `Markdown validation warnings for skill '${label}': ${validation.warnings.join(', ')}`
      );
    }
  }

  async create(dto: CreateSkillDto, createdBy: string): Promise<SkillResponse> {
    await this.assertNameValid(dto.name);
    this.warnIfDangerousMarkdown(dto.content ?? null, dto.name);

    const skill = this.skillRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      content: dto.content ?? null,
      createdOn: new Date(),
      createdBy,
    });
    const saved = await this.skillRepository.save(skill);
    return { ...saved, agentCount: 0 };
  }

  async update(
    id: number,
    dto: UpdateSkillDto,
    updatedBy: string
  ): Promise<SkillResponse> {
    const skill = await this.skillRepository.findOne({ where: { id } });
    if (!skill) {
      throw new NotFoundException(`Skill with id ${id} not found`);
    }

    if (dto.name !== undefined && dto.name !== skill.name) {
      await this.assertNameValid(dto.name, id);
      skill.name = dto.name;
    }
    if (dto.content !== undefined) {
      this.warnIfDangerousMarkdown(dto.content, dto.name ?? skill.name);
      skill.content = dto.content;
    }
    if (dto.description !== undefined) skill.description = dto.description;

    skill.updatedOn = new Date();
    skill.updatedBy = updatedBy;
    const saved = await this.skillRepository.save(skill);
    const [withCount] = await this.withAgentCounts([saved]);
    return withCount;
  }

  /**
   * Delete skills by IDs. Within a transaction, first remove all t_agent_skill
   * associations referencing each skill, then delete the t_skill rows.
   */
  async delete(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;

    return this.dataSource.transaction(async (manager) => {
      await manager.delete(AgentSkillEntity, { skillId: In(ids) });
      const result = await manager.delete(SkillEntity, ids);
      return result.affected ?? 0;
    });
  }
}
