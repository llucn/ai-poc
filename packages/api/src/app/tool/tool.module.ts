import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolEntity } from './tool.entity';
import { AgentToolEntity } from '../agent/agent-tool.entity';
import { ToolService } from './tool.service';
import { ToolController } from './tool.controller';
import { McpModule } from '../mcp/mcp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ToolEntity, AgentToolEntity]),
    McpModule,
  ],
  providers: [ToolService],
  controllers: [ToolController],
  exports: [ToolService],
})
export class ToolModule {}
