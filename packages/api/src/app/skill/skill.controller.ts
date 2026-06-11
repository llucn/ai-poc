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
import { SkillService } from './skill.service';
import type {
  CreateSkillDto,
  UpdateSkillDto,
  DeleteSkillsDto,
} from './skill.dto';

@Controller('skills')
@Roles('SYSTEM_ADMIN')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.skillService.findAll(pageNum, pageSizeNum);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.skillService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateSkillDto, @CurrentUser() user: any) {
    const createdBy = user?.username || 'system';
    return this.skillService.create(dto, createdBy);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSkillDto,
    @CurrentUser() user: any
  ) {
    const updatedBy = user?.username || 'system';
    return this.skillService.update(id, dto, updatedBy);
  }

  @Delete()
  @HttpCode(200)
  async delete(@Body() dto: DeleteSkillsDto) {
    const deleted = await this.skillService.delete(dto.ids);
    return { deleted };
  }
}
