import { Controller, Get } from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/current-user.decorator';
import type { MeResponse } from './me.dto';

@Controller('me')
export class MeController {
  @Get()
  getMe(@CurrentUser() user: CurrentUserPayload): MeResponse {
    return {
      userId: user.userId,
      userName: user.userName,
      phoneNumber: user.phoneNumber,
      email: user.email,
    };
  }
}
