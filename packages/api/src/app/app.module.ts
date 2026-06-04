import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HeaderAuthGuard } from './auth/header-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { loadAppConfig } from './config/app-config';
import { DatabaseModule } from './database/database.module';
import { FieldModule } from './field/field.module';
import { FormModule } from './form/form.module';
import { IssueCategoryModule } from './issue-category/issue-category.module';
import { MeModule } from './me/me.module';
import { UserEntity } from './user/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadAppConfig],
      envFilePath: '.env',
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([UserEntity]),
    AuthModule,
    MeModule,
    IssueCategoryModule,
    FieldModule,
    FormModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: HeaderAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
