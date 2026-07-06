# Spec: Server Tool Infrastructure

## Overview

Server Tool infrastructure enables backend-defined tools that are registered automatically on application startup and executed server-side with full access to database and services.

## API

### defineServerTool Function

```typescript
// packages/api/src/app/tool-registry/define-server-tool.ts

import { z } from 'zod';

export interface ServerToolDefinition<T extends z.ZodTypeAny> {
  name: string;
  description: string;
  parameters: T;
  execute: (params: z.infer<T>, context: ServerToolContext) => Promise<any>;
}

export interface ServerToolContext {
  userId: string;
  userRole: string;
  sessionId?: string;
  requestId: string;
}

export function defineServerTool<T extends z.ZodTypeAny>(
  definition: ServerToolDefinition<T>
): ServerToolDefinition<T> {
  // Validate tool name format
  if (!/^[a-z][a-z0-9-]*$/.test(definition.name)) {
    throw new Error(`Invalid tool name: ${definition.name}. Must match /^[a-z][a-z0-9-]*$/`);
  }

  return definition;
}
```

### ServerToolRegistryService

```typescript
// packages/api/src/app/tool-registry/server-tool-registry.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tool } from '../entities/tool.entity';
import { glob } from 'glob';
import { zodToJsonSchema } from 'zod-to-json-schema';

@Injectable()
export class ServerToolRegistryService {
  private readonly logger = new Logger(ServerToolRegistryService.name);
  private toolCache = new Map<string, ServerToolDefinition<any>>();

  constructor(
    @InjectRepository(Tool)
    private toolRepo: Repository<Tool>,
  ) {}

  async registerAllServerTools(): Promise<void> {
    this.logger.log('Starting server tool registration...');

    const toolFiles = await this.scanToolFiles();
    this.logger.log(`Found ${toolFiles.length} tool files`);

    for (const filePath of toolFiles) {
      try {
        const toolDef = await this.loadToolModule(filePath);
        await this.upsertToolToDatabase(toolDef);
        this.toolCache.set(toolDef.name, toolDef);
        this.logger.log(`Registered tool: ${toolDef.name}`);
      } catch (error) {
        this.logger.error(`Failed to register tool from ${filePath}:`, error);
      }
    }

    this.logger.log(`Server tool registration complete. ${this.toolCache.size} tools registered.`);
  }

  private async scanToolFiles(): Promise<string[]> {
    const pattern = 'packages/api/src/app/tools/*.tool.ts';
    return await glob(pattern);
  }

  private async loadToolModule(filePath: string): Promise<ServerToolDefinition<any>> {
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

  private isServerToolDefinition(obj: any): obj is ServerToolDefinition<any> {
    return (
      obj &&
      typeof obj.name === 'string' &&
      typeof obj.description === 'string' &&
      obj.parameters &&
      typeof obj.execute === 'function'
    );
  }

  private async upsertToolToDatabase(tool: ServerToolDefinition<any>): Promise<void> {
    const jsonSchema = zodToJsonSchema(tool.parameters);

    // First, upsert with temporary name (without ID)
    const tempName = `server__${tool.name}`;
    await this.toolRepo.upsert(
      {
        name: tempName,
        type: 'SERVER',
        description: tool.description,
        inputSchema: jsonSchema,
        updatedOn: new Date(),
      },
      ['name']
    );

    // Get the tool record to retrieve its ID
    const savedTool = await this.toolRepo.findOne({
      where: { name: tempName, type: 'SERVER' }
    });

    if (savedTool) {
      // Update name to include ID: server__<id>__<name>
      const finalName = `server__${savedTool.id}__${tool.name}`;
      if (savedTool.name !== finalName) {
        await this.toolRepo.update(savedTool.id, { name: finalName });
      }
    }
  }

  getToolDefinition(name: string): ServerToolDefinition<any> | undefined {
    return this.toolCache.get(name);
  }

  getAllToolNames(): string[] {
    return Array.from(this.toolCache.keys());
  }
}
```

### ServerToolExecutorService

```typescript
// packages/api/src/app/tool-registry/server-tool-executor.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ServerToolRegistryService } from './server-tool-registry.service';
import { ServerToolContext } from './define-server-tool';
import { z } from 'zod';

@Injectable()
export class ServerToolExecutorService {
  private readonly logger = new Logger(ServerToolExecutorService.name);

  constructor(private registry: ServerToolRegistryService) {}

  async execute(
    toolName: string,
    params: unknown,
    context: ServerToolContext,
  ): Promise<any> {
    const startTime = Date.now();

    try {
      // Get tool definition from cache
      const toolDef = this.registry.getToolDefinition(toolName);
      if (!toolDef) {
        throw new NotFoundException(`Server tool not found: ${toolName}`);
      }

      // Validate parameters
      const validatedParams = this.validateParams(toolDef, params);

      // Execute with timeout
      const result = await this.executeWithTimeout(
        toolDef.execute(validatedParams, context),
        30000, // 30 second timeout
      );

      this.logger.log({
        message: 'Server tool executed successfully',
        toolName,
        userId: context.userId,
        duration: Date.now() - startTime,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error({
        message: 'Server tool execution failed',
        toolName,
        userId: context.userId,
        error: error.message,
        duration: Date.now() - startTime,
      });

      return {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }

  private validateParams(toolDef: ServerToolDefinition<any>, params: unknown): any {
    try {
      return toolDef.parameters.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Parameter validation failed: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Tool execution timeout')), timeoutMs)
      ),
    ]);
  }
}
```

