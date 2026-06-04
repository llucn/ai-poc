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
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import {
  CreateFormDto,
  DeleteFormsDto,
  FormDto,
  FormFieldDto,
  PutFormFieldsDto,
  UpdateFormDto,
} from './form.dto';
import { FormFieldEntity } from './form-field.entity';
import { FormEntity } from './form.entity';
import { FormService } from './form.service';

function toDto(entity: FormEntity): FormDto {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    createdOn: entity.createdOn?.toISOString() ?? new Date().toISOString(),
    createdBy: entity.createdBy,
    updatedOn: entity.updatedOn?.toISOString() ?? null,
    updatedBy: entity.updatedBy,
  };
}

function toFieldDto(row: FormFieldEntity): FormFieldDto {
  return {
    formId: row.formId,
    fieldId: row.fieldId,
    position: row.position,
    field: {
      id: row.field.id,
      name: row.field.name,
      title: row.field.title,
      type: row.field.type,
    },
  };
}

@Controller('forms')
@Roles('ADMIN')
export class FormController {
  constructor(private readonly service: FormService) {}

  @Get()
  async findAll(): Promise<FormDto[]> {
    const rows = await this.service.findAll();
    return rows.map(toDto);
  }

  @Get('exists')
  async exists(@Query('name') name?: string): Promise<{ name: boolean }> {
    const taken = name ? await this.service.existsByName(name) : false;
    return { name: taken };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<FormDto> {
    const row = await this.service.findById(id);
    return toDto(row);
  }

  @Post()
  async create(
    @Body() dto: CreateFormDto,
    @CurrentUser() user: { userName: string },
  ): Promise<FormDto> {
    const created = await this.service.create(dto, user.userName);
    return toDto(created);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFormDto,
    @CurrentUser() user: { userName: string },
  ): Promise<FormDto> {
    const updated = await this.service.update(id, dto, user.userName);
    return toDto(updated);
  }

  @Delete()
  @HttpCode(200)
  async removeMany(@Body() dto: DeleteFormsDto): Promise<{ deleted: number }> {
    const deleted = await this.service.removeMany(dto.ids);
    return { deleted };
  }

  @Delete(':id')
  @HttpCode(200)
  async removeOne(@Param('id', ParseIntPipe) id: number): Promise<{ deleted: boolean }> {
    await this.service.removeOne(id);
    return { deleted: true };
  }

  @Get(':id/fields')
  async getFields(@Param('id', ParseIntPipe) id: number): Promise<FormFieldDto[]> {
    const rows = await this.service.getFields(id);
    return rows.map(toFieldDto);
  }

  @Put(':id/fields')
  async putFields(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PutFormFieldsDto,
    @CurrentUser() user: { userName: string },
  ): Promise<FormFieldDto[]> {
    const rows = await this.service.putFields(id, dto, user.userName);
    return rows.map(toFieldDto);
  }
}
