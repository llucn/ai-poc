import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppService } from './app.service';
import { Public } from './auth/public.decorator';
import { UserEntity } from './user/user.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  @Public()
  @Get()
  getData() {
    return this.appService.getData();
  }

  @Public()
  @Get('auth/users')
  async getAuthUsers() {
    // Return all users for mock login page (no authentication required)
    return this.userRepository.find({ order: { id: 'ASC' } });
  }
}
