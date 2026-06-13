import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Not } from 'typeorm';
import { ToolEntity, type McpToolSchema } from './tool.entity';
import { AgentToolEntity } from '../agent/agent-tool.entity';
import { McpClientService } from '../mcp/mcp-client.service';
import { isKebabCase } from '../utils/kebab-case';
import type { CreateToolDto, UpdateToolDto } from './tool.dto';

// Tool shape returned to clients, augmented with the number of agents that
// currently reference it (so the UI can warn before deletion).
export type ToolResponse = ToolEntity & { agentCount: number };

@Injectable()
export class ToolService {
  constructor(
    @InjectRepository(ToolEntity)
    private readonly toolRepository: Repository<ToolEntity>,
    @InjectRepository(AgentToolEntity)
    private readonly agentToolRepository: Repository<AgentToolEntity>,
    private readonly dataSource: DataSource,
    private readonly mcpClientService: McpClientService
  ) {}

  /** Attach agentCount (number of t_agent_tool rows referencing each tool). */
  private async withAgentCounts(tools: ToolEntity[]): Promise<ToolResponse[]> {
    if (tools.length === 0) return [];
    const ids = tools.map((t) => t.id);
    const rows = await this.agentToolRepository.find({
      where: { toolId: In(ids) },
    });
    const counts = new Map<number, number>();
    for (const row of rows) {
      counts.set(row.toolId, (counts.get(row.toolId) ?? 0) + 1);
    }
    return tools.map((t) => ({ ...t, agentCount: counts.get(t.id) ?? 0 }));
  }

  async findAll(page = 1, pageSize = 20) {
    const [tools, total] = await this.toolRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'ASC' },
    });

    return {
      data: await this.withAgentCounts(tools),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number): Promise<ToolResponse> {
    const tool = await this.toolRepository.findOne({ where: { id } });
    if (!tool) {
      throw new NotFoundException(`Tool with id ${id} not found`);
    }
    const [withCount] = await this.withAgentCounts([tool]);
    return withCount;
  }

  /**
   * Fetch and parse the tool list from an MCP server URL.
   * Throws BadRequestException on failure.
   */
  async fetchMcpSchema(serverUrl: string): Promise<McpToolSchema[]> {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(serverUrl);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    try {
      return await this.mcpClientService.fetchTools(parsedUrl.toString());
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to fetch MCP schema: ${error?.message ?? 'unknown error'}`
      );
    }
  }

  /** Test an MCP server URL without persisting; returns the parsed tools. */
  async testServer(serverUrl: string): Promise<{ tools: McpToolSchema[] }> {
    if (!serverUrl || serverUrl.trim().length === 0) {
      // Client Tools have no server URL and require no connectivity test.
      throw new BadRequestException(
        'Test endpoint is not applicable to Client Tools'
      );
    }
    const tools = await this.fetchMcpSchema(serverUrl);
    return { tools };
  }

  /** Validate server_name is kebab-case and not used by another tool. */
  private async assertNameValid(
    serverName: string,
    excludeId?: number
  ): Promise<void> {
    if (!isKebabCase(serverName)) {
      throw new BadRequestException(
        'Server name must be kebab-case: lowercase letters, numbers, and hyphens only, not starting or ending with hyphen'
      );
    }
    const existing = await this.toolRepository.findOne({
      where:
        excludeId === undefined
          ? { serverName }
          : { serverName, id: Not(excludeId) },
    });
    if (existing) {
      throw new ConflictException('Server name already exists');
    }
  }

  async create(dto: CreateToolDto, createdBy: string): Promise<ToolResponse> {
    await this.assertNameValid(dto.serverName);
    const kind = dto.kind ?? 'mcp';

    let serverUrl: string;
    let mcpSchema: McpToolSchema[];
    if (kind === 'client') {
      // Client Tools have no MCP server; serverUrl is unused and the schema is
      // supplied manually (Phase 1, no auto-registration / connectivity test).
      serverUrl = dto.serverUrl ?? '';
      mcpSchema = dto.mcpSchema ?? [];
    } else {
      // MCP Tools fetch their schema from the server URL.
      if (!dto.serverUrl) {
        throw new BadRequestException('serverUrl is required for MCP tools');
      }
      serverUrl = dto.serverUrl;
      mcpSchema = await this.fetchMcpSchema(dto.serverUrl);
    }

    const tool = this.toolRepository.create({
      serverName: dto.serverName,
      serverUrl,
      kind,
      source: 'database',
      mcpSchema,
      createdOn: new Date(),
      createdBy,
    });
    const saved = await this.toolRepository.save(tool);
    return { ...saved, agentCount: 0 };
  }

  async update(
    id: number,
    dto: UpdateToolDto,
    updatedBy: string
  ): Promise<ToolResponse> {
    const tool = await this.toolRepository.findOne({ where: { id } });
    if (!tool) {
      throw new NotFoundException(`Tool with id ${id} not found`);
    }

    if (dto.serverName !== undefined && dto.serverName !== tool.serverName) {
      await this.assertNameValid(dto.serverName, id);
      tool.serverName = dto.serverName;
    }

    if (dto.kind !== undefined) {
      tool.kind = dto.kind;
    }

    if (tool.kind === 'client') {
      // Client Tool: update serverUrl/schema directly, no connectivity fetch.
      if (dto.serverUrl !== undefined) tool.serverUrl = dto.serverUrl;
      if (dto.mcpSchema !== undefined) tool.mcpSchema = dto.mcpSchema;
    } else {
      // MCP Tool: changing the URL re-fetches the schema.
      if (dto.serverUrl !== undefined && dto.serverUrl !== tool.serverUrl) {
        tool.mcpSchema = await this.fetchMcpSchema(dto.serverUrl);
        tool.serverUrl = dto.serverUrl;
      } else if (dto.mcpSchema !== undefined) {
        tool.mcpSchema = dto.mcpSchema;
      }
    }

    tool.updatedOn = new Date();
    tool.updatedBy = updatedBy;
    const saved = await this.toolRepository.save(tool);
    const [withCount] = await this.withAgentCounts([saved]);
    return withCount;
  }

  /**
   * Delete tools by IDs. Within a transaction, first remove all t_agent_tool
   * associations referencing each tool, then delete the t_tool rows.
   */
  async delete(ids: number[]): Promise<number> {
    if (!ids || ids.length === 0) return 0;

    return this.dataSource.transaction(async (manager) => {
      await manager.delete(AgentToolEntity, { toolId: In(ids) });
      const result = await manager.delete(ToolEntity, ids);
      return result.affected ?? 0;
    });
  }
}
