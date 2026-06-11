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
import { AgentService } from './agent.service';
import type {
  CreateAgentDto,
  UpdateAgentDto,
  DeleteAgentsDto,
  UpdateSystemPromptDto,
  LinkToolDto,
  LinkSkillDto,
} from './agent.dto';

@Controller('agents')
@Roles('SYSTEM_ADMIN')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.agentService.findAll(pageNum, pageSizeNum);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.agentService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateAgentDto, @CurrentUser() user: any) {
    const createdBy = user?.username || 'system';
    return this.agentService.create(dto, createdBy);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAgentDto,
    @CurrentUser() user: any
  ) {
    const updatedBy = user?.username || 'system';
    return this.agentService.update(id, dto, updatedBy);
  }

  @Put(':id/system-prompt')
  async updateSystemPrompt(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSystemPromptDto,
    @CurrentUser() user: any
  ) {
    const updatedBy = user?.username || 'system';
    return this.agentService.updateSystemPrompt(id, dto.systemPrompt, updatedBy);
  }

  @Delete()
  @HttpCode(200)
  async delete(@Body() dto: DeleteAgentsDto) {
    const deleted = await this.agentService.delete(dto.ids);
    return { deleted };
  }

  // ===== Tool associations =====

  @Post(':id/tools')
  async linkTool(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LinkToolDto,
    @CurrentUser() user: any
  ) {
    const createdBy = user?.username || 'system';
    return this.agentService.linkTool(id, dto.toolId, createdBy);
  }

  @Delete(':id/tools/:toolId')
  @HttpCode(200)
  async unlinkTool(
    @Param('id', ParseIntPipe) id: number,
    @Param('toolId', ParseIntPipe) toolId: number
  ) {
    await this.agentService.unlinkTool(id, toolId);
    return { unlinked: true };
  }

  // ===== Skill associations =====

  @Post(':id/skills')
  async linkSkill(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LinkSkillDto,
    @CurrentUser() user: any
  ) {
    const createdBy = user?.username || 'system';
    return this.agentService.linkSkill(id, dto.skillId, createdBy);
  }

  @Delete(':id/skills/:skillId')
  @HttpCode(200)
  async unlinkSkill(
    @Param('id', ParseIntPipe) id: number,
    @Param('skillId', ParseIntPipe) skillId: number
  ) {
    await this.agentService.unlinkSkill(id, skillId);
    return { unlinked: true };
  }
}
