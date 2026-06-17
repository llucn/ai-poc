import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionService } from './session.service';
import type {
  CreateSessionDto,
  CreateMessageDto,
  DeleteSessionsDto,
  ClientResultDto,
} from './session.dto';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    const userName = user?.userName || user?.username || '';
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.sessionService.findAll(userName, pageNum, pageSizeNum);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    const userName = user?.userName || user?.username || '';
    return this.sessionService.findOne(id, userName);
  }

  @Post()
  async create(@Body() dto: CreateSessionDto, @CurrentUser() user: any) {
    const userName = user?.userName || user?.username || '';
    const createdBy = userName || 'system';
    return this.sessionService.createSession(dto, userName, createdBy);
  }

  @Delete()
  @HttpCode(200)
  async delete(@Body() dto: DeleteSessionsDto, @CurrentUser() user: any) {
    const userName = user?.userName || user?.username || '';
    const deleted = await this.sessionService.deleteByIds(dto.ids, userName);
    return { deleted };
  }

  @Get(':id/messages')
  async getMessages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any
  ) {
    const userName = user?.userName || user?.username || '';
    return this.sessionService.getMessages(id, userName);
  }

  @Post(':id/messages')
  async createMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    // 5.1: Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Abort signal: fires when the client disconnects so the service can
    // stop calling the LLM and exit the loop early.
    const abort = new AbortController();
    req.on('close', () => abort.abort());

    const userName = user?.userName || user?.username || '';
    const createdBy = userName || 'system';
    await this.sessionService.createMessage(id, dto, userName, createdBy, res, abort.signal);
  }

  @Post(':id/client-result')
  async clientResult(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ClientResultDto,
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    // SSE: the resumed turn streams its continuation (thoughts, final answer,
    // or another client_call) back over this response.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const abort = new AbortController();
    req.on('close', () => abort.abort());

    const userName = user?.userName || user?.username || '';
    const createdBy = userName || 'system';
    await this.sessionService.resumeClientResult(
      id,
      dto,
      userName,
      createdBy,
      res,
      abort.signal
    );
  }
}
