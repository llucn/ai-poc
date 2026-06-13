import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from './session.entity';
import { MessageEntity } from './message.entity';
import { PendingClientCallEntity } from './pending-client-call.entity';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { AgentEntity } from '../agent/agent.entity';
import { AgentToolEntity } from '../agent/agent-tool.entity';
import { AgentSkillEntity } from '../agent/agent-skill.entity';
import { ToolEntity } from '../tool/tool.entity';
import { SkillEntity } from '../skill/skill.entity';
import { LlmModule } from '../llm/llm.module';
import { McpModule } from '../mcp/mcp.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessionEntity,
      MessageEntity,
      AgentEntity,
      AgentToolEntity,
      AgentSkillEntity,
      ToolEntity,
      SkillEntity,
      PendingClientCallEntity,
    ]),
    LlmModule,
    McpModule,
  ],
  providers: [SessionService],
  controllers: [SessionController],
  exports: [SessionService],
})
export class SessionModule {}
