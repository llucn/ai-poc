import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentChunkEntity } from '../knowledge/document-chunk.entity';

export interface SimilaritySearchResult {
  results: Array<{
    documentId: number;
    documentName: string;
    documentPath: string;
    documentType: number;
    chunkIndex: number;
    chunkContent: string;
    score: number;
  }>;
  total: number;
}

/**
 * Service that provides similarity search against the knowledge base chunks.
 * Used by the knowledge-similarity server tool.
 */
@Injectable()
export class KnowledgeSimilarityToolService {
  private readonly logger = new Logger(KnowledgeSimilarityToolService.name);

  constructor(
    @InjectRepository(DocumentChunkEntity)
    private chunkRepo: Repository<DocumentChunkEntity>,
  ) {}

  /**
   * Search knowledge base chunks using word_similarity (pg_trgm).
   * Returns multiple chunks per document, ordered by score descending.
   */
  async search(
    query: string,
    tags?: string[],
    topN = 10,
  ): Promise<SimilaritySearchResult> {
    const startTime = Date.now();

    const qb = this.chunkRepo.createQueryBuilder('c');

    qb.select([
      'c.id',
      'c.documentId',
      'c.documentName',
      'c.documentType',
      'c.documentPath',
      'c.chunkIndex',
      'c.chunkContent',
    ]);

    // Use word_similarity for better short-query-to-long-content matching
    qb.addSelect('word_similarity(:query, c.chunk_content)', 'score');
    qb.where('word_similarity(:query, c.chunk_content) > 0.2', { query });

    if (tags && tags.length > 0) {
      qb.andWhere("c.document_tags->'tags' ?| :tags", { tags });
    }

    qb.orderBy('score', 'DESC');
    qb.limit(topN);

    const results = await qb.getRawAndEntities();

    const duration = Date.now() - startTime;
    if (duration > 500) {
      this.logger.warn({
        message: 'Slow knowledge similarity search',
        query,
        duration,
        resultCount: results.entities.length,
      });
    }

    return {
      results: results.entities.map((chunk, i) => ({
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        documentPath: chunk.documentPath,
        documentType: chunk.documentType,
        chunkIndex: chunk.chunkIndex,
        chunkContent: chunk.chunkContent,
        score: parseFloat(results.raw[i].score),
      })),
      total: results.entities.length,
    };
  }
}
