import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock pdf-parse to avoid its test-file side effect on import
vi.mock('pdf-parse', () => ({ default: vi.fn() }));

// Mock TypeORM and DataSource
const mockDocRepo = {
  create: vi.fn((entity) => entity),
  save: vi.fn((entity) => Promise.resolve({ id: 1, ...entity })),
  findOne: vi.fn(),
  find: vi.fn(),
  remove: vi.fn(),
  delete: vi.fn(),
};

const mockChunkRepo = {
  create: vi.fn((entity) => entity),
  save: vi.fn((entity) => Promise.resolve({ id: 1, ...entity })),
  findOne: vi.fn(),
  find: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
  createQueryBuilder: vi.fn(),
};

const mockDataSource = {
  query: vi.fn(),
};

const mockS3Service = {
  isConfigured: vi.fn(() => true),
  upload: vi.fn(() => Promise.resolve()),
  getDownloadUrl: vi.fn(() => Promise.resolve('https://s3.example.com/file.pdf')),
  download: vi.fn(),
  delete: vi.fn(() => Promise.resolve()),
  move: vi.fn(() => Promise.resolve()),
  exists: vi.fn(() => Promise.resolve(true)),
};

const mockChunkingService = {
  splitMarkdown: vi.fn(() => [{ index: 0, content: 'chunk content' }]),
  splitPdf: vi.fn(() => Promise.resolve([{ index: 0, content: 'page 1 text' }])),
};

import { KnowledgeService } from './knowledge.service';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';

function createService() {
  return new KnowledgeService(
    mockDocRepo as any,
    mockChunkRepo as any,
    mockDataSource as any,
    mockS3Service as any,
    mockChunkingService as any,
  );
}

