import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentChunkEntity } from '../knowledge/document-chunk.entity';
import { KnowledgeSimilarityToolService } from './knowledge-similarity-tool.service';

/**
 * Module for server tool implementations and their services.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DocumentChunkEntity])],
  providers: [KnowledgeSimilarityToolService],
  exports: [KnowledgeSimilarityToolService],
})
export class ToolsModule {}
