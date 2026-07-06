import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

export interface Chunk {
  index: number;
  content: string;
}

@Injectable()
export class ChunkingService {
  /**
   * Split Markdown content by headers (## or # boundaries).
   */
  splitMarkdown(content: string): Chunk[] {
    if (!content || !content.trim()) {
      return [{ index: 0, content: '' }];
    }

    const sections: string[] = [];
    const lines = content.split('\n');
    let current: string[] = [];

    for (const line of lines) {
      if (/^#{1,3}\s/.test(line) && current.length > 0) {
        sections.push(current.join('\n'));
        current = [line];
      } else {
        current.push(line);
      }
    }
    if (current.length > 0) {
      sections.push(current.join('\n'));
    }

    return sections.map((content, index) => ({ index, content: content.trim() }));
  }

  /**
   * Extract text from PDF buffer, split by page.
   */
  async splitPdf(buffer: Buffer): Promise<Chunk[]> {
    const data = await pdfParse(buffer, {
      pagerender: undefined,
    });

    // pdf-parse returns all text concatenated; use numpages to split
    // For page-by-page extraction, we re-parse with custom page render
    const chunks: Chunk[] = [];
    const pageTexts = await this.extractPages(buffer, data.numpages);

    for (let i = 0; i < pageTexts.length; i++) {
      chunks.push({ index: i, content: pageTexts[i].trim() });
    }

    return chunks.length > 0 ? chunks : [{ index: 0, content: data.text }];
  }

  private async extractPages(buffer: Buffer, numPages: number): Promise<string[]> {
    const pages: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const pageData = await pdfParse(buffer, {
        max: i,
      });
      // Extract only this page's text by diffing with previous pages
      if (i === 1) {
        pages.push(pageData.text);
      } else {
        const prevData = await pdfParse(buffer, { max: i - 1 });
        const pageText = pageData.text.slice(prevData.text.length);
        pages.push(pageText);
      }
    }

    return pages;
  }

  /**
   * Generate tsvector SQL for English text search.
   */
  toTsvectorSql(content: string): string {
    // Escape single quotes for SQL
    const escaped = content.replace(/'/g, "''");
    return `to_tsvector('english', '${escaped}')`;
  }
}
