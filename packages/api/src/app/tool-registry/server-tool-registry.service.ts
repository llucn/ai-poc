import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ToolEntity } from '../tool/tool.entity';
import { ServerToolDefinition } from './define-server-tool';
import { glob } from 'glob';
import { zodToJsonSchema } from 'zod-to-json-schema';
import * as path from 'path';

/**
 * Service responsible for scanning, loading, and registering server tools
 * from the filesystem into the database at application startup.
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
   * Scan and register all server tools from packages/api/src/app/tools/*.tool.ts
   */
  async registerAllServerTools(): Promise<void> {
    this.logger.log('Starting server tool registration...');

    try {
      const toolFiles = await this.scanToolFiles();
      this.logger.log(`Found ${toolFiles.length} tool files`);

      for (const filePath of toolFiles) {
        try {
          const toolDef = await this.loadToolModule(filePath);
          await this.upsertToolToDatabase(toolDef);
          this.toolCache.set(toolDef.name, toolDef);
          this.logger.log(`✓ Registered tool: ${toolDef.name}`);
        } catch (error) {
          this.logger.error(
            `Failed to register tool from ${filePath}: ${error.message}`,
            error.stack,
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
   * Scan for tool definition files matching *.tool.ts pattern
   */
  private async scanToolFiles(): Promise<string[]> {
    // Get absolute path to tools directory
    const toolsDir = path.join(
      process.cwd(),
      'packages/api/src/app/tools',
    );
    const pattern = path.join(toolsDir, '*.tool.ts');

    // Use glob to find all tool files
    const files = await glob(pattern.replace(/\\/g, '/'));
    return files;
  }

  /**
   * Dynamically import a tool module and extract its tool definition
   */
  private async loadToolModule(
    filePath: string,
  ): Promise<ServerToolDefinition<any>> {
    const module = await import(filePath);

    // Find exported tool definition
    for (const exportName of Object.keys(module)) {
      const exported = module[exportName];
      if (this.isServerToolDefinition(exported)) {
        return exported;
      }
    }

    throw new Error(`No server tool definition found in ${filePath}`);
  }

  /**
   * Type guard to check if an object is a ServerToolDefinition
   */
  private isServerToolDefinition(obj: any): obj is ServerToolDefinition<any> {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.name === 'string' &&
      typeof obj.description === 'string' &&
      obj.parameters &&
      typeof obj.execute === 'function'
    );
  }

  /**
   * Insert or update a tool in the database with server__ prefix and ID
   */
  private async upsertToolToDatabase(
    tool: ServerToolDefinition<any>,
  ): Promise<void> {
    const jsonSchema = zodToJsonSchema(tool.parameters);

    // First, upsert with temporary name (without ID)
    const tempName = `server__${tool.name}`;

    await this.toolRepo.upsert(
      {
        serverName: tempName,
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

    // Get the tool record to retrieve its ID
    const savedTool = await this.toolRepo.findOne({
      where: { serverName: tempName, kind: 'server' },
    });

    if (savedTool) {
      // Update name to include ID: server__<id>__<name>
      const finalName = `server__${savedTool.id}__${tool.name}`;
      if (savedTool.serverName !== finalName) {
        await this.toolRepo.update(savedTool.id, {
          serverName: finalName,
          updatedOn: new Date(),
        });
        this.logger.log(`Updated tool name: ${tempName} → ${finalName}`);
      }
    }
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
