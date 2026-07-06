import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DocumentEntity } from './document.entity';
import { DocumentChunkEntity } from './document-chunk.entity';
import { S3Service } from './s3.service';
import { ChunkingService } from './chunking.service';
import type {
  CreateDirectoryDto,
  CreateDocumentDto,
  RenameDocumentDto,
  MoveDocumentDto,
  UpdateDocumentContentDto,
  UpdateDocumentTagsDto,
} from './knowledge.dto';

// Document types
const TYPE_DIRECTORY = 1;
const TYPE_FILE = 2;
const TYPE_ATTACHMENT = 3;

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepo: Repository<DocumentEntity>,
    @InjectRepository(DocumentChunkEntity)
    private readonly chunkRepo: Repository<DocumentChunkEntity>,
    private readonly dataSource: DataSource,
    private readonly s3Service: S3Service,
    private readonly chunkingService: ChunkingService,
  ) {}

  // --- Directory ---

  async createDirectory(dto: CreateDirectoryDto, createdBy: string): Promise<DocumentEntity> {
    const path = await this.buildPath(dto.parentId, dto.name);
    await this.checkDuplicate(dto.parentId, dto.name);

    const doc = this.documentRepo.create({
      name: dto.name,
      type: TYPE_DIRECTORY,
      parentId: dto.parentId,
      path,
      size: 0,
      createdOn: new Date(),
      createdBy,
    });
    return this.documentRepo.save(doc);
  }

  // --- Markdown Document ---

  async createDocument(dto: CreateDocumentDto, createdBy: string): Promise<DocumentEntity> {
    const path = await this.buildPath(dto.parentId, dto.name);
    await this.checkDuplicate(dto.parentId, dto.name);

    const content = dto.content || '';
    const size = Buffer.byteLength(content, 'utf8');
    const tags = dto.tags ? { tags: dto.tags } : null;

    const doc = this.documentRepo.create({
      name: dto.name,
      type: TYPE_FILE,
      parentId: dto.parentId,
      path,
      tags,
      size,
      content,
      createdOn: new Date(),
      createdBy,
    });
    const saved = await this.documentRepo.save(doc);
    await this.generateChunks(saved, createdBy);
    return saved;
  }

  // --- PDF Attachment ---

  async uploadAttachment(
    parentId: number,
    fileName: string,
    buffer: Buffer,
    createdBy: string,
  ): Promise<DocumentEntity> {
    if (!this.s3Service.isConfigured()) {
      throw new BadRequestException('S3 is not configured. PDF upload unavailable.');
    }

    const path = await this.buildPath(parentId, fileName);
    await this.checkDuplicate(parentId, fileName);

    const s3Key = `${path}`;
    await this.s3Service.upload(s3Key, buffer, 'application/pdf');

    const doc = this.documentRepo.create({
      name: fileName,
      type: TYPE_ATTACHMENT,
      parentId,
      path,
      size: buffer.length,
      content: s3Key,
      createdOn: new Date(),
      createdBy,
    });
    const saved = await this.documentRepo.save(doc);

    // Extract PDF text and create chunks
    const chunks = await this.chunkingService.splitPdf(buffer);
    await this.saveChunks(saved, chunks, createdBy);

    return saved;
  }

  // --- Get / List ---

  async findOne(id: number): Promise<DocumentEntity> {
    const doc = await this.documentRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Document with id ${id} not found`);
    return doc;
  }

  async findOneWithDownloadUrl(id: number): Promise<DocumentEntity & { downloadUrl?: string }> {
    const doc = await this.findOne(id);
    if (doc.type === TYPE_ATTACHMENT && doc.content) {
      const downloadUrl = await this.s3Service.getDownloadUrl(doc.content);
      return { ...doc, downloadUrl };
    }
    return doc;
  }

  async listByParent(parentId: number, sortBy = 'name', sortOrder: 'ASC' | 'DESC' = 'ASC') {
    const validSorts: Record<string, string> = {
      name: 'name',
      createdOn: 'created_on',
      updatedOn: 'updated_on',
    };
    const orderCol = validSorts[sortBy] || 'name';

    const docs = await this.documentRepo.find({
      where: { parentId },
      order: { [sortBy === 'name' ? 'name' : sortBy === 'createdOn' ? 'createdOn' : 'updatedOn']: sortOrder },
    });
    return docs;
  }

  // --- Update Content ---

  async updateContent(id: number, dto: UpdateDocumentContentDto, updatedBy: string): Promise<DocumentEntity> {
    const doc = await this.findOne(id);
    if (doc.type !== TYPE_FILE) {
      throw new BadRequestException('Can only update content of Markdown documents');
    }

    doc.content = dto.content;
    doc.size = Buffer.byteLength(dto.content, 'utf8');
    doc.updatedOn = new Date();
    doc.updatedBy = updatedBy;
    const saved = await this.documentRepo.save(doc);

    // Regenerate chunks
    await this.chunkRepo.delete({ documentId: id });
    await this.generateChunks(saved, updatedBy);

    return saved;
  }

  // --- Rename ---

  async rename(id: number, dto: RenameDocumentDto, updatedBy: string): Promise<DocumentEntity> {
    const doc = await this.findOne(id);
    const oldPath = doc.path;
    const oldName = doc.name;

    await this.checkDuplicate(doc.parentId, dto.name, id);

    const newPath = await this.buildPath(doc.parentId, dto.name);
    doc.name = dto.name;
    doc.path = newPath;
    doc.updatedOn = new Date();
    doc.updatedBy = updatedBy;
    const saved = await this.documentRepo.save(doc);

    // Update children paths if directory
    if (doc.type === TYPE_DIRECTORY) {
      await this.updateChildPaths(oldPath, newPath);
    }

    // Move S3 object if attachment
    if (doc.type === TYPE_ATTACHMENT && doc.content) {
      const newS3Key = newPath;
      await this.s3Service.move(doc.content, newS3Key);
      saved.content = newS3Key;
      await this.documentRepo.save(saved);
    }

    // Update chunk metadata
    await this.chunkRepo.update({ documentId: id }, {
      documentName: dto.name,
      documentPath: newPath,
      updatedOn: new Date(),
      updatedBy,
    });

    return saved;
  }

  // --- Move ---

  async move(id: number, dto: MoveDocumentDto, updatedBy: string): Promise<DocumentEntity> {
    const doc = await this.findOne(id);
    const oldPath = doc.path;

    // Circular reference check
    if (doc.type === TYPE_DIRECTORY) {
      await this.checkCircularReference(id, dto.parentId);
    }

    await this.checkDuplicate(dto.parentId, doc.name, id);

    const newPath = await this.buildPath(dto.parentId, doc.name);
    doc.parentId = dto.parentId;
    doc.path = newPath;
    doc.updatedOn = new Date();
    doc.updatedBy = updatedBy;
    const saved = await this.documentRepo.save(doc);

    // Update children paths if directory
    if (doc.type === TYPE_DIRECTORY) {
      await this.updateChildPaths(oldPath, newPath);
    }

    // Move S3 object if attachment
    if (doc.type === TYPE_ATTACHMENT && doc.content) {
      const newS3Key = newPath;
      await this.s3Service.move(doc.content, newS3Key);
      saved.content = newS3Key;
      await this.documentRepo.save(saved);
    }

    // Update chunk metadata
    await this.chunkRepo.update({ documentId: id }, {
      documentPath: newPath,
      updatedOn: new Date(),
      updatedBy,
    });

    return saved;
  }

  // --- Tags ---

  async updateTags(id: number, dto: UpdateDocumentTagsDto, updatedBy: string): Promise<DocumentEntity> {
    const doc = await this.findOne(id);
    doc.tags = { tags: dto.tags };
    doc.updatedOn = new Date();
    doc.updatedBy = updatedBy;
    const saved = await this.documentRepo.save(doc);

    // Propagate to chunks
    await this.chunkRepo.update({ documentId: id }, {
      documentTags: { tags: dto.tags },
      updatedOn: new Date(),
      updatedBy,
    });

    return saved;
  }

  // --- Delete ---

  async deleteDocument(id: number): Promise<void> {
    const doc = await this.findOne(id);
    await this.deleteRecursive(doc);
  }

  async deleteDocuments(ids: number[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const doc = await this.documentRepo.findOne({ where: { id } });
      if (doc) {
        await this.deleteRecursive(doc);
        count++;
      }
    }
    return count;
  }

  private async deleteRecursive(doc: DocumentEntity): Promise<void> {
    if (doc.type === TYPE_DIRECTORY) {
      const children = await this.documentRepo.find({ where: { parentId: doc.id } });
      for (const child of children) {
        await this.deleteRecursive(child);
      }
    }

    // Delete S3 object if attachment
    if (doc.type === TYPE_ATTACHMENT && doc.content && this.s3Service.isConfigured()) {
      await this.s3Service.delete(doc.content).catch(() => {
        // Log but don't fail if S3 delete fails
      });
    }

    // Delete chunks
    await this.chunkRepo.delete({ documentId: doc.id });
    // Delete document
    await this.documentRepo.remove(doc);
  }

  // --- Search ---

  async search(
    query: string,
    tags?: string[],
    page = 1,
    pageSize = 20,
  ) {
    const qb = this.chunkRepo.createQueryBuilder('c');
    qb.select([
      'c.id',
      'c.documentId',
      'c.documentName',
      'c.documentType',
      'c.documentPath',
      'c.documentTags',
      'c.chunkIndex',
      'c.chunkContent',
    ]);
    qb.addSelect("ts_rank(c.search_vector, plainto_tsquery('english', :query))", 'rank');
    qb.where("c.search_vector @@ plainto_tsquery('english', :query)", { query });

    if (tags && tags.length > 0) {
      qb.andWhere("c.document_tags->'tags' ?| :tags", { tags });
    }

    qb.orderBy('rank', 'DESC');
    qb.skip((page - 1) * pageSize);
    qb.take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // --- Private helpers ---

  private async buildPath(parentId: number, name: string): Promise<string> {
    if (parentId === 0) {
      return name;
    }
    const parent = await this.documentRepo.findOne({ where: { id: parentId } });
    if (!parent) throw new NotFoundException(`Parent directory with id ${parentId} not found`);
    if (parent.type !== TYPE_DIRECTORY) throw new BadRequestException('Parent must be a directory');
    return `${parent.path}/${name}`;
  }

  private async checkDuplicate(parentId: number, name: string, excludeId?: number): Promise<void> {
    const existing = await this.documentRepo.findOne({ where: { parentId, name } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Document with name '${name}' already exists in this directory`);
    }
  }

  private async checkCircularReference(docId: number, targetParentId: number): Promise<void> {
    let currentId = targetParentId;
    while (currentId !== 0) {
      if (currentId === docId) {
        throw new BadRequestException('Cannot move a directory into its own descendant');
      }
      const parent = await this.documentRepo.findOne({ where: { id: currentId } });
      if (!parent) break;
      currentId = parent.parentId;
    }
  }

  private async updateChildPaths(oldPath: string, newPath: string): Promise<void> {
    // Update all documents whose path starts with oldPath/
    await this.dataSource.query(
      `UPDATE t_document SET path = $1 || SUBSTRING(path FROM $2) WHERE path LIKE $3`,
      [newPath, oldPath.length + 1, `${oldPath}/%`],
    );
    await this.dataSource.query(
      `UPDATE t_document_chunk SET document_path = $1 || SUBSTRING(document_path FROM $2) WHERE document_path LIKE $3`,
      [newPath, oldPath.length + 1, `${oldPath}/%`],
    );
  }

  private async generateChunks(doc: DocumentEntity, createdBy: string): Promise<void> {
    if (doc.type !== TYPE_FILE || !doc.content) return;
    const chunks = this.chunkingService.splitMarkdown(doc.content);
    await this.saveChunks(doc, chunks, createdBy);
  }

  private async saveChunks(
    doc: DocumentEntity,
    chunks: { index: number; content: string }[],
    createdBy: string,
  ): Promise<void> {
    for (const chunk of chunks) {
      await this.dataSource.query(
        `INSERT INTO t_document_chunk
         (document_id, document_name, document_type, document_path, document_tags, chunk_index, chunk_content, search_vector, created_on, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, to_tsvector('english', $8), NOW(), $9)`,
        [
          doc.id,
          doc.name,
          doc.type,
          doc.path,
          doc.tags ? JSON.stringify(doc.tags) : null,
          chunk.index,
          chunk.content,
          chunk.content || '',
          createdBy,
        ],
      );
    }
  }
}
