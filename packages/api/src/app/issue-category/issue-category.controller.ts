import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import {
  CreateIssueCategoryDto,
  DeleteIssueCategoriesDto,
  ExistsResponseDto,
  IssueCategoryDto,
  UpdateIssueCategoryDto,
} from './issue-category.dto';
import { IssueCategoryEntity } from './issue-category.entity';
import { IssueCategoryService } from './issue-category.service';

function toDto(entity: IssueCategoryEntity): IssueCategoryDto {
  return {
    id: entity.id,
    name: entity.name,
    displayName: entity.displayName,
  };
}

@Controller('issue-categories')
@Roles('ADMIN')
export class IssueCategoryController {
  constructor(private readonly service: IssueCategoryService) {}

  @Get()
  async findAll(): Promise<IssueCategoryDto[]> {
    const rows = await this.service.findAll();
    return rows.map(toDto);
  }

  @Get('exists')
  exists(
    @Query('name') name?: string,
    @Query('displayName') displayName?: string,
  ): Promise<ExistsResponseDto> {
    return this.service.checkExists(name, displayName);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IssueCategoryDto> {
    const row = await this.service.findById(id);
    return toDto(row);
  }

  @Post()
  async create(
    @Body() dto: CreateIssueCategoryDto,
  ): Promise<IssueCategoryDto> {
    const created = await this.service.create(dto);
    return toDto(created);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIssueCategoryDto,
  ): Promise<IssueCategoryDto> {
    const updated = await this.service.update(id, dto);
    return toDto(updated);
  }

  @Delete()
  @HttpCode(200)
  async remove(
    @Body() dto: DeleteIssueCategoriesDto,
  ): Promise<{ deleted: number }> {
    const deleted = await this.service.removeMany(dto.ids);
    return { deleted };
  }
}
