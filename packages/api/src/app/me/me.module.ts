import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [MeController],
})
export class MeModule {}
