import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ServerToolRegistryService } from './server-tool-registry.service';
import { ServerToolContext, ServerToolDefinition } from './define-server-tool';
import { z } from 'zod';

/**
 * Service responsible for executing server tools with parameter validation,
 * timeout handling, and error management.
 */
@Injectable()
export class ServerToolExecutorService {
  private readonly logger = new Logger(ServerToolExecutorService.name);
  private readonly DEFAULT_TIMEOUT_MS = 30000; // 30 seconds

  constructor(private registry: ServerToolRegistryService) {}

  /**
   * Execute a server tool by name with the given parameters and context
   */
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
        this.DEFAULT_TIMEOUT_MS,
      );

      const duration = Date.now() - startTime;

      this.logger.log({
        message: 'Server tool executed successfully',
        toolName,
        userId: context.userId,
        duration,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error({
        message: 'Server tool execution failed',
        toolName,
        userId: context.userId,
        error: error.message,
        duration,
      });

      return {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }

  /**
   * Validate parameters against the tool's Zod schema
   */
  private validateParams(
    toolDef: ServerToolDefinition<any>,
    params: unknown,
  ): any {
    try {
      return toolDef.parameters.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new Error(`Parameter validation failed: ${errorMessages}`);
      }
      throw error;
    }
  }

  /**
   * Execute a promise with a timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error('Tool execution timeout')),
          timeoutMs,
        ),
      ),
    ]);
  }
}
