import { Controller, Get, NotFoundException } from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../auth/current-user.decorator';
import { UserService } from '../user/user.service';
import type { MeResponse } from './me.dto';

@Controller('me')
export class MeController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getMe(@CurrentUser() user: CurrentUserPayload): Promise<MeResponse> {
    const userName = user.userName;

    // Query the database for the user by name
    const userEntity = await this.userService.findByName(userName);

    if (!userEntity) {
      throw new NotFoundException(`User '${userName}' not found`);
    }

    return {
      id: userEntity.id,
      name: userEntity.name,
      displayName: userEntity.displayName,
      email: userEntity.email,
      role: userEntity.role,
    };
  }
}
