import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToolEntity } from '../tool/tool.entity';
import { ServerToolDefinition } from './define-server-tool';
import { SERVER_TOOLS } from '../tools';

/**
 * Service responsible for registering server tools from the SERVER_TOOLS
 * registry into the database at application startup.
 */
@Injectable()
export class ServerToolRegistryService {
  private readonly logger = new Logger(ServerToolRegistryService.name);
  private toolCache = new Map<string, ServerToolDefinition<any>>();

  constructor(
    @InjectRepository(ToolEntity)
    private toolRepo: Repository<ToolEntity>,
  ) {}

  /**
   * Register all server tools from the SERVER_TOOLS registry
   */
  async registerAllServerTools(): Promise<void> {
    this.logger.log('Starting server tool registration...');

    try {
      this.logger.log(`Found ${SERVER_TOOLS.length} tools to register`);

      for (const toolDef of SERVER_TOOLS) {
        try {
          await this.upsertToolToDatabase(toolDef);
          this.toolCache.set(toolDef.name, toolDef);
          this.logger.log(`✓ Registered tool: ${toolDef.name}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const stack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `Failed to register tool ${toolDef.name}: ${message}`,
            stack,
          );
        }
      }

      this.logger.log(
        `Server tool registration complete. ${this.toolCache.size} tools registered.`,
      );
    } catch (error) {
      this.logger.error('Server tool registration failed:', error);
      throw error;
    }
  }

  /**
   * Insert or update a tool in the database with server__ prefix and ID
   */
  private async upsertToolToDatabase(
    tool: ServerToolDefinition<any>,
  ): Promise<void> {
    // Convert Zod schema to JSON Schema using Zod's native method
    // This matches how Client Tools serialize their schemas
    const jsonSchema = tool.parameters.toJSONSchema();

    this.logger.debug(
      `Generated JSON Schema for ${tool.name}: ${JSON.stringify(jsonSchema)}`,
    );

    // Store the tool name without prefix (e.g., "knowledge-similarity")
    // The prefix server__<id>__ is added when building the tool list for the LLM
    await this.toolRepo.upsert(
      {
        serverName: tool.name,
        serverUrl: '', // Not used for server tools
        kind: 'server',
        source: 'registry',
        mcpSchema: [
          {
            name: tool.name,
            description: tool.description,
            parameters: jsonSchema,
          },
        ],
        createdOn: new Date(),
        createdBy: 'system',
        updatedOn: new Date(),
        updatedBy: 'system',
      },
      ['serverName'],
    );
  }

  /**
   * Get a tool definition from the cache by name (without prefix)
   */
  getToolDefinition(name: string): ServerToolDefinition<any> | undefined {
    return this.toolCache.get(name);
  }

  /**
   * Get all registered tool names (without prefix)
   */
  getAllToolNames(): string[] {
    return Array.from(this.toolCache.keys());
  }
}
