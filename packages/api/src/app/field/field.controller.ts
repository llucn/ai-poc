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
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import {
  CreateFieldDto,
  DeleteFieldsDto,
  ExistsFieldResponseDto,
  FieldDto,
  UpdateFieldDto,
} from './field.dto';
import { FieldEntity } from './field.entity';
import type { FieldType } from './field-type';
import { FieldService } from './field.service';

function toDto(entity: FieldEntity): FieldDto {
  let parsedProps: object | null = null;
  if (entity.properties) {
    try {
      parsedProps = JSON.parse(entity.properties);
    } catch {
      parsedProps = null;
    }
  }
  return {
    id: entity.id,
    name: entity.name,
    title: entity.title,
    description: entity.description,
    required: entity.required === 1,
    defaultValue: entity.defaultValue,
    type: entity.type as FieldType,
    properties: parsedProps,
    createdOn: entity.createdOn?.toISOString() ?? new Date().toISOString(),
    createdBy: entity.createdBy,
    updatedOn: entity.updatedOn?.toISOString() ?? null,
    updatedBy: entity.updatedBy,
  };
}

@Controller('fields')
@Roles('ADMIN')
export class FieldController {
  constructor(private readonly service: FieldService) {}

  @Get()
  async findAll(): Promise<FieldDto[]> {
    const rows = await this.service.findAll();
    return rows.map(toDto);
  }

  @Get('exists')
  async exists(@Query('name') name?: string): Promise<ExistsFieldResponseDto> {
    const taken = name ? await this.service.existsByName(name) : false;
    return { name: taken };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<FieldDto> {
    const row = await this.service.findById(id);
    return toDto(row);
  }

  @Post()
  async create(
    @Body() dto: CreateFieldDto,
    @CurrentUser() user: { userName: string },
  ): Promise<FieldDto> {
    const created = await this.service.create(dto, user.userName);
    return toDto(created);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFieldDto,
    @CurrentUser() user: { userName: string },
  ): Promise<FieldDto> {
    const updated = await this.service.update(id, dto, user.userName);
    return toDto(updated);
  }

  @Delete()
  @HttpCode(200)
  async removeMany(@Body() dto: DeleteFieldsDto): Promise<{ deleted: number }> {
    const deleted = await this.service.removeMany(dto.ids);
    return { deleted };
  }

  @Delete(':id')
  @HttpCode(200)
  async removeOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    await this.service.removeOne(id);
    return { deleted: true };
  }
}
