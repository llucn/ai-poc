import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../config/app-config';
import { UserEntity } from '../user/user.entity';
import { AgentEntity } from '../agent/agent.entity';
import { AgentToolEntity } from '../agent/agent-tool.entity';
import { AgentSkillEntity } from '../agent/agent-skill.entity';
import { ToolEntity } from '../tool/tool.entity';
import { SkillEntity } from '../skill/skill.entity';
import { SessionEntity } from '../session/session.entity';
import { MessageEntity } from '../session/message.entity';
import { PendingClientCallEntity } from '../session/pending-client-call.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService<AppConfig>) => ({
        type: 'mysql',
        host: cfg.get('db.host', { infer: true }) as string,
        port: cfg.get('db.port', { infer: true }) as number,
        username: cfg.get('db.user', { infer: true }) as string,
        password: cfg.get('db.password', { infer: true }) as string,
        database: cfg.get('db.name', { infer: true }) as string,
        entities: [
          UserEntity,
          AgentEntity,
          AgentToolEntity,
          AgentSkillEntity,
          ToolEntity,
          SkillEntity,
          SessionEntity,
          MessageEntity,
          PendingClientCallEntity,
        ],
        synchronize: false,
        logging: ['error', 'warn'],
      }),
    }),
  ],
})
export class DatabaseModule {}
