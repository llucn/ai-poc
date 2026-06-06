import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../config/app-config';
import { UserEntity } from '../user/user.entity';
import { AgentEntity } from '../agent/agent.entity';
import { AgentToolEntity } from '../agent/agent-tool.entity';
import { AgentSkillEntity } from '../agent/agent-skill.entity';

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
        entities: [UserEntity, AgentEntity, AgentToolEntity, AgentSkillEntity],
        synchronize: false,
        logging: ['error', 'warn'],
      }),
    }),
  ],
})
export class DatabaseModule {}