## Database

### Tool Entity (Existing)

No changes needed. Server tools use existing `t_tool` table:

```typescript
// packages/api/src/app/entities/tool.entity.ts

@Entity('t_tool')
export class Tool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  type: string; // 'MCP', 'CLIENT', 'SERVER'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true, name: 'input_schema' })
  inputSchema: object;

  @CreateDateColumn({ name: 'created_on' })
  createdOn: Date;

  @UpdateDateColumn({ name: 'updated_on', nullable: true })
  updatedOn: Date;
}
```

## Module Configuration

### ToolRegistryModule

```typescript
// packages/api/src/app/tool-registry/tool-registry.module.ts

import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tool } from '../entities/tool.entity';
import { ServerToolRegistryService } from './server-tool-registry.service';
import { ServerToolExecutorService } from './server-tool-executor.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tool])],
  providers: [
    ServerToolRegistryService,
    ServerToolExecutorService,
  ],
  exports: [ServerToolExecutorService],
})
export class ToolRegistryModule implements OnModuleInit {
  constructor(private registry: ServerToolRegistryService) {}

  async onModuleInit() {
    await this.registry.registerAllServerTools();
  }
}
```

### Import in AppModule

```typescript
// packages/api/src/app/app.module.ts

import { ToolRegistryModule } from './tool-registry/tool-registry.module';

@Module({
  imports: [
    // ... other modules
    ToolRegistryModule,
  ],
})
export class AppModule {}
```

## Integration

### Tool Execution Flow

Modify existing tool service to handle SERVER type:

```typescript
// Example integration (actual location may vary)

@Injectable()
export class ToolService {
  constructor(
    @InjectRepository(Tool)
    private toolRepo: Repository<Tool>,
    private serverToolExecutor: ServerToolExecutorService,
    // ... other executors
  ) {}

  async executeTool(
    toolName: string,
    params: unknown,
    userId: string,
    sessionId?: string,
  ): Promise<any> {
    // Look up tool in database
    const tool = await this.toolRepo.findOne({ where: { name: toolName } });
    if (!tool) {
      throw new NotFoundException(`Tool not found: ${toolName}`);
    }

    // Route based on tool type
    switch (tool.type) {
      case 'SERVER':
        // Extract tool name from server__<id>__<name> format
        const serverToolName = toolName.replace(/^server__\d+__/, '');
        const context: ServerToolContext = {
          userId,
          userRole: await this.getUserRole(userId),
          sessionId,
          requestId: this.generateRequestId(),
        };
        return await this.serverToolExecutor.execute(serverToolName, params, context);

      case 'MCP':
        // ... existing MCP execution logic
        break;

      case 'CLIENT':
        // ... existing client tool logic
        break;

      default:
        throw new Error(`Unknown tool type: ${tool.type}`);
    }
  }
}
```

## Testing

### Unit Test Example

```typescript
// packages/api/src/app/tool-registry/server-tool-registry.service.spec.ts

describe('ServerToolRegistryService', () => {
  let service: ServerToolRegistryService;
  let toolRepo: Repository<Tool>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerToolRegistryService,
        {
          provide: getRepositoryToken(Tool),
          useValue: {
            upsert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServerToolRegistryService>(ServerToolRegistryService);
    toolRepo = module.get<Repository<Tool>>(getRepositoryToken(Tool));
  });

  it('should register all server tools on init', async () => {
    await service.registerAllServerTools();

    expect(toolRepo.upsert).toHaveBeenCalled();
    expect(service.getAllToolNames().length).toBeGreaterThan(0);
  });

  it('should cache tool definitions', async () => {
    await service.registerAllServerTools();

    const toolDef = service.getToolDefinition('knowledge-similarity');
    expect(toolDef).toBeDefined();
    expect(toolDef.name).toBe('knowledge-similarity');
  });
});
```

## Security

### Input Validation

- All parameters validated via Zod schema before execution
- Type coercion and default values handled by Zod
- Invalid inputs return descriptive error messages

### Access Control

- `ServerToolContext` includes userId and userRole
- Tools can implement role-based access checks
- All executions logged with user context

### Rate Limiting

Consider adding rate limiting decorator:

```typescript
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
@UseGuards(ThrottlerGuard)
export class ServerToolExecutorService {
  // ...
}
```

## Monitoring

### Metrics to Track

- Tool registration duration on startup
- Tool execution success/failure rate
- Tool execution duration (p50, p95, p99)
- Parameter validation error rate

### Logging

All executions logged with structured data:

```json
{
  "message": "Server tool executed successfully",
  "toolName": "knowledge-similarity",
  "userId": "user123",
  "duration": 245,
  "timestamp": "2026-07-06T14:30:00Z"
}
```

## Error Handling

### Common Errors

| Error | Cause | Response |
|-------|-------|----------|
| Tool not found | Tool name doesn't exist in cache | 404 with tool name |
| Parameter validation failed | Invalid params per Zod schema | 400 with validation errors |
| Execution timeout | Tool took > 30s | 408 with timeout message |
| Execution error | Exception in tool logic | 500 with error message |

### Error Response Format

```typescript
{
  success: false,
  error: "Parameter validation failed: ...",
  stack?: "..." // only in development
}
```
