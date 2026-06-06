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
  RegisterMcpServerDto,
  TestMcpServerDto,
  CreateSkillDto,
  UpdateSkillDto,
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

  // ===== MCP Servers =====

  @Get(':id/mcp-servers')
  async listMcpServers(@Param('id', ParseIntPipe) id: number) {
    return this.agentService.listMcpServers(id);
  }

  @Post(':id/mcp-servers/test')
  @HttpCode(200)
  async testMcpServer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TestMcpServerDto
  ) {
    return this.agentService.testMcpServer(dto.serverUrl);
  }

  @Post(':id/mcp-servers')
  async registerMcpServer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterMcpServerDto,
    @CurrentUser() user: any
  ) {
    const createdBy = user?.username || 'system';
    return this.agentService.registerMcpServer(id, dto, createdBy);
  }

  @Put(':id/mcp-servers/:serverId')
  async updateMcpServer(
    @Param('id', ParseIntPipe) id: number,
    @Param('serverId', ParseIntPipe) serverId: number,
    @Body() dto: RegisterMcpServerDto,
    @CurrentUser() user: any
  ) {
    const updatedBy = user?.username || 'system';
    return this.agentService.updateMcpServer(id, serverId, dto, updatedBy);
  }

  @Delete(':id/mcp-servers/:serverId')
  @HttpCode(200)
  async deleteMcpServer(
    @Param('id', ParseIntPipe) id: number,
    @Param('serverId', ParseIntPipe) serverId: number
  ) {
    await this.agentService.deleteMcpServer(id, serverId);
    return { deleted: true };
  }

  // ===== Skills =====

  @Post(':id/skills')
  async createSkill(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSkillDto,
    @CurrentUser() user: any
  ) {
    const createdBy = user?.username || 'system';
    return this.agentService.createSkill(id, dto, createdBy);
  }

  @Put(':id/skills/:skillId')
  async updateSkill(
    @Param('id', ParseIntPipe) id: number,
    @Param('skillId', ParseIntPipe) skillId: number,
    @Body() dto: UpdateSkillDto,
    @CurrentUser() user: any
  ) {
    const updatedBy = user?.username || 'system';
    return this.agentService.updateSkill(id, skillId, dto, updatedBy);
  }

  @Delete(':id/skills/:skillId')
  @HttpCode(200)
  async deleteSkill(
    @Param('id', ParseIntPipe) id: number,
    @Param('skillId', ParseIntPipe) skillId: number
  ) {
    await this.agentService.deleteSkill(id, skillId);
    return { deleted: true };
  }
}
