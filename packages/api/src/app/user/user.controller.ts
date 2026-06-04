import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserService } from './user.service';
import type { CreateUserDto, UpdateUserDto, DeleteUsersDto } from './user.dto';

@Controller('users')
@Roles('SYSTEM_ADMIN')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('exists')
  async exists(@Query('name') name?: string) {
    return this.userService.exists(name || '');
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.userService.findAll(pageNum, pageSizeNum);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: any,
  ) {
    const createdBy = user?.username || 'system';
    return this.userService.create(dto, createdBy);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    const updatedBy = user?.username || 'system';
    return this.userService.update(id, dto, updatedBy);
  }

  @Delete()
  @HttpCode(200)
  async delete(@Body() dto: DeleteUsersDto) {
    const deleted = await this.userService.delete(dto.ids);
    return { deleted };
  }
}
