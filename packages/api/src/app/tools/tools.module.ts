import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentChunkEntity } from '../knowledge/document-chunk.entity';
import { AgentEntity } from '../agent/agent.entity';
import { SessionEntity } from '../session/session.entity';
import { AgentSwitchLogEntity } from '../session/agent-switch-log.entity';
import { MessageEntity } from '../session/message.entity';
import { KnowledgeSimilarityToolService } from './knowledge-similarity-tool.service';
import { AgentSwitchToolService } from './agent-switch-tool.service';

/**
 * Module for server tool implementations and their services.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentChunkEntity,
      AgentEntity,
      SessionEntity,
      AgentSwitchLogEntity,
      MessageEntity,
    ]),
  ],
  providers: [KnowledgeSimilarityToolService, AgentSwitchToolService],
  exports: [KnowledgeSimilarityToolService, AgentSwitchToolService],
})
export class ToolsModule {}