describe('KnowledgeService', () => {
  let service: KnowledgeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = createService();
  });

  describe('createDirectory', () => {
    it('creates a directory at root level', async () => {
      mockDocRepo.findOne.mockResolvedValue(null); // no duplicate
      mockDocRepo.save.mockImplementation((e) => Promise.resolve({ id: 1, ...e }));

      const result = await service.createDirectory({ name: 'docs', parentId: 0 }, 'admin');

      expect(mockDocRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'docs',
          type: 1,
          parentId: 0,
          path: 'docs',
        })
      );
      expect(result).toHaveProperty('name', 'docs');
    });

    it('creates a directory under a parent', async () => {
      // buildPath calls findOne({where:{id:5}}) to get parent
      // checkDuplicate calls findOne({where:{parentId:5, name:'sub'}})
      mockDocRepo.findOne
        .mockResolvedValueOnce({ id: 5, name: 'parent', type: 1, path: '/parent', parentId: 0 }) // buildPath
        .mockResolvedValueOnce(null); // checkDuplicate (no dup)

      mockDocRepo.save.mockImplementation((e) => Promise.resolve({ id: 2, ...e }));

      const result = await service.createDirectory({ name: 'sub', parentId: 5 }, 'admin');
      expect(result.path).toBe('/parent/sub');
    });

    it('throws ConflictException for duplicate name', async () => {
      mockDocRepo.findOne.mockResolvedValue({ id: 99, name: 'docs', parentId: 0 });

      await expect(
        service.createDirectory({ name: 'docs', parentId: 0 }, 'admin')
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createDocument', () => {
    it('creates a Markdown document and generates chunks', async () => {
      // parentId=0, so buildPath won't call findOne
      // checkDuplicate calls findOne({where:{parentId:0, name:'readme.md'}})
      mockDocRepo.findOne.mockResolvedValueOnce(null); // checkDuplicate
      mockDocRepo.save.mockImplementation((e) => Promise.resolve({ id: 10, ...e }));
      mockDataSource.query.mockResolvedValue(undefined);

      const result = await service.createDocument(
        { name: 'readme.md', parentId: 0, content: '# Hello\nWorld' },
        'admin'
      );

      expect(result).toHaveProperty('name', 'readme.md');
      expect(result).toHaveProperty('type', 2);
      expect(mockChunkingService.splitMarkdown).toHaveBeenCalledWith('# Hello\nWorld');
      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it('calculates size from content bytes', async () => {
      mockDocRepo.findOne.mockResolvedValue(null);
      mockDocRepo.save.mockImplementation((e) => Promise.resolve({ id: 11, ...e }));
      mockDataSource.query.mockResolvedValue(undefined);

      await service.createDocument(
        { name: 'test.md', parentId: 0, content: 'abc' },
        'admin'
      );

      expect(mockDocRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ size: 3 })
      );
    });
  });

  describe('uploadAttachment', () => {
    it('uploads PDF to S3 and creates document', async () => {
      mockDocRepo.findOne.mockResolvedValue(null);
      mockDocRepo.save.mockImplementation((e) => Promise.resolve({ id: 20, ...e }));
      mockDataSource.query.mockResolvedValue(undefined);

      const buffer = Buffer.from('fake pdf content');
      const result = await service.uploadAttachment(0, 'report.pdf', buffer, 'admin');

      expect(mockS3Service.upload).toHaveBeenCalledWith('report.pdf', buffer, 'application/pdf');
      expect(result).toHaveProperty('type', 3);
      expect(result).toHaveProperty('name', 'report.pdf');
      expect(mockChunkingService.splitPdf).toHaveBeenCalledWith(buffer);
    });

    it('throws BadRequestException when S3 not configured', async () => {
      mockS3Service.isConfigured.mockReturnValueOnce(false);
      const buffer = Buffer.from('pdf');

      await expect(
        service.uploadAttachment(0, 'file.pdf', buffer, 'admin')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('returns document when found', async () => {
      const doc = { id: 1, name: 'test', type: 2 };
      mockDocRepo.findOne.mockResolvedValue(doc);

      const result = await service.findOne(1);
      expect(result).toEqual(doc);
    });

    it('throws NotFoundException when not found', async () => {
      mockDocRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneWithDownloadUrl', () => {
    it('adds downloadUrl for PDF attachments', async () => {
      mockDocRepo.findOne.mockResolvedValue({
        id: 1, name: 'file.pdf', type: 3, content: '/file.pdf',
      });

      const result = await service.findOneWithDownloadUrl(1);
      expect(result.downloadUrl).toBe('https://s3.example.com/file.pdf');
      expect(mockS3Service.getDownloadUrl).toHaveBeenCalledWith('/file.pdf');
    });

    it('does not add downloadUrl for Markdown documents', async () => {
      mockDocRepo.findOne.mockResolvedValue({
        id: 2, name: 'readme.md', type: 2, content: '# hi',
      });

      const result = await service.findOneWithDownloadUrl(2);
      expect(result.downloadUrl).toBeUndefined();
    });
  });

  describe('listByParent', () => {
    it('returns documents for a parent', async () => {
      const docs = [
        { id: 1, name: 'a', type: 1 },
        { id: 2, name: 'b', type: 2 },
      ];
      mockDocRepo.find.mockResolvedValue(docs);

      const result = await service.listByParent(0);
      expect(result).toEqual(docs);
      expect(mockDocRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { parentId: 0 } })
      );
    });
  });

  describe('updateContent', () => {
    it('updates Markdown document content and regenerates chunks', async () => {
      const doc = { id: 10, name: 'test.md', type: 2, content: 'old', path: '/test.md', tags: null };
      mockDocRepo.findOne.mockResolvedValue(doc);
      mockDocRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockChunkRepo.delete.mockResolvedValue(undefined);
      mockDataSource.query.mockResolvedValue(undefined);

      const result = await service.updateContent(10, { content: 'new content' }, 'admin');

      expect(result.content).toBe('new content');
      expect(mockChunkRepo.delete).toHaveBeenCalledWith({ documentId: 10 });
      expect(mockChunkingService.splitMarkdown).toHaveBeenCalledWith('new content');
    });

    it('throws BadRequestException for non-file documents', async () => {
      mockDocRepo.findOne.mockResolvedValue({ id: 1, type: 1, name: 'dir' });

      await expect(
        service.updateContent(1, { content: 'x' }, 'admin')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rename', () => {
    it('renames a document and updates path', async () => {
      const doc = { id: 5, name: 'old', type: 2, parentId: 0, path: '/old', content: null, tags: null };
      mockDocRepo.findOne
        .mockResolvedValueOnce(doc)      // findOne
        .mockResolvedValueOnce(null);    // checkDuplicate
      mockDocRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockChunkRepo.update.mockResolvedValue(undefined);

      const result = await service.rename(5, { name: 'new' }, 'admin');

      expect(result.name).toBe('new');
      expect(result.path).toBe('new');
    });

    it('updates child paths when renaming a directory', async () => {
      const doc = { id: 3, name: 'old-dir', type: 1, parentId: 0, path: 'old-dir', content: null, tags: null };
      mockDocRepo.findOne
        .mockResolvedValueOnce(doc)
        .mockResolvedValueOnce(null); // no duplicate
      mockDocRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockChunkRepo.update.mockResolvedValue(undefined);
      mockDataSource.query.mockResolvedValue(undefined);

      await service.rename(3, { name: 'new-dir' }, 'admin');

      // Should update child paths
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE t_document'),
        expect.arrayContaining(['new-dir'])
      );
    });
  });

  describe('move', () => {
    it('moves a document to a new parent', async () => {
      const doc = { id: 7, name: 'file.md', type: 2, parentId: 0, path: '/file.md', content: null, tags: null };
      const target = { id: 3, name: 'target', type: 1, path: '/target', parentId: 0 };

      mockDocRepo.findOne
        .mockResolvedValueOnce(doc)       // findOne
        .mockResolvedValueOnce(null)      // checkDuplicate
        .mockResolvedValueOnce(target);   // buildPath - find parent
      mockDocRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockChunkRepo.update.mockResolvedValue(undefined);

      const result = await service.move(7, { parentId: 3 }, 'admin');

      expect(result.parentId).toBe(3);
      expect(result.path).toBe('/target/file.md');
    });

    it('prevents circular reference when moving directory', async () => {
      // dir A (id=1) contains dir B (id=2). Try to move A into B.
      const dirA = { id: 1, name: 'A', type: 1, parentId: 0, path: '/A', content: null, tags: null };
      const dirB = { id: 2, name: 'B', type: 1, parentId: 1, path: '/A/B', content: null, tags: null };

      mockDocRepo.findOne
        .mockResolvedValueOnce(dirA)    // findOne for id=1
        .mockResolvedValueOnce(dirB);   // checkCircularReference: lookup targetParentId=2

      await expect(
        service.move(1, { parentId: 2 }, 'admin')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTags', () => {
    it('updates document tags and propagates to chunks', async () => {
      const doc = { id: 4, name: 'doc', type: 2, tags: null, parentId: 0, path: '/doc' };
      mockDocRepo.findOne.mockResolvedValue(doc);
      mockDocRepo.save.mockImplementation((e) => Promise.resolve(e));
      mockChunkRepo.update.mockResolvedValue(undefined);

      const result = await service.updateTags(4, { tags: ['tag1', 'tag2'] }, 'admin');

      expect(result.tags).toEqual({ tags: ['tag1', 'tag2'] });
      expect(mockChunkRepo.update).toHaveBeenCalledWith(
        { documentId: 4 },
        expect.objectContaining({ documentTags: { tags: ['tag1', 'tag2'] } })
      );
    });
  });

  describe('deleteDocument', () => {
    it('deletes a single document', async () => {
      const doc = { id: 8, name: 'file', type: 2, parentId: 0, content: null };
      mockDocRepo.findOne.mockResolvedValue(doc);
      mockDocRepo.find.mockResolvedValue([]); // no children
      mockDocRepo.remove.mockResolvedValue(undefined);
      mockChunkRepo.delete.mockResolvedValue(undefined);

      await service.deleteDocument(8);

      expect(mockChunkRepo.delete).toHaveBeenCalledWith({ documentId: 8 });
      expect(mockDocRepo.remove).toHaveBeenCalledWith(doc);
    });

    it('recursively deletes directory children', async () => {
      const dir = { id: 1, name: 'dir', type: 1, parentId: 0, content: null };
      const child = { id: 2, name: 'child', type: 2, parentId: 1, content: null };

      mockDocRepo.findOne.mockResolvedValue(dir);
      mockDocRepo.find
        .mockResolvedValueOnce([child])  // children of dir
        .mockResolvedValueOnce([]);      // children of child (none)
      mockDocRepo.remove.mockResolvedValue(undefined);
      mockChunkRepo.delete.mockResolvedValue(undefined);

      await service.deleteDocument(1);

      // Should delete child chunks and document, then parent
      expect(mockChunkRepo.delete).toHaveBeenCalledWith({ documentId: 2 });
      expect(mockChunkRepo.delete).toHaveBeenCalledWith({ documentId: 1 });
      expect(mockDocRepo.remove).toHaveBeenCalledTimes(2);
    });

    it('deletes S3 object for PDF attachments', async () => {
      const pdf = { id: 9, name: 'doc.pdf', type: 3, parentId: 0, content: '/doc.pdf' };
      mockDocRepo.findOne.mockResolvedValue(pdf);
      mockDocRepo.find.mockResolvedValue([]);
      mockDocRepo.remove.mockResolvedValue(undefined);
      mockChunkRepo.delete.mockResolvedValue(undefined);

      await service.deleteDocument(9);

      expect(mockS3Service.delete).toHaveBeenCalledWith('/doc.pdf');
    });
  });

  describe('search', () => {
    it('searches with tsvector and returns paginated results', async () => {
      const mockQb = {
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([
          [{ id: 1, chunkContent: 'found text', documentName: 'test.md' }],
          1,
        ]),
      };
      mockChunkRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.search('test query', undefined, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(mockQb.where).toHaveBeenCalledWith(
        expect.stringContaining("plainto_tsquery('english', :query)"),
        { query: 'test query' }
      );
    });

    it('adds tag filter when tags provided', async () => {
      const mockQb = {
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
      };
      mockChunkRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.search('query', ['tag1', 'tag2'], 1, 20);

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('?|'),
        { tags: ['tag1', 'tag2'] }
      );
    });

    it('paginates correctly', async () => {
      const mockQb = {
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        getManyAndCount: vi.fn().mockResolvedValue([[], 50]),
      };
      mockChunkRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.search('query', undefined, 3, 10);

      expect(mockQb.skip).toHaveBeenCalledWith(20); // (3-1) * 10
      expect(mockQb.take).toHaveBeenCalledWith(10);
      expect(result.totalPages).toBe(5);
    });
  });
});
