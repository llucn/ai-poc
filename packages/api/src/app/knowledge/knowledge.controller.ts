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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { KnowledgeService } from './knowledge.service';
import type {
  CreateDirectoryDto,
  CreateDocumentDto,
  RenameDocumentDto,
  MoveDocumentDto,
  UpdateDocumentContentDto,
  UpdateDocumentTagsDto,
  DeleteDocumentsDto,
} from './knowledge.dto';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  // --- Read operations: any authenticated user ---

  @Get('documents')
  @Roles()
  async list(
    @Query('parentId') parentId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const pid = parentId ? parseInt(parentId, 10) : 0;
    const order = sortOrder === 'DESC' ? 'DESC' : 'ASC';
    return this.knowledgeService.listByParent(pid, sortBy || 'name', order);
  }

  @Get('documents/:id')
  @Roles()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.knowledgeService.findOneWithDownloadUrl(id);
  }

  @Get('search')
  @Roles()
  async search(
    @Query('q') query: string,
    @Query('type') type?: string,
    @Query('tags') tags?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!query) throw new BadRequestException('Query parameter "q" is required');
    const searchType = type === 'similarity' ? 'similarity' : 'keyword';
    const tagList = tags ? tags.split(',').map((t) => t.trim()) : undefined;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.knowledgeService.search(query, searchType, tagList, pageNum, pageSizeNum);
  }

  // --- Write operations: SYSTEM_ADMIN only ---

  @Post('directories')
  @Roles('SYSTEM_ADMIN')
  async createDirectory(
    @Body() dto: CreateDirectoryDto,
    @CurrentUser() user: any,
  ) {
    return this.knowledgeService.createDirectory(dto, user?.username || 'system');
  }

  @Post('documents')
  @Roles('SYSTEM_ADMIN')
  async createDocument(
    @Body() dto: CreateDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.knowledgeService.createDocument(dto, user?.username || 'system');
  }

  @Post('attachments')
  @Roles('SYSTEM_ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Body('parentId') parentId: string,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }
    const pid = parseInt(parentId, 10);
    if (isNaN(pid)) throw new BadRequestException('Invalid parentId');
    return this.knowledgeService.uploadAttachment(pid, file.originalname, file.buffer, user?.username || 'system');
  }

  @Put('documents/:id')
  @Roles('SYSTEM_ADMIN')
  async updateContent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentContentDto,
    @CurrentUser() user: any,
  ) {
    return this.knowledgeService.updateContent(id, dto, user?.username || 'system');
  }

  @Put('documents/:id/rename')
  @Roles('SYSTEM_ADMIN')
  async rename(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RenameDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.knowledgeService.rename(id, dto, user?.username || 'system');
  }

  @Put('documents/:id/move')
  @Roles('SYSTEM_ADMIN')
  async move(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.knowledgeService.move(id, dto, user?.username || 'system');
  }

  @Put('documents/:id/tags')
  @Roles('SYSTEM_ADMIN')
  async updateTags(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDocumentTagsDto,
    @CurrentUser() user: any,
  ) {
    return this.knowledgeService.updateTags(id, dto, user?.username || 'system');
  }

  @Delete('documents/:id')
  @Roles('SYSTEM_ADMIN')
  @HttpCode(200)
  async deleteOne(@Param('id', ParseIntPipe) id: number) {
    await this.knowledgeService.deleteDocument(id);
    return { deleted: 1 };
  }

  @Delete('documents')
  @Roles('SYSTEM_ADMIN')
  @HttpCode(200)
  async deleteMany(@Body() dto: DeleteDocumentsDto) {
    const deleted = await this.knowledgeService.deleteDocuments(dto.ids);
    return { deleted };
  }
}
