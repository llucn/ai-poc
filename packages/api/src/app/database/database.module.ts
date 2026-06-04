import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../config/app-config';
import { UserEntity } from '../user/user.entity';

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
        entities: [UserEntity],
        synchronize: false,
        logging: ['error', 'warn'],
      }),
    }),
  ],
})
export class DatabaseModule {}
