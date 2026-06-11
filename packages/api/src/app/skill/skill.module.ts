import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillEntity } from './skill.entity';
import { AgentSkillEntity } from '../agent/agent-skill.entity';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SkillEntity, AgentSkillEntity])],
  providers: [SkillService],
  controllers: [SkillController],
  exports: [SkillService],
})
export class SkillModule {}
