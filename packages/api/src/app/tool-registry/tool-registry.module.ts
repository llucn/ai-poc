import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolEntity } from '../tool/tool.entity';
import { ServerToolRegistryService } from './server-tool-registry.service';
import { ServerToolExecutorService } from './server-tool-executor.service';

/**
 * Module for server tool infrastructure.
 * Automatically registers all server tools on application startup.
 */
@Module({
  imports: [TypeOrmModule.forFeature([ToolEntity])],
  providers: [ServerToolRegistryService, ServerToolExecutorService],
  exports: [ServerToolExecutorService, ServerToolRegistryService],
})
export class ToolRegistryModule implements OnModuleInit {
  constructor(private registry: ServerToolRegistryService) {}

  async onModuleInit() {
    await this.registry.registerAllServerTools();
  }
}
