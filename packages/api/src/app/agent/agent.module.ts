import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentEntity } from './agent.entity';
import { AgentToolEntity } from './agent-tool.entity';
import { AgentSkillEntity } from './agent-skill.entity';
import { ToolEntity } from '../tool/tool.entity';
import { SkillEntity } from '../skill/skill.entity';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AgentEntity,
      AgentToolEntity,
      AgentSkillEntity,
      ToolEntity,
      SkillEntity,
    ]),
  ],
  providers: [AgentService],
  controllers: [AgentController],
  exports: [AgentService],
})
export class AgentModule {}
