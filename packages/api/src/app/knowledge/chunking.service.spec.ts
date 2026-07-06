import { describe, expect, it, vi } from 'vitest';

// Mock pdf-parse to avoid its test-file side effect on import
vi.mock('pdf-parse', () => ({ default: vi.fn() }));

import { ChunkingService } from './chunking.service';

describe('ChunkingService', () => {
  const service = new ChunkingService();

  describe('splitMarkdown', () => {
    it('returns single chunk for content without headers', () => {
      const result = service.splitMarkdown('Hello world\nsome text');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ index: 0, content: 'Hello world\nsome text' });
    });

    it('splits by h1 headers', () => {
      const content = '# Title\nIntro\n# Section 2\nBody';
      const result = service.splitMarkdown(content);
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('# Title\nIntro');
      expect(result[1].content).toBe('# Section 2\nBody');
    });

    it('splits by h2 headers', () => {
      const content = 'Preamble\n## First\nContent 1\n## Second\nContent 2';
      const result = service.splitMarkdown(content);
      expect(result).toHaveLength(3);
      expect(result[0].content).toBe('Preamble');
      expect(result[1].content).toBe('## First\nContent 1');
      expect(result[2].content).toBe('## Second\nContent 2');
    });

    it('splits by h3 headers', () => {
      const content = '### A\nText A\n### B\nText B';
      const result = service.splitMarkdown(content);
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('### A\nText A');
      expect(result[1].content).toBe('### B\nText B');
    });

    it('does not split on h4 or deeper headers', () => {
      const content = '#### Deep\nStill same chunk\n#### Another\nSame';
      const result = service.splitMarkdown(content);
      expect(result).toHaveLength(1);
    });

    it('returns single empty chunk for empty string', () => {
      const result = service.splitMarkdown('');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ index: 0, content: '' });
    });

    it('assigns sequential indices', () => {
      const content = '# A\na\n# B\nb\n# C\nc';
      const result = service.splitMarkdown(content);
      expect(result.map(c => c.index)).toEqual([0, 1, 2]);
    });
  });

  describe('toTsvectorSql', () => {
    it('generates correct SQL for simple text', () => {
      const sql = service.toTsvectorSql('hello world');
      expect(sql).toBe("to_tsvector('english', 'hello world')");
    });

    it('escapes single quotes', () => {
      const sql = service.toTsvectorSql("it's a test");
      expect(sql).toBe("to_tsvector('english', 'it''s a test')");
    });
  });
});
