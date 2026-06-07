import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionEntity } from './session.entity';
import { MessageEntity } from './message.entity';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { AgentEntity } from '../agent/agent.entity';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessionEntity, MessageEntity, AgentEntity]),
    LlmModule,
  ],
  providers: [SessionService],
  controllers: [SessionController],
  exports: [SessionService],
})
export class SessionModule {}
