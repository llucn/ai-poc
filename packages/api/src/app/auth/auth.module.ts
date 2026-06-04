import { Module } from '@nestjs/common';
import { HeaderAuthGuard } from './header-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  providers: [HeaderAuthGuard, RolesGuard],
  exports: [HeaderAuthGuard, RolesGuard],
})
export class AuthModule {}
