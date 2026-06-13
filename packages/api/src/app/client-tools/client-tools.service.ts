import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ToolEntity } from '../tool/tool.entity';
import { AgentToolEntity } from '../agent/agent-tool.entity';
import type { ClientToolDefinitionDto } from './client-tools.dto';

// A tool definition as reported by the frontend and cached in memory.
export interface CachedClientTool {
  name: string;
  description: string;
  parametersSchema: unknown;
}

@Injectable()
export class ClientToolsService {
  private readonly logger = new Logger(ClientToolsService.name);
  // In-memory cache of the most recent registry sync (for GET /registry).
  private registry: CachedClientTool[] = [];

  constructor(private readonly dataSource: DataSource) {}

  /** Return the cached registry mirror (last sync). */
  getRegistry(): CachedClientTool[] {
    return this.registry;
  }

  /**
   * Reconcile the frontend's defineClientTool registry into t_tool (source='registry').
   * This is a full synchronization: tools in the reported list are upserted
   * (created or updated by server_name), and any existing source='registry' rows
   * not in the list are deleted (cascading to t_agent_tool).
   *
   * Conflict handling: if a reported tool name matches an existing source='database'
   * row, that tool is skipped with a warning (does not block other tools).
   */
  async syncRegistry(
    tools: ClientToolDefinitionDto[],
    createdBy: string
  ): Promise<void> {
    this.logger.log(`Syncing ${tools.length} client tools from frontend`);

    await this.dataSource.transaction(async (manager) => {
      const toolRepo = manager.getRepository(ToolEntity);
      const agentToolRepo = manager.getRepository(AgentToolEntity);

      // 1. Upsert reported tools (create if new, update if exists as registry row).
      const reportedNames = new Set<string>();
      for (const dto of tools) {
        reportedNames.add(dto.name);
        const existing = await toolRepo.findOne({
          where: { serverName: dto.name },
        });

        if (existing && existing.source === 'database') {
          // Name collision with an admin-created tool: skip and warn.
          this.logger.warn(
            `Tool "${dto.name}" already exists as source='database'; skipping registry sync for this tool`
          );
          continue;
        }

        // Wrap the tool definition in an array (mcp_schema format).
        const mcpSchema = [
          {
            name: dto.name,
            description: dto.description,
            parameters: dto.parametersSchema,
          },
        ];

        if (existing) {
          // Existing registry row: update schema.
          existing.mcpSchema = mcpSchema;
          existing.updatedOn = new Date();
          existing.updatedBy = createdBy;
          await toolRepo.save(existing);
          this.logger.log(`Updated registry tool: ${dto.name} (id=${existing.id})`);
        } else {
          // New tool: create as kind='client', source='registry'.
          const tool = toolRepo.create({
            serverName: dto.name,
            serverUrl: '',
            kind: 'client',
            source: 'registry',
            mcpSchema,
            createdOn: new Date(),
            createdBy,
          });
          const saved = await toolRepo.save(tool);
          this.logger.log(`Created registry tool: ${dto.name} (id=${saved.id})`);
        }
      }

      // 2. Delete registry rows no longer in the reported list.
      // Find all current source='registry' rows.
      const currentRegistry = await toolRepo.find({ where: { source: 'registry' } });
      const toDelete = currentRegistry.filter(
        (row) => !reportedNames.has(row.serverName)
      );

      for (const tool of toDelete) {
        // Delete agent associations first (explicit cleanup; ON DELETE CASCADE
        // would handle this, but we log it for visibility).
        const assocs = await agentToolRepo.find({
          where: { toolId: tool.id },
        });
        if (assocs.length > 0) {
          await agentToolRepo.remove(assocs);
          this.logger.log(
            `Removed ${assocs.length} agent association(s) for deleted tool: ${tool.serverName}`
          );
        }
        await toolRepo.remove(tool);
        this.logger.log(`Deleted registry tool: ${tool.serverName} (id=${tool.id})`);
      }
    });

    // 3. Update in-memory cache.
    this.registry = tools.map((t) => ({
      name: t.name,
      description: t.description,
      parametersSchema: t.parametersSchema,
    }));

    this.logger.log('Registry sync complete');
  }
}
