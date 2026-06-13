import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToolEntity } from '../tool/tool.entity';
import { AgentToolEntity } from '../agent/agent-tool.entity';
import { ClientToolsService } from './client-tools.service';
import { ClientToolsController } from './client-tools.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ToolEntity, AgentToolEntity])],
  providers: [ClientToolsService],
  controllers: [ClientToolsController],
})
export class ClientToolsModule {}
