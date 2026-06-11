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
import { ToolService } from './tool.service';
import type {
  CreateToolDto,
  UpdateToolDto,
  TestToolDto,
  DeleteToolsDto,
} from './tool.dto';

@Controller('tools')
@Roles('SYSTEM_ADMIN')
export class ToolController {
  constructor(private readonly toolService: ToolService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.toolService.findAll(pageNum, pageSizeNum);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.toolService.findOne(id);
  }

  @Post('test')
  @HttpCode(200)
  async testServer(@Body() dto: TestToolDto) {
    return this.toolService.testServer(dto.serverUrl);
  }

  @Post()
  async create(@Body() dto: CreateToolDto, @CurrentUser() user: any) {
    const createdBy = user?.username || 'system';
    return this.toolService.create(dto, createdBy);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateToolDto,
    @CurrentUser() user: any
  ) {
    const updatedBy = user?.username || 'system';
    return this.toolService.update(id, dto, updatedBy);
  }

  @Delete()
  @HttpCode(200)
  async delete(@Body() dto: DeleteToolsDto) {
    const deleted = await this.toolService.delete(dto.ids);
    return { deleted };
  }
}
